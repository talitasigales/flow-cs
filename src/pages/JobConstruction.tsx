import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Briefcase, Info } from 'lucide-react';
import { QuestionCard, ProgressIndicator } from '@/components/job-construction';
import { jobConstructionQuestions } from '@/data/jobConstructionQuestions';
import { 
  calculateJobProfileScores, 
  validateAnswers, 
  type Answers 
} from '@/utils/jobProfileCalculator';

export default function JobConstruction() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [showIntro, setShowIntro] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const validation = validateAnswers(answers);

  const handleAnswer = (questionId: number, answer: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    if (!validation.isValid) return;
    
    const scores = calculateJobProfileScores(answers);
    navigate('/job-construction/result', { state: { scores } });
  };

  const handleReset = () => {
    setAnswers({});
    setShowIntro(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-primary text-primary-foreground shadow-lg">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Construção de Cargos</h1>
                <p className="text-muted-foreground">
                  Defina o perfil comportamental ideal para uma função
                </p>
              </div>
            </div>

            {showIntro ? (
              /* Introduction Card */
              <Card className="p-6 space-y-4 border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Como funciona?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Responda 20 perguntas sobre as exigências comportamentais do cargo que você 
                      deseja mapear. Com base nas suas respostas, o sistema irá gerar um 
                      <strong className="text-foreground"> Perfil de Cargo Sugerido</strong> utilizando 
                      os 5 eixos da metodologia PDA (REPNA).
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-3">
                      <li>• <strong className="text-foreground">R</strong> - Risco: orientação para resultados e competitividade</li>
                      <li>• <strong className="text-foreground">E</strong> - Extroversão: sociabilidade e comunicação</li>
                      <li>• <strong className="text-foreground">P</strong> - Paciência: estabilidade e constância</li>
                      <li>• <strong className="text-foreground">N</strong> - Normas: conformidade e precisão</li>
                      <li>• <strong className="text-foreground">A</strong> - Autocontrole: controle emocional</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => setShowIntro(false)} 
                    className="gap-2"
                  >
                    Iniciar Questionário
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              /* Questionnaire */
              <div className="space-y-6">
                {/* Progress Indicator */}
                <ProgressIndicator
                  answeredCount={validation.answeredCount}
                  totalQuestions={20}
                  noCount={validation.noCount}
                  minNoRequired={5}
                />

                {/* Questions */}
                <div className="space-y-4">
                  {jobConstructionQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      questionNumber={q.id}
                      question={q.question}
                      answer={answers[q.id]}
                      onAnswer={(answer) => handleAnswer(q.id, answer)}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="sm:order-1"
                  >
                    Limpar Respostas
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!validation.isValid}
                    className="gap-2 sm:order-2 sm:ml-auto"
                  >
                    Identificar Perfil do Cargo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Validation Errors */}
                {validation.errors.length > 0 && validation.answeredCount > 0 && (
                  <div className="text-sm text-muted-foreground text-center">
                    {validation.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
