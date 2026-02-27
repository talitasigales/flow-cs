import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) { setUnreadCount(0); return; }

    // Get all participations with last_read_at
    const { data: participations } = await (supabase as any)
      .from('chat_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations || participations.length === 0) { setUnreadCount(0); return; }

    let total = 0;
    for (const p of participations) {
      const { count } = await (supabase as any)
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', p.conversation_id)
        .gt('created_at', p.last_read_at || '1970-01-01')
        .neq('sender_id', user.id);
      total += count || 0;
    }

    setUnreadCount(total);
  };

  useEffect(() => {
    if (!user) return;
    fetchUnread();

    // Listen globally for new messages
    const channel = supabase
      .channel('global-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          // If the message is not from me, bump count
          if (payload.new?.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { unreadCount, refetch: fetchUnread };
}
