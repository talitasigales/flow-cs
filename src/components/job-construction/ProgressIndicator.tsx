import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  answeredCount: number;
  totalQuestions: number;
  noCount: number;
  minNoRequired: number;
}

export function ProgressIndicator({
  answeredCount,
  totalQuestions,
  noCount,
  minNoRequired
}: ProgressIndicatorProps) {
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const isComplete = answeredCount === totalQuestions;
  const hasMinNo = noCount >= minNoRequired;

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className={cn(
            "font-medium",
            isComplete ? "text-primary" : "text-foreground"
          )}>
            {answeredCount} de {totalQuestions}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-primary" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={cn(
            "text-sm",
            isComplete ? "text-primary" : "text-muted-foreground"
          )}>
            Todas respondidas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasMinNo ? (
            <CheckCircle className="w-4 h-4 text-primary" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={cn(
            "text-sm",
            hasMinNo ? "text-primary" : "text-muted-foreground"
          )}>
            Mínimo "Não": {noCount}/{minNoRequired}
          </span>
        </div>
      </div>
    </div>
  );
}
