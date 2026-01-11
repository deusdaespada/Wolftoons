import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Title {
  id: string;
  title: string;
  alternative_titles?: string[] | null;
  cover: string;
  type: 'Manhwa' | 'Manhua' | 'Mangá' | 'Novel' | 'Webtoon' | 'HQ' | 'Doujinshi' | 'One-shot' | 'Light Novel' | 'Web Novel' | 'Fanfic';
  rating: number;
  status: 'Completo' | 'Em andamento';
  genres: string[];
  synopsis: string;
  author: string;
  year: number;
  views: number;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

const TITLES_CACHE_KEY = 'wolftoon_titles_cache';
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

const getCachedTitles = (): Title[] | null => {
  try {
    const cached = localStorage.getItem(TITLES_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(TITLES_CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedTitles = (data: Title[]) => {
  try {
    localStorage.setItem(TITLES_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage full
  }
};

export const useTitles = () => {
  const query = useQuery({
    queryKey: ['titles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Title[];
    },
    initialData: getCachedTitles() ?? undefined,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });

  // Update cache when data changes
  useEffect(() => {
    if (query.data && !query.isStale) {
      setCachedTitles(query.data);
    }
  }, [query.data, query.isStale]);

  return query;
};

export const useTitle = (idOrSlug: string) => {
  return useQuery({
    queryKey: ['title', idOrSlug],
    queryFn: async () => {
      // First try to find by slug
      let { data, error } = await supabase
        .from('titles')
        .select('*')
        .eq('slug', idOrSlug)
        .maybeSingle();
      
      // If not found by slug, try by id
      if (!data) {
        const result = await supabase
          .from('titles')
          .select('*')
          .eq('id', idOrSlug)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data as Title;
    },
    enabled: !!idOrSlug,
  });
};

export const useCreateTitle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (title: Omit<Title, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('titles')
        .insert(title)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titles'] });
    },
  });
};

export const useUpdateTitle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Title> & { id: string }) => {
      const { data, error } = await supabase
        .from('titles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titles'] });
    },
  });
};

export const useDeleteTitle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titles'] });
    },
  });
};