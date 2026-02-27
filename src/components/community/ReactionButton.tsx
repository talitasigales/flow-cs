import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const REACTIONS = [
  { type: 'like', emoji: '❤️', label: 'Curtir' },
  { type: 'inspirador', emoji: '🔥', label: 'Inspirador' },
  { type: 'util', emoji: '💡', label: 'Útil' },
  { type: 'parabens', emoji: '👏', label: 'Parabéns' },
];

interface ReactionButtonProps {
  postId: string;
  likesCount: number;
  currentReaction: string | null; // null = not reacted
  reactionCounts?: Record<string, number>;
  onToggle: () => void;
}

export function ReactionButton({ postId, likesCount, currentReaction, reactionCounts, onToggle }: ReactionButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleReact = async (reactionType: string) => {
    if (!user || loading) return;
    setLoading(true);
    setShowPicker(false);
    try {
      if (currentReaction) {
        // Remove existing reaction
        await (supabase as any).from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      }
      if (currentReaction !== reactionType) {
        // Add new reaction
        await (supabase as any).from('community_likes')
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      }
      onToggle();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowPicker(false), 300);
  };

  const currentEmoji = currentReaction
    ? REACTIONS.find(r => r.type === currentReaction)?.emoji || '❤️'
    : null;

  // Build summary of reactions
  const counts = reactionCounts || {};
  const topReactions = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="relative" ref={pickerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Reaction picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-popover border border-border rounded-full px-2 py-1 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {REACTIONS.map(r => (
            <button
              key={r.type}
              onClick={(e) => { e.stopPropagation(); handleReact(r.type); }}
              className={cn(
                'text-lg hover:scale-125 transition-transform px-1 rounded',
                currentReaction === r.type && 'bg-primary/10'
              )}
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); handleReact('like'); }}
        disabled={loading}
        className={cn(
          'gap-1 transition-colors',
          currentReaction && 'text-red-500 hover:text-red-600'
        )}
      >
        {currentEmoji ? (
          <span className="text-sm">{currentEmoji}</span>
        ) : (
          <Heart className="h-4 w-4" />
        )}
        {/* Show top reaction emojis */}
        {topReactions.length > 0 && (
          <span className="flex gap-0 text-xs">
            {topReactions.map(([type]) => {
              const r = REACTIONS.find(r => r.type === type);
              return r ? <span key={type}>{r.emoji}</span> : null;
            })}
          </span>
        )}
        <span>{likesCount}</span>
      </Button>
    </div>
  );
}
