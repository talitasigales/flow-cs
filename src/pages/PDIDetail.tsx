import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, FileCheck } from 'lucide-react';
import PDIStageTips from '@/components/pdi/PDIStageTips';
import { toast } from 'sonner';
import { PDA_AXES } from '@/data/pdiTemplates';
import PDIJourneyTimeline from '@/components/pdi/PDIJourneyTimeline';
import PDIBehaviorDisplay from '@/components/pdi/PDIBehaviorDisplay';
import PDIActionsTab from '@/components/pdi/PDIActionsTab';
import PDIProgressCard from '@/components/pdi/PDIProgressCard';
import PDICheckinDialog from '@/components/pdi/PDICheckinDialog';
import PDIClosureDialog from '@/components/pdi/PDIClosureDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PDIDetail() {
  const { pdiId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pdi, setPdi] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [closure, setClosure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);

  useEffect(() => {
    if (user && pdiId) {
      fetchPDIData();
    }
  }, [user, pdiId]);

  const advanceStage = async (pdiData: any, actionsData: any[], checkinsData: any[], closureData: any) => {
    let newStatus = pdiData.status;
    let newStage = pdiData.current_stage;

    if (closureData) {
      newStatus = 'completed';
      newStage = 5;
    } else if (checkinsData.length > 0 && actionsData.length > 0) {
      if (pdiData.status !== 'acompanhamento' && pdiData.status !== 'fechamento' && pdiData.status !== 'completed') {
        newStatus = 'acompanhamento';
        newStage = 4;
      }
    } else if (actionsData.length > 0) {
      if (pdiData.status === 'devolutiva' || pdiData.status === 'active') {
        newStatus = 'construcao';
        newStage = 3;
      }
    }

    if (newStatus !== pdiData.status || newStage !== pdiData.current_stage) {
      const { error } = await supabase
        .from('pdis')
        .update({ status: newStatus, current_stage: newStage })
        .eq('id', pdiData.id);

      if (!error) {
        pdiData.status = newStatus;
        pdiData.current_stage = newStage;
      }
    }

    return pdiData;
  };

  const fetchPDIData = async () => {
    try {
      const { data: pdiData, error: pdiError } = await supabase
        .from('pdis')
        .select('*')
        .eq('id', pdiId)
        .eq('user_id', user?.id)
        .single();

      if (pdiError) throw pdiError;

      const { data: actionsData, error: actionsError } = await supabase
        .from('pdi_actions')
        .select('*')
        .eq('pdi_id', pdiId!)
        .order('created_at', { ascending: false });

      if (actionsError) throw actionsError;
      setActions(actionsData || []);

      const { data: checkinsData, error: checkinsError } = await supabase
        .from('pdi_checkins')
        .select('*')
        .eq('pdi_id', pdiId!)
        .order('checkin_date', { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckins(checkinsData || []);

      const { data: closureData, error: closureError } = await supabase
        .from('pdi_closures')
        .select('*')
        .eq('pdi_id', pdiId!)
        .maybeSingle();

      if (closureError) throw closureError;
      setClosure(closureData);

      const updatedPdi = await advanceStage(pdiData, actionsData || [], checkinsData || [], closureData);
      setPdi(updatedPdi);
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      toast.error('Erro ao carregar PDI');
      navigate('/pdi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando PDI...</p>
        </div>
      </div>
    );
  }

  if (!pdi) return null;

  const axisInfo = PDA_AXES[pdi.pda_axis];
  const behaviors = pdi.behavior_assessments || [];
  const nextCheckinNumber = checkins.length + 1;
  const canClose = checkins.length >= 2 && !closure;

  const STAGE_STATUS_MAP: Record<number, { status: string; stage: number }> = {
    1: { status: 'devolutiva', stage: 2 },
    2: { status: 'construcao', stage: 3 },
    3: { status: 'acompanhamento', stage: 4 },
    4: { status: 'fechamento', stage: 5 },
  };

  const handleManualAdvance = async () => {
    const next = STAGE_STATUS_MAP[pdi.current_stage];
    if (!next) return;

    try {
      const { error } = await supabase
        .from('pdis')
        .update({ status: next.status, current_stage: next.stage })
        .eq('id', pdi.id);

      if (error) throw error;
      toast.success('Etapa avançada com sucesso!');
      fetchPDIData();
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      toast.error('Erro ao avançar etapa');
    }
  };

  const canManuallyAdvance = !closure && pdi.status !== 'completed' && (
    pdi.current_stage < 4 || (pdi.current_stage === 4 && nextCheckinNumber <= 2)
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      active: 'Ativo',
      devolutiva: 'Autoconhecimento',
      construcao: 'Plano de ação',
      acompanhamento: 'Acompanhamento',
      fechamento: 'Fechamento',
      completed: 'Concluído'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/pdi')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">PDI - {pdi.employee_name}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              {!closure && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setCheckinDialogOpen(true)}
                    disabled={nextCheckinNumber > 2}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Check-in #{nextCheckinNumber}
                  </Button>
                  {canClose && (
                    <Button onClick={() => setClosureDialogOpen(true)}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Concluir PDI
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Badge 
              style={{ 
                backgroundColor: axisInfo?.color || '#6b7280',
                color: 'white'
              }}
            >
              {axisInfo?.name}
            </Badge>
            <Badge variant="secondary">
              Etapa {pdi.current_stage}/5
            </Badge>
            <Badge variant={closure ? 'default' : 'outline'}>
              {getStatusLabel(pdi.status)}
            </Badge>
          </div>

          <PDIJourneyTimeline currentStep={pdi.current_stage} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="assessment">Autoavaliação</TabsTrigger>
            <TabsTrigger value="actions">
              Ações ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="checkins">
              Check-ins ({checkins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PDIStageTips
              currentStage={pdi.current_stage}
              status={pdi.status}
              onAdvanceStage={handleManualAdvance}
              onOpenCheckin={() => setCheckinDialogOpen(true)}
              canAdvance={canManuallyAdvance}
              isCompleted={!!closure}
            />
            <PDIProgressCard pdi={pdi} actions={actions} />

            {pdi.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{pdi.notes}</p>
                </CardContent>
              </Card>
            )}

            {closure && (
              <Card>
                <CardHeader>
                  <CardTitle>Fechamento do PDI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Nota de Satisfação</p>
                    <p className="text-3xl font-bold text-primary">{closure.satisfaction_score}/100</p>
                  </div>
                  {closure.main_learnings && (
                    <div>
                      <p className="text-sm font-medium">Principais Aprendizados</p>
                      <p className="text-sm text-muted-foreground">{closure.main_learnings}</p>
                    </div>
                  )}
                  {closure.next_steps && (
                    <div>
                      <p className="text-sm font-medium">Próximos Passos</p>
                      <p className="text-sm text-muted-foreground">{closure.next_steps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assessment">
            <PDIBehaviorDisplay
              behaviors={behaviors}
              reflectiveAnswers={pdi.reflective_answers}
              pdaAxis={pdi.pda_axis}
            />
          </TabsContent>

          <TabsContent value="actions">
            <PDIActionsTab
              pdiId={pdiId!}
              actions={actions}
              onRefresh={fetchPDIData}
            />
          </TabsContent>

          <TabsContent value="checkins" className="space-y-4">
            {checkins.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum check-in realizado ainda.
                  </p>
                  <Button onClick={() => setCheckinDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Realizar Primeiro Check-in
                  </Button>
                </CardContent>
              </Card>
            ) : (
              checkins.map((checkin) => (
                <Card key={checkin.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Check-in #{checkin.checkin_number}</span>
                      <Badge variant="outline">
                        {new Date(checkin.checkin_date).toLocaleDateString('pt-BR')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {checkin.what_worked && (
                      <div>
                        <p className="text-sm font-medium">✅ O que deu certo</p>
                        <p className="text-sm text-muted-foreground">{checkin.what_worked}</p>
                      </div>
                    )}
                    {checkin.obstacles && (
                      <div>
                        <p className="text-sm font-medium">🚧 Obstáculos</p>
                        <p className="text-sm text-muted-foreground">{checkin.obstacles}</p>
                      </div>
                    )}
                    {checkin.notes && (
                      <div>
                        <p className="text-sm font-medium">📝 Notas</p>
                        <p className="text-sm text-muted-foreground">{checkin.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PDICheckinDialog
        open={checkinDialogOpen}
        onOpenChange={setCheckinDialogOpen}
        pdiId={pdiId!}
        checkinNumber={nextCheckinNumber}
        onSuccess={fetchPDIData}
      />

      <PDIClosureDialog
        open={closureDialogOpen}
        onOpenChange={setClosureDialogOpen}
        pdiId={pdiId!}
        onSuccess={fetchPDIData}
      />
    </div>
  );
}

