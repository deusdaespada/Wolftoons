import { useState } from 'react';
import { useReadingGoals } from '@/hooks/useReadingGoals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Calendar, CalendarDays, Settings2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ReadingGoalsCard() {
  const { goals, progress, isLoading, updateGoals, isUpdating, weeklyProgress, monthlyProgress } = useReadingGoals();
  const [isEditing, setIsEditing] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(goals.weekly_goal);
  const [monthlyGoal, setMonthlyGoal] = useState(goals.monthly_goal);

  const handleSave = () => {
    updateGoals(
      { weeklyGoal, monthlyGoal },
      {
        onSuccess: () => {
          toast.success('Metas atualizadas!');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Erro ao atualizar metas');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas de Leitura
            </CardTitle>
            <CardDescription>Defina suas metas semanais e mensais</CardDescription>
          </div>
          
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWeeklyGoal(goals.weekly_goal);
                setMonthlyGoal(goals.monthly_goal);
                setIsEditing(true);
              }}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="text-green-500"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Weekly Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="font-medium">Meta Semanal</span>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 1)}
                  className="w-20 h-8 text-center"
                  min={1}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">caps</span>
              </div>
            ) : (
              <span className={cn(
                'text-sm font-medium',
                weeklyProgress >= 100 ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {progress.weekly} / {goals.weekly_goal} capítulos
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <Progress 
              value={weeklyProgress} 
              className={cn(
                'h-3',
                weeklyProgress >= 100 && '[&>div]:bg-green-500'
              )}
            />
            <p className="text-xs text-muted-foreground text-right">
              {weeklyProgress >= 100 ? '🎉 Meta alcançada!' : `${Math.round(weeklyProgress)}% concluído`}
            </p>
          </div>
        </div>

        {/* Monthly Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-400" />
              <span className="font-medium">Meta Mensal</span>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseInt(e.target.value) || 1)}
                  className="w-20 h-8 text-center"
                  min={1}
                  max={500}
                />
                <span className="text-sm text-muted-foreground">caps</span>
              </div>
            ) : (
              <span className={cn(
                'text-sm font-medium',
                monthlyProgress >= 100 ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {progress.monthly} / {goals.monthly_goal} capítulos
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            <Progress 
              value={monthlyProgress} 
              className={cn(
                'h-3',
                monthlyProgress >= 100 && '[&>div]:bg-green-500'
              )}
            />
            <p className="text-xs text-muted-foreground text-right">
              {monthlyProgress >= 100 ? '🎉 Meta alcançada!' : `${Math.round(monthlyProgress)}% concluído`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
