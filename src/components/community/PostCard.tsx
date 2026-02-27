import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Trash2, UserCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { LikeButton } from './LikeButton';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { findOrCreateConversation } from '@/hooks/useChatUtils';

const CATEGORY_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  dica: { label: '💡 Dica', variant: 'default' },
  duvida: { label: '❓ Dúvida', variant: 'secondary' },
  case: { label: '📋 Case', variant: 'outline' },
  reflexao: { label: '💭 Reflexão', variant: 'default' },
};

export interface PostData {
  id: string;
  user_id: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  is_anonymous: boolean;
  created_at: string;
  image_url?: string | null;
  profile?: {
    full_name: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
    pda_profile_name?: string | null;
    pda_dominant_axis?: string | null;
    pda_r_value?: number | null;
    pda_e_value?: number | null;
    pda_p_value?: number | null;
    pda_n_value?: number | null;
    pda_a_value?: number | null;
  };
  is_liked?: boolean;
}

interface PostCardProps {
  post: PostData;
  onRefresh: () => void;
}

export function PostCard({ post, onRefresh }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const canDelete = user?.id === post.user_id || isAdmin;

  const categoryInfo = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.reflexao;

  const authorName = post.is_anonymous ? 'Anônimo' : (post.profile?.full_name || 'Usuário');
  const authorCompany = post.is_anonymous ? '' : post.profile?.company;
  const authorJob = post.is_anonymous ? '' : post.profile?.job_title;
  const initials = post.is_anonymous ? '?' : (authorName?.charAt(0) || 'U');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await (supabase as any).from('community_posts').delete().eq('id', post.id);
      toast.success('Publicação excluída');
      onRefresh();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/community/${post.id}`)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {!post.is_anonymous && post.profile?.avatar_url && (
                <AvatarImage src={post.profile.avatar_url} />
              )}
              <AvatarFallback>
                {post.is_anonymous ? <UserCircle className="h-5 w-5" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{authorName}</p>
                {!post.is_anonymous && post.profile?.pda_r_value != null && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono">
                    R:{post.profile.pda_r_value} E:{post.profile.pda_e_value} P:{post.profile.pda_p_value} N:{post.profile.pda_n_value} A:{post.profile.pda_a_value}
                  </Badge>
                )}
              </div>
              {(authorJob || authorCompany) && (
                <p className="text-xs text-muted-foreground">
                  {[authorJob, authorCompany].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={categoryInfo.variant}>{categoryInfo.label}</Badge>
            {canDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="Imagem do post" className="mt-3 rounded-lg max-h-80 object-cover w-full" />
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <LikeButton
            postId={post.id}
            likesCount={post.likes_count}
            isLiked={post.is_liked || false}
            onToggle={onRefresh}
          />
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(`/community/${post.id}`)}>
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </Button>
          {!post.is_anonymous && user && user.id !== post.user_id && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={async (e) => {
                e.stopPropagation();
                const convId = await findOrCreateConversation(user.id, post.user_id);
                if (convId) navigate(`/messages/${convId}`);
                else toast.error('Erro ao iniciar conversa');
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
        </span>
      </CardFooter>
    </Card>
  );
}
