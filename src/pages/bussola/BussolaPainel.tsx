import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BussolaLayout } from '@/components/bussola/BussolaLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Users, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EnrollYoungDialog } from '@/components/bussola/EnrollYoungDialog';

export default function BussolaPainel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrollOpen, setEnrollOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const { data: program } = useQuery({
    queryKey: ['bussola-program'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('id, name')
        .eq('slug', 'bussola')
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['psychologist-assignments', user?.id, program?.id],
    queryFn: async () => {
      if (!user?.id || !program?.id) return [];
      const { data } = await supabase
        .from('bussola_assignments' as any)
        .select('*')
        .eq('psychologist_id', user.id)
        .eq('program_id', program.id)
        .order('created_at', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!user?.id && !!program?.id,
  });

  // Fetch profiles for all assigned young users
  const youngUserIds = assignments.map((a: any) => a.young_user_id).filter(Boolean);
  const { data: youngProfiles = [] } = useQuery({
    queryKey: ['young-profiles', youngUserIds],
    queryFn: async () => {
      if (!youngUserIds.length) return [];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', youngUserIds);
      return data || [];
    },
    enabled: youngUserIds.length > 0,
  });

  // Fetch sessions for progress tracking
  const { data: sessions = [] } = useQuery({
    queryKey: ['psychologist-sessions', user?.id, program?.id],
    queryFn: async () => {
      if (!user?.id || !program?.id) return [];
      const { data } = await supabase
        .from('bussola_sessions' as any)
        .select('*')
        .eq('psychologist_user_id', user.id)
        .eq('program_id', program.id);
      return (data || []) as any[];
    },
    enabled: !!user?.id && !!program?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('bussola_assignments' as any)
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychologist-assignments'] });
      toast.success('Jovem removido com sucesso');
    },
    onError: () => toast.error('Erro ao remover jovem'),
  });

  if (authLoading || !program) {
    return (
      <BussolaLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BussolaLayout>
    );
  }

  const getProfileForYoung = (youngId: string) =>
    youngProfiles.find((p: any) => p.user_id === youngId);

  const getSessionsForYoung = (youngId: string) =>
    sessions.filter((s: any) => s.young_user_id === youngId);

  const getCompletedCount = (youngId: string) =>
    getSessionsForYoung(youngId).filter((s: any) => s.status === 'completed').length;

  return (
    <BussolaLayout title="Painel do Psicólogo">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Meus Jovens</h2>
              <p className="text-sm text-muted-foreground">{assignments.length} jovem(ns) cadastrado(s)</p>
            </div>
          </div>
          <Button onClick={() => setEnrollOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Cadastrar Jovem
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : assignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum jovem cadastrado ainda</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Clique em "Cadastrar Jovem" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment: any) => {
              const profile = getProfileForYoung(assignment.young_user_id);
              const completed = getCompletedCount(assignment.young_user_id);
              const total = assignment.encounter_count || 5;
              const name = profile?.full_name || assignment.young_name || 'Sem nome';
              const email = profile?.email || assignment.young_email || '';

              return (
                <Card key={assignment.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-bold text-primary">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{name}</p>
                        <p className="text-sm text-muted-foreground">{email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={total === 1 ? 'secondary' : 'default'} className="font-medium">
                        {total === 1 ? 'Avulso' : `${total} encontros`}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {completed}/{total} concluídos
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/bussola/jovem/${assignment.young_user_id}`)}
                        title="Ver progresso"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este jovem?')) {
                            deleteMutation.mutate(assignment.id);
                          }
                        }}
                        title="Remover"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <EnrollYoungDialog
          open={enrollOpen}
          onOpenChange={setEnrollOpen}
          programId={program.id}
          psychologistId={user!.id}
        />
      </div>
    </BussolaLayout>
  );
}
