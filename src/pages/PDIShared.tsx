import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PDA_AXES } from '@/data/pdiTemplates';
import PDIJourneyTimeline from '@/components/pdi/PDIJourneyTimeline';
import PDIBehaviorDisplay from '@/components/pdi/PDIBehaviorDisplay';
import grouLogo from '@/assets/grou-logo-branco.png.asset.json';
import { Loader2, Lock } from 'lucide-react';

interface SharedData {
  pdi: any;
  actions: any[];
  checkins: any[];
  closure: any;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  devolutiva: 'Autoconhecimento',
  construcao: 'Plano de ação',
  acompanhamento: 'Acompanhamento',
  fechamento: 'Fechamento',
  completed: 'Concluído',
};

const ACTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Não iniciada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export default function PDIShared() {
  const { token } = useParams();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: res, error: fnError } = await supabase.functions.invoke('pdi-share', {
        body: { action: 'view', token },
      });

      if (fnError || (res as any)?.error) {
        console.error('[PDIShared] error:', fnError, res);
        setError((res as any)?.error ?? 'link_invalid');
      } else {
        setData(res as SharedData);
      }
      setLoading(false);
    };
    void load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-3">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold">Link indisponível</h1>
            <p className="text-sm text-muted-foreground">
              {error === 'link_expired'
                ? 'O prazo de acesso a este plano expirou.'
                : 'Este link não é mais válido. Peça um novo link a quem compartilhou seu PDI.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pdi, actions, checkins, closure } = data;
  const axisInfo = PDA_AXES[pdi.pda_axis];
  const behaviors = pdi.behavior_assessments || [];
  const completedActions = actions.filter((a) => a.status === 'completed').length;
  const progress = actions.length ? Math.round((completedActions / actions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <img src={grouLogo} alt="Grou" className="h-8 w-auto" />
            <Badge variant="outline">Somente leitura</Badge>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Meu PDI — {pdi.employee_name}</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe aqui o seu Plano de Desenvolvimento Individual.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {axisInfo && (
              <Badge style={{ backgroundColor: axisInfo.color, color: 'white' }}>{axisInfo.name}</Badge>
            )}
            <Badge variant="secondary">Etapa {pdi.current_stage}/5</Badge>
            <Badge variant={closure ? 'default' : 'outline'}>
              {STATUS_LABELS[pdi.status] || pdi.status}
            </Badge>
          </div>
          <PDIJourneyTimeline currentStep={pdi.current_stage} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso das ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {completedActions} de {actions.length} ações concluídas ({progress}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano de ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma ação cadastrada ainda.</p>
            ) : (
              actions.map((action) => (
                <div key={action.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-sm">{action.description}</p>
                    <Badge variant="outline">{ACTION_STATUS_LABELS[action.status] || action.status}</Badge>
                  </div>
                  {(action.start_date || action.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {action.start_date && `Início: ${new Date(action.start_date).toLocaleDateString('pt-BR')}`}
                      {action.start_date && action.end_date && ' · '}
                      {action.end_date && `Prazo: ${new Date(action.end_date).toLocaleDateString('pt-BR')}`}
                    </p>
                  )}
                  {action.specific && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{action.specific}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <PDIBehaviorDisplay
          behaviors={behaviors}
          reflectiveAnswers={pdi.reflective_answers}
          pdaAxis={pdi.pda_axis}
        />

        {checkins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Check-ins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkins.map((checkin) => (
                <div key={checkin.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Check-in #{checkin.checkin_number}</p>
                    <Badge variant="outline">
                      {new Date(checkin.checkin_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                  {checkin.what_worked && (
                    <div>
                      <p className="text-sm font-medium">O que deu certo</p>
                      <p className="text-sm text-muted-foreground">{checkin.what_worked}</p>
                    </div>
                  )}
                  {checkin.obstacles && (
                    <div>
                      <p className="text-sm font-medium">Obstáculos</p>
                      <p className="text-sm text-muted-foreground">{checkin.obstacles}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {closure && (
          <Card>
            <CardHeader>
              <CardTitle>Fechamento do PDI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {closure.satisfaction_score != null && (
                <div>
                  <p className="text-sm font-medium">Nota de satisfação</p>
                  <p className="text-3xl font-bold text-primary">{closure.satisfaction_score}/100</p>
                </div>
              )}
              {closure.main_learnings && (
                <div>
                  <p className="text-sm font-medium">Principais aprendizados</p>
                  <p className="text-sm text-muted-foreground">{closure.main_learnings}</p>
                </div>
              )}
              {closure.next_steps && (
                <div>
                  <p className="text-sm font-medium">Próximos passos</p>
                  <p className="text-sm text-muted-foreground">{closure.next_steps}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
