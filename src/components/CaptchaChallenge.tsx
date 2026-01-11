import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, RefreshCw, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CaptchaChallengeProps {
  onSuccess: () => void;
  onFailure: () => void;
  reason?: string;
}

interface Challenge {
  type: 'math' | 'image' | 'slider';
  question: string;
  answer: string;
  options?: string[];
  images?: { id: string; url: string; isTarget: boolean }[];
}

const generateMathChallenge = (): Challenge => {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    default:
      a = 5;
      b = 3;
      answer = 8;
  }

  return {
    type: 'math',
    question: `Quanto é ${a} ${op} ${b}?`,
    answer: answer.toString(),
  };
};

const generateSliderChallenge = (): Challenge => {
  const targetValue = Math.floor(Math.random() * 80) + 10;
  return {
    type: 'slider',
    question: `Mova o slider para ${targetValue}`,
    answer: targetValue.toString(),
  };
};

const generateImageChallenge = (): Challenge => {
  const shapes = ['círculo', 'quadrado', 'triângulo', 'estrela'];
  const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
  
  const images = shapes.map((shape, idx) => ({
    id: shape,
    url: getShapeSvg(shape),
    isTarget: shape === targetShape,
  }));

  // Shuffle images
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  return {
    type: 'image',
    question: `Selecione o ${targetShape}`,
    answer: targetShape,
    images,
  };
};

const getShapeSvg = (shape: string): string => {
  const svgs: Record<string, string> = {
    círculo: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3b82f6"/></svg>')}`,
    quadrado: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#ef4444"/></svg>')}`,
    triângulo: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="#22c55e"/></svg>')}`,
    estrela: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="#eab308"/></svg>')}`,
  };
  return svgs[shape] || svgs.círculo;
};

export const CaptchaChallenge = ({ onSuccess, onFailure, reason }: CaptchaChallengeProps) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MAX_ATTEMPTS = 3;

  const generateNewChallenge = useCallback(() => {
    const types = ['math', 'image', 'slider'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    let newChallenge: Challenge;
    switch (type) {
      case 'math':
        newChallenge = generateMathChallenge();
        break;
      case 'image':
        newChallenge = generateImageChallenge();
        break;
      case 'slider':
        newChallenge = generateSliderChallenge();
        break;
      default:
        newChallenge = generateMathChallenge();
    }
    
    setChallenge(newChallenge);
    setUserAnswer('');
    setSliderValue(50);
    setSelectedImage(null);
    setError(null);
  }, []);

  useEffect(() => {
    generateNewChallenge();
  }, [generateNewChallenge]);

  const verifyCaptcha = async () => {
    if (!challenge) return;
    
    setIsVerifying(true);
    setError(null);

    let isCorrect = false;

    switch (challenge.type) {
      case 'math':
        isCorrect = userAnswer.trim() === challenge.answer;
        break;
      case 'slider':
        const target = parseInt(challenge.answer);
        isCorrect = Math.abs(sliderValue - target) <= 5;
        break;
      case 'image':
        isCorrect = selectedImage === challenge.answer;
        break;
    }

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isCorrect) {
      setSuccess(true);
      
      // Log successful captcha completion
      try {
        await supabase.functions.invoke('check-ip-block', {
          body: {
            action: 'captcha_success',
            user_agent: navigator.userAgent,
            page_url: window.location.href,
          }
        });
      } catch (e) {
        console.error('Failed to log captcha success:', e);
      }

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError('Muitas tentativas incorretas. Acesso bloqueado.');
        
        // Log failed captcha
        try {
          await supabase.functions.invoke('check-ip-block', {
            body: {
              action: 'captcha_failed',
              user_agent: navigator.userAgent,
              page_url: window.location.href,
              attempts: newAttempts,
            }
          });
        } catch (e) {
          console.error('Failed to log captcha failure:', e);
        }

        setTimeout(() => {
          onFailure();
        }, 2000);
      } else {
        setError(`Resposta incorreta. Tentativas restantes: ${MAX_ATTEMPTS - newAttempts}`);
        generateNewChallenge();
      }
    }

    setIsVerifying(false);
  };

  if (!challenge) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Verificação de Segurança</h2>
            <p className="text-sm text-muted-foreground">
              {reason || 'Complete o desafio para continuar'}
            </p>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-green-500/20 rounded-full animate-pulse">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-green-500 font-medium">Verificação concluída!</p>
          </div>
        ) : (
          <>
            {/* Challenge */}
            <div className="space-y-4">
              <p className="text-center text-foreground font-medium">{challenge.question}</p>

              {/* Math Challenge */}
              {challenge.type === 'math' && (
                <Input
                  type="number"
                  placeholder="Digite sua resposta"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="text-center text-xl"
                  disabled={isVerifying}
                  onKeyDown={(e) => e.key === 'Enter' && verifyCaptcha()}
                />
              )}

              {/* Slider Challenge */}
              {challenge.type === 'slider' && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={isVerifying}
                  />
                  <div className="text-center text-2xl font-bold text-primary">{sliderValue}</div>
                </div>
              )}

              {/* Image Challenge */}
              {challenge.type === 'image' && challenge.images && (
                <div className="grid grid-cols-2 gap-3">
                  {challenge.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.id)}
                      disabled={isVerifying}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedImage === img.id
                          ? 'border-primary bg-primary/10 scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img 
                        src={img.url} 
                        alt="Shape" 
                        className="w-16 h-16 mx-auto"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={generateNewChallenge}
                disabled={isVerifying}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Novo Desafio
              </Button>
              <Button
                onClick={verifyCaptcha}
                disabled={isVerifying || (challenge.type === 'image' && !selectedImage)}
                className="flex-1"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>

            {/* Attempts counter */}
            <div className="text-center text-xs text-muted-foreground">
              Tentativa {attempts + 1} de {MAX_ATTEMPTS}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
