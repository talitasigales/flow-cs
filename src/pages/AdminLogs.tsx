import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  user_name?: string;
  user_company?: string;
}

const AdminLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchLogs();
    }
  }, [user, isAdmin]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch profile names for user_ids
      const userIds = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
      let profileMap: Record<string, { name: string; company: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, full_name, company')
          .in('user_id', userIds);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: any) => [p.user_id, { name: p.full_name || 'Sem nome', company: p.company || '' }])
          );
        }
      }

      const enrichedLogs = (data || []).map((log: any) => ({
        ...log,
        user_name: log.user_id ? (profileMap[log.user_id]?.name || 'Desconhecido') : 'Sistema',
        user_company: log.user_id ? (profileMap[log.user_id]?.company || '') : '',
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge variant="default">Criado</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary">Atualizado</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Deletado</Badge>;
      case 'MODULE_ACCESS':
        return <Badge className="bg-blue-600">Acessou</Badge>;
      case 'MODULE_COMPLETED':
        return <Badge className="bg-green-600">Concluiu</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getResourceName = (tableName: string | null) => {
    if (!tableName) return '-';
    const mapping: Record<string, string> = {
      'user_roles': 'Permissões',
      'module_materials': 'Materiais',
      'modules': 'Módulos',
      'program_modules': 'Módulos do Programa',
      'program_materials': 'Materiais do Programa',
      'profiles': 'Perfis',
      'matriz_9box': 'Matriz 9Box',
      'profile_evolution': 'Evolução de Perfil',
      'pdis': 'PDIs',
      'pdi_actions': 'Ações PDI',
      'pdi_checkins': 'Check-ins PDI',
      'pdi_closures': 'Encerramento PDI',
      'pdi_mentors': 'Mentores PDI',
      'community_posts': 'Posts Comunidade',
      'community_comments': 'Comentários',
      'community_likes': 'Curtidas',
      'user_progress': 'Progresso',
      'programs': 'Programas',
      'program_classes': 'Turmas',
      'program_enrollments': 'Matrículas',
      'program_events': 'Eventos',
      'class_schedules': 'Agenda de Aulas',
      'webinars': 'Webinars',
      'knowledge_base': 'Base de Conhecimento',
      'chat_messages': 'Mensagens Chat',
      'nanda_messages': 'Mensagens Nanda',
      'notifications': 'Notificações',
      'user_follows': 'Seguidores',
      'user_invites': 'Convites',
      'workshop_responses': 'Respostas Workshop',
    };
    return mapping[tableName] || tableName;
  };

  const fieldLabels: Record<string, string> = {
    full_name: 'Nome', email: 'Email', company: 'Empresa', job_title: 'Cargo',
    bio: 'Bio', phone: 'Telefone', avatar_url: 'Avatar', linkedin_url: 'LinkedIn',
    password_changed: 'Senha alterada', lgpd_accepted: 'LGPD aceito',
    pda_dominant_axis: 'Eixo PDA', pda_profile_name: 'Perfil PDA',
    pda_p_value: 'PDA P', pda_e_value: 'PDA E', pda_a_value: 'PDA A',
    pda_n_value: 'PDA N', pda_r_value: 'PDA R', community_visible: 'Visível comunidade',
    pda_public: 'PDA público', analysis_result: 'Resultado análise',
    role: 'Papel', title: 'Título', name: 'Nome', description: 'Descrição',
    content: 'Conteúdo', status: 'Status', completed: 'Concluído',
    employee_name: 'Colaborador', pda_axis: 'Eixo PDA', current_stage: 'Etapa',
    performance: 'Desempenho', potential: 'Potencial', notes: 'Observações',
    reaction_type: 'Reação', is_anonymous: 'Anônimo', category: 'Categoria',
    video_url: 'URL vídeo', file_url: 'URL arquivo', file_type: 'Tipo arquivo',
    presenter: 'Apresentador', specialist: 'Especialista',
    behavior_assessments: 'Avaliações', reflective_answers: 'Respostas reflexivas',
    satisfaction_score: 'Nota satisfação', final_status: 'Status final',
    mentor_name: 'Mentor', mentor_role: 'Papel mentor',
  };

  const ignoredFields = ['id', 'user_id', 'created_at', 'updated_at', 'updated_at', 'last_password_change', 'lgpd_accepted_at'];

  const getChangedFields = (oldData: any, newData: any): string[] => {
    if (!oldData || !newData) return [];
    const changes: string[] = [];
    for (const key of Object.keys(newData)) {
      if (ignoredFields.includes(key)) continue;
      const oldVal = JSON.stringify(oldData[key] ?? null);
      const newVal = JSON.stringify(newData[key] ?? null);
      if (oldVal !== newVal) {
        const label = fieldLabels[key] || key;
        const nv = newData[key];
        const ov = oldData[key];
        if (typeof nv === 'string' && nv.length < 40 && typeof ov === 'string' && ov.length < 40) {
          changes.push(`${label}: "${ov}" → "${nv}"`);
        } else if (typeof nv === 'boolean' || typeof nv === 'number') {
          changes.push(`${label}: ${ov} → ${nv}`);
        } else {
          changes.push(`${label} alterado`);
        }
      }
    }
    return changes;
  };

  const getRecordLabel = (log: AuditLog): string => {
    const data = log.new_data || log.old_data;
    if (!data) return '';
    switch (log.table_name) {
      case 'profiles': return data.full_name || data.email || '';
      case 'user_roles': return `Papel: ${data.role || '-'}`;
      case 'pdis': return `${data.employee_name || '-'} (${data.pda_axis || '-'})`;
      case 'pdi_actions': return (data.description || '').substring(0, 50);
      case 'pdi_checkins': return `Check-in #${data.checkin_number || '-'}`;
      case 'pdi_closures': return `Status: ${data.final_status || '-'}`;
      case 'pdi_mentors': return `Mentor: ${data.mentor_name || '-'}`;
      case 'matriz_9box': return `${data.employee_name || '-'} (P:${data.performance ?? '-'}/P:${data.potential ?? '-'})`;
      case 'profile_evolution': return `${data.employee_name || '-'} — ${data.assessment_date || '-'}`;
      case 'community_posts': return (data.content || '').substring(0, 50);
      case 'community_comments': return (data.content || '').substring(0, 50);
      case 'community_likes': return `Reação: ${data.reaction_type || 'like'}`;
      case 'user_progress': return data.completed ? 'Concluído' : 'Em andamento';
      case 'modules': case 'program_modules': return data.title || '-';
      case 'module_materials': case 'program_materials': return `${data.title || '-'}${data.file_type ? ` (${data.file_type})` : ''}`;
      case 'programs': return data.name || '-';
      case 'program_classes': return data.name || '-';
      case 'program_enrollments': return 'Matrícula';
      case 'program_events': return data.title || '-';
      case 'class_schedules': return data.title || '-';
      case 'webinars': return data.title || '-';
      case 'knowledge_base': return data.title || '-';
      case 'chat_messages': return (data.content || '').substring(0, 40);
      case 'nanda_messages': return `[${data.role}] ${(data.content || '').substring(0, 40)}`;
      case 'notifications': return (data.message || '').substring(0, 40);
      case 'user_follows': return 'Seguiu usuário';
      case 'user_invites': return `${data.email || '-'} (${data.status || '-'})`;
      case 'workshop_responses': return 'Resposta workshop';
      default: {
        const fb = Object.entries(data).find(([k, v]) => typeof v === 'string' && !ignoredFields.includes(k) && (v as string).length > 0);
        return fb ? (fb[1] as string).substring(0, 50) : '';
      }
    }
  };

  const getLogDetails = (log: AuditLog) => {
    const data = log.new_data || log.old_data;
    if (!data) return log.record_id ? log.record_id.substring(0, 8) + '...' : '-';

    if (log.action === 'MODULE_ACCESS' || log.action === 'MODULE_COMPLETED') {
      return (
        <span>
          <span className="font-medium">{data.module_title}</span>
          {data.program_name && <span className="text-muted-foreground"> — {data.program_name}</span>}
        </span>
      );
    }

    const label = getRecordLabel(log);

    if (log.action === 'UPDATE' && log.old_data && log.new_data) {
      const changes = getChangedFields(log.old_data, log.new_data);
      if (changes.length > 0) {
        return (
          <span className="space-y-0.5">
            {label && <span className="font-medium">{label}</span>}
            {label && ' — '}
            <span className="text-muted-foreground">{changes.slice(0, 3).join('; ')}{changes.length > 3 ? ` (+${changes.length - 3})` : ''}</span>
          </span>
        );
      }
      return label || '-';
    }

    if (log.action === 'INSERT') {
      return label ? <span><span className="text-muted-foreground">Criou: </span><span className="font-medium">{label}</span></span> : '-';
    }

    if (log.action === 'DELETE') {
      return label ? <span><span className="text-muted-foreground">Removeu: </span><span className="font-medium">{label}</span></span> : '-';
    }

    return label || '-';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.table_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_company || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.table_name === resourceFilter;
    const matchesCompany = companyFilter === 'all' || log.user_company === companyFilter;

    return matchesSearch && matchesAction && matchesResource && matchesCompany;
  });

  const uniqueResourceTypes = Array.from(new Set(logs.map(log => log.table_name).filter(Boolean))) as string[];
  const uniqueCompanies = Array.from(new Set(logs.map(log => log.user_company).filter(Boolean))) as string[];

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Logs do Sistema</h1>
              <p className="text-muted-foreground">Histórico de atividades e auditoria</p>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os logs por termo, ação, recurso ou empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou recurso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ação</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                     <SelectItem value="INSERT">Criado</SelectItem>
                     <SelectItem value="UPDATE">Atualizado</SelectItem>
                     <SelectItem value="DELETE">Deletado</SelectItem>
                     <SelectItem value="MODULE_ACCESS">Acessou Módulo</SelectItem>
                     <SelectItem value="MODULE_COMPLETED">Concluiu Módulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Recurso</label>
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueResourceTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {getResourceName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Empresa</label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Atividade</CardTitle>
            <CardDescription>
              Mostrando {filteredLogs.length} de {logs.length} registro{logs.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{log.user_name}</TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>{getResourceName(log.table_name)}</TableCell>
                        <TableCell className="text-sm max-w-md">
                          {getLogDetails(log)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogs;
