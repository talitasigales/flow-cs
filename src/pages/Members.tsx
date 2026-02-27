import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Search } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FollowButton } from '@/components/community/FollowButton';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import { supabase } from '@/integrations/supabase/client';

interface MemberProfile {
  user_id: string;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  pda_profile_name: string | null;
  pda_dominant_axis: string | null;
  pda_r_value: number | null;
  pda_e_value: number | null;
  pda_p_value: number | null;
  pda_n_value: number | null;
  pda_a_value: number | null;
}

export default function Members() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchMembers() {
      if (!user) return;
      setLoading(true);
      const { data } = await (supabase as any)
        .from('public_profiles')
        .select('*');
      setMembers((data || []).filter((m: MemberProfile) => m.user_id !== user.id));

      // Fetch follower counts
      const { data: follows } = await (supabase as any)
        .from('user_follows')
        .select('following_id');
      const counts: Record<string, number> = {};
      (follows || []).forEach((f: any) => {
        counts[f.following_id] = (counts[f.following_id] || 0) + 1;
      });
      setFollowerCounts(counts);
      setLoading(false);
    }
    fetchMembers();
  }, [user]);

  const filtered = members.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q) ||
      m.job_title?.toLowerCase().includes(q) ||
      m.pda_profile_name?.toLowerCase().includes(q)
    );
  });

  if (authLoading) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Membros</h1>
                  <p className="text-sm text-muted-foreground">Conheça e siga os profissionais da comunidade</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou cargo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-8">Carregando membros...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum membro encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(member => (
                  <Card key={member.user_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/profile/${member.user_id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                          <AvatarFallback>{member.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate hover:underline">{member.full_name || 'Usuário'}</p>
                          {(member.job_title || member.company) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[member.job_title, member.company].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {member.pda_r_value != null && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono mt-1">
                              R:{member.pda_r_value} E:{member.pda_e_value} P:{member.pda_p_value} N:{member.pda_n_value} A:{member.pda_a_value}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {followerCounts[member.user_id] || 0} seguidores
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <FollowButton
                          isFollowing={isFollowing(member.user_id)}
                          onToggle={() => toggleFollow(member.user_id)}
                          loading={followLoading}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
