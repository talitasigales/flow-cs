import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reply, Trash2, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

export interface CommentData {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
  };
  replies?: CommentData[];
}

interface CommentThreadProps {
  comments: CommentData[];
  postId: string;
  onRefresh: () => void;
}

export function CommentThread({ comments, postId, onRefresh }: CommentThreadProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    setLoading(true);
    try {
      await (supabase as any).from('community_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parentId,
      });
      if (parentId) {
        setReplyContent('');
        setReplyTo(null);
      } else {
        setNewComment('');
      }
      onRefresh();
    } catch {
      toast.error('Erro ao comentar');
    } finally {
      setLoading(false);
    }
  };

  // Group top-level and replies
  const topLevel = comments.filter(c => !c.parent_comment_id);
  const repliesMap = new Map<string, CommentData[]>();
  comments.filter(c => c.parent_comment_id).forEach(c => {
    const arr = repliesMap.get(c.parent_comment_id!) || [];
    arr.push(c);
    repliesMap.set(c.parent_comment_id!, arr);
  });

  return (
    <div className="space-y-4">
      {/* New comment input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
        />
        <Button size="sm" onClick={() => handleSubmit()} disabled={loading || !newComment.trim()}>
          Comentar
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {topLevel.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesMap.get(comment.id) || []}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            onSubmitReply={() => handleSubmit(comment.id)}
            loading={loading}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment, replies, replyTo, setReplyTo, replyContent, setReplyContent, onSubmitReply, loading, onRefresh,
}: {
  comment: CommentData;
  replies: CommentData[];
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (v: string) => void;
  onSubmitReply: () => void;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const canDelete = user?.id === comment.user_id || isAdmin;
  const name = comment.profile?.full_name || 'Usuário';

  const handleDelete = async () => {
    await (supabase as any).from('community_comments').delete().eq('id', comment.id);
    onRefresh();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Avatar className="h-8 w-8">
          {comment.profile?.avatar_url && <AvatarImage src={comment.profile.avatar_url} />}
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{name}</span>
              {comment.profile?.company && (
                <span className="text-xs text-muted-foreground ml-2">{comment.profile.company}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex gap-2 mt-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
              <Reply className="h-3 w-3 mr-1" /> Responder
            </Button>
            {canDelete && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" /> Excluir
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {replyTo === comment.id && (
        <div className="ml-8 space-y-2">
          <Textarea placeholder="Sua resposta..." value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSubmitReply} disabled={loading || !replyContent.trim()}>Responder</Button>
            <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-muted/20">
              <Avatar className="h-7 w-7">
                {reply.profile?.avatar_url && <AvatarImage src={reply.profile.avatar_url} />}
                <AvatarFallback>{(reply.profile?.full_name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{reply.profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                {(user?.id === reply.user_id || isAdmin) && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive mt-1"
                    onClick={async () => { await (supabase as any).from('community_comments').delete().eq('id', reply.id); onRefresh(); }}>
                    <Trash2 className="h-3 w-3 mr-1" /> Excluir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
