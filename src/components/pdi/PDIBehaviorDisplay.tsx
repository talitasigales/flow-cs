import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PDA_AXES } from '@/data/pdiTemplates';

interface BehaviorRating {
  behavior: string;
  rating: number;
}

interface PDIBehaviorDisplayProps {
  behaviors: BehaviorRating[];
  reflectiveAnswers?: Record<string, string>;
  pdaAxis: string;
}

interface ReflectiveAnswerItem {
  key: string;
  number: number;
  question: string;
  answer: string;
}

const getQuestionNumberFromKey = (key: string) => {
  const normalizedKey = key.trim();

  const questionKeyMatch = normalizedKey.match(/^question_(\d+)$/i);
  if (questionKeyMatch) {
    const rawNumber = parseInt(questionKeyMatch[1], 10);
    return rawNumber === 0 ? 1 : rawNumber;
  }

  const genericQuestionMatch = normalizedKey.match(/^question\s*(\d+)$/i);
  if (genericQuestionMatch) {
    return parseInt(genericQuestionMatch[1], 10);
  }

  const qMatch = normalizedKey.match(/^q(\d+)$/i);
  if (qMatch) {
    return parseInt(qMatch[1], 10);
  }

  return null;
};

const buildReflectiveAnswerItems = (
  reflectiveAnswers: Record<string, string>,
  pdaAxis: string,
): ReflectiveAnswerItem[] => {
  const axisQuestions = PDA_AXES[pdaAxis]?.reflectiveQuestions ?? [];

  return Object.entries(reflectiveAnswers)
    .filter(([, answer]) => typeof answer === 'string' && answer.trim().length > 0)
    .map(([key, answer], index) => {
      const parsedNumber = getQuestionNumberFromKey(key);
      const fallbackNumber = index + 1;
      const questionNumber = parsedNumber ?? fallbackNumber;
      const questionIndex = Math.max(questionNumber - 1, 0);
      const mappedQuestion = axisQuestions[questionIndex];
      const rawLabelLooksLikeQuestionKey = /^(question[_\s]?\d+|q\d+)$/i.test(key.trim());

      return {
        key,
        number: questionNumber,
        question: mappedQuestion || (rawLabelLooksLikeQuestionKey ? `Pergunta ${questionNumber}` : key),
        answer,
      };
    })
    .sort((a, b) => a.number - b.number);
};

export default function PDIBehaviorDisplay({
  behaviors,
  reflectiveAnswers,
  pdaAxis,
}: PDIBehaviorDisplayProps) {
  const reflectiveItems = reflectiveAnswers
    ? buildReflectiveAnswerItems(reflectiveAnswers, pdaAxis)
    : [];

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

      {reflectiveItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respostas Reflexivas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {reflectiveItems.map((item) => (
              <div key={item.key} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.number}. {item.question}
                </p>
                <p className="text-sm whitespace-pre-wrap">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
