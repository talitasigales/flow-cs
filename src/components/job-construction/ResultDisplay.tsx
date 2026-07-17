import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JobProfileScores, getScoreClassification } from '@/utils/jobProfileCalculator';
import { axisLabels, axisDescriptions, Axis } from '@/data/jobConstructionQuestions';
import { cn } from '@/lib/utils';
import groLogo from '@/assets/grou-logo-verde.webp';

interface ResultDisplayProps {
  scores: JobProfileScores;
}

const axisOrder: Axis[] = ['R', 'E', 'P', 'N', 'A'];

function getClassificationColor(classification: string) {
  switch (classification) {
    case 'Alto':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'Situacional':
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    case 'Baixo':
      return 'bg-muted text-muted-foreground border-muted-foreground/30';
    default:
      return '';
  }
}

export function ResultDisplay({ scores }: ResultDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Header with Logo */}
      <div className="flex flex-col items-center gap-4 py-6">
        <img 
          src={groLogo} 
          alt="Grou Logo" 
          className="h-16 w-auto object-contain"
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text">Perfil de Cargo Sugerido</h1>
          <p className="text-muted-foreground mt-1">Resultado da análise comportamental</p>
        </div>
      </div>

      {/* Scores Table */}
      <Card className="overflow-hidden border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Eixo</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold text-center w-24">Score</TableHead>
              <TableHead className="font-semibold text-center w-32">Classificação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {axisOrder.map((axis) => {
              const score = scores[axis];
              const classification = getScoreClassification(score);
              return (
                <TableRow key={axis} className="hover:bg-muted/20">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {axis}
                      </span>
                      {axisLabels[axis]}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {axisDescriptions[axis]}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg">{score}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={cn("font-medium", getClassificationColor(classification))}
                    >
                      {classification}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Score Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getClassificationColor('Baixo')}>Baixo</Badge>
          <span className="text-muted-foreground">0-33</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getClassificationColor('Situacional')}>Situacional</Badge>
          <span className="text-muted-foreground">34-67</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getClassificationColor('Alto')}>Alto</Badge>
          <span className="text-muted-foreground">68-100</span>
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="p-4 bg-muted/20 border-dashed">
        <p className="text-sm text-muted-foreground text-center italic">
          Este é um perfil de cargo sugerido baseado na metodologia PDA. 
          Para uma análise completa ou adaptação, consulte um Analista PDA certificado.
        </p>
      </Card>
    </div>
  );
}
