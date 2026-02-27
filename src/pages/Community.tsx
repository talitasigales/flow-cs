import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users2, Flame } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard, PostData } from '@/components/community/PostCard';
import { NewPostDialog } from '@/components/community/NewPostDialog';
import { NotificationCenter } from '@/components/community/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'dica', label: '💡 Dicas' },
  { value: 'duvida', label: '❓ Dúvidas' },
  { value: 'case', label: '📋 Cases' },
  { value: 'reflexao', label: '💭 Reflexões' },
];

const PAGE_SIZE = 20;

export default function Community() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [feedTab, setFeedTab] = useState<'all' | 'following' | 'trending'>('all');
  const { isFollowing, toggleFollow, followingIds } = useFollows();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const fetchPosts = useCallback(async (reset = false) => {
    if (!user) return;
    setLoading(true);
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = (supabase as any)
      .from('community_posts')
      .select('*')
      .range(from, to);

    if (feedTab === 'trending') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (category !== 'all') {
      query = query.eq('category', category);
    }
    if (search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    const { data: postsData, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    let filteredPosts = postsData || [];

    // Client-side filter for "following" tab
    if (feedTab === 'following') {
      filteredPosts = filteredPosts.filter((p: any) => followingIds.has(p.user_id));
    }

    // Fetch profiles for posts
    const userIds = [...new Set(filteredPosts.map((p: any) => p.user_id))];
    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await (supabase as any)
        .from('public_profiles')
        .select('*')
        .in('user_id', userIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    // Fetch user reactions
    const postIds = filteredPosts.map((p: any) => p.id);
    let userReactions: Record<string, string> = {};
    let reactionCountsMap: Record<string, Record<string, number>> = {};
    if (postIds.length > 0) {
      const [userLikesRes, allLikesRes] = await Promise.all([
        (supabase as any)
          .from('community_likes')
          .select('post_id, reaction_type')
          .eq('user_id', user.id)
          .in('post_id', postIds),
        (supabase as any)
          .from('community_likes')
          .select('post_id, reaction_type')
          .in('post_id', postIds),
      ]);
      (userLikesRes.data || []).forEach((l: any) => {
        userReactions[l.post_id] = l.reaction_type;
      });
      (allLikesRes.data || []).forEach((l: any) => {
        if (!reactionCountsMap[l.post_id]) reactionCountsMap[l.post_id] = {};
        reactionCountsMap[l.post_id][l.reaction_type] = (reactionCountsMap[l.post_id][l.reaction_type] || 0) + 1;
      });
    }

    const enriched: PostData[] = filteredPosts.map((p: any) => ({
      ...p,
      profile: profilesMap[p.user_id] || null,
      is_liked: !!userReactions[p.id],
      current_reaction: userReactions[p.id] || null,
      reaction_counts: reactionCountsMap[p.id] || {},
    }));

    if (reset) {
      setPosts(enriched);
      setPage(0);
    } else {
      setPosts(prev => [...prev, ...enriched]);
    }
    setHasMore(filteredPosts.length === PAGE_SIZE);
    setLoading(false);
  }, [user, category, search, page, feedTab, followingIds]);

  useEffect(() => {
    if (user) fetchPosts(true);
  }, [user, category, feedTab]);

  const handleSearch = () => {
    fetchPosts(true);
  };

  if (authLoading) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Comunidade</h1>
                  <p className="text-sm text-muted-foreground">Compartilhe e aprenda com profissionais de outras empresas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Nova Publicação
                </Button>
              </div>
            </div>

            {/* Feed tabs */}
            <Tabs value={feedTab} onValueChange={v => setFeedTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">🌐 Todos</TabsTrigger>
                <TabsTrigger value="following">👥 Seguindo</TabsTrigger>
                <TabsTrigger value="trending">
                  <Flame className="h-4 w-4 mr-1" /> Em Alta
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar publicações..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onRefresh={() => fetchPosts(true)}
                  isFollowing={isFollowing(post.user_id)}
                  onToggleFollow={() => toggleFollow(post.user_id)}
                />
              ))}
              {posts.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{feedTab === 'following' ? 'Nenhuma publicação de quem você segue.' : 'Nenhuma publicação ainda. Seja o primeiro!'}</p>
                </div>
              )}
              {hasMore && posts.length > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => { setPage(p => p + 1); fetchPosts(); }} disabled={loading}>
                    {loading ? 'Carregando...' : 'Carregar mais'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <NewPostDialog open={dialogOpen} onOpenChange={setDialogOpen} onPostCreated={() => fetchPosts(true)} />
        </div>
    </AppLayout>
  );
}
