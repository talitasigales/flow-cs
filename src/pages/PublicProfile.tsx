import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Linkedin, MapPin, Briefcase, Users } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PostCard, PostData } from '@/components/community/PostCard';
import { FollowButton } from '@/components/community/FollowButton';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import { supabase } from '@/integrations/supabase/client';
import { findOrCreateConversation } from '@/hooks/useChatUtils';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface PublicProfileData {
  user_id: string;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  pda_profile_name: string | null;
  pda_dominant_axis: string | null;
  pda_r_value: number | null;
  pda_e_value: number | null;
  pda_p_value: number | null;
  pda_n_value: number | null;
  pda_a_value: number | null;
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!userId || !user) return;
    // If viewing own profile, redirect
    if (userId === user.id) { navigate('/profile'); return; }
    fetchProfile();
  }, [userId, user]);

  const fetchProfile = async () => {
    if (!userId || !user) return;
    setLoading(true);

    // Fetch profile, posts, follow counts in parallel
    const [profileRes, postsRes, followersRes, followingRes] = await Promise.all([
      (supabase as any).from('public_profiles').select('*').eq('user_id', userId).single(),
      (supabase as any).from('community_posts').select('*').eq('user_id', userId).eq('is_anonymous', false).order('created_at', { ascending: false }).limit(20),
      (supabase as any).from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      (supabase as any).from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);

    setProfile(profileRes.data);
    setFollowerCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);

    // Enrich posts with profile and likes
    const postsData = postsRes.data || [];
    const postIds = postsData.map((p: any) => p.id);
    let likedSet = new Set<string>();
    if (postIds.length > 0) {
      const { data: likes } = await (supabase as any)
        .from('community_likes')
        .select('post_id')
        .eq('user_id', user!.id)
        .in('post_id', postIds);
      (likes || []).forEach((l: any) => likedSet.add(l.post_id));
    }

    setPosts(postsData.map((p: any) => ({
      ...p,
      profile: profileRes.data,
      is_liked: likedSet.has(p.id),
    })));
    setLoading(false);
  };

  const radarData = profile?.pda_r_value != null ? [
    { dimension: 'R', value: profile.pda_r_value || 0 },
    { dimension: 'E', value: profile.pda_e_value || 0 },
    { dimension: 'P', value: profile.pda_p_value || 0 },
    { dimension: 'N', value: profile.pda_n_value || 0 },
    { dimension: 'A', value: profile.pda_a_value || 0 },
  ] : [];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-8">
            <p className="text-center text-muted-foreground">Perfil não encontrado.</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            {/* Profile header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <h1 className="text-2xl font-bold">{profile.full_name || 'Usuário'}</h1>
                    {(profile.job_title || profile.company) && (
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {[profile.job_title, profile.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {profile.bio && <p className="text-sm">{profile.bio}</p>}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span><strong className="text-foreground">{followerCount}</strong> seguidores</span>
                      <span><strong className="text-foreground">{followingCount}</strong> seguindo</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <FollowButton
                        isFollowing={isFollowing(profile.user_id)}
                        onToggle={() => toggleFollow(profile.user_id)}
                        loading={followLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!user) return;
                          const convId = await findOrCreateConversation(user.id, profile.user_id);
                          if (convId) navigate(`/messages/${convId}`);
                          else toast.error('Erro ao iniciar conversa');
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1.5" /> Mensagem
                      </Button>
                      {profile.linkedin_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDA Chart */}
            {radarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Perfil REPNA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-48">
                      <ResponsiveContainer>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" className="text-xs" />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} />
                          <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        R:{profile.pda_r_value} E:{profile.pda_e_value} P:{profile.pda_p_value} N:{profile.pda_n_value} A:{profile.pda_a_value}
                      </Badge>
                      {profile.pda_dominant_axis && (
                        <p className="text-sm text-muted-foreground">Eixo dominante: <strong>{profile.pda_dominant_axis}</strong></p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Publicações</h2>
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma publicação ainda.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onRefresh={fetchProfile}
                      isFollowing={isFollowing(post.user_id)}
                      onToggleFollow={() => toggleFollow(post.user_id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
