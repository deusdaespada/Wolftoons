import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RecentChapter {
  id: string;
  title_id: string;
  chapter_number: number;
  chapter_title: string | null;
  created_at: string;
  title: {
    id: string;
    title: string;
    cover: string;
    type: string;
  };
}

export const useRecentChapters = (limit = 12) => {
  return useQuery({
    queryKey: ['recent-chapters', limit],
    queryFn: async () => {
      // Get recent chapters
      const { data: chapters, error } = await supabase
        .from('chapters')
        .select('id, title_id, chapter_number, chapter_title, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Get unique title ids
      const titleIds = [...new Set(chapters.map(c => c.title_id))];
      
      // Fetch titles
      const { data: titles } = await supabase
        .from('titles')
        .select('id, title, cover, type')
        .in('id', titleIds);
      
      const titlesMap = new Map(titles?.map(t => [t.id, t]) || []);
      
      return chapters.map(chapter => ({
        ...chapter,
        title: titlesMap.get(chapter.title_id)!,
      })).filter(c => c.title) as RecentChapter[];
    },
  });
};
