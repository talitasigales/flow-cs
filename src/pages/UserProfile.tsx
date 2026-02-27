import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Shield, Lock, BarChart3, Save, ClipboardList, Grid3x3, GraduationCap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface ProfileData {
  full_name: string | null;
  company: string | null;
  lgpd_accepted: boolean | null;
  lgpd_accepted_at: string | null;
  last_password_change: string | null;
  password_changed: boolean | null;
}

interface Stats {
  activePDIs: number;
  pdaProfiles: number;
  ninebox: number;
  completedModules: number;
}

export default function UserProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [stats, setStats] = useState<Stats>({ activePDIs: 0, pdaProfiles: 0, ninebox: 0, completedModules: 0 });
  const [latestPDA, setLatestPDA] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchLatestPDA();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company, lgpd_accepted, lgpd_accepted_at, last_password_change, password_changed')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      setProfile(data);
      setFullName(data?.full_name || '');
      setCompany(data?.company || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [pdisRes, pdaRes, nineboxRes, progressRes] = await Promise.all([
        supabase.from('pdis').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).neq('status', 'completed'),
        supabase.from('profile_evolution').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('matriz_9box').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('completed', true),
      ]);
      setStats({
        activePDIs: pdisRes.count || 0,
        pdaProfiles: pdaRes.count || 0,
        ninebox: nineboxRes.count || 0,
        completedModules: progressRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLatestPDA = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_evolution')
        .select('*')
        .eq('user_id', user!.id)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      setLatestPDA(data);
    } catch (error) {
      console.error('Error fetching PDA:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, company })
        .eq('user_id', user!.id);
      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
      setProfile(prev => prev ? { ...prev, full_name: fullName, company } : prev);
    } catch (error) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeLgpd = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ lgpd_accepted: false, lgpd_accepted_at: null })
        .eq('user_id', user!.id);
      if (error) throw error;
      toast.success('Consentimento LGPD revogado. Você será redirecionado.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast.error('Erro ao revogar consentimento');
    }
  };

  const radarData = latestPDA
    ? [
        { dimension: 'R', value: latestPDA.r_value || 0 },
        { dimension: 'E', value: latestPDA.e_value || 0 },
        { dimension: 'P', value: latestPDA.p_value || 0 },
        { dimension: 'N', value: latestPDA.n_value || 0 },
        { dimension: 'A', value: latestPDA.a_value || 0 },
      ]
    : [];

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold gradient-text">Meu Perfil</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-6 space-y-6">
            {/* Stats summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'PDIs Ativos', value: stats.activePDIs, icon: ClipboardList },
                { label: 'Perfis PDA', value: stats.pdaProfiles, icon: TrendingUp },
                { label: 'Colaboradores 9Box', value: stats.ninebox, icon: Grid3x3 },
                { label: 'Módulos Concluídos', value: stats.completedModules, icon: GraduationCap },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full max-w-lg grid-cols-4">
                <TabsTrigger value="personal">
                  <User className="mr-1 h-4 w-4" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="pda">
                  <BarChart3 className="mr-1 h-4 w-4" />
                  PDA
                </TabsTrigger>
                <TabsTrigger value="lgpd">
                  <Shield className="mr-1 h-4 w-4" />
                  LGPD
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="mr-1 h-4 w-4" />
                  Segurança
                </TabsTrigger>
              </TabsList>

              {/* Dados Pessoais */}
              <TabsContent value="personal">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                    <CardDescription>Gerencie suas informações de perfil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dados PDA */}
              <TabsContent value="pda">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Último Perfil PDA</CardTitle>
                    <CardDescription>
                      {latestPDA
                        ? `${latestPDA.employee_name} — ${format(new Date(latestPDA.assessment_date), "dd/MM/yyyy", { locale: ptBR })}`
                        : 'Nenhum perfil PDA cadastrado'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latestPDA ? (
                      <div className="space-y-6">
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="hsl(var(--border))" />
                              <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} />
                              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center">
                          <Button variant="outline" onClick={() => navigate('/profile-evolution')}>
                            Ver Evolução Completa
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhum perfil PDA cadastrado ainda</p>
                        <Button onClick={() => navigate('/profile-evolution')}>Cadastrar Perfil PDA</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LGPD */}
              <TabsContent value="lgpd">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Consentimento LGPD</CardTitle>
                    <CardDescription>Informações sobre tratamento de dados pessoais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status do consentimento</p>
                        <p className={`font-semibold ${profile?.lgpd_accepted ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profile?.lgpd_accepted ? 'Aceito' : 'Não aceito'}
                        </p>
                      </div>
                      {profile?.lgpd_accepted_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">Data de aceite</p>
                          <p className="font-semibold">
                            {format(new Date(profile.lgpd_accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                      <p><strong>Dados coletados:</strong> Nome, email, empresa, perfis PDA (REPNA), PDIs, dados da Matriz 9Box, progresso em módulos.</p>
                      <p><strong>Finalidade:</strong> Gestão de desenvolvimento profissional e sucesso do cliente.</p>
                      <p><strong>Base legal:</strong> Consentimento do titular (Art. 7°, I da LGPD).</p>
                      <p><strong>Seus direitos:</strong> Acesso, correção, exclusão, portabilidade, e revogação do consentimento.</p>
                    </div>

                    {profile?.lgpd_accepted && (
                      <Button variant="destructive" onClick={handleRevokeLgpd}>
                        Revogar Consentimento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Segurança */}
              <TabsContent value="security">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Configurações de segurança da conta</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Última troca de senha</p>
                      <p className="font-semibold">
                        {profile?.last_password_change
                          ? format(new Date(profile.last_password_change), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Nunca alterada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Senha personalizada</p>
                      <p className={`font-semibold ${profile?.password_changed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {profile?.password_changed ? 'Sim' : 'Não — usando senha inicial'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                      <Lock className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
