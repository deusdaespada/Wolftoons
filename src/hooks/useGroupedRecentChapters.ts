import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface ChapterInfo {
  id: string;
  chapter_number: number;
  chapter_title: string | null;
  created_at: string;
}

interface TitleWithChapters {
  id: string;
  title: string;
  cover: string;
  type: string;
  chapters: ChapterInfo[];
  totalChapters: number;
  latestUpdate: string;
  newChaptersCount: number;
}

const CHAPTERS_CACHE_KEY = 'wolftoon_recent_chapters_cache';
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

const getCachedChapters = (limit: number): TitleWithChapters[] | null => {
  try {
    const cached = localStorage.getItem(`${CHAPTERS_CACHE_KEY}_${limit}`);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CHAPTERS_CACHE_KEY}_${limit}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedChapters = (data: TitleWithChapters[], limit: number) => {
  try {
    localStorage.setItem(`${CHAPTERS_CACHE_KEY}_${limit}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full
  }
};

export const useGroupedRecentChapters = (limit = 10) => {
  const query = useQuery({
    queryKey: ['grouped-recent-chapters', limit],
    queryFn: async () => {
      // Get recent chapters with a time window (last 7 days considered "new")
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: chapters, error } = await supabase
        .from('chapters')
        .select('id, title_id, chapter_number, chapter_title, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Get unique title ids
      const titleIds = [...new Set(chapters.map(c => c.title_id))];
      
      // Fetch titles
      const { data: titles } = await supabase
        .from('titles')
        .select('id, title, cover, type')
        .in('id', titleIds);
      
      const titlesMap = new Map(titles?.map(t => [t.id, t]) || []);

      // Get total chapters count for each title
      const { data: chapterCounts } = await supabase
        .from('chapters')
        .select('title_id')
        .in('title_id', titleIds);

      const totalChaptersMap = new Map<string, number>();
      chapterCounts?.forEach(c => {
        totalChaptersMap.set(c.title_id, (totalChaptersMap.get(c.title_id) || 0) + 1);
      });

      // Group chapters by title
      const groupedMap = new Map<string, ChapterInfo[]>();
      
      chapters.forEach(chapter => {
        if (!groupedMap.has(chapter.title_id)) {
          groupedMap.set(chapter.title_id, []);
        }
        groupedMap.get(chapter.title_id)!.push({
          id: chapter.id,
          chapter_number: chapter.chapter_number,
          chapter_title: chapter.chapter_title,
          created_at: chapter.created_at,
        });
      });

      // Sort chapters within each group by number descending
      groupedMap.forEach((chapters, titleId) => {
        chapters.sort((a, b) => b.chapter_number - a.chapter_number);
      });

      // Create final array
      const result: TitleWithChapters[] = [];
      
      for (const [titleId, titleChapters] of groupedMap) {
        const title = titlesMap.get(titleId);
        if (!title) continue;

        // Count how many chapters are "new" (within last 7 days)
        const newChaptersCount = titleChapters.filter(
          c => new Date(c.created_at) > sevenDaysAgo
        ).length;

        result.push({
          id: title.id,
          title: title.title,
          cover: title.cover,
          type: title.type,
          chapters: titleChapters,
          totalChapters: totalChaptersMap.get(titleId) || titleChapters.length,
          latestUpdate: titleChapters[0]?.created_at || '',
          newChaptersCount: Math.max(1, newChaptersCount),
        });
      }

      // Sort by most recent update
      result.sort((a, b) => 
        new Date(b.latestUpdate).getTime() - new Date(a.latestUpdate).getTime()
      );

      return result.slice(0, limit);
    },
    initialData: getCachedChapters(limit) ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  // Update cache when data changes
  useEffect(() => {
    if (query.data && !query.isStale) {
      setCachedChapters(query.data, limit);
    }
  }, [query.data, query.isStale, limit]);

  return query;
};