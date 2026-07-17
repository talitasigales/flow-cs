import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lightbulb, Target, ClipboardList, BarChart3, Flag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PDIStageTipsProps {
  currentStage: number;
  status: string;
  onAdvanceStage: () => void;
  onOpenCheckin?: () => void;
  canAdvance: boolean;
  isCompleted: boolean;
}

const STAGE_INFO: Record<number, {
  title: string;
  icon: any;
  description: string;
  tips: string[];
  nextAction: string;
}> = {
  1: {
    title: 'Mapeamento Inicial',
    icon: Target,
    description: 'Identifique os comportamentos mais importantes para o seu contexto atual e use isso como base para o seu plano.',
    tips: [
      'Reflita sobre as demandas da sua função e os comportamentos que mais impactam seus resultados.',
      'Se fizer sentido, alinhe essa leitura com sua liderança para enriquecer a análise.',
      'Compare seu perfil PDA com os comportamentos mais importantes para sua rotina.',
      'Anote os principais pontos de atenção para orientar as próximas etapas do PDI.',
    ],
    nextAction: 'Avançar para Autoconhecimento',
  },
  2: {
    title: 'Autoconhecimento',
    icon: ClipboardList,
    description: 'Use seu relatório e suas respostas para entender melhor seus padrões, pontos fortes e oportunidades de desenvolvimento.',
    tips: [
      'Revise seu perfil PDA com foco nos comportamentos que mais aparecem no seu dia a dia.',
      'Observe quais situações geram mais facilidade, energia ou satisfação.',
      'Identifique também os contextos que exigem mais esforço, adaptação ou autocontrole.',
      'Conecte essa análise ao que você deseja desenvolver na sua atuação atual.',
      'Se quiser, compartilhe essas percepções com sua liderança para receber apoio ao longo do processo.',
    ],
    nextAction: 'Avançar para Plano de Ação',
  },
  3: {
    title: 'Plano de Ação',
    icon: ClipboardList,
    description: 'Transforme seus aprendizados em ações práticas usando SMART e a lógica 70|20|10.',
    tips: [
      'Vá até a aba “Ações” e registre suas ações de desenvolvimento.',
      'Use a metodologia SMART: Específico, Mensurável, Atingível, Relevante e Temporal.',
      'Distribua as ações na proporção 70|20|10: experiência, aprendizado social e educação formal.',
      'Defina datas de início e prazo para manter clareza sobre a execução.',
      'Identifique pessoas ou recursos que podem apoiar seu desenvolvimento.',
    ],
    nextAction: 'Avançar para Acompanhamento',
  },
  4: {
    title: 'Acompanhamento',
    icon: BarChart3,
    description: 'Registre seus check-ins para acompanhar sua evolução, refletir sobre avanços e ajustar o plano quando necessário.',
    tips: [
      'Registre 2 check-ins ao longo do seu PDI.',
      'Em cada check-in, reflita sobre o que funcionou, o que não funcionou e quais obstáculos surgiram.',
      'Reconheça suas conquistas e os esforços realizados até aqui.',
      'Atualize seu plano sempre que perceber novas prioridades ou aprendizados.',
      'Mantenha o foco no desenvolvimento dos comportamentos que você quer fortalecer.',
    ],
    nextAction: 'Registrar Check-in',
  },
  5: {
    title: 'Fechamento',
    icon: Flag,
    description: 'Faça uma avaliação final do ciclo, reconheça sua evolução e defina como continuará se desenvolvendo.',
    tips: [
      'Realize uma avaliação honesta do processo e dos resultados alcançados.',
      'Reconheça e celebre os progressos, mesmo os pequenos.',
      'Identifique aprendizados que podem ser aplicados em outras áreas da sua atuação.',
      'Defina próximos passos para manter seu desenvolvimento contínuo.',
      'Após registrar 2 check-ins, o botão “Concluir PDI” ficará disponível no topo da página.',
    ],
    nextAction: '',
  },
};

export default function PDIStageTips({ currentStage, status, onAdvanceStage, onOpenCheckin, canAdvance, isCompleted }: PDIStageTipsProps) {
  const stageInfo = STAGE_INFO[currentStage];
  if (!stageInfo || isCompleted) return null;

  const Icon = stageInfo.icon;
  const isCheckinAction = currentStage === 4 && !!onOpenCheckin;
  const handlePrimaryAction = isCheckinAction ? onOpenCheckin : onAdvanceStage;
  const dialogDescription = isCheckinAction
    ? 'Você será levado ao registro do check-in para continuar o acompanhamento do seu PDI.'
    : 'Tem certeza que deseja avançar para a próxima etapa? Essa ação indica que você concluiu o que precisava nesta fase.';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Etapa atual: {stageInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{stageInfo.description}</p>

        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-primary" />
            O que fazer nesta etapa:
          </p>
          <ul className="space-y-1.5">
            {stageInfo.tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {canAdvance && stageInfo.nextAction && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <ChevronRight className="h-4 w-4 mr-2" />
                {stageInfo.nextAction}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{stageInfo.nextAction}</AlertDialogTitle>
                <AlertDialogDescription>
                  {dialogDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePrimaryAction}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
