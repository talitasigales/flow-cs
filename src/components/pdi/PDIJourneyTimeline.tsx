import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { number: 1, label: 'Compatibilidade', short: 'Comp.' },
  { number: 2, label: 'Devolutiva', short: 'Devol.' },
  { number: 3, label: 'Construção', short: 'Constr.' },
  { number: 4, label: 'Acompanhamento', short: 'Acomp.' },
  { number: 5, label: 'Fechamento', short: 'Fech.' }
];

interface PDIJourneyTimelineProps {
  currentStep: number;
  className?: string;
}

export default function PDIJourneyTimeline({ currentStep, className }: PDIJourneyTimelineProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors",
                  step.number < currentStep && "bg-primary border-primary text-primary-foreground",
                  step.number === currentStep && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                  step.number > currentStep && "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step.number < currentStep ? (
                  <Check className="h-6 w-6" />
                ) : step.number === currentStep ? (
                  <Circle className="h-6 w-6 fill-current" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center",
                  step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.short}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-colors",
                  step.number < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
