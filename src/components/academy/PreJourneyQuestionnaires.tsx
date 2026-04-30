import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// TODO: substituir pelos links reais dos questionários
const RESILIENCIA_URL = '#';
const DILEMAS_URL = '#';

const STORAGE_PREFIX = 'master-lider:questionnaire';

type QuestionnaireKey = 'resiliencia' | 'dilemas';

const QUESTIONNAIRES: { key: QuestionnaireKey; label: string; url: string }[] = [
  { key: 'resiliencia', label: 'Questionário de Resiliência', url: RESILIENCIA_URL },
  { key: 'dilemas', label: 'Questionário Dilemas de Gestão', url: DILEMAS_URL },
];

export function PreJourneyQuestionnaires() {
  const { user } = useAuth();
  const [accessed, setAccessed] = useState<Record<QuestionnaireKey, boolean>>({
    resiliencia: false,
    dilemas: false,
  });

  const storageKey = (key: QuestionnaireKey) =>
    `${STORAGE_PREFIX}:${key}:${user?.id ?? 'anon'}`;

  useEffect(() => {
    if (!user) return;
    setAccessed({
      resiliencia: !!localStorage.getItem(storageKey('resiliencia')),
      dilemas: !!localStorage.getItem(storageKey('dilemas')),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleClick = (key: QuestionnaireKey, url: string) => {
    if (user) {
      localStorage.setItem(storageKey(key), new Date().toISOString());
      setAccessed((prev) => ({ ...prev, [key]: true }));
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="glass-morphism border-primary/20 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5 text-primary" />
          Antes de iniciar sua jornada
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Responda os dois questionários abaixo para preparar sua experiência no Master Líder.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUESTIONNAIRES.map((q) => {
            const done = accessed[q.key];
            return (
              <Button
                key={q.key}
                variant={done ? 'outline' : 'default'}
                size="lg"
                onClick={() => handleClick(q.key, q.url)}
                className="justify-between h-auto py-4"
              >
                <span className="flex items-center gap-2 text-left">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <ExternalLink className="w-5 h-5 shrink-0" />
                  )}
                  <span className="font-medium">{q.label}</span>
                </span>
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Os questionários abrem em uma nova aba. Marcamos localmente quando você acessa cada um.
        </p>
      </CardContent>
    </Card>
  );
}
