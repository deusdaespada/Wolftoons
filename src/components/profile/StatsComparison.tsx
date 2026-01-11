import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useDetailedUserStats } from '@/hooks/useDetailedUserStats';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Users, BookOpen, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonItemProps {
  label: string;
  icon: React.ReactNode;
  userValue: number;
  avgValue: number;
  unit: string;
  higherIsBetter?: boolean;
}

const ComparisonItem = ({ label, icon, userValue, avgValue, unit, higherIsBetter = true }: ComparisonItemProps) => {
  const diff = userValue - avgValue;
  const percentDiff = avgValue > 0 ? Math.round((diff / avgValue) * 100) : 0;
  const isAbove = diff > 0;
  const isSame = Math.abs(percentDiff) < 5;
  
  const status = isSame ? 'same' : (isAbove === higherIsBetter ? 'good' : 'bad');

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">
            Média da plataforma: {avgValue.toFixed(1)} {unit}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-lg">{userValue.toFixed(1)} {unit}</p>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          status === 'good' && 'text-green-500',
          status === 'bad' && 'text-red-400',
          status === 'same' && 'text-muted-foreground'
        )}>
          {status === 'good' && <TrendingUp className="h-3 w-3" />}
          {status === 'bad' && <TrendingDown className="h-3 w-3" />}
          {status === 'same' && <Minus className="h-3 w-3" />}
          {isSame ? 'Na média' : `${Math.abs(percentDiff)}% ${isAbove ? 'acima' : 'abaixo'}`}
        </div>
      </div>
    </div>
  );
};

export default function StatsComparison() {
  const { user } = useAuth();
  const { data: platformStats, isLoading: platformLoading } = usePlatformStats();
  const { data: userStats, isLoading: userLoading } = useDetailedUserStats(user?.id);

  const isLoading = platformLoading || userLoading;

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  if (!platformStats || !userStats) return null;

  const userChapters = userStats.chaptersRead || 0;
  const userReadingTime = (userStats.estimatedReadingTime || 0) / 60; // Convert minutes to hours
  const userTitles = userStats.titlesRead || 0;

  // Estimate avg titles per user
  const avgTitlesPerUser = platformStats.avg_chapters_per_user / 10; // Estimate

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Comparação com a Comunidade
            </CardTitle>
            <CardDescription>
              Veja como você se compara com a média de {platformStats.total_users.toLocaleString()} leitores
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold">{platformStats.total_users.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <ComparisonItem
          label="Capítulos Lidos"
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          userValue={userChapters}
          avgValue={platformStats.avg_chapters_per_user}
          unit="caps"
          higherIsBetter={true}
        />
        
        <ComparisonItem
          label="Tempo de Leitura"
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          userValue={userReadingTime}
          avgValue={platformStats.avg_reading_time_hours}
          unit="h"
          higherIsBetter={true}
        />
        
        <ComparisonItem
          label="Obras na Lista"
          icon={<Users className="h-5 w-5 text-purple-400" />}
          userValue={userTitles}
          avgValue={avgTitlesPerUser}
          unit=""
          higherIsBetter={true}
        />

        {platformStats.top_genre && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Gênero mais popular da plataforma</p>
            <p className="font-bold text-primary">{platformStats.top_genre}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
