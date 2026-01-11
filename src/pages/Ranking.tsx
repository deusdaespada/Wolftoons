import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, BookOpen, Crown, Star, Flame, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankedUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  score: number;
  chapters_read?: number;
  achievements_count?: number;
}

const useRankings = () => {
  const chaptersRanking = useQuery({
    queryKey: ['ranking-chapters'],
    queryFn: async () => {
      const { data: history, error } = await supabase.from('reading_history').select('user_id');
      if (error) throw error;

      const countByUser = history.reduce((acc: Record<string, number>, item) => {
        acc[item.user_id] = (acc[item.user_id] || 0) + 1;
        return acc;
      }, {});

      const userIds = Object.keys(countByUser);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);

      return userIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        return { user_id: userId, username: profile?.username || null, avatar_url: profile?.avatar_url || null, score: countByUser[userId], chapters_read: countByUser[userId] };
      }).sort((a, b) => b.score - a.score).slice(0, 50);
    },
  });

  const combinedRanking = useQuery({
    queryKey: ['ranking-combined'],
    queryFn: async () => {
      const [historyRes, achievementsRes] = await Promise.all([
        supabase.from('reading_history').select('user_id'),
        supabase.from('user_achievements').select('user_id, achievement_id'),
      ]);

      const chaptersCount: Record<string, number> = {};
      historyRes.data?.forEach(item => { chaptersCount[item.user_id] = (chaptersCount[item.user_id] || 0) + 1; });

      const pointsByRarity: Record<string, number> = { legendary: 100, epic: 50, rare: 25, common: 10 };
      const rarityByAchievement: Record<string, string> = {
        first_chapter: 'common', avid_reader: 'rare', bookworm: 'epic', legend_reader: 'legendary',
        manhwa_fan: 'rare', manga_fan: 'rare', manhua_fan: 'rare', novel_lover: 'rare',
        collector_10: 'common', collector_50: 'rare', time_10h: 'common', time_100h: 'epic',
        streak_7: 'rare', streak_30: 'legendary', genre_explorer: 'rare',
      };

      const achievementData: Record<string, { points: number; count: number }> = {};
      achievementsRes.data?.forEach(a => {
        if (!achievementData[a.user_id]) achievementData[a.user_id] = { points: 0, count: 0 };
        achievementData[a.user_id].points += pointsByRarity[rarityByAchievement[a.achievement_id] || 'common'];
        achievementData[a.user_id].count++;
      });

      const allUserIds = [...new Set([...Object.keys(chaptersCount), ...Object.keys(achievementData)])];
      if (allUserIds.length === 0) return [];

      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', allUserIds);

      return allUserIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        const chapters = chaptersCount[userId] || 0;
        const achData = achievementData[userId] || { points: 0, count: 0 };
        return { user_id: userId, username: profile?.username || null, avatar_url: profile?.avatar_url || null, score: (chapters * 2) + achData.points, chapters_read: chapters, achievements_count: achData.count };
      }).sort((a, b) => b.score - a.score).slice(0, 50);
    },
  });

  return { chapters: chaptersRanking, combined: combinedRanking };
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full shadow-lg"><Crown className="h-5 w-5 text-white" /></div>;
  if (rank === 2) return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full"><Medal className="h-5 w-5 text-white" /></div>;
  if (rank === 3) return <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full"><Award className="h-5 w-5 text-white" /></div>;
  return <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full"><span className="font-bold text-muted-foreground">{rank}</span></div>;
};

const RankingList = ({ data, isLoading }: { data: RankedUser[] | undefined; isLoading: boolean }) => {
  if (isLoading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!data?.length) return <div className="text-center py-12"><Trophy className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum ranking disponível</p></div>;

  return (
    <div className="space-y-3">
      {data.map((user, i) => (
        <div key={user.user_id} className={cn("flex items-center gap-4 p-4 rounded-xl transition-all", i === 0 && "bg-yellow-500/10 border border-yellow-500/30", i === 1 && "bg-gray-400/10 border border-gray-400/30", i === 2 && "bg-amber-600/10 border border-amber-600/30", i > 2 && "bg-card/50 border border-border/50")}>
          <RankBadge rank={i + 1} />
          <Avatar className="h-12 w-12 border-2"><AvatarImage src={user.avatar_url || undefined} /><AvatarFallback><User className="h-6 w-6" /></AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-semibold truncate", i === 0 && "text-yellow-400")}>{user.username || 'Anônimo'}</h3>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {user.chapters_read && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{user.chapters_read} caps</span>}
              {user.achievements_count && <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{user.achievements_count}</span>}
            </div>
          </div>
          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-bold", i === 0 && "bg-yellow-500/20 text-yellow-400", i > 0 && "bg-primary/10 text-primary")}><Star className="h-4 w-4" />{user.score}</div>
        </div>
      ))}
    </div>
  );
};

export default function Ranking() {
  const [activeTab, setActiveTab] = useState('combined');
  const rankings = useRankings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-primary/5 border border-border p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl shadow-lg"><Trophy className="h-10 w-10 text-white" /></div>
            <div><h1 className="text-3xl font-bold">Ranking de Leitores</h1><p className="text-muted-foreground">Os leitores mais dedicados</p></div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-card/50 p-1 mb-6">
            <TabsTrigger value="combined" className="flex items-center gap-2"><Flame className="h-4 w-4" />Geral</TabsTrigger>
            <TabsTrigger value="chapters" className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Capítulos</TabsTrigger>
          </TabsList>
          <TabsContent value="combined">
            <Card className="bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" />Ranking Geral</CardTitle><CardDescription>Capítulos + Conquistas</CardDescription></CardHeader><CardContent><RankingList data={rankings.combined.data} isLoading={rankings.combined.isLoading} /></CardContent></Card>
          </TabsContent>
          <TabsContent value="chapters">
            <Card className="bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-500" />Por Capítulos</CardTitle></CardHeader><CardContent><RankingList data={rankings.chapters.data} isLoading={rankings.chapters.isLoading} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
