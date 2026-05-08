import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Activity, MessageSquare, Download } from 'lucide-react';
import { generateCSV, downloadCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  user_roles: 'Permissões', module_materials: 'Materiais', modules: 'Módulos',
  program_modules: 'Módulos do Programa', program_materials: 'Materiais do Programa',
  profiles: 'Perfis', matriz_9box: 'Matriz 9Box', profile_evolution: 'Evolução de Perfil',
  pdis: 'PDIs', pdi_actions: 'Ações PDI', pdi_checkins: 'Check-ins PDI',
  pdi_closures: 'Encerramento PDI', pdi_mentors: 'Mentores PDI',
  community_posts: 'Posts Comunidade', community_comments: 'Comentários',
  community_likes: 'Curtidas', user_progress: 'Progresso', programs: 'Programas',
  program_classes: 'Turmas', program_enrollments: 'Matrículas',
  program_events: 'Eventos', class_schedules: 'Agenda', webinars: 'Webinars',
  knowledge_base: 'Base de Conhecimento', chat_messages: 'Mensagens Chat',
  nanda_messages: 'Mensagens Nanda', notifications: 'Notificações',
  user_follows: 'Seguidores', user_invites: 'Convites',
  workshop_responses: 'Respostas Workshop', job_constructions: 'Construção de Cargos',
  csat_responses: 'CSAT',
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Criou', UPDATE: 'Atualizou', DELETE: 'Removeu',
  MODULE_ACCESS: 'Acessou Módulo', MODULE_COMPLETED: 'Concluiu Módulo',
  VIDEO_PLAY: 'Assistiu Vídeo', MATERIAL_EXPAND: 'Abriu Material',
  MATERIAL_DOWNLOAD: 'Baixou Material', JOB_CONSTRUCTION: 'Construção de Cargo',
};

const getActionDetail = (log: any): string => {
  const data = log.new_data || log.old_data || {};
  if (data.module_title) return data.module_title + (data.program_name ? ` — ${data.program_name}` : '');
  if (data.material_title) return data.material_title;
  if (data.video_title) return data.video_title;
  if (data.job_title) return data.job_title;
  if (data.title) return data.title;
  if (data.full_name) return data.full_name;
  if (data.name) return data.name;
  if (data.content) return String(data.content).substring(0, 80);
  return RESOURCE_LABELS[log.table_name] || log.table_name || '';
};

export const UserActivityDialog = ({ open, onOpenChange, userId, userName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [nandaMsgs, setNandaMsgs] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalActions: number;
    nandaCount: number;
    moduleAccess: number;
    videoPlays: number;
    posts: number;
    actionsByResource: Record<string, number>;
  }>({ totalActions: 0, nandaCount: 0, moduleAccess: 0, videoPlays: 0, posts: 0, actionsByResource: {} });

  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      setLoading(true);
      try {
        const [logsRes, nandaRes] = await Promise.all([
          (supabase as any).from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
          (supabase as any).from('nanda_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
        ]);
        const logsData = logsRes.data || [];
        const nandaData = nandaRes.data || [];
        setLogs(logsData);
        setNandaMsgs(nandaData);

        const actionsByResource: Record<string, number> = {};
        let moduleAccess = 0, videoPlays = 0, posts = 0;
        for (const l of logsData) {
          const key = l.table_name || l.action;
          actionsByResource[key] = (actionsByResource[key] || 0) + 1;
          if (l.action === 'MODULE_ACCESS') moduleAccess++;
          if (l.action === 'VIDEO_PLAY') videoPlays++;
          if (l.table_name === 'community_posts' && l.action === 'INSERT') posts++;
        }
        setStats({
          totalActions: logsData.length,
          nandaCount: nandaData.filter((m: any) => m.role === 'user').length,
          moduleAccess, videoPlays, posts,
          actionsByResource,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId]);

  const topResources = Object.entries(stats.actionsByResource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <DialogTitle>Atividade · {userName}</DialogTitle>
              <DialogDescription>Visão completa do uso da plataforma por este usuário</DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || (logs.length === 0 && nandaMsgs.length === 0)}
              onClick={() => {
                const headers = ['Data/Hora', 'Tipo', 'Ação', 'Recurso', 'Detalhes'];
                const rows: (string | number)[][] = [];
                for (const l of logs) {
                  rows.push([
                    new Date(l.created_at).toLocaleString('pt-BR'),
                    'Plataforma',
                    ACTION_LABELS[l.action] || l.action,
                    RESOURCE_LABELS[l.table_name] || l.table_name || '-',
                    getActionDetail(l),
                  ]);
                }
                for (const m of nandaMsgs) {
                  rows.push([
                    new Date(m.created_at).toLocaleString('pt-BR'),
                    'Nanda',
                    m.role === 'user' ? 'Mensagem do usuário' : 'Resposta da Nanda',
                    'Chatbot Nanda',
                    String(m.content || '').replace(/\s+/g, ' ').slice(0, 500),
                  ]);
                }
                rows.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
                if (rows.length === 0) {
                  toast.error('Nenhuma atividade para exportar');
                  return;
                }
                const csv = generateCSV(headers, rows);
                const slug = userName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) || 'usuario';
                downloadCSV(csv, `atividade_${slug}_${new Date().toISOString().split('T')[0]}.csv`);
                toast.success(`${rows.length} registros exportados`);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando atividade...</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1" />Visão Geral</TabsTrigger>
              <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-1" />Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="nanda"><Sparkles className="h-4 w-4 mr-1" />Nanda ({stats.nandaCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Total de ações</p>
                  <p className="text-2xl font-bold">{stats.totalActions}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Mensagens Nanda</p>
                  <p className="text-2xl font-bold text-primary">{stats.nandaCount}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Módulos acessados</p>
                  <p className="text-2xl font-bold">{stats.moduleAccess}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Vídeos assistidos</p>
                  <p className="text-2xl font-bold">{stats.videoPlays}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground">Posts publicados</p>
                  <p className="text-2xl font-bold">{stats.posts}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Top recursos utilizados</p>
                <div className="flex flex-wrap gap-2">
                  {topResources.length === 0 && <p className="text-sm text-muted-foreground">Sem atividade registrada.</p>}
                  {topResources.map(([key, count]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {RESOURCE_LABELS[key] || ACTION_LABELS[key] || key} · {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <ScrollArea className="h-[55vh] pr-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Nenhum log registrado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {logs.map((log) => (
                      <div key={log.id} className="text-sm border-b py-2 flex justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                          <span className="text-muted-foreground"> · {RESOURCE_LABELS[log.table_name] || log.table_name || '-'}</span>
                          <p className="text-xs text-muted-foreground truncate">{getActionDetail(log)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="nanda">
              <ScrollArea className="h-[55vh] pr-3">
                {nandaMsgs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Este usuário ainda não interagiu com a Nanda.</p>
                ) : (
                  <div className="space-y-2">
                    {nandaMsgs.map((m) => (
                      <div key={m.id} className={`rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary/10 border border-primary/30' : 'bg-muted/40'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {m.role === 'user' ? (
                            <Badge variant="default" className="text-[10px]">Usuário</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]"><MessageSquare className="h-3 w-3 mr-1" />Nanda</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
