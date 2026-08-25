import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { useCSATContext } from '@/contexts/CSATContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Briefcase, Info, History, Trash2, Eye, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { QuestionCard, ProgressIndicator } from '@/components/job-construction';
import { jobConstructionQuestions } from '@/data/jobConstructionQuestions';
import { 
  calculateJobProfileScores, 
  validateAnswers, 
  type Answers,
  type JobProfileScores
} from '@/utils/jobProfileCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { getScoreClassification } from '@/utils/jobProfileCalculator';

interface JobConstructionRecord {
  id: string;
  job_title: string;
  r_score: number;
  e_score: number;
  p_score: number;
  n_score: number;
  a_score: number;
  created_at: string;
}

export default function JobConstruction() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [showIntro, setShowIntro] = useState(true);
  const [jobTitle, setJobTitle] = useState('');
  const [history, setHistory] = useState<JobConstructionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { triggerFirstUseCSAT } = useCSATContext();

  useEffect(() => {
    if (user) {
      fetchHistory();
      triggerFirstUseCSAT('job_construction', 'Construção de Cargos');
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('job_constructions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory((data as JobConstructionRecord[]) || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!validation.isValid) return;
    
    const scores = calculateJobProfileScores(answers);
    
    try {
      // Save to database
      const { data, error } = await supabase
        .from('job_constructions')
        .insert({
          user_id: user.id,
          job_title: jobTitle.trim() || 'Sem título',
          r_score: scores.R,
          e_score: scores.E,
          p_score: scores.P,
          n_score: scores.N,
          a_score: scores.A,
          answers: answers as any,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Log action for admin visibility
      await supabase.rpc('log_user_action', {
        _action: 'JOB_CONSTRUCTION',
        _table_name: 'job_constructions',
        _record_id: data.id,
        _new_data: { job_title: jobTitle.trim() || 'Sem título', scores } as any,
      });

      navigate('/job-construction/result', { state: { scores, recordId: data.id } });
    } catch (err) {
      console.error('Error saving job construction:', err);
      toast.error('Erro ao salvar análise');
      // Still navigate even if save fails
      navigate('/job-construction/result', { state: { scores } });
    }
  };

  const handleExportQuestions = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    const maxWidth = 595 - marginX * 2;
    let y = 64;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Construção de Cargos — Questionário', marginX, y);
    y += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Responda SIM ou NÃO para cada pergunta sobre as exigências do cargo.', marginX, y);
    y += 26;

    doc.setFontSize(11);
    jobConstructionQuestions.forEach((q) => {
      const lines = doc.splitTextToSize(`${q.id}. ${q.question}`, maxWidth - 90);
      if (y + lines.length * 15 + 10 > 800) {
        doc.addPage();
        y = 64;
      }
      doc.text(lines, marginX, y);
      doc.text('(  ) SIM   (  ) NÃO', marginX + maxWidth - 88, y);
      y += lines.length * 15 + 12;
    });

    doc.save('construcao-de-cargos-perguntas.pdf');
    toast.success('Perguntas exportadas em PDF');
  };

  const handleReset = () => {
    setAnswers({});
    setJobTitle('');
    setShowIntro(true);
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_constructions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(r => r.id !== id));
      toast.success('Análise removida');
    } catch {
      toast.error('Erro ao remover análise');
    }
  };

  const handleViewRecord = (record: JobConstructionRecord) => {
    const scores: JobProfileScores = {
      R: record.r_score,
      E: record.e_score,
      P: record.p_score,
      N: record.n_score,
      A: record.a_score,
    };
    navigate('/job-construction/result', { state: { scores, recordId: record.id } });
  };

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-4 sm:p-6 lg:p-8">
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
              <div className="space-y-6">
                {/* Introduction Card */}
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

                {/* History Section */}
                {history.length > 0 && (
                  <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold">Análises Anteriores</h2>
                    </div>
                    <div className="space-y-3">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {record.job_title || 'Sem título'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.created_at).toLocaleDateString('pt-BR')}
                            </p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {(['R', 'E', 'P', 'N', 'A'] as const).map((axis) => {
                                const key = `${axis.toLowerCase()}_score` as keyof JobConstructionRecord;
                                const score = record[key] as number;
                                return (
                                  <Badge key={axis} variant="outline" className="text-xs px-1.5 py-0">
                                    {axis}: {score}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewRecord(record)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              /* Questionnaire */
              <div className="space-y-6">
                {/* Job Title Input */}
                <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
                  <label className="text-sm font-medium mb-2 block">
                    Nome do Cargo (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Gerente de Projetos, Analista Financeiro..."
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </Card>

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
        </div>
    </AppLayout>
  );
}
