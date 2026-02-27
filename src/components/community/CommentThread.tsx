import { useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Reply, Trash2, ImagePlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionTextarea } from './MentionTextarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { notifyMentions, renderMentionText } from '@/utils/mentionUtils';

export interface CommentData {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  image_url?: string | null;
  profile?: {
    full_name: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
  };
  replies?: CommentData[];
}

function useImageAttachment() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens são permitidas'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageSelect(file);
        return;
      }
    }
  }, [handleImageSelect]);

  const removeImage = () => { setImageFile(null); setImagePreview(null); };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null;
    const ext = imageFile.name.split('.').pop() || 'png';
    const path = `${userId}/${Date.now()}-comment.${ext}`;
    const { error } = await supabase.storage.from('community-images').upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from('community-images').getPublicUrl(path);
    return data.publicUrl;
  };

  return { imageFile, imagePreview, fileInputRef, handleImageSelect, handlePaste, removeImage, uploadImage };
}

function ImageInput({ imagePreview, removeImage, fileInputRef, handleImageSelect, handlePaste }: {
  imagePreview: string | null;
  removeImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageSelect: (file: File) => void;
  handlePaste?: React.ClipboardEventHandler;
}) {
  return (
    <>
      {imagePreview && (
        <div className="relative inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border" />
          <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={removeImage}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {!imagePreview && (
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" /> Imagem
        </Button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); e.target.value = ''; }} />
    </>
  );
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
  const mainImage = useImageAttachment();
  const replyImage = useImageAttachment();

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyContent : newComment;
    const img = parentId ? replyImage : mainImage;
    if (!content.trim() && !img.imageFile) return;
    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (img.imageFile) imageUrl = await img.uploadImage(user.id);

      const { data: commentData } = await (supabase as any).from('community_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parentId,
        image_url: imageUrl,
      }).select('id').single();
      // Notify mentioned users
      if (commentData?.id) {
        await notifyMentions(content, user.id, postId, commentData.id);
      }
      if (parentId) {
        setReplyContent('');
        setReplyTo(null);
        replyImage.removeImage();
      } else {
        setNewComment('');
        mainImage.removeImage();
      }
      onRefresh();
    } catch {
      toast.error('Erro ao comentar');
    } finally {
      setLoading(false);
    }
  };

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const repliesMap = new Map<string, CommentData[]>();
  comments.filter(c => c.parent_comment_id).forEach(c => {
    const arr = repliesMap.get(c.parent_comment_id!) || [];
    arr.push(c);
    repliesMap.set(c.parent_comment_id!, arr);
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <MentionTextarea
          placeholder="Escreva um comentário... Use @nome para mencionar alguém"
          value={newComment}
          onChange={setNewComment}
          onPaste={mainImage.handlePaste}
          rows={3}
        />
        <div className="flex items-center gap-2">
          <ImageInput {...mainImage} />
          <Button size="sm" onClick={() => handleSubmit()} disabled={loading || (!newComment.trim() && !mainImage.imageFile)}>
            Comentar
          </Button>
        </div>
      </div>

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
            replyImage={replyImage}
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
  comment, replies, replyTo, setReplyTo, replyContent, setReplyContent, replyImage, onSubmitReply, loading, onRefresh,
}: {
  comment: CommentData;
  replies: CommentData[];
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (v: string) => void;
  replyImage: ReturnType<typeof useImageAttachment>;
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
          {comment.content && <p className="text-sm mt-1 whitespace-pre-wrap">{renderMentionText(comment.content)}</p>}
          {comment.image_url && (
            <img src={comment.image_url} alt="Imagem" className="mt-2 rounded-lg max-h-48 object-cover" />
          )}
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

      {replyTo === comment.id && (
        <div className="ml-8 space-y-2">
          <MentionTextarea
            placeholder="Sua resposta... Use @nome para mencionar"
            value={replyContent}
            onChange={setReplyContent}
            onPaste={replyImage.handlePaste}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <ImageInput {...replyImage} />
            <Button size="sm" onClick={onSubmitReply} disabled={loading || (!replyContent.trim() && !replyImage.imageFile)}>Responder</Button>
            <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); replyImage.removeImage(); }}>Cancelar</Button>
          </div>
        </div>
      )}

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
                {reply.content && <p className="text-sm mt-1 whitespace-pre-wrap">{renderMentionText(reply.content)}</p>}
                {reply.image_url && (
                  <img src={reply.image_url} alt="Imagem" className="mt-2 rounded-lg max-h-48 object-cover" />
                )}
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
