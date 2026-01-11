import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritesWithTitles } from '@/hooks/useFavoritesWithTitles';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { useDetailedUserStats } from '@/hooks/useDetailedUserStats';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import MangaCard from '@/components/MangaCard';
import ProfileStats from '@/components/profile/ProfileStats';
import GenreChart from '@/components/profile/GenreChart';
import ActivityChart from '@/components/profile/ActivityChart';
import TypeDistribution from '@/components/profile/TypeDistribution';
import AchievementsBadges from '@/components/profile/AchievementsBadges';
import ReadingGoalsCard from '@/components/profile/ReadingGoalsCard';
import StatsComparison from '@/components/profile/StatsComparison';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Heart, BookOpen, Settings, Crown, Save, History, Trash2, LogOut, Calendar, Clock, Key, BarChart3, Camera, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, isVip, signOut } = useAuth();
  const { data: favorites = [], isLoading: favoritesLoading } = useFavoritesWithTitles();
  const { progress, isLoading: progressLoading } = useReadingProgress();
  const { history, isLoading: historyLoading, clearHistory, isClearingHistory } = useReadingHistory();
  const { data: detailedStats, isLoading: statsLoading } = useDetailedUserStats(user?.id);
  const { toast } = useToast();
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    
    loadProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('covers')
          .getPublicUrl(filePath);

        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            avatar_url: finalAvatarUrl,
          });
        
        if (insertError) throw insertError;
      }

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = () => {
    clearHistory(undefined, {
      onSuccess: () => {
        toast({
          title: 'Histórico limpo',
          description: 'Seu histórico de leitura foi removido.',
        });
      },
      onError: () => {
        toast({
          title: 'Erro',
          description: 'Não foi possível limpar o histórico.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta');
      }

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída permanentemente.',
      });
      
      await signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a conta.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos de senha.',
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

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi atualizada com sucesso.',
      });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-card rounded-3xl" />
            <div className="h-24 bg-card rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const memberSince = user.created_at ? new Date(user.created_at) : new Date();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header - Hero Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }} />
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="relative">
                  <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary/30 shadow-lg shadow-primary/20">
                    <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/30 to-primary/10">
                      <User className="h-16 w-16 text-primary/70" />
                    </AvatarFallback>
                  </Avatar>
                  {isVip && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-2.5 shadow-lg">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {username || user.email?.split('@')[0]}
                    </h1>
                    {isVip && (
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 rounded-full text-sm font-semibold w-fit mx-auto lg:mx-0">
                        <Sparkles className="h-4 w-4" />
                        Membro VIP
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                
                {/* Quick Info */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Membro desde {memberSince.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  {isVip && (
                    <Link 
                      to="/vip/status" 
                      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                    >
                      <Crown className="h-4 w-4" />
                      Ver Status VIP
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Suas Estatísticas
          </h2>
          <ProfileStats stats={detailedStats} isLoading={statsLoading} />
        </div>

        {/* Achievements & Goals Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <ReadingGoalsCard />
          <StatsComparison />
        </div>

        {/* Achievements */}
        <AchievementsBadges />

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Genre Chart */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                Gêneros Favoritos
              </CardTitle>
              <CardDescription>Baseado no seu histórico de leitura</CardDescription>
            </CardHeader>
            <CardContent>
              <GenreChart genres={detailedStats?.favoriteGenres || []} />
            </CardContent>
          </Card>

          {/* Activity Chart */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Atividade Mensal
              </CardTitle>
              <CardDescription>Capítulos lidos nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart activity={detailedStats?.monthlyActivity || []} />
            </CardContent>
          </Card>
        </div>

        {/* Type Distribution */}
        {detailedStats?.typeDistribution && detailedStats.typeDistribution.length > 0 && (
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                Tipos de Obras Lidas
              </CardTitle>
              <CardDescription>Distribuição por tipo de conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              <TypeDistribution types={detailedStats.typeDistribution} />
            </CardContent>
          </Card>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px] bg-card/50 p-1">
            <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favoritos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Reading Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <h2 className="text-xl font-semibold">Continue Lendo</h2>
            {progressLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-card/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : progress.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">Você ainda não começou a ler nada.</p>
                  <Button asChild>
                    <Link to="/catalog">Explorar Catálogo</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.map((item) => (
                  <Link key={item.id} to={`/read/${item.title_id}/${item.chapter?.chapter_number || 1}`}>
                    <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/50 hover:bg-card/80 transition-all duration-300 group">
                      <div className="flex gap-4 p-4">
                        <img 
                          src={item.title?.cover} 
                          alt={item.title?.title}
                          className="w-16 h-24 object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">{item.title?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Capítulo {item.chapter?.chapter_number}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Página {item.page_number}
                          </p>
                          {item.completed && (
                            <span className="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Concluído
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reading History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Histórico de Leitura</h2>
              {history.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todo seu histórico de leitura será removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearHistory}
                        disabled={isClearingHistory}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isClearingHistory ? 'Limpando...' : 'Limpar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            {historyLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-card/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <History className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">Seu histórico de leitura está vazio.</p>
                  <Button asChild>
                    <Link to="/catalog">Começar a Ler</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <Link key={item.id} to={`/read/${item.title_id}/${item.chapter?.chapter_number || 1}`}>
                    <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-primary/50 hover:bg-card/80 transition-all duration-300 group">
                      <div className="flex items-center gap-4 p-3">
                        <img 
                          src={item.title?.cover} 
                          alt={item.title?.title}
                          className="w-12 h-16 object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate group-hover:text-primary transition-colors">{item.title?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Capítulo {item.chapter?.chapter_number}
                            {item.chapter?.chapter_title && ` - ${item.chapter.chapter_title}`}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <h2 className="text-xl font-semibold">Meus Favoritos ({favorites.length})</h2>
            {favoritesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-card/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-muted-foreground mb-4">Você ainda não tem favoritos.</p>
                  <Button asChild>
                    <Link to="/catalog">Explorar Catálogo</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {favorites.map((fav) => (
                  <MangaCard 
                    key={fav.id} 
                    id={fav.title_id}
                    title={fav.title?.title || ''}
                    cover={fav.title?.cover || ''}
                    type={(fav.title?.type as "Manhwa" | "Manhua" | "Mangá") || 'Manhwa'}
                    rating={fav.title?.rating || 0}
                    views={fav.title?.views || 0}
                    status={(fav.title?.status as "Completo" | "Em andamento") || 'Em andamento'}
                    genres={fav.title?.genres || []}
                    slug={fav.title?.slug}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Profile Settings */}
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>Atualize suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*,.avif"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de usuário</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Seu nome de usuário"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={user.email || ''}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isChangingPassword}
                  variant="secondary"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </CardContent>
            </Card>

            {/* VIP Banner */}
            {!isVip && (
              <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-yellow-500/10 border-primary/30 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }} />
                </div>
                <CardContent className="py-8 relative">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Torne-se VIP</h3>
                        <p className="text-sm text-muted-foreground">
                          Acesso a benefícios exclusivos e conteúdo premium
                        </p>
                      </div>
                    </div>
                    <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0">
                      <Link to="/vip">Ver Benefícios</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da Conta
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        disabled={isDeletingAccount}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos, incluindo:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Perfil e avatar</li>
                            <li>Favoritos</li>
                            <li>Histórico de leitura</li>
                            <li>Comentários</li>
                            <li>Progresso de leitura</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingAccount ? 'Excluindo...' : 'Excluir Permanentemente'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
