import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useFollows(onFollowNotify?: (targetUserId: string, isNowFollowing: boolean) => void) {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    setFollowingIds(new Set((data || []).map((f: any) => f.following_id)));
  }, [user]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    setLoading(true);
    const isFollowing = followingIds.has(targetUserId);

    if (isFollowing) {
      await (supabase as any)
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } else {
      await (supabase as any)
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      setFollowingIds(prev => new Set(prev).add(targetUserId));
      // Create notification for the target user
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'follow',
          message: 'começou a te seguir',
        });
    }
    setLoading(false);
  }, [user, followingIds]);

  const isFollowing = useCallback((targetUserId: string) => followingIds.has(targetUserId), [followingIds]);

  return { followingIds, isFollowing, toggleFollow, loading, refetch: fetchFollowing };
}
