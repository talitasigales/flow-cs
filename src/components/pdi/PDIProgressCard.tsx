import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp } from 'lucide-react';

interface PDIProgressCardProps {
  pdi: any;
  actions: any[];
}

export default function PDIProgressCard({ pdi, actions }: PDIProgressCardProps) {
  const experienceActions = actions.filter(a => a.learning_type === 'experience');
  const mentoringActions = actions.filter(a => a.learning_type === 'mentoring');
  const formalActions = actions.filter(a => a.learning_type === 'formal');

  const experienceCompleted = experienceActions.filter(a => a.status === 'completed').length;
  const mentoringCompleted = mentoringActions.filter(a => a.status === 'completed').length;
  const formalCompleted = formalActions.filter(a => a.status === 'completed').length;

  const totalCompleted = actions.filter(a => a.status === 'completed').length;
  const progressPercentage = actions.length > 0 
    ? Math.round((totalCompleted / actions.length) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{progressPercentage}%</div>
              <p className="text-sm text-muted-foreground">
                {totalCompleted} de {actions.length} ações concluídas
              </p>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Ações por Tipo (70/20/10)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">🟢 Experiência (70%)</span>
            <Badge variant="secondary">
              {experienceCompleted}/{experienceActions.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">🟡 Mentoria (20%)</span>
            <Badge variant="secondary">
              {mentoringCompleted}/{mentoringActions.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">🔵 Formal (10%)</span>
            <Badge variant="secondary">
              {formalCompleted}/{formalActions.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Prazos e Datas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Início</p>
              <p className="font-medium">
                {pdi.start_date ? new Date(pdi.start_date).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Prazo</p>
              <p className="font-medium">
                {pdi.target_date ? new Date(pdi.target_date).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={pdi.status === 'completed' ? 'default' : 'secondary'}>
                {pdi.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
