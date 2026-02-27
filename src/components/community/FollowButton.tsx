import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => void;
  loading?: boolean;
  size?: 'sm' | 'default' | 'icon';
}

export function FollowButton({ isFollowing, onToggle, loading, size = 'sm' }: FollowButtonProps) {
  return (
    <Button
      variant={isFollowing ? 'secondary' : 'default'}
      size={size}
      className="gap-1.5"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={loading}
    >
      {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
    </Button>
  );
}
