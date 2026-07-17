import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PDA_AXES } from '@/data/pdiTemplates';

const STEPS = ['Eixo PDA', 'Dados', 'Autoavaliação', 'Objetivo'];

export default function PDICreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedAxis, setSelectedAxis] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [behaviorRatings, setBehaviorRatings] = useState<Record<number, number>>({});
  const [reflectiveAnswers, setReflectiveAnswers] = useState<Record<number, string>>({});

  const axisInfo = selectedAxis ? PDA_AXES[selectedAxis] : null;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedAxis !== '';
      case 1:
        return employeeName.trim() !== '';
      case 2:
        return Object.keys(behaviorRatings).length === 5;
      case 3:
        return Object.keys(reflectiveAnswers).length >= 3 && Object.values(reflectiveAnswers).some(a => a.trim() !== '');
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!user || !canProceed()) return;

    setLoading(true);
    try {
      const behaviorAssessments = Object.entries(behaviorRatings).map(([index, rating]) => ({
        behavior: axisInfo?.behaviors[parseInt(index)],
        rating
      }));

      const formattedAnswers = Object.entries(reflectiveAnswers).reduce((acc, [index, answer]) => {
        acc[`question_${index}`] = answer;
        return acc;
      }, {} as Record<string, string>);

      const { data, error } = await supabase
        .from('pdis')
        .insert({
          user_id: user.id,
          employee_name: employeeName,
          pda_axis: selectedAxis,
          status: 'devolutiva',
          current_stage: 2,
          start_date: startDate || new Date().toISOString().split('T')[0],
          target_date: targetDate || null,
          behavior_assessments: behaviorAssessments,
          reflective_answers: formattedAnswers,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('PDI criado com sucesso!');
      navigate(`/pdi/${data?.id}`);
    } catch (error) {
      console.error('Erro ao criar PDI:', error);
      toast.error('Erro ao criar PDI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/pdi')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Criar novo PDI</h1>
              <p className="text-muted-foreground mt-1">Siga o passo a passo para montar seu plano de desenvolvimento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((step) => (
              <span key={step} className="flex-1 text-center">{step}</span>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-6">
                  Selecione o eixo PDA que melhor representa o perfil comportamental que você deseja desenvolver neste PDI:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(PDA_AXES).map(([key, axis]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedAxis(key)}
                      className={`p-6 rounded-lg border-2 text-left transition-all ${
                        selectedAxis === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: axis.color }}
                        />
                        <h3 className="font-semibold text-lg">{axis.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{axis.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeName">Nome *</Label>
                  <Input
                    id="employeeName"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetDate">Prazo desejado</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && axisInfo && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Avalie de 1 a 10 o quanto cada comportamento está presente hoje. Considere 1 como menos frequente e 10 como muito frequente.
                </p>
                {axisInfo.behaviors.map((behavior, index) => (
                  <div key={index} className="space-y-2">
                    <Label>{behavior}</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-12">1</span>
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        value={behaviorRatings[index] || 5}
                        onChange={(e) => setBehaviorRatings({
                          ...behaviorRatings,
                          [index]: parseInt(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">10</span>
                      <span className="font-bold w-8 text-center">{behaviorRatings[index] || 5}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 3 && axisInfo && (
              <div className="space-y-6">
                <p className="text-muted-foreground mb-4">
                  Responda às perguntas reflexivas para aprofundar seu autoconhecimento e definir melhor seu foco de desenvolvimento:
                </p>
                {axisInfo.reflectiveQuestions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <Label>{index + 1}. {question}</Label>
                    <Textarea
                      value={reflectiveAnswers[index] || ''}
                      onChange={(e) => setReflectiveAnswers({
                        ...reflectiveAnswers,
                        [index]: e.target.value
                      })}
                      placeholder="Digite sua resposta..."
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={!canProceed() || loading}
            >
              {loading ? 'Criando...' : 'Criar PDI'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
