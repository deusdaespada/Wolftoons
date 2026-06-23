import { memo } from 'react';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Lock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Config ───────────────────────────────────────────────────────────────────

type Rarity = Achievement['rarity'];

const RARITY_CONFIG: Record<Rarity, { gradient: string; bg: string; label: string }> = {
  common:    { gradient: 'from-zinc-500 to-zinc-600',   bg: 'bg-zinc-500/10 border-zinc-500/30',   label: 'Comum'    },
  rare:      { gradient: 'from-blue-500 to-blue-600',   bg: 'bg-blue-500/10 border-blue-500/30',   label: 'Raro'     },
  epic:      { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10 border-purple-500/30', label: 'Épico' },
  legendary: { gradient: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Lendário' },
};

const LOCKED_PREVIEW = 6;

// ─── AchievementCard ──────────────────────────────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

const AchievementCard = memo(({ achievement, unlocked }: AchievementCardProps) => {
  const { gradient, bg, label } = RARITY_CONFIG[achievement.rarity];

  return (
    <article
      className={cn(
        'relative p-4 rounded-xl border transition-all duration-300',
        unlocked
          ? cn(bg, 'hover:scale-105')
          : 'bg-muted/30 border-border/30 opacity-50 grayscale',
      )}
      aria-label={`${achievement.name} — ${unlocked ? 'desbloqueada' : 'bloqueada'}`}
    >
      {!unlocked && (
        <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" aria-hidden />
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'text-3xl p-2 rounded-lg shrink-0',
            unlocked ? `bg-gradient-to-br ${gradient} bg-opacity-20` : 'bg-muted',
          )}
          aria-hidden
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{achievement.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {achievement.description}
          </p>
          <Badge
            variant="outline"
            className={cn(
              'mt-2 text-[10px] px-1.5 py-0',
              unlocked && `bg-gradient-to-r ${gradient} text-white border-0`,
            )}
          >
            {label}
          </Badge>
        </div>
      </div>
    </article>
  );
});
AchievementCard.displayName = 'AchievementCard';

// ─── Section ──────────────────────────────────────────────────────────────────

interface AchievementSectionProps {
  title: React.ReactNode;
  achievements: Achievement[];
  unlocked: boolean;
  extra?: React.ReactNode;
}

function AchievementSection({ title, achievements, unlocked, extra }: AchievementSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map((a) => (
          <AchievementCard key={a.id} achievement={a} unlocked={unlocked} />
        ))}
      </div>
      {extra}
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AchievementsSkeleton() {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3" aria-busy aria-label="Carregando conquistas...">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AchievementsBadges() {
  const { unlocked, locked, isLoading, totalPoints } = useAchievements();

  if (isLoading) return <AchievementsSkeleton />;

  const visibleLocked = locked.slice(0, LOCKED_PREVIEW);
  const hiddenCount = locked.length - LOCKED_PREVIEW;

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" aria-hidden />
              Conquistas
            </CardTitle>
            <CardDescription>
              {unlocked.length} de {unlocked.length + locked.length} desbloqueadas
            </CardDescription>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full"
            aria-label={`${totalPoints} pontos de conquista`}
          >
            <Trophy className="h-4 w-4 text-yellow-400" aria-hidden />
            <span className="font-bold text-yellow-400">{totalPoints}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {unlocked.length > 0 && (
          <AchievementSection
            unlocked
            achievements={unlocked}
            title={
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                <span className="text-primary">Desbloqueadas</span>
              </>
            }
          />
        )}

        {visibleLocked.length > 0 && (
          <AchievementSection
            unlocked={false}
            achievements={visibleLocked}
            title={
              <>
                <Lock className="h-3 w-3 text-muted-foreground" aria-hidden />
                <span className="text-muted-foreground">Bloqueadas</span>
              </>
            }
            extra={
              hiddenCount > 0 ? (
                <p className="text-xs text-muted-foreground text-center" aria-live="polite">
                  +{hiddenCount} conquistas a desbloquear
                </p>
              ) : undefined
            }
          />
        )}

        {unlocked.length === 0 && locked.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma conquista disponível ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
