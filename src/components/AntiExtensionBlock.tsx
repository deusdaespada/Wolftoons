import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { CaptchaChallenge } from './CaptchaChallenge';

interface AntiExtensionBlockProps {
  reason?: string | null;
  showCaptcha?: boolean;
  captchaReason?: string | null;
  onCaptchaSuccess?: () => void;
  onCaptchaFailure?: () => void;
}

const AntiExtensionBlock = ({ 
  reason, 
  showCaptcha = false,
  captchaReason,
  onCaptchaSuccess,
  onCaptchaFailure,
}: AntiExtensionBlockProps) => {
  const navigate = useNavigate();

  // Show CAPTCHA challenge if needed
  if (showCaptcha && onCaptchaSuccess && onCaptchaFailure) {
    return (
      <CaptchaChallenge 
        onSuccess={onCaptchaSuccess}
        onFailure={onCaptchaFailure}
        reason={captchaReason || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 inline-block">
            <Shield className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Bloqueado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">
                Atividade suspeita detectada
              </p>
              <p className="text-muted-foreground">
                Detectamos que você pode estar usando uma extensão de leitura não autorizada
                ou um navegador automatizado para acessar nosso conteúdo.
              </p>
            </div>
          </div>

          {reason && (
            <div className="text-xs text-muted-foreground text-center font-mono bg-muted/50 p-2 rounded">
              Motivo: {reason}
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Por que isso acontece?</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Uso de extensões como Tachiyomi, Kotatsu, ou similares
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Navegadores automatizados (Selenium, Puppeteer)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Tentativas de scraping ou download em massa
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como resolver?</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Acesse diretamente pelo navegador
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Desative extensões de leitura
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                Use um navegador normal (Chrome, Firefox, Safari)
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AntiExtensionBlock;
