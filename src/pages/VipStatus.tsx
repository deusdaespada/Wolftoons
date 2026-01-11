import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Calendar, Clock, Shield, Zap, Star, Gift, ArrowRight } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VipInfo {
  expiresAt: Date | null;
  isPermanent: boolean;
  createdAt: Date | null;
}

interface VipHistoryItem {
  id: string;
  action: string;
  created_at: string;
  expires_at: string | null;
}

const VipStatus = () => {
  const { user, isVip, loading } = useAuth();
  const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
  const [vipHistory, setVipHistory] = useState<VipHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVipInfo = async () => {
      if (!user) return;

      try {
        // Fetch VIP role info
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, expires_at, created_at')
          .eq('user_id', user.id)
          .eq('role', 'vip')
          .maybeSingle();

        if (roleData) {
          setVipInfo({
            expiresAt: roleData.expires_at ? new Date(roleData.expires_at) : null,
            isPermanent: !roleData.expires_at,
            createdAt: roleData.created_at ? new Date(roleData.created_at) : null,
          });
        }

        // Fetch VIP history for this user
        const { data: historyData } = await supabase
          .from('vip_history')
          .select('id, action, created_at, expires_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (historyData) {
          setVipHistory(historyData);
        }
      } catch (error) {
        console.error('Error fetching VIP info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchVipInfo();
    }
  }, [user, loading]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const benefits = [
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Sem Anúncios",
      description: "Experiência de leitura sem interrupções"
    },
    {
      icon: <Zap className="h-5 w-5 text-primary" />,
      title: "Acesso Antecipado",
      description: "Leia novos capítulos antes de todos"
    },
    {
      icon: <Crown className="h-5 w-5 text-primary" />,
      title: "Badge Exclusivo",
      description: "Destaque-se com seu badge VIP"
    },
    {
      icon: <Star className="h-5 w-5 text-primary" />,
      title: "Capítulos VIP",
      description: "Acesso a conteúdo exclusivo"
    }
  ];

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'add':
        return 'VIP Ativado';
      case 'renew':
        return 'VIP Renovado';
      case 'remove':
        return 'VIP Removido';
      case 'code_redemption':
        return 'Código Resgatado';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
      case 'renew':
      case 'code_redemption':
        return 'text-green-500';
      case 'remove':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-semibold mb-8 flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          Status VIP
        </h1>

        {isVip ? (
          <>
            {/* VIP Active Card */}
            <Card className="mb-8 bg-gradient-to-r from-primary/20 to-primary/5 border-primary/50">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 bg-primary/20 rounded-full">
                    <Crown className="h-12 w-12 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="font-display text-2xl font-semibold mb-2">Você é VIP!</h2>
                    <p className="text-muted-foreground mb-4">
                      Aproveite todos os benefícios exclusivos da sua assinatura.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      {vipInfo?.isPermanent ? (
                        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">VIP Permanente</span>
                        </div>
                      ) : vipInfo?.expiresAt && (
                        <>
                          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Expira em: {format(vipInfo.expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDistanceToNow(vipInfo.expiresAt, { locale: ptBR, addSuffix: true })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Grid */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Seus Benefícios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      {benefit.icon}
                      <div>
                        <h4 className="font-medium text-sm">{benefit.title}</h4>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VIP History */}
            {vipHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Histórico VIP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vipHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-muted ${getActionColor(item.action)}`}>
                            <Gift className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${getActionColor(item.action)}`}>
                              {getActionLabel(item.action)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        {item.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Válido até: {format(new Date(item.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Not VIP */
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="p-4 bg-muted rounded-full inline-block mb-6">
                <Crown className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-4">Você ainda não é VIP</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Torne-se VIP e aproveite benefícios exclusivos como acesso antecipado, sem anúncios e muito mais!
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/vip">
                  Conhecer Plano VIP
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VipStatus;
