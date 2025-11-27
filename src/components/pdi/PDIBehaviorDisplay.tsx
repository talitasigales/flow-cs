import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BehaviorRating {
  behavior: string;
  rating: number;
}

interface PDIBehaviorDisplayProps {
  behaviors: BehaviorRating[];
  reflectiveAnswers?: Record<string, string>;
  pdaAxis: string;
}

export default function PDIBehaviorDisplay({ 
  behaviors, 
  reflectiveAnswers,
  pdaAxis 
}: PDIBehaviorDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Autoavaliação Inicial - Comportamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {behaviors.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium flex-1">{item.behavior}</p>
                <span className="text-sm font-bold text-primary ml-4">{item.rating}/10</span>
              </div>
              <Progress value={item.rating * 10} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {reflectiveAnswers && Object.keys(reflectiveAnswers).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respostas Reflexivas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(reflectiveAnswers).map(([question, answer], index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{question}</p>
                <p className="text-sm">{answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
