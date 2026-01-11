import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BlockedAccessLog {
  id: string;
  user_id: string | null;
  reason: string;
  detected_extensions: string[] | null;
  user_agent: string | null;
  page_url: string | null;
  created_at: string;
}

export const useBlockedAccessNotifications = () => {
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Only subscribe if user is admin
    if (!isAdmin) return;

    const channel = supabase
      .channel('blocked-access-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocked_access_logs',
        },
        async (payload) => {
          const log = payload.new as BlockedAccessLog;
          
          // Get username if user_id exists
          let username = 'Anônimo';
          if (log.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', log.user_id)
              .single();
            
            if (profile?.username) {
              username = profile.username;
            }
          }

          // Show toast notification
          const extensions = log.detected_extensions?.join(', ') || 'Desconhecido';
          toast.error(
            `🛡️ Acesso Bloqueado`,
            {
              description: `Usuário: ${username}\nMotivo: ${log.reason}\nExtensões: ${extensions}`,
              duration: 10000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);
};
