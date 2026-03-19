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
    title: 'Compatibilidade com o Cargo',
    icon: Target,
    description: 'Nesta etapa, realize o mapeamento dos comportamentos compatíveis e não compatíveis do colaborador com o cargo atual.',
    tips: [
      'Realize um mapeamento prévio dos comportamentos desejados para o cargo junto ao gestor e RH.',
      'Compare o perfil PDA do colaborador com o perfil ideal do cargo.',
      'Identifique os eixos comportamentais com menor compatibilidade.',
      'Documente os gaps encontrados para orientar as próximas etapas.',
    ],
    nextAction: 'Avançar para Devolutiva',
  },
  2: {
    title: 'Devolutiva PDA',
    icon: ClipboardList,
    description: 'Promova o autoconhecimento a partir do relatório individual e alinhe expectativas sobre o desenvolvimento.',
    tips: [
      'Inicie com a devolutiva do perfil, focando nos indicadores do gráfico PDA.',
      'Pergunte: "O que você faz hoje que lhe gera mais satisfação e não exige grande esforço?"',
      'Pergunte: "O que lhe gera maior desconforto ou esforço na rotina de trabalho?"',
      'Apresente o relatório de compatibilidade com o cargo, destacando áreas com menor compatibilidade.',
      'Pergunte: "Quais são seus pontos a serem melhorados (principais limitadores)?"',
      'Oriente o colaborador a refletir sobre os pontos levantados até o próximo encontro.',
    ],
    nextAction: 'Avançar para Construção do Plano',
  },
  3: {
    title: 'Construção do Plano',
    icon: ClipboardList,
    description: 'Identifique comportamentos a desenvolver e construa o plano de ação usando SMART e 70|20|10.',
    tips: [
      'Vá até a aba "Ações" e crie suas ações de desenvolvimento.',
      'Use a metodologia SMART: Específico, Mensurável, Atingível, Relevante, Temporal.',
      'Distribua as ações na proporção 70|20|10: 2-3 ações de Experiência, 1 de Aprendizado Social, 1 de Educação Formal.',
      'Defina datas de início e prazo para cada ação.',
      'Identifique mentores que possam apoiar no desenvolvimento.',
    ],
    nextAction: 'Avançar para Acompanhamento',
  },
  4: {
    title: 'Acompanhamento',
    icon: BarChart3,
    description: 'Realize check-ins periódicos para avaliar progresso, identificar obstáculos e ajustar o plano.',
    tips: [
      'Realize 2 sessões de acompanhamento (check-ins) durante o período do PDI.',
      'No check-in, reflita: O que deu certo? O que não deu certo? Quais foram os obstáculos?',
      'Celebre as conquistas e reconheça os esforços realizados.',
      'Ajuste o plano se necessário — adicione ou modifique ações.',
      'Mantenha o foco no desenvolvimento comportamental, não apenas em resultados.',
    ],
    nextAction: 'Avançar para Fechamento',
  },
  5: {
    title: 'Fechamento',
    icon: Flag,
    description: 'Avalie os resultados alcançados, reconheça o crescimento e planeje os próximos passos.',
    tips: [
      'Realize uma avaliação honesta do processo e dos resultados.',
      'Reconheça e celebre os progressos, mesmo os pequenos.',
      'Identifique aprendizados que podem ser aplicados em outras áreas.',
      'Defina próximos passos para manter o desenvolvimento contínuo.',
      'Clique em "Fechar PDI" para registrar o fechamento formalmente.',
    ],
    nextAction: '',
  },
};

export default function PDIStageTips({ currentStage, status, onAdvanceStage, canAdvance, isCompleted }: PDIStageTipsProps) {
  const stageInfo = STAGE_INFO[currentStage];
  if (!stageInfo || isCompleted) return null;

  const Icon = stageInfo.icon;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Etapa Atual: {stageInfo.title}
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
                  Tem certeza que deseja avançar para a próxima etapa? Essa ação indica que você concluiu as atividades desta fase.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onAdvanceStage}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
