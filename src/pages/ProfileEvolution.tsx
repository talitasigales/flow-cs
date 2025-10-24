import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, TrendingUp, FileText, Calendar, BarChart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileEvolution {
  id: string;
  year: number;
  file_url: string | null;
  analysis_result: any;
  created_at: string;
}

export default function ProfileEvolution() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    year: new Date().getFullYear(),
    r: 50,
    e: 50,
    p: 50,
    n: 50,
    a: 50,
    tomada_decisoes: 50,
    intensidade_perfil: 50,
    energia: 50,
    equilibrio_energia: 50,
    modificacao_perfil: 50,
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_evolution')
        .select('*')
        .eq('user_id', user?.id)
        .order('year', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.employee_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.year) {
      toast.error('Ano é obrigatório');
      return;
    }

    // Check if year already exists
    const existingProfile = profiles.find((p) => p.year === formData.year);
    if (existingProfile) {
      toast.error('Já existe um perfil para este ano');
      return;
    }

    try {
      const { error } = await supabase.from('profile_evolution').insert({
        user_id: user?.id,
        employee_name: formData.employee_name,
        year: formData.year,
        analysis_result: {
          r: formData.r,
          e: formData.e,
          p: formData.p,
          n: formData.n,
          a: formData.a,
          tomada_decisoes: formData.tomada_decisoes,
          intensidade_perfil: formData.intensidade_perfil,
          energia: formData.energia,
          equilibrio_energia: formData.equilibrio_energia,
          modificacao_perfil: formData.modificacao_perfil,
          notes: formData.notes,
        },
      });

      if (error) throw error;
      toast.success('Perfil adicionado com sucesso');
      setDialogOpen(false);
      resetForm();
      fetchProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_evolution')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Perfil removido com sucesso');
      fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Erro ao remover perfil');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_name: '',
      year: new Date().getFullYear(),
      r: 50,
      e: 50,
      p: 50,
      n: 50,
      a: 50,
      tomada_decisoes: 50,
      intensidade_perfil: 50,
      energia: 50,
      equilibrio_energia: 50,
      modificacao_perfil: 50,
      notes: '',
    });
  };

  const getProfileColor = (dimension: string) => {
    switch (dimension) {
      case 'r':
        return 'bg-orange-500';
      case 'e':
        return 'bg-yellow-500';
      case 'p':
        return 'bg-blue-500';
      case 'n':
        return 'bg-green-500';
      case 'a':
        return 'bg-purple-500';
      case 'tomada_decisoes':
        return 'bg-cyan-500';
      case 'intensidade_perfil':
        return 'bg-pink-500';
      case 'energia':
        return 'bg-red-500';
      case 'equilibrio_energia':
        return 'bg-indigo-500';
      case 'modificacao_perfil':
        return 'bg-teal-500';
      default:
        return 'bg-primary';
    }
  };

  const getDimensionLabel = (dimension: string) => {
    switch (dimension) {
      case 'r':
        return 'R (Risco)';
      case 'e':
        return 'E (Extroversão)';
      case 'p':
        return 'P (Paciência)';
      case 'n':
        return 'N (Normas)';
      case 'a':
        return 'A (Autocontrole)';
      case 'tomada_decisoes':
        return 'Tomada de Decisões';
      case 'intensidade_perfil':
        return 'Intensidade do Perfil';
      case 'energia':
        return 'Energia';
      case 'equilibrio_energia':
        return 'Equilíbrio de Energia';
      case 'modificacao_perfil':
        return 'Modificação do Perfil';
      default:
        return dimension;
    }
  };

  const calculateAverage = (dimension: keyof typeof formData) => {
    if (profiles.length === 0) return 0;
    const values = profiles
      .map((p) => p.analysis_result?.[dimension as keyof typeof p.analysis_result] as number)
      .filter((v) => v !== undefined);
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold gradient-text">
                Evolução de Perfil PDA
              </h1>
            </div>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar novo relatório PDA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Perfil Anual</DialogTitle>
                  <DialogDescription>
                    Registre os scores do seu perfil PDA para comparação ao longo dos anos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_name">Nome do Colaborador</Label>
                    <Input
                      id="employee_name"
                      type="text"
                      value={formData.employee_name}
                      onChange={(e) =>
                        setFormData({ ...formData, employee_name: e.target.value })
                      }
                      placeholder="Ex: João Silva"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: parseInt(e.target.value) })
                      }
                      min="2000"
                      max="2100"
                    />
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="r">R (Risco) (0-100)</Label>
                      <Input
                        id="r"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.r}
                        onChange={(e) =>
                          setFormData({ ...formData, r: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="e">E (Extroversão) (0-100)</Label>
                      <Input
                        id="e"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.e}
                        onChange={(e) =>
                          setFormData({ ...formData, e: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="p">P (Paciência) (0-100)</Label>
                      <Input
                        id="p"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.p}
                        onChange={(e) =>
                          setFormData({ ...formData, p: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="n">N (Normas) (0-100)</Label>
                      <Input
                        id="n"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.n}
                        onChange={(e) =>
                          setFormData({ ...formData, n: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="a">A (Autocontrole) (0-100)</Label>
                      <Input
                        id="a"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.a}
                        onChange={(e) =>
                          setFormData({ ...formData, a: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="font-semibold mb-3 text-sm">Métricas Adicionais</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tomada_decisoes">
                          Tomada de Decisões (0-100)
                        </Label>
                        <Input
                          id="tomada_decisoes"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.tomada_decisoes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tomada_decisoes: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 mt-3">
                        <Label htmlFor="intensidade_perfil">
                          Intensidade do Perfil (0-100)
                        </Label>
                        <Input
                          id="intensidade_perfil"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.intensidade_perfil}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              intensidade_perfil: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 mt-3">
                        <Label htmlFor="energia">Energia (0-100)</Label>
                        <Input
                          id="energia"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.energia}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              energia: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 mt-3">
                        <Label htmlFor="equilibrio_energia">
                          Equilíbrio de Energia (0-100)
                        </Label>
                        <Input
                          id="equilibrio_energia"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.equilibrio_energia}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              equilibrio_energia: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 mt-3">
                        <Label htmlFor="modificacao_perfil">
                          Modificação do Perfil (0-100)
                        </Label>
                        <Input
                          id="modificacao_perfil"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.modificacao_perfil}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              modificacao_perfil: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Adicione notas sobre este período..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {profiles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum perfil registrado
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Comece adicionando seu perfil PDA para acompanhar sua evolução ao longo dos anos
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Perfil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="timeline" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="timeline">
                <Calendar className="mr-2 h-4 w-4" />
                Linha do Tempo
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <BarChart className="mr-2 h-4 w-4" />
                Comparação
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <TrendingUp className="mr-2 h-4 w-4" />
                Análise
              </TabsTrigger>
            </TabsList>

            {/* Timeline View */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="grid gap-4">
                {profiles.map((profile) => {
                  const getInterpretation = (key: string, value: number) => {
                    const interpretations: Record<string, Record<string, string>> = {
                      r: {
                        low: 'Perfil mais cauteloso e analítico nas decisões',
                        medium: 'Equilibra análise e ousadia nas decisões',
                        high: 'Perfil mais ousado e disposto a assumir riscos'
                      },
                      e: {
                        low: 'Preferência por trabalho mais reservado e individual',
                        medium: 'Equilíbrio entre interações sociais e trabalho individual',
                        high: 'Perfil comunicativo e voltado para relacionamentos'
                      },
                      p: {
                        low: 'Ritmo mais acelerado e dinâmico de trabalho',
                        medium: 'Equilibra ritmo e constância nas atividades',
                        high: 'Perfil paciente, constante e metódico'
                      },
                      n: {
                        low: 'Maior flexibilidade e adaptabilidade às mudanças',
                        medium: 'Equilíbrio entre seguir processos e flexibilidade',
                        high: 'Valoriza estrutura, normas e procedimentos'
                      },
                      a: {
                        low: 'Expressão mais espontânea e direta das emoções',
                        medium: 'Equilíbrio entre expressão e controle emocional',
                        high: 'Alto controle e gestão das reações emocionais'
                      },
                      tomada_decisoes: {
                        low: 'Decisões mais reflexivas e consultivas',
                        medium: 'Equilíbrio entre reflexão e ação nas decisões',
                        high: 'Decisões mais rápidas e assertivas'
                      },
                      intensidade_perfil: {
                        low: 'Perfil mais flexível e adaptável',
                        medium: 'Intensidade moderada nas características',
                        high: 'Características fortemente marcadas no comportamento'
                      },
                      energia: {
                        low: 'Energia mais contida e reservada',
                        medium: 'Nível equilibrado de energia',
                        high: 'Alta energia e dinamismo no comportamento'
                      },
                      equilibrio_energia: {
                        low: 'Energia concentrada em áreas específicas',
                        medium: 'Distribuição moderada de energia',
                        high: 'Energia bem distribuída entre diferentes áreas'
                      },
                      modificacao_perfil: {
                        low: 'Comportamento mais natural e espontâneo',
                        medium: 'Adaptação moderada ao contexto',
                        high: 'Alta adaptação do comportamento ao ambiente'
                      }
                    };

                    const level = value <= 33 ? 'low' : value <= 66 ? 'medium' : 'high';
                    return interpretations[key]?.[level] || '';
                  };

                  return (
                    <Card key={profile.id} className="gradient-card border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Ano {profile.year}
                            </CardTitle>
                            <CardDescription>
                              Registrado em{' '}
                              {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(profile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {profile.analysis_result && (
                          <>
                            {/* Perfil REPNA */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                Perfil Comportamental PDA
                              </h4>
                              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                                {['r', 'e', 'p', 'n', 'a'].map((key) => {
                                  const value = profile.analysis_result?.[key];
                                  if (typeof value !== 'number') return null;
                                  return (
                                    <div key={key} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">
                                          {getDimensionLabel(key)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {value}/100
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground italic">
                                        {getInterpretation(key, value)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Análise Complementar */}
                            <div className="space-y-4 pt-4 border-t border-border">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Análise Complementar
                              </h4>
                              <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                                {['tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((key) => {
                                  const value = profile.analysis_result?.[key];
                                  if (typeof value !== 'number') return null;
                                  return (
                                    <div key={key} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">
                                          {getDimensionLabel(key)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {value}/100
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground italic">
                                        {getInterpretation(key, value)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                        
                        {profile.analysis_result?.notes && (
                          <div className="pt-4 border-t border-border">
                            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              Observações
                            </h4>
                            <p className="text-sm text-muted-foreground pl-6">
                              {profile.analysis_result.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Comparison View */}
            <TabsContent value="comparison" className="space-y-4">
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Comparação Entre Anos</CardTitle>
                  <CardDescription>
                    Visualize a evolução dos seus scores PDA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {['r', 'e', 'p', 'n', 'a', 'tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map(
                      (dimension) => (
                        <div key={dimension} className="space-y-3">
                          <h4 className="font-semibold text-sm">
                            {getDimensionLabel(dimension)}
                          </h4>
                          <div className="space-y-2">
                            {profiles.map((profile) => {
                              const value =
                                profile.analysis_result?.[
                                  dimension as keyof typeof profile.analysis_result
                                ] as number;
                              if (!value) return null;
                              return (
                                <div
                                  key={profile.id}
                                  className="flex items-center gap-4"
                                >
                                  <span className="text-sm font-medium w-16">
                                    {profile.year}
                                  </span>
                                  <div className="flex-1">
                                    <Progress
                                      value={value}
                                      className={`h-6 ${getProfileColor(dimension)}`}
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground w-12 text-right">
                                    {value}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis View */}
            <TabsContent value="analysis" className="space-y-4">
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Análise de Evolução do Perfil PDA</CardTitle>
                  <CardDescription>
                    Interpretação técnica das mudanças comportamentais ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Análise Descritiva */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Interpretação Técnica da Evolução
                    </h4>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Trajetória de Desenvolvimento:</strong> A análise longitudinal do perfil comportamental revela padrões significativos de adaptação e crescimento profissional. As variações observadas nos eixos REPNA indicam processos de maturação comportamental e ajustes estratégicos às demandas do ambiente organizacional.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Eixo de Risco (R):</strong> Flutuações neste eixo sugerem evolução na capacidade de gestão de incertezas e tomada de decisão sob pressão. Incrementos indicam maior propensão à inovação e desafios, enquanto reduções podem sinalizar amadurecimento na avaliação criteriosa de cenários.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Eixo de Extroversão (E):</strong> Mudanças temporais refletem ajustes na estratégia relacional e comunicacional. Elevações apontam expansão da rede de influência e liderança, ao passo que reduções podem indicar refinamento na seletividade das interações.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Eixo de Paciência (P):</strong> A dinâmica deste eixo evidencia transformações no ritmo de trabalho e gestão do tempo. Aumentos correlacionam-se com desenvolvimento de resiliência e planejamento de longo prazo, enquanto quedas podem refletir adaptação a ambientes mais dinâmicos.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Eixo de Normas (N):</strong> Variações demonstram reconfiguração na relação com estruturas e processos. Incrementos sugerem valorização crescente de metodologias estruturadas, ao passo que reduções indicam maior flexibilidade e adaptabilidade contextual.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Eixo de Autocontrole (A):</strong> Alterações neste domínio revelam evolução na gestão emocional e autorregulação. Elevações apontam sofisticação na diplomacia e controle de impulsos, enquanto reduções podem indicar autenticidade e espontaneidade calibradas.
                      </p>
                      <p className="leading-relaxed">
                        <strong className="text-foreground">Indicadores Complementares:</strong> As métricas de Tomada de Decisões, Intensidade do Perfil, Energia, Equilíbrio de Energia e Modificação do Perfil fornecem insights sobre a consistência comportamental, capacidade adaptativa e o grau de ajuste consciente do comportamento às demandas situacionais.
                      </p>
                    </div>
                  </div>

                  {/* Tabela Comparativa */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Tabela Comparativa de Indicadores
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-semibold">Indicador</th>
                            {profiles.map((profile) => (
                              <th key={profile.id} className="text-center py-3 px-4 font-semibold">
                                {profile.year}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['r', 'e', 'p', 'n', 'a', 'tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dimension, idx) => (
                            <tr key={dimension} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                              <td className="py-3 px-4 font-medium">
                                {getDimensionLabel(dimension)}
                              </td>
                              {profiles.map((profile) => {
                                const value = profile.analysis_result?.[dimension];
                                return (
                                  <td key={profile.id} className="text-center py-3 px-4">
                                    {typeof value === 'number' ? (
                                      <span className="inline-flex items-center justify-center w-12 h-8 rounded bg-primary/10 text-foreground font-semibold">
                                        {value}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Estatísticas Resumidas */}
                  <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-border">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-medium">Anos Registrados</span>
                      </div>
                      <span className="text-2xl font-bold">{profiles.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-success" />
                        <span className="font-medium">Período</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {profiles[0]?.year} - {profiles[profiles.length - 1]?.year}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
