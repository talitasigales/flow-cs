import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LikeButton } from '@/components/community/LikeButton';
import { CommentThread, CommentData } from '@/components/community/CommentThread';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_LABELS: Record<string, string> = {
  dica: '💡 Dica', duvida: '❓ Dúvida', case: '📋 Case', reflexao: '💭 Reflexão',
};

export default function CommunityPost() {
  const { postId } = useParams<{ postId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user || !postId) return;
    setLoading(true);

    // Fetch post
    const { data: postData } = await (supabase as any)
      .from('community_posts').select('*').eq('id', postId).single();
    if (!postData) { navigate('/community'); return; }

    // Fetch profile
    const { data: profile } = await (supabase as any)
      .from('public_profiles').select('*').eq('user_id', postData.user_id).single();
    postData.profile = profile;

    // Check like
    const { data: like } = await (supabase as any)
      .from('community_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    setIsLiked(!!like);

    setPost(postData);

    // Fetch comments
    const { data: commentsData } = await (supabase as any)
      .from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });

    // Enrich with profiles
    const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id))];
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('public_profiles').select('*').in('user_id', userIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    const enriched: CommentData[] = (commentsData || []).map((c: any) => ({
      ...c,
      profile: profilesMap[c.user_id] || null,
    }));

    setComments(enriched);
    setLoading(false);
  }, [user, postId, navigate]);

  useEffect(() => {
    if (user && postId) fetchData();
  }, [user, postId]);

  if (authLoading || loading || !post) return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
      </div>
    </SidebarProvider>
  );

  const authorName = post.is_anonymous ? 'Anônimo' : (post.profile?.full_name || 'Usuário');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate('/community')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {!post.is_anonymous && post.profile?.avatar_url && <AvatarImage src={post.profile.avatar_url} />}
                    <AvatarFallback>
                      {post.is_anonymous ? <UserCircle className="h-6 w-6" /> : authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{authorName}</p>
                    {!post.is_anonymous && (post.profile?.job_title || post.profile?.company) && (
                      <p className="text-sm text-muted-foreground">
                        {[post.profile?.job_title, post.profile?.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Badge className="ml-auto">{CATEGORY_LABELS[post.category] || post.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-2">
                  <LikeButton postId={post.id} likesCount={post.likes_count} isLiked={isLiked} onToggle={fetchData} />
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Comentários ({comments.length})</h2>
              <CommentThread comments={comments} postId={post.id} onRefresh={fetchData} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
