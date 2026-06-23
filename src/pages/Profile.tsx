import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoritesWithTitles } from '@/hooks/useFavoritesWithTitles';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { useDetailedUserStats } from '@/hooks/useDetailedUserStats';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PageTransition from '@/components/PageTransition';
import MangaCard from '@/components/MangaCard';
import ProfileStats from '@/components/profile/ProfileStats';
import GenreChart from '@/components/profile/GenreChart';
import ActivityChart from '@/components/profile/ActivityChart';
import TypeDistribution from '@/components/profile/TypeDistribution';
import AchievementsBadges from '@/components/profile/AchievementsBadges';
import ReadingGoalsCard from '@/components/profile/ReadingGoalsCard';
import StatsComparison from '@/components/profile/StatsComparison';
import LevelBadge from '@/components/profile/LevelBadge';
import XPBar from '@/components/profile/XPBar';
import DailyCheckinCard from '@/components/profile/DailyCheckinCard';
import { useUserXP } from '@/hooks/useGamification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User, Heart, BookOpen, Settings, Crown, Save, History, Trash2,
  LogOut, Calendar, Key, BarChart3, Camera, Sparkles, Target,
  Trophy, PieChart, Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const NAV_ITEMS = [
  { id: 'overview',  label: 'Visão Geral',    icon: BarChart3 },
  { id: 'progress',  label: 'Continue Lendo', icon: BookOpen  },
  { id: 'history',   label: 'Histórico',      icon: History   },
  { id: 'favorites', label: 'Favoritos',      icon: Heart     },
  { id: 'settings',  label: 'Configurações',  icon: Settings  },
] as const;

type SectionId = typeof NAV_ITEMS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Formato inválido. Use JPEG, PNG, WebP, GIF ou AVIF.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `A imagem deve ter no máximo ${MAX_FILE_SIZE_MB}MB.`;
  return null;
}

async function uploadImage(userId: string, file: File, path: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${path}.${ext}`;
  const { error } = await supabase.storage.from('covers').upload(filePath, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from('covers').getPublicUrl(filePath).data.publicUrl;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

function EmptyState({ icon: Icon, message, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <Card className="bg-card/40 border-border/30">
      <CardContent className="py-10 text-center">
        <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" aria-hidden />
        <p className="text-muted-foreground mb-3">{message}</p>
        {actionLabel && actionTo && (
          <Button asChild size="sm">
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonList({ count = 3, className = 'h-24' }: { count?: number; className?: string }) {
  return (
    <div className="space-y-2" aria-busy aria-label="Carregando...">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${className} bg-card/50 rounded-xl animate-pulse`} />
      ))}
    </div>
  );
}

// ─── Profile Header ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  user: { email?: string | null; created_at?: string };
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  isVip: boolean;
  userXP: any;
  detailedStats: any;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ProfileHeader({
  user, username, avatarUrl, bannerUrl, isVip,
  userXP, detailedStats, onBannerChange, onAvatarChange,
}: ProfileHeaderProps) {
  const memberSince = useMemo(
    () => user.created_at ? new Date(user.created_at) : new Date(),
    [user.created_at],
  );

  const displayName = username || user.email?.split('@')[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm">
      {/* Banner */}
      <div className="relative h-32 md:h-44 w-full overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner do perfil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-amber-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <label className="absolute top-2 right-2 cursor-pointer" aria-label="Trocar capa de fundo">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 hover:bg-black/70 text-white text-[11px] font-medium backdrop-blur-sm transition">
            <ImageIcon className="h-3 w-3" aria-hidden />
            Trocar capa
          </div>
          <input type="file" accept="image/*,.avif" onChange={onBannerChange} className="sr-only" />
        </label>
      </div>

      <div className="px-4 md:px-5 pb-5 -mt-12 md:-mt-14 relative">
        <div className="flex items-end gap-3 md:gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-card shadow-xl">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" alt={`Avatar de ${displayName}`} />
              <AvatarFallback className="bg-muted">
                <User className="h-8 w-8 text-muted-foreground" aria-hidden />
              </AvatarFallback>
            </Avatar>
            {isVip && (
              <div
                className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full ring-2 ring-card"
                aria-label="Usuário VIP"
              >
                <Crown className="h-3.5 w-3.5 text-white" aria-hidden />
              </div>
            )}
          </div>

          {/* Name & Level */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-xl md:text-2xl font-bold truncate">{displayName}</h1>
              {isVip && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full text-[10px] font-bold">
                  <Sparkles className="h-2.5 w-2.5" aria-hidden /> VIP
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden />
              <span>Desde {memberSince.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="hidden sm:block shrink-0 pb-1">
            <LevelBadge level={userXP?.level ?? 1} size="md" />
          </div>
        </div>

        <div className="mt-4">
          <XPBar xp={userXP} />
        </div>

        {/* Quick Stats */}
        <dl className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/30">
          {[
            { value: detailedStats?.chaptersRead ?? 0,   label: 'Capítulos', color: 'text-primary'    },
            { value: detailedStats?.titlesRead    ?? 0,  label: 'Títulos',   color: 'text-blue-400'   },
            { value: detailedStats?.favoritesCount ?? 0, label: 'Favoritos', color: 'text-red-400'    },
            { value: detailedStats?.readingStreak  ?? 0, label: 'Streak 🔥', color: 'text-orange-400' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <dd className={`text-lg font-bold ${color}`}>{value}</dd>
              <dt className="text-[10px] text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ─── Section Nav ──────────────────────────────────────────────────────────────

interface SectionNavProps {
  active: SectionId;
  onChange: (id: SectionId) => void;
}

function SectionNav({ active, onChange }: SectionNavProps) {
  return (
    <nav aria-label="Seções do perfil" className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            active === id
              ? 'bg-primary text-primary-foreground'
              : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────

function OverviewSection({ detailedStats, statsLoading }: { detailedStats: any; statsLoading: boolean }) {
  return (
    <div className="space-y-4">
      <ProfileStats stats={detailedStats} isLoading={statsLoading} />

      <div className="grid md:grid-cols-2 gap-4">
        <DailyCheckinCard />
        <ReadingGoalsCard />
      </div>

      <AchievementsBadges />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/40 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-400" aria-hidden />
              Gêneros Favoritos
            </CardTitle>
            <CardDescription className="text-xs">Top 5 gêneros mais lidos</CardDescription>
          </CardHeader>
          <CardContent>
            {(detailedStats?.favoriteGenres ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Leia mais para ver seus gêneros favoritos
              </p>
            ) : (
              <GenreChart genres={detailedStats.favoriteGenres} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
              Atividade Mensal
            </CardTitle>
            <CardDescription className="text-xs">Capítulos lidos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart activity={detailedStats?.monthlyActivity ?? []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(detailedStats?.typeDistribution?.length ?? 0) > 0 && (
          <Card className="bg-card/40 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-400" aria-hidden />
                Tipos de Obras
              </CardTitle>
              <CardDescription className="text-xs">Distribuição por tipo de conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              <TypeDistribution types={detailedStats.typeDistribution} />
            </CardContent>
          </Card>
        )}
        <StatsComparison />
      </div>
    </div>
  );
}

// ─── Progress Section ─────────────────────────────────────────────────────────

function ProgressSection({ progress, isLoading }: { progress: any[]; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Continue Lendo</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-24 bg-card/50 rounded-xl animate-pulse" aria-hidden />
          ))}
        </div>
      ) : progress.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="Você ainda não começou a ler nada."
          actionLabel="Explorar Catálogo"
          actionTo="/catalog"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {progress.map((item) => (
            <Link key={item.id} to={`/read/${item.title_id}/${item.chapter?.chapter_number ?? 1}`}>
              <Card className="bg-card/40 border-border/30 overflow-hidden hover:border-primary/40 transition-all group">
                <div className="flex gap-3 p-3">
                  <img
                    src={item.title?.cover}
                    alt={item.title?.title}
                    className="w-14 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {item.title?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cap. {item.chapter?.chapter_number} • Pág. {item.page_number}
                    </p>
                    {item.completed && (
                      <span className="inline-block mt-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
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
    </div>
  );
}

// ─── History Section ──────────────────────────────────────────────────────────

interface HistorySectionProps {
  history: any[];
  isLoading: boolean;
  isClearing: boolean;
  onClear: () => void;
}

function HistorySection({ history, isLoading, isClearing, onClear }: HistorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Leitura</h2>
        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 text-xs">
                <Trash2 className="h-3.5 w-3.5 mr-1" aria-hidden /> Limpar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClear}
                  disabled={isClearing}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isClearing ? 'Limpando...' : 'Limpar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={5} className="h-16" />
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          message="Seu histórico está vazio."
          actionLabel="Começar a Ler"
          actionTo="/catalog"
        />
      ) : (
        <div className="space-y-1.5">
          {history.map((item) => (
            <Link key={item.id} to={`/read/${item.title_id}/${item.chapter?.chapter_number ?? 1}`}>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card/30 hover:bg-card/60 transition-colors group">
                <img
                  src={item.title?.cover}
                  alt={item.title?.title}
                  className="w-10 h-14 object-cover rounded"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {item.title?.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cap. {item.chapter?.chapter_number}
                    {item.chapter?.chapter_title && ` - ${item.chapter.chapter_title}`}
                  </p>
                </div>
                <time
                  className="text-[10px] text-muted-foreground whitespace-nowrap"
                  dateTime={item.read_at}
                >
                  {formatDistanceToNow(new Date(item.read_at), { addSuffix: true, locale: ptBR })}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Favorites Section ────────────────────────────────────────────────────────

function FavoritesSection({ favorites, isLoading }: { favorites: any[]; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Meus Favoritos ({favorites.length})</h2>
      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2" aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[3/4] bg-card/50 rounded-lg animate-pulse" aria-hidden />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          message="Você ainda não tem favoritos."
          actionLabel="Explorar Catálogo"
          actionTo="/catalog"
        />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {favorites.map((fav) => (
            <MangaCard
              key={fav.id}
              id={fav.title_id}
              title={fav.title?.title ?? ''}
              cover={fav.title?.cover ?? ''}
              type={(fav.title?.type as 'Manhwa' | 'Manhua' | 'Mangá') ?? 'Manhwa'}
              rating={fav.title?.rating ?? 0}
              views={fav.title?.views ?? 0}
              status={(fav.title?.status as 'Completo' | 'Em andamento') ?? 'Em andamento'}
              genres={fav.title?.genres ?? []}
              slug={fav.title?.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

interface SettingsSectionProps {
  user: { email?: string | null; id: string };
  username: string;
  avatarUrl: string;
  isVip: boolean;
  isSaving: boolean;
  isChangingPassword: boolean;
  isDeletingAccount: boolean;
  newPassword: string;
  confirmNewPassword: string;
  onUsernameChange: (v: string) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onSave: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

function SettingsSection({
  user, username, avatarUrl, isVip,
  isSaving, isChangingPassword, isDeletingAccount,
  newPassword, confirmNewPassword,
  onUsernameChange, onAvatarChange,
  onNewPasswordChange, onConfirmPasswordChange,
  onSave, onChangePassword, onSignOut, onDeleteAccount,
}: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Profile info */}
      <Card className="bg-card/40 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4 text-primary" aria-hidden /> Informações do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar atual" />
                <AvatarFallback><User className="h-8 w-8" aria-hidden /></AvatarFallback>
              </Avatar>
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                aria-label="Trocar avatar"
              >
                <Camera className="h-5 w-5 text-white" aria-hidden />
                <input type="file" accept="image/*,.avif" onChange={onAvatarChange} className="sr-only" />
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs">Nome de usuário</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="Seu nome de usuário"
                  className="h-9 bg-background/50"
                  maxLength={32}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" value={user.email ?? ''} disabled className="h-9 bg-muted/50" />
              </div>
            </div>
          </div>
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="bg-card/40 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" aria-hidden /> Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-password" className="text-xs">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                placeholder="••••••••"
                className="h-9 bg-background/50"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-xs">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="••••••••"
                className="h-9 bg-background/50"
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button onClick={onChangePassword} disabled={isChangingPassword} variant="secondary" size="sm">
            <Key className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      {/* VIP upsell */}
      {!isVip && (
        <Card className="bg-gradient-to-r from-primary/15 to-yellow-500/10 border-primary/20">
          <CardContent className="py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center" aria-hidden>
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Torne-se VIP</h3>
                <p className="text-xs text-muted-foreground">Acesso a benefícios exclusivos</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0">
              <Link to="/vip">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" aria-hidden /> Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Sair da conta
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeletingAccount}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden /> Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isDeletingAccount ? 'Excluindo...' : 'Excluir conta'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, isVip, signOut } = useAuth();
  const { data: favorites = [], isLoading: favoritesLoading } = useFavoritesWithTitles();
  const { progress, isLoading: progressLoading } = useReadingProgress();
  const { history, isLoading: historyLoading, clearHistory, isClearingHistory } = useReadingHistory();
  const { data: detailedStats, isLoading: statsLoading } = useDetailedUserStats(user?.id);
  const { data: userXP } = useUserXP(user?.id);
  const { toast } = useToast();

  const [username, setUsername]                     = useState('');
  const [avatarUrl, setAvatarUrl]                   = useState('');
  const [bannerUrl, setBannerUrl]                   = useState('');
  const [avatarFile, setAvatarFile]                 = useState<File | null>(null);
  const [bannerFile, setBannerFile]                 = useState<File | null>(null);
  const [isSaving, setIsSaving]                     = useState(false);
  const [newPassword, setNewPassword]               = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount]   = useState(false);
  const [activeSection, setActiveSection]           = useState<SectionId>('overview');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username, avatar_url, banner_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setUsername(data.username ?? '');
        setAvatarUrl(data.avatar_url ?? '');
        setBannerUrl((data as any).banner_url ?? '');
      });
  }, [user]);

  const handleImageChange = useCallback(
    (setter: (url: string) => void, fileSetter: (f: File) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const err = validateImageFile(file);
        if (err) { toast({ title: 'Arquivo inválido', description: err, variant: 'destructive' }); return; }
        fileSetter(file);
        setter(URL.createObjectURL(file));
      },
    [toast],
  );

  const handleAvatarChange = useMemo(
    () => handleImageChange(setAvatarUrl, setAvatarFile),
    [handleImageChange],
  );
  const handleBannerChange = useMemo(
    () => handleImageChange(setBannerUrl, setBannerFile),
    [handleImageChange],
  );

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const finalAvatarUrl = avatarFile ? await uploadImage(user.id, avatarFile, 'avatar') : avatarUrl;
      const finalBannerUrl = bannerFile ? await uploadImage(user.id, bannerFile, 'banner') : bannerUrl;

      const payload = {
        username,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
        updated_at: new Date().toISOString(),
      } as any;

      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (error) {
        const { error: insertError } = await supabase.from('profiles').insert({ id: user.id, ...payload });
        if (insertError) throw insertError;
      }

      setAvatarUrl(finalAvatarUrl);
      setBannerUrl(finalBannerUrl);
      setAvatarFile(null);
      setBannerFile(null);
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' });
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o perfil.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [user, avatarFile, bannerFile, avatarUrl, bannerUrl, username, toast]);

  const handleClearHistory = useCallback(() => {
    clearHistory(undefined, {
      onSuccess: () => toast({ title: 'Histórico limpo', description: 'Seu histórico foi removido.' }),
      onError:   () => toast({ title: 'Erro', description: 'Não foi possível limpar o histórico.', variant: 'destructive' }),
    });
  }, [clearHistory, toast]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao excluir conta');

      toast({ title: 'Conta excluída', description: 'Sua conta foi excluída permanentemente.' });
      await signOut();
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message ?? 'Não foi possível excluir a conta.', variant: 'destructive' });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [signOut, navigate, toast]);

  const handleChangePassword = useCallback(async () => {
    if (!newPassword || !confirmNewPassword) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos de senha.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Senhas diferentes', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Senha alterada', description: 'Sua senha foi atualizada.' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message ?? 'Não foi possível alterar a senha.', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  }, [newPassword, confirmNewPassword, toast]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16" aria-busy aria-label="Carregando perfil...">
          <div className="animate-pulse space-y-4 max-w-5xl mx-auto">
            <div className="h-44 bg-card rounded-2xl" />
            <div className="h-10 bg-card rounded-xl" />
            <div className="h-64 bg-card rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
          <ProfileHeader
            user={user}
            username={username}
            avatarUrl={avatarUrl}
            bannerUrl={bannerUrl}
            isVip={isVip}
            userXP={userXP}
            detailedStats={detailedStats}
            onBannerChange={handleBannerChange}
            onAvatarChange={handleAvatarChange}
          />

          <SectionNav active={activeSection} onChange={setActiveSection} />

          {activeSection === 'overview' && (
            <OverviewSection detailedStats={detailedStats} statsLoading={statsLoading} />
          )}
          {activeSection === 'progress' && (
            <ProgressSection progress={progress} isLoading={progressLoading} />
          )}
          {activeSection === 'history' && (
            <HistorySection
              history={history}
              isLoading={historyLoading}
              isClearing={isClearingHistory}
              onClear={handleClearHistory}
            />
          )}
          {activeSection === 'favorites' && (
            <FavoritesSection favorites={favorites} isLoading={favoritesLoading} />
          )}
          {activeSection === 'settings' && (
            <SettingsSection
              user={user}
              username={username}
              avatarUrl={avatarUrl}
              isVip={isVip}
              isSaving={isSaving}
              isChangingPassword={isChangingPassword}
              isDeletingAccount={isDeletingAccount}
              newPassword={newPassword}
              confirmNewPassword={confirmNewPassword}
              onUsernameChange={setUsername}
              onAvatarChange={handleAvatarChange}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmNewPassword}
              onSave={handleSaveProfile}
              onChangePassword={handleChangePassword}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
        </main>
      </div>
    </PageTransition>
  );
};

export default Profile;
