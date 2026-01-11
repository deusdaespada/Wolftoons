import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Star, Zap, Shield, Crown, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRedeemVipCode } from "@/hooks/useVipCode";
import { useToast } from "@/hooks/use-toast";

const Vip = () => {
  const { user, isVip } = useAuth();
  const { toast } = useToast();
  const redeemCode = useRedeemVipCode();
  const [code, setCode] = useState('');

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await redeemCode.mutateAsync({ code: code.trim() });
      toast({
        title: 'Código resgatado!',
        description: 'Você agora é VIP! Aproveite os benefícios.',
      });
      setCode('');
    } catch (error: any) {
      toast({
        title: 'Erro ao resgatar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const benefits = [
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Sem Anúncios",
      description: "Experiência de leitura completamente livre de anúncios e interrupções"
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Acesso Antecipado",
      description: "Seja o primeiro a ler novos capítulos antes de todos"
    },
    {
      icon: <Crown className="h-6 w-6 text-primary" />,
      title: "Badge Exclusivo",
      description: "Badge VIP exclusivo no seu perfil para se destacar"
    },
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Apoie o Projeto",
      description: "Ajude a manter o Wolftoon funcionando e crescendo"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* VIP Status Banner */}
        {user && isVip && (
          <Card className="mb-8 bg-gradient-to-r from-primary/20 to-primary/10 border-primary/50">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="font-display text-2xl font-semibold mb-2">Você é VIP!</h2>
              <p className="text-muted-foreground">Aproveite todos os benefícios exclusivos da sua assinatura.</p>
            </CardContent>
          </Card>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="text-6xl mb-4">⭐</div>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold mb-6 text-glow">
            VIP Wolftoon
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Leve sua experiência de leitura para o próximo nível com recursos exclusivos
          </p>
          <div className="inline-flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-bold text-primary">R$ 9,90</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
        </div>

        {/* Redeem Code Section */}
        {user && !isVip && (
          <Card className="max-w-md mx-auto mb-16 bg-card/50 border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="h-6 w-6 text-primary" />
                <h3 className="font-display text-xl font-semibold">Resgatar Código VIP</h3>
              </div>
              <form onSubmit={handleRedeemCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Digite seu código VIP"
                    className="uppercase"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={redeemCode.isPending || !code.trim()}
                >
                  {redeemCode.isPending ? 'Resgatando...' : 'Resgatar Código'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-card/50 border-border/40 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">{benefit.icon}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-semibold text-center mb-8">
            Compare os Planos
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-semibold mb-2">Grátis</h3>
                  <p className="text-3xl font-bold">R$ 0</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Acesso a todos os títulos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Leitura ilimitada</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">✗ Com anúncios</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">✗ Sem acesso antecipado</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-6" asChild>
                  <Link to="/catalog">Continuar Grátis</Link>
                </Button>
              </CardContent>
            </Card>

            {/* VIP Plan */}
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-semibold mb-2">VIP Wolftoon</h3>
                  <p className="text-3xl font-bold text-primary">R$ 9,90</p>
                  <p className="text-sm text-muted-foreground">/mês</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Tudo do plano grátis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Sem anúncios</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Acesso antecipado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Badge exclusivo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Apoie o Wolftoon</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura VIP a qualquer momento sem taxas de cancelamento.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Como funciona o acesso antecipado?</h3>
                <p className="text-sm text-muted-foreground">
                  Membros VIP têm acesso aos novos capítulos 24 horas antes do lançamento público.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Como resgatar um código VIP?</h3>
                <p className="text-sm text-muted-foreground">
                  Se você recebeu um código VIP, basta inseri-lo no campo acima quando estiver logado. 
                  O VIP será ativado automaticamente na sua conta.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Quais são as formas de pagamento?</h3>
                <p className="text-sm text-muted-foreground">
                  Aceitamos cartão de crédito, débito e PIX para maior comodidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vip;
