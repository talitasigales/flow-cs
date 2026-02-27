import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Simple notification sound using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently fail if audio not available
  }
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    if (!user) { setUnreadCount(0); return; }

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

    const channel = supabase
      .channel('global-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          if (payload.new?.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
            // Play sound if not currently viewing that conversation
            const currentPath = window.location.pathname;
            const convId = payload.new?.conversation_id;
            if (!currentPath.startsWith(`/messages/${convId}`)) {
              playNotificationSound();
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { unreadCount, refetch: fetchUnread };
}
