import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Search, Briefcase, Building2, Linkedin, Mail } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FollowButton } from '@/components/community/FollowButton';
import { useAuth } from '@/contexts/AuthContext';
import { useFollows } from '@/hooks/useFollows';
import { supabase } from '@/integrations/supabase/client';
import { findOrCreateConversation } from '@/hooks/useChatUtils';
import { toast } from 'sonner';

interface MemberProfile {
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

const AXIS_LABELS: Record<string, string> = {
  R: 'Risco',
  E: 'Extroversão',
  P: 'Paciência',
  N: 'Normas',
  A: 'Autocontrole',
};

function getClassification(value: number): { label: string; className: string } {
  if (value <= 33) return { label: 'Baixo', className: 'bg-blue-500/10 text-blue-600' };
  if (value <= 67) return { label: 'Situacional', className: 'bg-amber-500/10 text-amber-600' };
  return { label: 'Alto', className: 'bg-emerald-500/10 text-emerald-600' };
}

function MiniProfileBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-muted-foreground w-3">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{value}</span>
    </div>
  );
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
      m.pda_profile_name?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q)
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
                placeholder="Buscar por nome, empresa, cargo ou bio..."
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
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map(member => {
                  const hasPda = member.pda_r_value != null;
                  const dominant = member.pda_dominant_axis;

                  return (
                    <Card
                      key={member.user_id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/profile/${member.user_id}`)}
                    >
                      <CardContent className="p-5">
                        {/* Header: avatar + info */}
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 border-2 border-border">
                            {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                            <AvatarFallback className="text-lg">{member.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate group-hover:underline">
                              {member.full_name || 'Usuário'}
                            </p>
                            {member.job_title && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Briefcase className="h-3 w-3 shrink-0" />
                                {member.job_title}
                              </p>
                            )}
                            {member.company && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {member.company}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {followerCounts[member.user_id] || 0} seguidores
                            </p>
                          </div>
                        </div>

                        {/* Bio */}
                        {member.bio && (
                          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                            {member.bio}
                          </p>
                        )}

                        {/* REPNA mini chart */}
                        {hasPda && (
                          <>
                            <Separator className="my-3" />
                            <div className="space-y-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-medium text-muted-foreground">Perfil REPNA</span>
                                {dominant && (
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                    Eixo dominante: {dominant} ({AXIS_LABELS[dominant] || dominant})
                                  </Badge>
                                )}
                              </div>
                              <MiniProfileBar label="R" value={member.pda_r_value || 0} />
                              <MiniProfileBar label="E" value={member.pda_e_value || 0} />
                              <MiniProfileBar label="P" value={member.pda_p_value || 0} />
                              <MiniProfileBar label="N" value={member.pda_n_value || 0} />
                              <MiniProfileBar label="A" value={member.pda_a_value || 0} />
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <FollowButton
                            isFollowing={isFollowing(member.user_id)}
                            onToggle={() => toggleFollow(member.user_id)}
                            loading={followLoading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={async () => {
                              if (!user) return;
                              const convId = await findOrCreateConversation(user.id, member.user_id);
                              if (convId) navigate(`/messages/${convId}`);
                              else toast.error('Erro ao iniciar conversa');
                            }}
                          >
                            <Mail className="h-3.5 w-3.5" /> Mensagem
                          </Button>
                          {member.linkedin_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <Linkedin className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
