import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-wolftoon-session',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ============================================
// PROTEÇÃO ANTI-EXTENSÃO - MIDDLEWARE STYLE
// ============================================

// Blocked User-Agent patterns (specific to reading extensions)
const BLOCKED_PATTERNS = [
  // Tachiyomi ecosystem - very specific
  /\btachiyomi\b/i, /\bkeiyoushi\b/i, /\bmihon\b/i, /\baniyomi\b/i,
  /\bneko\b/i, /\bsuwayomi\b/i, /\byokai\b/i, /\bkotatsu\b/i,
  /\bkomikku\b/i, /\bpaperback\b/i,
  /eu\.kanade\.tachiyomi/i, /pt\.wolftoon/i, /pt\.kuromangas/i, /app\.mihon/i,
  
  // HTTP clients without browser context
  /^okhttp\/\d/i,
  /^dalvik\/\d/i,
  /^java\//i,
  /apache-httpclient/i,
  
  // Scraping libraries
  /python-requests/i, /python-urllib/i, /\bscrapy\b/i,
  /\bcurl\/\d/i, /\bwget\/\d/i,
  /node-fetch/i, /^axios\//i, /go-http-client/i, /libwww-perl/i,
  
  // Headless browsers
  /headlesschrome/i, /\bphantomjs\b/i, /\bselenium\b/i, /\bpuppeteer\b/i,
];

// Valid domains for referer check
const VALID_DOMAINS = ['wolftoon', 'localhost', '127.0.0.1', 'lovableproject.com', 'lovable.app'];

// Session token secret
const SESSION_SECRET = 'W0lfT00n_S3ss10n_K3y_2024!';
const SESSION_VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

// Rate limiting
const rateLimitStore = new Map<string, { count: number; firstRequest: number; imageCount: number }>();
const RATE_LIMIT = 100;
const IMAGE_RATE_LIMIT = 50;
const RATE_WINDOW = 60000; // 1 minute

interface CheckRequest {
  path?: string;
  userAgent?: string;
  referer?: string;
  origin?: string;
  sessionToken?: string;
  requestType?: 'page' | 'api' | 'image' | 'chapter';
  headers?: Record<string, string>;
}

// Generate session token
function generateSessionToken(clientIp: string, timestamp: number): string {
  const data = `${SESSION_SECRET}:${clientIp}:${Math.floor(timestamp / SESSION_VALIDITY_MS)}`;
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) + data.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

// Validate session token
function validateSessionToken(token: string, clientIp: string, timestamp: number): boolean {
  const currentWindow = Math.floor(Date.now() / SESSION_VALIDITY_MS);
  const tokenWindow = Math.floor(timestamp / SESSION_VALIDITY_MS);
  
  // Valid for current and previous window
  if (Math.abs(currentWindow - tokenWindow) > 1) {
    return false;
  }
  
  const expectedToken = generateSessionToken(clientIp, timestamp);
  return token === expectedToken;
}

// Check User-Agent
function checkUserAgent(ua: string): { blocked: boolean; reason?: string } {
  if (!ua || ua.length < 15) {
    return { blocked: true, reason: 'missing_or_short_ua' };
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(ua)) {
      // Exception: OkHttp/Dalvik with full browser signature is a legitimate Android browser
      if (/okhttp|dalvik/i.test(ua) && /mozilla\/5.*applewebkit.*chrome.*mobile safari/i.test(ua)) {
        continue;
      }
      return { blocked: true, reason: `blocked_pattern: ${pattern.toString()}` };
    }
  }
  
  return { blocked: false };
}

// Check referer validity
function checkReferer(referer: string, path: string): { valid: boolean; reason?: string } {
  // Allow empty referer for initial page loads
  if (!referer) {
    // But block if it's an API or image request without referer
    if (path && (path.includes('/api/') || path.includes('/images/') || path.includes('/chapters/'))) {
      return { valid: false, reason: 'no_referer_for_api' };
    }
    return { valid: true };
  }
  
  // Check if referer is from valid domain
  const isValidDomain = VALID_DOMAINS.some(domain => referer.toLowerCase().includes(domain));
  if (!isValidDomain) {
    return { valid: false, reason: `invalid_referer: ${referer.substring(0, 50)}` };
  }
  
  return { valid: true };
}

// Check rate limit
function checkRateLimit(ip: string, isImageRequest: boolean): { limited: boolean; count: number; limit: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now - record.firstRequest > RATE_WINDOW) {
    rateLimitStore.set(ip, { count: 1, firstRequest: now, imageCount: isImageRequest ? 1 : 0 });
    return { limited: false, count: 1, limit: isImageRequest ? IMAGE_RATE_LIMIT : RATE_LIMIT };
  }
  
  record.count++;
  if (isImageRequest) record.imageCount++;
  
  const limit = isImageRequest ? IMAGE_RATE_LIMIT : RATE_LIMIT;
  const count = isImageRequest ? record.imageCount : record.count;
  
  if (count > limit) {
    return { limited: true, count, limit };
  }
  
  return { limited: false, count, limit };
}

// Check if it's a real browser (has required headers)
function checkBrowserHeaders(headers: Record<string, string>): { valid: boolean; missing: string[] } {
  const required = ['accept', 'accept-language', 'accept-encoding'];
  const missing: string[] = [];
  
  for (const header of required) {
    const value = headers[header] || headers[header.toLowerCase()];
    if (!value) {
      missing.push(header);
    }
  }
  
  return { valid: missing.length === 0, missing };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';

  // Extract all request headers
  const reqHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    reqHeaders[key.toLowerCase()] = value;
  });

  try {
    const body: CheckRequest = await req.json();
    const userAgent = body.userAgent || reqHeaders['user-agent'] || '';
    const referer = body.referer || reqHeaders['referer'] || '';
    const path = body.path || '';
    const sessionToken = body.sessionToken || reqHeaders['x-session-token'] || reqHeaders['x-wolftoon-session'] || '';
    const requestType = body.requestType || 'page';
    const providedHeaders = { ...reqHeaders, ...(body.headers || {}) };

    console.log(`[anti-extension-check] IP: ${clientIp}, Path: ${path}, Type: ${requestType}`);

    // 1. Check if IP is whitelisted
    const { data: whitelisted } = await supabase
      .from('whitelisted_ips')
      .select('id')
      .eq('ip_address', clientIp)
      .single();

    if (whitelisted) {
      const newToken = generateSessionToken(clientIp, Date.now());
      return new Response(
        JSON.stringify({ 
          blocked: false, 
          reason: 'whitelisted',
          sessionToken: newToken,
          sessionExpires: Date.now() + SESSION_VALIDITY_MS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if IP is already blocked
    const { data: blockedIp } = await supabase
      .from('blocked_ips')
      .select('id, reason, expires_at')
      .eq('ip_address', clientIp)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (blockedIp) {
      console.log(`[anti-extension-check] IP ${clientIp} is blocked: ${blockedIp.reason}`);
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: blockedIp.reason,
          code: 'IP_BLOCKED',
          expires_at: blockedIp.expires_at
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check User-Agent
    const uaCheck = checkUserAgent(userAgent);
    if (uaCheck.blocked) {
      console.log(`[anti-extension-check] Blocked UA: ${uaCheck.reason}`);
      
      await supabase.from('blocked_access_logs').insert({
        ip_address: clientIp,
        reason: `Middleware: ${uaCheck.reason}`,
        detected_extensions: ['UA-Block'],
        user_agent: userAgent,
        page_url: path || referer,
      });

      // Block for 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await supabase.from('blocked_ips').upsert({
        ip_address: clientIp,
        reason: `Extension detected: ${uaCheck.reason}`,
        expires_at: expiresAt.toISOString(),
        strike_count: 1,
      }, { onConflict: 'ip_address' });

      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'extension_detected',
          code: 'EXTENSION_BLOCKED',
          message: 'Acesso via extensões não permitido'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check referer for API/image requests
    const refererCheck = checkReferer(referer, path);
    if (!refererCheck.valid) {
      console.log(`[anti-extension-check] Invalid referer: ${refererCheck.reason}`);
      
      await supabase.from('blocked_access_logs').insert({
        ip_address: clientIp,
        reason: `Referer: ${refererCheck.reason}`,
        detected_extensions: ['Referer-Block'],
        user_agent: userAgent,
        page_url: path,
      });

      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'invalid_request',
          code: 'INVALID_REFERER',
          message: 'Requisições diretas não permitidas'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check browser headers for API requests
    if (requestType === 'api' || requestType === 'chapter') {
      const headerCheck = checkBrowserHeaders(providedHeaders);
      if (!headerCheck.valid) {
        console.log(`[anti-extension-check] Missing browser headers: ${headerCheck.missing.join(', ')}`);
        
        // Only log, don't block immediately (some legitimate requests may miss headers)
        await supabase.from('blocked_access_logs').insert({
          ip_address: clientIp,
          reason: `Missing headers: ${headerCheck.missing.join(', ')}`,
          detected_extensions: ['Header-Suspicious'],
          user_agent: userAgent,
          page_url: path,
        });
      }
    }

    // 6. Check rate limit
    const isImageRequest = requestType === 'image';
    const rateCheck = checkRateLimit(clientIp, isImageRequest);
    if (rateCheck.limited) {
      console.log(`[anti-extension-check] Rate limited: ${rateCheck.count}/${rateCheck.limit}`);
      
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          reason: 'rate_limit_exceeded',
          code: 'RATE_LIMIT',
          message: 'Muitas requisições. Aguarde um momento.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    // 7. Validate session token for protected resources
    if ((requestType === 'chapter' || requestType === 'image') && path.includes('/api/')) {
      if (!sessionToken) {
        console.log(`[anti-extension-check] Missing session token for protected resource`);
        
        return new Response(
          JSON.stringify({ 
            blocked: true, 
            reason: 'no_session',
            code: 'UNAUTHORIZED',
            message: 'Sessão inválida'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate token (simplified - in production, use proper JWT)
      const [tokenPart, timestampPart] = sessionToken.split(':');
      const timestamp = parseInt(timestampPart || '0');
      
      if (!validateSessionToken(tokenPart, clientIp, timestamp)) {
        console.log(`[anti-extension-check] Invalid session token`);
        
        return new Response(
          JSON.stringify({ 
            blocked: true, 
            reason: 'invalid_session',
            code: 'SESSION_EXPIRED',
            message: 'Token inválido ou expirado'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // All checks passed - generate/refresh session token
    const newToken = generateSessionToken(clientIp, Date.now());
    const sessionExpires = Date.now() + SESSION_VALIDITY_MS;

    return new Response(
      JSON.stringify({ 
        blocked: false,
        sessionToken: `${newToken}:${Date.now()}`,
        sessionExpires,
        rateLimit: {
          current: rateCheck.count,
          limit: rateCheck.limit,
          remaining: rateCheck.limit - rateCheck.count
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[anti-extension-check] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
