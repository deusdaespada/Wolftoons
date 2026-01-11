import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Banned from "./Banned";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [banInfo, setBanInfo] = useState<{ reason: string; expires_at: string | null; is_permanent: boolean } | null>(null);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery mode from URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      setIsRecoveryMode(true);
    }
  }, []);

  useEffect(() => {
    if (user && !isRecoveryMode) {
      navigate('/');
    }
  }, [user, navigate, isRecoveryMode]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      // Check if user is banned
      if (error.message === 'BANNED' && error.banInfo) {
        setBanInfo(error.banInfo);
        setIsLoading(false);
        return;
      }
      
      toast({
        title: 'Erro no login',
        description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta ao Wolftoon.',
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm') as string;

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, username);

    if (error) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao Wolftoon. Você já pode fazer login.',
      });
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Este email não está cadastrado no sistema.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verifique seu email',
        description: 'Se este email estiver cadastrado, você receberá um link de recuperação.',
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });
      // Clear recovery mode and redirect
      window.location.hash = '';
      setIsRecoveryMode(false);
      navigate('/');
    }
    setIsLoading(false);
  };

  // Show banned page if user is banned
  if (banInfo) {
    return (
      <Banned 
        reason={banInfo.reason} 
        expiresAt={banInfo.expires_at} 
        isPermanent={banInfo.is_permanent} 
      />
    );
  }

  const handleCancelRecovery = async () => {
    await supabase.auth.signOut();
    window.location.hash = '';
    setIsRecoveryMode(false);
    navigate('/auth');
  };

  // Password Recovery Mode UI
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelRecovery}
            className="mb-8 hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar e sair
          </Button>

          <div className="bg-card border border-border/40 rounded-2xl p-8 glow-card">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-semibold mb-2 text-foreground">
                Nova Senha
              </h1>
              <p className="text-sm text-muted-foreground">
                Digite sua nova senha abaixo
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-border/40 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-background border-border/40 focus:border-primary"
                />
              </div>

              <Button
                onClick={handleUpdatePassword}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-8 hover:bg-primary/10 hover:text-primary"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Wolftoon
          </Link>
        </Button>

        {/* Auth Card */}
        <div className="bg-card border border-border/40 rounded-2xl p-8 glow-card">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-semibold mb-2 text-foreground">
              Wolftoon
            </h1>
            <p className="text-sm text-muted-foreground">
              Sua plataforma de mangás e novels
            </p>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 border-border/40 hover:bg-muted"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                    >
                      Esqueceu sua senha?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar Senha</DialogTitle>
                      <DialogDescription>
                        Digite seu email para receber um link de recuperação de senha.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="bg-background border-border/40 focus:border-primary"
                      />
                      <Button
                        onClick={handlePasswordReset}
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Enviando..." : "Enviar Link"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirmar Senha</Label>
                  <Input
                    id="register-confirm"
                    name="confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-background border-border/40 focus:border-primary"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? "Cadastrando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
