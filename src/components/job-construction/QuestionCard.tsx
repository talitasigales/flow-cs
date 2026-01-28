import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  answer: boolean | undefined;
  onAnswer: (answer: boolean) => void;
}

export function QuestionCard({ 
  questionNumber, 
  question, 
  answer, 
  onAnswer 
}: QuestionCardProps) {
  return (
    <Card className="p-4 sm:p-6 border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {questionNumber}
          </span>
          <p className="text-foreground leading-relaxed pt-1">{question}</p>
        </div>
        
        <div className="flex gap-3 ml-11">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAnswer(true)}
            className={cn(
              "flex-1 gap-2 transition-all duration-200",
              answer === true && "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Check className="w-4 h-4" />
            Sim
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAnswer(false)}
            className={cn(
              "flex-1 gap-2 transition-all duration-200",
              answer === false && "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 hover:text-destructive-foreground"
            )}
          >
            <X className="w-4 h-4" />
            Não
          </Button>
        </div>
      </div>
    </Card>
  );
}
