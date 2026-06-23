import { memo, useMemo, useCallback } from 'react';
import { Flame, Gift, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyCheckin } from '@/hooks/useGamification';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns how many days of the current 7-day cycle are completed.
 * streak=0 → 0, streak=7 → 7, streak=8 → 1, streak=14 → 7, etc.
 */
function activeDaysInCycle(streak: number): number {
  if (streak === 0) return 0;
  const mod = streak % 7;
  return mod === 0 ? 7 : mod;
}

// ─── WeekGrid ─────────────────────────────────────────────────────────────────

interface WeekGridProps {
  streak: number;
}

const WeekGrid = memo(({ streak }: WeekGridProps) => {
  const activeDays = useMemo(() => activeDaysInCycle(streak), [streak]);

  return (
    <div
      className="grid grid-cols-7 gap-1"
      role="list"
      aria-label="Progresso semanal"
    >
      {WEEK_DAYS.map((dayLabel, i) => {
        const active = i < activeDays;
        return (
          <div
            key={i}
            role="listitem"
            aria-label={`Dia ${i + 1}: ${active ? 'completo' : 'pendente'}`}
            className={cn(
              'h-7 rounded-md flex items-center justify-center text-[10px] font-medium border transition-colors',
              active
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-card/40 border-border/30 text-muted-foreground',
            )}
          >
            {active
              ? <Check className="h-3 w-3" aria-hidden />
              : <span aria-hidden>{dayLabel}</span>
            }
          </div>
        );
      })}
    </div>
  );
});
WeekGrid.displayName = 'WeekGrid';

// ─── ButtonLabel ──────────────────────────────────────────────────────────────

function ButtonLabel({ isPending, checkedToday }: { isPending: boolean; checkedToday: boolean }) {
  if (isPending) return <><Loader2 className="h-4 w-4 mr-1 animate-spin" aria-hidden />Validando...</>;
  if (checkedToday) return <><Check className="h-4 w-4 mr-1" aria-hidden />Check-in feito</>;
  return <><Gift className="h-4 w-4 mr-1" aria-hidden />Fazer Check-in</>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DailyCheckinCard() {
  const { data, isLoading, checkin } = useDailyCheckin();
  const { toast } = useToast();

  const streak      = data?.streak ?? 0;
  const checkedToday = data?.checkedToday ?? false;

  const handleCheckin = useCallback(async () => {
    try {
      const result = await checkin.mutateAsync();
      if (result.already_checked) {
        toast({
          title: 'Já fez check-in hoje',
          description: `Sequência atual: ${result.streak} dias.`,
        });
      } else {
        toast({
          title: `+${result.xp_awarded} XP!`,
          description: `Check-in registrado. Sequência: ${result.streak} dias 🔥`,
        });
      }
    } catch {
      toast({
        title: 'Erro no check-in',
        description: 'Não foi possível registrar o check-in. Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [checkin, toast]);

  const isDisabled = isLoading || checkin.isPending || checkedToday;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card/60 to-amber-500/10 border-primary/20 backdrop-blur-sm overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" aria-hidden />

      <CardHeader className="pb-2 relative">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" aria-hidden />
          Check-in Diário
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {/* Streak counter + status */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30"
            aria-label={`Sequência de ${streak} dias`}
          >
            <Flame className="h-4 w-4 text-orange-400" aria-hidden />
            <span className="font-bold text-orange-400">{streak}</span>
            <span className="text-[11px] text-muted-foreground">dias</span>
          </div>
          <p className="text-xs text-muted-foreground flex-1">
            {checkedToday
              ? 'Check-in feito hoje. Volte amanhã!'
              : 'Ganhe XP e mantenha sua sequência ativa.'}
          </p>
        </div>

        <WeekGrid streak={streak} />

        <Button
          onClick={handleCheckin}
          disabled={isDisabled}
          className="w-full"
          size="sm"
          aria-label={
            checkedToday
              ? 'Check-in já realizado hoje'
              : 'Realizar check-in diário'
          }
        >
          <ButtonLabel isPending={checkin.isPending} checkedToday={checkedToday} />
        </Button>
      </CardContent>
    </Card>
  );
}
