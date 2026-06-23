import { memo } from 'react';
import { UserXP } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XPBarProps {
  xp: UserXP | undefined;
  className?: string;
  showLabel?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const XPBar = memo(({ xp, className, showLabel = true }: XPBarProps) => {
  const current = xp?.xp_in_level ?? 0;
  const needed  = xp?.xp_needed  ?? 100;
  const level   = xp?.level      ?? 1;
  const percent = Math.min(100, Math.round((current / needed) * 100));

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium">Nível {level}</span>
          <span>
            <span className="text-primary font-semibold">{current}</span>
            {' / '}{needed} XP
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-label={`XP: ${current} de ${needed} para o nível ${level + 1}`}
        className="relative h-2 w-full rounded-full overflow-hidden bg-card/80 border border-border/40"
      >
        <div
          className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary transition-[width] duration-500 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
          style={{ width: `${percent}%` }}
          aria-hidden
        />
        {/* Shimmer — suppressed for users who prefer reduced motion via Tailwind's motion-safe */}
        <div
          className="absolute inset-0 motion-safe:animate-pulse bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] pointer-events-none"
          aria-hidden
        />
      </div>
    </div>
  );
});

XPBar.displayName = 'XPBar';

export default XPBar;
