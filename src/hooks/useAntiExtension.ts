import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExtensionDetection {
  isBlocked: boolean;
  reason: string | null;
  detectedExtensions: string[];
  showCaptcha: boolean;
  captchaReason: string | null;
}

// Extension patterns - very specific
const EXTENSION_PATTERNS = [
  { pattern: 'tachiyomi', name: 'Tachiyomi' },
  { pattern: 'kotatsu', name: 'Kotatsu' },
  { pattern: 'mihon', name: 'Mihon' },
  { pattern: 'neko', name: 'Neko' },
  { pattern: 'tachiyomisy', name: 'TachiyomiSY' },
  { pattern: 'tachiyomij2k', name: 'TachiyomiJ2K' },
  { pattern: 'aniyomi', name: 'Aniyomi' },
  { pattern: 'komikku', name: 'Komikku' },
  { pattern: 'paperback', name: 'Paperback' },
  { pattern: 'suwayomi', name: 'Suwayomi' },
  { pattern: 'yokai', name: 'Yokai' },
  { pattern: 'keiyoushi', name: 'Keiyoushi' },
  { pattern: 'eu.kanade.tachiyomi', name: 'Tachiyomi-Package' },
  { pattern: 'pt.wolftoon', name: 'Wolftoon-Ext' },
  { pattern: 'pt.kuromangas', name: 'Kuromangas-Ext' },
];

// Honeypot endpoints that trigger instant ban
const HONEYPOT_ENDPOINTS = [
  '/api/v1/manga/list.json',
  '/api/v2/chapters/all',
  '/api/manga.json',
  '/manga/api/list',
  '/api/export/chapters',
  '/data/chapters.json',
  '/api/v1/download',
  '/api/bulk/images',
  '/api/scrape',
];

// Suspicious patterns that trigger CAPTCHA instead of immediate block
const CAPTCHA_TRIGGER_PATTERNS = [
  'No-Accept-Language',
  'Minimal-UA',
  'RateLimit',
];

export const useAntiExtension = () => {
  const { user } = useAuth();
  const hasLoggedRef = useRef(false);
  const hasCheckedIpRef = useRef(false);
  const hasFirewallCheckedRef = useRef(false);
  const hasSetupHoneypotsRef = useRef(false);
  const captchaPassedRef = useRef(false);
  
  const [detection, setDetection] = useState<ExtensionDetection>({
    isBlocked: false,
    reason: null,
    detectedExtensions: [],
    showCaptcha: false,
    captchaReason: null,
  });

  // Trigger honeypot - instant ban
  const triggerHoneypot = useCallback(async (type: string, endpoint: string) => {
    console.warn(`[CyberWall] HONEYPOT TRIGGERED: ${type}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-ip-block', {
        body: {
          action: 'honeypot',
          honeypot_type: type,
          endpoint: endpoint,
          user_agent: navigator.userAgent,
          page_url: window.location.href,
          user_id: user?.id,
        }
      });

      if (data?.blocked) {
        setDetection({
          isBlocked: true,
          reason: 'Acesso não autorizado detectado',
          detectedExtensions: ['Honeypot'],
          showCaptcha: false,
          captchaReason: null,
        });
      }
    } catch (error) {
      console.error('Honeypot trigger failed:', error);
    }
  }, [user?.id]);

  // Setup honeypot traps
  const setupHoneypots = useCallback(() => {
    if (hasSetupHoneypotsRef.current) return;
    hasSetupHoneypotsRef.current = true;

    // Intercept fetch to check for honeypot access
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      for (const honeypot of HONEYPOT_ENDPOINTS) {
        if (url.includes(honeypot)) {
          triggerHoneypot('fetch-honeypot', honeypot);
          throw new Error('Blocked');
        }
      }
      
      return originalFetch.apply(this, args);
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
      const urlStr = url.toString();
      
      for (const honeypot of HONEYPOT_ENDPOINTS) {
        if (urlStr.includes(honeypot)) {
          triggerHoneypot('xhr-honeypot', honeypot);
          throw new Error('Blocked');
        }
      }
      
      return originalXHROpen.apply(this, [method, url, ...rest] as any);
    };

    // Add invisible honeypot links
    const honeypotContainer = document.createElement('div');
    honeypotContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
    honeypotContainer.innerHTML = `
      <a href="/api/v1/manga/list.json" data-honeypot="link1">API</a>
      <a href="/api/export/chapters" data-honeypot="link2">Export</a>
      <a href="/data/chapters.json" data-honeypot="link3">Data</a>
    `;
    document.body.appendChild(honeypotContainer);

    // Monitor for programmatic access to honeypot links
    const links = honeypotContainer.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        triggerHoneypot('link-honeypot', (e.target as HTMLAnchorElement).href);
      });
    });

    console.log('[CyberWall] Honeypots deployed');
  }, [triggerHoneypot]);

  // Check IP block
  const checkIpBlock = useCallback(async () => {
    if (hasCheckedIpRef.current) return null;
    hasCheckedIpRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('check-ip-block', {
        body: { action: 'check' }
      });

      if (error) {
        console.error('Error checking IP block:', error);
        return null;
      }

      if (data?.blocked) {
        return { blocked: true, reason: data.reason, expires_at: data.expires_at };
      }

      return null;
    } catch (error) {
      console.error('Failed to check IP block:', error);
      return null;
    }
  }, []);

  // Firewall check
  const firewallCheck = useCallback(async () => {
    if (hasFirewallCheckedRef.current) return null;
    hasFirewallCheckedRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('check-ip-block', {
        body: { 
          action: 'firewall_check',
          user_agent: navigator.userAgent,
          page_url: window.location.href,
          user_id: user?.id,
        }
      });

      if (error) {
        console.error('Error in firewall check:', error);
        return null;
      }

      if (data?.blocked) {
        return { blocked: true, reason: data.reason, detectedPatterns: data.detectedPatterns || [] };
      }

      return null;
    } catch (error) {
      console.error('Failed firewall check:', error);
      return null;
    }
  }, [user?.id]);

  // Record strike
  const recordStrike = useCallback(async (reason: string, detectedExtensions: string[]) => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('check-ip-block', {
        body: {
          action: 'record_strike',
          detected_extensions: detectedExtensions,
          reason,
          user_id: user?.id,
          user_agent: navigator.userAgent,
          page_url: window.location.href,
        }
      });

      if (error) {
        console.error('Error recording strike:', error);
        return;
      }
      
      if (data?.blocked) {
        setDetection({
          isBlocked: true,
          reason: 'IP bloqueado',
          detectedExtensions,
          showCaptcha: false,
          captchaReason: null,
        });
      }
    } catch (error) {
      console.error('Failed to record strike:', error);
    }
  }, [user?.id]);

  // Client-side extension detection
  const checkExtensionPatterns = useCallback(() => {
    const detected: string[] = [];
    const userAgent = navigator.userAgent.toLowerCase();

    for (const { pattern, name } of EXTENSION_PATTERNS) {
      if (userAgent.includes(pattern.toLowerCase())) {
        detected.push(name);
      }
    }

    // OkHttp without browser
    const hasMozilla = /mozilla\/\d/i.test(navigator.userAgent);
    const hasMobileSafari = /mobile safari/i.test(navigator.userAgent);
    const hasChrome = /chrome\/\d/i.test(navigator.userAgent);
    const isRealMobileBrowser = hasMozilla && (hasMobileSafari || hasChrome);

    if (/okhttp\/\d/i.test(userAgent) && !isRealMobileBrowser) {
      detected.push('OkHttp');
    }

    if (/dalvik\/\d/i.test(userAgent) && !isRealMobileBrowser) {
      detected.push('Dalvik');
    }

    if (/^java\/|apache-httpclient/i.test(userAgent)) {
      detected.push('JavaClient');
    }

    if (/headlesschrome/i.test(userAgent)) {
      detected.push('HeadlessChrome');
    }

    if (/phantomjs/i.test(userAgent)) {
      detected.push('PhantomJS');
    }

    return { detected: detected.length > 0, patterns: detected };
  }, []);

  // Automation detection
  const checkAutomation = useCallback(() => {
    const navigatorAny = navigator as any;
    const detected: string[] = [];
    const windowAny = window as any;
    const documentAny = document as any;
    
    if (navigatorAny.webdriver === true) detected.push('webdriver');
    if (windowAny.callPhantom || windowAny._phantom) detected.push('phantom');
    if (windowAny.__nightmare) detected.push('nightmare');
    if (windowAny.__puppeteer_evaluation_script__) detected.push('puppeteer');
    if (windowAny.__playwright) detected.push('playwright');
    
    if (documentAny.__selenium_unwrapped || documentAny.__webdriver_evaluate ||
        documentAny.__driver_evaluate || documentAny.$cdc_asdjflasutopfhvcZLmcfl_) {
      detected.push('selenium');
    }

    return { detected: detected.length > 0, patterns: detected };
  }, []);

  // Protect images
  const protectImages = useCallback(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        toast.info('Conteúdo protegido');
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Watermark
  const addWatermark = useCallback((userId?: string) => {
    const watermarkId = 'reader-watermark';
    const existing = document.getElementById(watermarkId);
    if (existing) existing.remove();
    if (!userId) return;

    const watermark = document.createElement('div');
    watermark.id = watermarkId;
    watermark.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; opacity: 0.01;
      background: repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(0,0,0,0.02) 100px, rgba(0,0,0,0.02) 200px);
    `;
    
    const userIdSpan = document.createElement('span');
    userIdSpan.style.cssText = 'position: absolute; font-size: 1px; color: transparent; user-select: none;';
    userIdSpan.textContent = `ID:${userId}`;
    watermark.appendChild(userIdSpan);
    
    document.body.appendChild(watermark);

    return () => { watermark.remove(); };
  }, []);

  // Disable print
  const disablePrintScreen = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        toast.info('Capturas de tela desabilitadas');
      }
      if (e.ctrlKey && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  // Check if detection should trigger CAPTCHA instead of block
  const shouldShowCaptcha = useCallback((detectedPatterns: string[]): boolean => {
    // If captcha was already passed, don't show again
    if (captchaPassedRef.current) return false;
    
    // If any pattern matches CAPTCHA triggers, show captcha
    return detectedPatterns.some(pattern => 
      CAPTCHA_TRIGGER_PATTERNS.some(trigger => 
        pattern.toLowerCase().includes(trigger.toLowerCase())
      )
    );
  }, []);

  // Handle CAPTCHA success
  const onCaptchaSuccess = useCallback(() => {
    captchaPassedRef.current = true;
    setDetection(prev => ({
      ...prev,
      showCaptcha: false,
      captchaReason: null,
      isBlocked: false,
    }));
    toast.success('Verificação concluída com sucesso!');
  }, []);

  // Handle CAPTCHA failure
  const onCaptchaFailure = useCallback(() => {
    setDetection(prev => ({
      ...prev,
      showCaptcha: false,
      isBlocked: true,
      reason: 'Falha na verificação de segurança',
    }));
  }, []);

  // Main detection
  const runDetection = useCallback(async () => {
    // If captcha was passed, skip all checks
    if (captchaPassedRef.current) return;

    // Setup honeypots first
    setupHoneypots();

    // Check if IP blocked
    const ipBlock = await checkIpBlock();
    if (ipBlock?.blocked) {
      setDetection({ 
        isBlocked: true, 
        reason: `IP bloqueado: ${ipBlock.reason}`, 
        detectedExtensions: ['IP-Block'],
        showCaptcha: false,
        captchaReason: null,
      });
      return;
    }

    // Firewall check
    const firewall = await firewallCheck();
    if (firewall?.blocked) {
      const detectedPatterns = firewall.detectedPatterns || [];
      
      // Check if this should trigger CAPTCHA instead
      if (shouldShowCaptcha(detectedPatterns)) {
        setDetection({ 
          isBlocked: false, 
          reason: null, 
          detectedExtensions: detectedPatterns,
          showCaptcha: true,
          captchaReason: 'Atividade suspeita detectada. Complete a verificação.',
        });
        return;
      }
      
      setDetection({ 
        isBlocked: true, 
        reason: firewall.reason, 
        detectedExtensions: detectedPatterns,
        showCaptcha: false,
        captchaReason: null,
      });
      return;
    }

    let allDetected: string[] = [];
    let blockReason: string | null = null;

    // Extension check
    const extensionCheck = checkExtensionPatterns();
    if (extensionCheck.detected) {
      allDetected = [...allDetected, ...extensionCheck.patterns];
      blockReason = `Extensão detectada: ${extensionCheck.patterns.join(', ')}`;
    }

    // Automation check
    const automationCheck = checkAutomation();
    if (automationCheck.detected) {
      allDetected = [...allDetected, ...automationCheck.patterns];
      blockReason = blockReason 
        ? `${blockReason} | Automação: ${automationCheck.patterns.join(', ')}`
        : `Automação detectada: ${automationCheck.patterns.join(', ')}`;
    }

    if (allDetected.length > 0 && blockReason) {
      // Check if CAPTCHA should be shown instead of blocking
      if (shouldShowCaptcha(allDetected)) {
        setDetection({ 
          isBlocked: false, 
          reason: null, 
          detectedExtensions: allDetected,
          showCaptcha: true,
          captchaReason: 'Verificação adicional necessária',
        });
        return;
      }
      
      recordStrike(blockReason, allDetected);
      setDetection({ 
        isBlocked: true, 
        reason: blockReason, 
        detectedExtensions: allDetected,
        showCaptcha: false,
        captchaReason: null,
      });
    }
  }, [checkIpBlock, firewallCheck, checkExtensionPatterns, checkAutomation, recordStrike, setupHoneypots, shouldShowCaptcha]);

  // Initialize
  useEffect(() => {
    runDetection();

    const cleanupImages = protectImages();
    const cleanupKeys = disablePrintScreen();
    const cleanupWatermark = user?.id ? addWatermark(user.id) : undefined;

    return () => {
      cleanupImages();
      cleanupKeys();
      cleanupWatermark?.();
    };
  }, [runDetection, protectImages, disablePrintScreen, addWatermark, user?.id]);

  return { ...detection, addWatermark, onCaptchaSuccess, onCaptchaFailure };
};
