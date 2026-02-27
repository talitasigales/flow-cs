import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  actor_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const notifs = data || [];
    
    // Fetch actor profiles
    const actorIds = [...new Set(notifs.filter((n: any) => n.actor_id).map((n: any) => n.actor_id))];
    let profilesMap: Record<string, any> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('public_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', actorIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    const enriched = notifs.map((n: any) => ({
      ...n,
      actor_profile: profilesMap[n.actor_id] || null,
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter((n: Notification) => !n.read).length);
    setLoading(false);
  }, [user]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    if (!user) return;
    if (notificationId) {
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
    } else {
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    }
    fetchNotifications();
  }, [user, fetchNotifications]);

  const createNotification = useCallback(async (
    targetUserId: string,
    type: string,
    message: string,
    postId?: string,
    commentId?: string,
  ) => {
    if (!user || targetUserId === user.id) return;
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: targetUserId,
        actor_id: user.id,
        type,
        message,
        post_id: postId || null,
        comment_id: commentId || null,
      });
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = (supabase as any)
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [user, fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, createNotification };
}
