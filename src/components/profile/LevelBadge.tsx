import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types & Config ───────────────────────────────────────────────────────────

interface Tier {
  name: string;
  gradient: string;
  ring: string;
  /** Minimum level (inclusive) to reach this tier */
  threshold: number;
}

// Ordered highest → lowest so find() short-circuits early for high-level users
const TIERS: readonly Tier[] = [
  { threshold: 50, name: 'Mestre',    gradient: 'from-yellow-400 to-amber-600',  ring: 'ring-amber-400/40'   },
  { threshold: 30, name: 'Lendário',  gradient: 'from-purple-500 to-fuchsia-600', ring: 'ring-fuchsia-500/40' },
  { threshold: 20, name: 'Épico',     gradient: 'from-rose-500 to-red-600',       ring: 'ring-rose-500/40'    },
  { threshold: 10, name: 'Raro',      gradient: 'from-sky-400 to-blue-600',       ring: 'ring-blue-500/40'    },
  { threshold: 5,  name: 'Avançado',  gradient: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-500/40' },
  { threshold: 0,  name: 'Iniciante', gradient: 'from-zinc-400 to-zinc-600',      ring: 'ring-zinc-500/40'    },
] as const;

const SIZE_CLASSES = {
  sm: { circle: 'h-8  w-8  text-xs',  sparkle: 'h-2.5 w-2.5' },
  md: { circle: 'h-12 w-12 text-sm',  sparkle: 'h-3   w-3'   },
  lg: { circle: 'h-16 w-16 text-base', sparkle: 'h-3.5 w-3.5' },
} as const;

type Size = keyof typeof SIZE_CLASSES;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tierFor(level: number): Tier {
  return TIERS.find((t) => level >= t.threshold) ?? TIERS[TIERS.length - 1];
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface LevelBadgeProps {
  level: number;
  size?: Size;
  className?: string;
}

const LevelBadge = memo(({ level, size = 'md', className }: LevelBadgeProps) => {
  const tier = tierFor(level);
  const { circle, sparkle } = SIZE_CLASSES[size];

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      role="img"
      aria-label={`Nível ${level} — ${tier.name}`}
    >
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center font-bold text-white',
          'shadow-lg bg-gradient-to-br ring-2 ring-offset-2 ring-offset-background',
          circle,
          tier.gradient,
          tier.ring,
        )}
      >
        <span className="leading-none" aria-hidden>{level}</span>

        <Sparkles
          className={cn('absolute -top-1 -right-1 text-yellow-300 drop-shadow', sparkle)}
          aria-hidden
        />
      </div>

      {size !== 'sm' && (
        <span className="mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {tier.name}
        </span>
      )}
    </div>
  );
});

LevelBadge.displayName = 'LevelBadge';

export default LevelBadge;
