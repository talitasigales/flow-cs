import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  postId: string;
  likesCount: number;
  isLiked: boolean;
  onToggle: () => void;
}

export function LikeButton({ postId, likesCount, isLiked, onToggle }: LikeButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isLiked) {
        await (supabase as any).from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await (supabase as any).from('community_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      onToggle();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'gap-1.5 transition-colors',
        isLiked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
      <span>{likesCount}</span>
    </Button>
  );
}
