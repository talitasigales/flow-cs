import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, UserX, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminPayments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/dashboard');
  }, [adminLoading, isAdmin, navigate]);

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-bussola-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bussola_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch unassigned young users (no psychologist)
  const { data: unassigned = [], isLoading: unassignedLoading } = useQuery({
    queryKey: ['admin-unassigned-young'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bussola_assignments' as any)
        .select('*')
        .is('psychologist_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: isAdmin,
  });

  // Fetch psychologists for assignment
  const { data: psychologists = [] } = useQuery({
    queryKey: ['admin-psychologists'],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'psychologist');
      if (!roles?.length) return [];
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      return profiles || [];
    },
    enabled: isAdmin,
  });

  // Assign psychologist mutation
  const assignMutation = useMutation({
    mutationFn: async ({ assignmentId, psychologistId }: { assignmentId: string; psychologistId: string }) => {
      const { error } = await supabase
        .from('bussola_assignments' as any)
        .update({ psychologist_id: psychologistId, status: 'active' } as any)
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-unassigned-young'] });
      toast.success('Psicólogo atribuído com sucesso');
    },
    onError: () => toast.error('Erro ao atribuir psicólogo'),
  });

  if (adminLoading || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos Bússola</h1>
            <p className="text-sm text-muted-foreground">Pagamentos via Dom Pagamentos e jovens sem psicólogo</p>
          </div>
        </div>

        {/* Unassigned Young Users */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserX className="h-5 w-5 text-destructive" />
              Jovens sem Psicólogo ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Todos os jovens possuem psicólogo atribuído ✅</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Encontros</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Atribuir Psicólogo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassigned.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.young_name || '—'}</TableCell>
                      <TableCell>{a.young_email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={a.encounter_count === 1 ? 'secondary' : 'default'}>
                          {a.encounter_count === 1 ? 'Avulso' : `${a.encounter_count} encontros`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {psychologists.length > 0 ? (
                          <Select
                            onValueChange={(val) => assignMutation.mutate({ assignmentId: a.id, psychologistId: val })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {psychologists.map((p: any) => (
                                <SelectItem key={p.user_id} value={p.user_id}>
                                  {p.full_name || p.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum psicólogo cadastrado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payments History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Histórico de Pagamentos ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>ID Transação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.customer_name || '—'}</TableCell>
                      <TableCell>{p.customer_email}</TableCell>
                      <TableCell>
                        <Badge variant={p.encounter_count === 1 ? 'secondary' : 'default'}>
                          {p.encounter_count === 1 ? 'Avulso' : `${p.encounter_count} encontros`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                        {p.dom_transaction_id}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPayments;
