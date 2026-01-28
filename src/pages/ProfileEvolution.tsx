import { useEffect, useState, useMemo } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, TrendingUp, FileText, Calendar, BarChart, Trash2, Filter, X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { AIAnalysis } from '@/components/AIAnalysis';

interface ProfileEvolutionAnalysis {
  employee_name: string;
  r: number;
  e: number;
  p: number;
  n: number;
  a: number;
  tomada_decisoes: number;
  intensidade_perfil: number;
  energia: number;
  equilibrio_energia: number;
  modificacao_perfil: number;
  notes: string | null;
}

interface ProfileEvolution {
  id: string;
  employee_name: string;
  assessment_date: string;
  r_value: number | null;
  e_value: number | null;
  p_value: number | null;
  n_value: number | null;
  a_value: number | null;
  decision_making: number | null;
  profile_intensity: number | null;
  energy: number | null;
  energy_balance: number | null;
  notes: string | null;
  created_at: string;
  // Computed for frontend use
  year: number;
  // Computed analysis_result for backward compatibility
  analysis_result: ProfileEvolutionAnalysis;
}

export default function ProfileEvolution() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedYearA, setSelectedYearA] = useState<number | null>(null);
  const [selectedYearB, setSelectedYearB] = useState<number | null>(null);
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

  // Helper to get profile values
  const getProfileValue = (profile: ProfileEvolution, key: string): number => {
    const mappings: Record<string, keyof ProfileEvolution> = {
      r: 'r_value',
      e: 'e_value',
      p: 'p_value',
      n: 'n_value',
      a: 'a_value',
      tomada_decisoes: 'decision_making',
      intensidade_perfil: 'profile_intensity',
      energia: 'energy',
      equilibrio_energia: 'energy_balance',
    };
    const dbKey = mappings[key] || key;
    return (profile[dbKey as keyof ProfileEvolution] as number) || 0;
  };

  // Extract unique names and years
  const uniqueNames = useMemo(() => {
    const names = profiles
      .map(p => p.employee_name)
      .filter((name): name is string => !!name && name.trim() !== '');
    return Array.from(new Set(names));
  }, [profiles]);

  const uniqueYears = useMemo(() => {
    const years = profiles.map(p => p.year);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [profiles]);

  // Set default comparison years (two most recent)
  useEffect(() => {
    if (uniqueYears.length >= 2 && !selectedYearA && !selectedYearB) {
      setSelectedYearA(uniqueYears[uniqueYears.length - 2]);
      setSelectedYearB(uniqueYears[uniqueYears.length - 1]);
    } else if (uniqueYears.length === 1 && !selectedYearA) {
      setSelectedYearA(uniqueYears[0]);
    }
  }, [uniqueYears, selectedYearA, selectedYearB]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const profileName = profile.employee_name;
      const nameMatch = selectedName === 'all' || profileName === selectedName;
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(profile.year);
      return nameMatch && yearMatch;
    });
  }, [profiles, selectedName, selectedYears]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const clearFilters = () => {
    setSelectedName('all');
    setSelectedYears([]);
  };

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
        .order('assessment_date', { ascending: true });

      if (error) throw error;
      
      // Map database data to frontend format with computed year and analysis_result
      const mappedData: ProfileEvolution[] = (data || []).map(item => {
        const year = new Date(item.assessment_date).getFullYear();
        return {
          id: item.id,
          employee_name: item.employee_name,
          assessment_date: item.assessment_date,
          r_value: item.r_value,
          e_value: item.e_value,
          p_value: item.p_value,
          n_value: item.n_value,
          a_value: item.a_value,
          decision_making: item.decision_making,
          profile_intensity: item.profile_intensity,
          energy: item.energy,
          energy_balance: item.energy_balance,
          notes: item.notes,
          created_at: item.created_at,
          year,
          // Computed analysis_result for backward compatibility with UI
          analysis_result: {
            employee_name: item.employee_name,
            r: item.r_value || 0,
            e: item.e_value || 0,
            p: item.p_value || 0,
            n: item.n_value || 0,
            a: item.a_value || 0,
            tomada_decisoes: item.decision_making || 0,
            intensidade_perfil: item.profile_intensity || 0,
            energia: item.energy || 0,
            equilibrio_energia: item.energy_balance || 0,
            modificacao_perfil: 0, // Not in new schema
            notes: item.notes,
          },
        };
      });
      
      setProfiles(mappedData);
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
        assessment_date: `${formData.year}-01-01`,
        r_value: formData.r,
        e_value: formData.e,
        p_value: formData.p,
        n_value: formData.n,
        a_value: formData.a,
        decision_making: formData.tomada_decisoes,
        profile_intensity: formData.intensidade_perfil,
        energy: formData.energia,
        energy_balance: formData.equilibrio_energia,
        notes: formData.notes,
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
      const { error } = await (supabase as any)
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
        return 'bg-purple-600';
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

  const getProfileColorHex = (dimension: string) => {
    switch (dimension) {
      case 'r':
        return '#f97316'; // orange-500
      case 'e':
        return '#eab308'; // yellow-500
      case 'p':
        return '#3b82f6'; // blue-500
      case 'n':
        return '#22c55e'; // green-500
      case 'a':
        return '#9333ea'; // purple-600
      default:
        return '#3b82f6';
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
      .map((p) => getProfileValue(p, dimension as string))
      .filter((v) => v !== undefined && v !== null);
    return values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0;
  };

  // Helper function to calculate delta
  const calculateDelta = (yearA: number | null, yearB: number | null, dimension: string) => {
    if (!yearA || !yearB) return { value: 0, percentage: 0, trend: 'neutral' as const };
    
    const profileA = profiles.find(p => p.year === yearA);
    const profileB = profiles.find(p => p.year === yearB);
    
    if (!profileA || !profileB) return { value: 0, percentage: 0, trend: 'neutral' as const };
    
    const valueA = getProfileValue(profileA, dimension);
    const valueB = getProfileValue(profileB, dimension);
    const diff = valueB - valueA;
    const percentage = valueA !== 0 ? Math.round((diff / valueA) * 100) : 0;
    
    return {
      value: diff,
      percentage,
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
    };
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!selectedYearA && !selectedYearB) return [];
    
    const dimensions = ['r', 'e', 'p', 'n', 'a'];
    
    return dimensions.map(dim => {
      const profileA = profiles.find(p => p.year === selectedYearA);
      const profileB = profiles.find(p => p.year === selectedYearB);
      
      return {
        dimension: getDimensionLabel(dim),
        [selectedYearA || 'A']: profileA ? getProfileValue(profileA, dim) : 0,
        [selectedYearB || 'B']: profileB ? getProfileValue(profileB, dim) : 0,
      };
    });
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
                      <h4 className="font-semibold mb-3 text-sm">Análise Complementar</h4>
                      
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="tomada_decisoes">Tomada de Decisões</Label>
                            <span className="text-sm font-medium">{formData.tomada_decisoes}%</span>
                          </div>
                          <Slider
                            id="tomada_decisoes"
                            min={0}
                            max={100}
                            step={1}
                            value={[formData.tomada_decisoes]}
                            onValueChange={(value) =>
                              setFormData({ ...formData, tomada_decisoes: value[0] })
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="intensidade_perfil">Intensidade do Perfil</Label>
                            <span className="text-sm font-medium">{formData.intensidade_perfil}%</span>
                          </div>
                          <Slider
                            id="intensidade_perfil"
                            min={0}
                            max={100}
                            step={1}
                            value={[formData.intensidade_perfil]}
                            onValueChange={(value) =>
                              setFormData({ ...formData, intensidade_perfil: value[0] })
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="energia">Energia</Label>
                            <span className="text-sm font-medium">{formData.energia}%</span>
                          </div>
                          <Slider
                            id="energia"
                            min={0}
                            max={100}
                            step={1}
                            value={[formData.energia]}
                            onValueChange={(value) =>
                              setFormData({ ...formData, energia: value[0] })
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="equilibrio_energia">Equilíbrio de Energia</Label>
                            <span className="text-sm font-medium">{formData.equilibrio_energia}%</span>
                          </div>
                          <Slider
                            id="equilibrio_energia"
                            min={0}
                            max={100}
                            step={1}
                            value={[formData.equilibrio_energia]}
                            onValueChange={(value) =>
                              setFormData({ ...formData, equilibrio_energia: value[0] })
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="modificacao_perfil">Modificação do Perfil</Label>
                            <span className="text-sm font-medium">{formData.modificacao_perfil}%</span>
                          </div>
                          <Slider
                            id="modificacao_perfil"
                            min={0}
                            max={100}
                            step={1}
                            value={[formData.modificacao_perfil]}
                            onValueChange={(value) =>
                              setFormData({ ...formData, modificacao_perfil: value[0] })
                            }
                            className="w-full"
                          />
                        </div>
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

            {/* Timeline View - Comparative Side by Side */}
            <TabsContent value="timeline" className="space-y-6">
              {profiles.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum perfil cadastrado</h3>
                    <p className="text-muted-foreground mb-6">
                      Adicione seu primeiro perfil REPNA para começar a comparação e análise
                    </p>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Perfil
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Filters Section */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" />
                        Filtros de Comparação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Name Filter */}
                        <div className="space-y-2">
                          <Label>Colaborador</Label>
                          <Select value={selectedName} onValueChange={setSelectedName}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um colaborador" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os colaboradores</SelectItem>
                              {uniqueNames.map(name => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Years Filter */}
                        <div className="space-y-2">
                          <Label>Anos para Comparar</Label>
                          <div className="flex flex-wrap gap-2">
                            {uniqueYears.map(year => (
                              <Badge
                                key={year}
                                variant={selectedYears.includes(year) ? "default" : "outline"}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => toggleYear(year)}
                              >
                                {year}
                                {selectedYears.includes(year) && (
                                  <X className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            ))}
                            {uniqueYears.length === 0 && (
                              <span className="text-sm text-muted-foreground">Nenhum ano disponível</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(selectedName !== 'all' || selectedYears.length > 0) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Limpar Filtros
                        </Button>
                      )}

                      {/* Results count */}
                      <div className="text-sm text-muted-foreground">
                        Exibindo {filteredProfiles.length} de {profiles.length} perfis
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profiles Grid */}
                  {filteredProfiles.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Filter className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhum perfil encontrado</h3>
                        <p className="text-muted-foreground mb-6">
                          Ajuste os filtros ou adicione novos perfis
                        </p>
                        <Button onClick={clearFilters} variant="outline" className="gap-2">
                          <X className="h-4 w-4" />
                          Limpar Filtros
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                      {filteredProfiles.map((profile) => (
                        <Card key={profile.id} className="gradient-card border-border/50 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Calendar className="h-5 w-5" />
                            {profile.year}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {profile.employee_name || 'Colaborador'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <EditProfileDialog
                            profileId={profile.id}
                            currentData={{
                              r: getProfileValue(profile, 'r'),
                              e: getProfileValue(profile, 'e'),
                              p: getProfileValue(profile, 'p'),
                              n: getProfileValue(profile, 'n'),
                              a: getProfileValue(profile, 'a'),
                              tomada_decisoes: getProfileValue(profile, 'tomada_decisoes'),
                              intensidade_perfil: getProfileValue(profile, 'intensidade_perfil'),
                              energia: getProfileValue(profile, 'energia'),
                              equilibrio_energia: getProfileValue(profile, 'equilibrio_energia'),
                              modificacao_perfil: 0,
                            }}
                            onSuccess={fetchProfiles}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(profile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                          {/* REPNA Grid + Energy Bar */}
                          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
                            {/* REPNA Grid Chart */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                Perfil Comportamental REPNA
                              </h4>
                              <div className="bg-muted/20 rounded-lg p-6">
                                <svg width="100%" height="400" viewBox="0 0 500 400" className="overflow-visible">
                                  {/* Grid background with rounded corners */}
                                  <defs>
                                    <clipPath id="roundedGrid">
                                      <rect x="50" y="20" width="400" height="320" rx="20" />
                                    </clipPath>
                                  </defs>
                                  
                                  <rect 
                                    x="50" 
                                    y="20" 
                                    width="400" 
                                    height="320" 
                                    fill="hsl(var(--muted))" 
                                    opacity="0.3"
                                    rx="20"
                                  />
                                  
                                  {/* Horizontal grid lines and Y-axis labels */}
                                  {[0, 25, 50, 75, 100].map((value) => {
                                    const y = 340 - (value * 3.2);
                                    return (
                                      <g key={value}>
                                        <line
                                          x1="50"
                                          y1={y}
                                          x2="450"
                                          y2={y}
                                          stroke="hsl(var(--muted-foreground))"
                                          strokeOpacity="0.2"
                                          strokeDasharray="4,4"
                                          clipPath="url(#roundedGrid)"
                                        />
                                        <text
                                          x="35"
                                          y={y}
                                          textAnchor="end"
                                          dominantBaseline="middle"
                                          fill="hsl(var(--muted-foreground))"
                                          fontSize="12"
                                          fontWeight="500"
                                        >
                                          {value}
                                        </text>
                                      </g>
                                    );
                                  })}
                                  
                                  {/* REPNA data points and connecting lines */}
                                  {(() => {
                                    const dimensions = ['r', 'e', 'p', 'n', 'a'];
                                    const points = dimensions.map((dim, index) => {
                                      const value = (profile.analysis_result as any)?.[dim] || 0;
                                      const x = 50 + (index * 100) + 50;
                                      const y = 340 - (value * 3.2);
                                      return { x, y, value, dim, color: getProfileColorHex(dim) };
                                    });
                                    
                                    return (
                                      <>
                                        {/* Vertical colored bars for each dimension */}
                                        {points.map((point, index) => (
                                          <rect
                                            key={`bar-${index}`}
                                            x={point.x - 15}
                                            y={point.y}
                                            width="30"
                                            height={340 - point.y}
                                            fill={point.color}
                                            opacity="0.15"
                                            rx="4"
                                          />
                                        ))}
                                        
                                        {/* Connecting lines */}
                                        {points.map((point, index) => {
                                          if (index === points.length - 1) return null;
                                          const nextPoint = points[index + 1];
                                          return (
                                            <line
                                              key={`line-${index}`}
                                              x1={point.x}
                                              y1={point.y}
                                              x2={nextPoint.x}
                                              y2={nextPoint.y}
                                              stroke="hsl(var(--primary))"
                                              strokeWidth="3"
                                            />
                                          );
                                        })}
                                        
                                        {/* Data points (circles) */}
                                        {points.map((point, index) => (
                                          <g key={`point-${index}`}>
                                            <circle
                                              cx={point.x}
                                              cy={point.y}
                                              r="18"
                                              fill={point.color}
                                              stroke="white"
                                              strokeWidth="3"
                                            />
                                            <text
                                              x={point.x}
                                              y={point.y}
                                              textAnchor="middle"
                                              dominantBaseline="central"
                                              fill="white"
                                              fontSize="16"
                                              fontWeight="bold"
                                            >
                                              {point.dim.toUpperCase()}
                                            </text>
                                          </g>
                                        ))}
                                      </>
                                    );
                                  })()}
                                  
                                  {/* Bottom labels */}
                                  {['R', 'E', 'P', 'N', 'A'].map((letter, index) => (
                                    <text
                                      key={letter}
                                      x={50 + (index * 100) + 50}
                                      y="370"
                                      textAnchor="middle"
                                      fill="hsl(var(--foreground))"
                                      fontSize="20"
                                      fontWeight="bold"
                                    >
                                      {letter}
                                    </text>
                                  ))}
                                </svg>
                              </div>
                            </div>

                            {/* Energy Bar */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Energia (NE)
                              </h4>
                              <div className="bg-muted/20 rounded-lg p-6 flex flex-col items-center justify-center h-[400px]">
                                <div className="flex flex-col items-center gap-2 h-full w-full max-w-[120px]">
                                  <div className="text-2xl font-bold text-green-500">+</div>
                                  <div className="flex-1 w-full relative bg-muted rounded-lg overflow-hidden flex flex-col justify-end">
                                    <div
                                      className="w-full bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 rounded-lg"
                                      style={{
                                        height: `${profile.analysis_result?.energia || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-2xl font-bold text-red-500">-</div>
                                </div>
                                <div className="text-3xl font-bold text-primary mt-4">
                                  {profile.analysis_result?.energia || 0}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Indicadores Horizontais */}
                          <div className="space-y-4 pt-4 border-t border-border">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Indicadores
                            </h4>
                            <div className="grid gap-3">
                              {['tomada_decisoes', 'intensidade_perfil', 'equilibrio_energia', 'modificacao_perfil'].map((key) => {
                                const value = profile.analysis_result?.[key as keyof ProfileEvolutionAnalysis];
                                if (typeof value !== 'number') return null;
                                return (
                                  <div key={key} className="flex items-center gap-4">
                                    <span className="font-medium text-sm min-w-[180px]">
                                      {getDimensionLabel(key)}
                                    </span>
                                    <div className="flex-1 relative h-8 bg-muted rounded-lg overflow-hidden">
                                      <div
                                        className="absolute left-0 top-0 h-full bg-primary transition-all rounded-lg"
                                        style={{ width: `${value}%` }}
                                      />
                                    </div>
                                    <span className="text-lg font-bold text-primary min-w-[50px] text-right">
                                      {value}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Tabela de Resumo */}
                          <div className="pt-4 border-t border-border">
                            <div className="rounded-lg overflow-hidden shadow-lg">
                              <div className="grid grid-cols-6 text-center text-white font-bold">
                                <div className="py-4 px-2 bg-primary">
                                  Perfil
                                </div>
                                {[
                                  { letter: 'R', color: '#f97316' },
                                  { letter: 'E', color: '#eab308' },
                                  { letter: 'P', color: '#3b82f6' },
                                  { letter: 'N', color: '#22c55e' },
                                  { letter: 'A', color: '#9333ea' }
                                ].map(({ letter, color }) => (
                                  <div
                                    key={letter}
                                    className="py-4 px-2"
                                    style={{ backgroundColor: color }}
                                  >
                                    {letter}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-6 text-center text-white font-semibold text-lg">
                                <div className="py-3 px-2 bg-primary/90">
                                  {profile.year}
                                </div>
                                {[
                                  { key: 'r', color: '#f97316' },
                                  { key: 'e', color: '#eab308' },
                                  { key: 'p', color: '#3b82f6' },
                                  { key: 'n', color: '#22c55e' },
                                  { key: 'a', color: '#9333ea' }
                                ].map(({ key, color }) => (
                                  <div
                                    key={key}
                                    className="py-3 px-2"
                                    style={{ backgroundColor: `${color}dd` }}
                                  >
                                    {getProfileValue(profile, key)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {profile.notes && (
                            <div className="pt-4 border-t border-border">
                              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Observações</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {profile.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

          {/* Comparison View */}
          <TabsContent value="comparison" className="space-y-4">
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Comparação Entre Anos</CardTitle>
                  <CardDescription>
                    Compare dois anos específicos e visualize as diferenças
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Year Selectors */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium">Comparar:</span>
                    <Select
                      value={selectedYearA?.toString() || ''}
                      onValueChange={(value) => setSelectedYearA(parseInt(value))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano base" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-medium">vs</span>
                    <Select
                      value={selectedYearB?.toString() || ''}
                      onValueChange={(value) => setSelectedYearB(parseInt(value))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ano comparação" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueYears.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedYearA && selectedYearB && (
                    <>
                      {/* Radar Chart */}
                      <div className="bg-muted/20 rounded-lg p-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Gráfico Comparativo REPNA
                        </h4>
                        <ResponsiveContainer width="100%" height={400}>
                          <RadarChart data={getRadarData()}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis 
                              dataKey="dimension" 
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar
                              name={selectedYearA.toString()}
                              dataKey={selectedYearA.toString()}
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                            <Radar
                              name={selectedYearB.toString()}
                              dataKey={selectedYearB.toString()}
                              stroke="#22c55e"
                              fill="#22c55e"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-primary" />
                            <span className="text-sm font-medium">{selectedYearA}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
                            <span className="text-sm font-medium">{selectedYearB}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delta Cards - REPNA */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Diferenças - Perfil REPNA
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {['r', 'e', 'p', 'n', 'a'].map((dim) => {
                            const profileA = profiles.find(p => p.year === selectedYearA);
                            const profileB = profiles.find(p => p.year === selectedYearB);
                            const valueA = profileA?.analysis_result?.[dim] || 0;
                            const valueB = profileB?.analysis_result?.[dim] || 0;
                            const delta = calculateDelta(selectedYearA, selectedYearB, dim);
                            
                            return (
                              <Card key={dim} className="p-4 border-border/50">
                                <div className="text-center space-y-2">
                                  <div className="text-2xl font-bold" style={{ color: getProfileColorHex(dim) }}>
                                    {dim.toUpperCase()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {valueA} → {valueB}
                                  </div>
                                  <div className={`flex items-center justify-center gap-1 text-sm font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                    {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </div>
                                  {delta.percentage !== 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      ({delta.percentage > 0 ? '+' : ''}{delta.percentage}%)
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delta Cards - Indicadores Complementares */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Diferenças - Indicadores Complementares
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {['tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dim) => {
                            const profileA = profiles.find(p => p.year === selectedYearA);
                            const profileB = profiles.find(p => p.year === selectedYearB);
                            const valueA = profileA?.analysis_result?.[dim] || 0;
                            const valueB = profileB?.analysis_result?.[dim] || 0;
                            const delta = calculateDelta(selectedYearA, selectedYearB, dim);
                            
                            return (
                              <Card key={dim} className="p-4 border-border/50">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium line-clamp-2">
                                    {getDimensionLabel(dim)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {valueA} → {valueB}
                                  </div>
                                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                    {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                    {delta.percentage !== 0 && (
                                      <span className="text-xs">
                                        ({delta.percentage > 0 ? '+' : ''}{delta.percentage}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Simplified Comparison Table */}
                      <div className="bg-muted/20 rounded-lg p-6">
                        <h4 className="font-semibold mb-4">Tabela Comparativa Simplificada</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-semibold">Dimensão</th>
                                <th className="text-center py-3 px-4 font-semibold">{selectedYearA}</th>
                                <th className="text-center py-3 px-4 font-semibold">{selectedYearB}</th>
                                <th className="text-center py-3 px-4 font-semibold">Variação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {['r', 'e', 'p', 'n', 'a', 'tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dimension, idx) => {
                                const profileA = profiles.find(p => p.year === selectedYearA);
                                const profileB = profiles.find(p => p.year === selectedYearB);
                                const valueA = profileA?.analysis_result?.[dimension] || 0;
                                const valueB = profileB?.analysis_result?.[dimension] || 0;
                                const delta = calculateDelta(selectedYearA, selectedYearB, dimension);
                                const isSignificant = Math.abs(delta.value) >= 10;
                                
                                return (
                                  <tr 
                                    key={dimension} 
                                    className={`${idx % 2 === 0 ? 'bg-muted/30' : ''} ${isSignificant ? 'border-l-4 border-primary' : ''}`}
                                  >
                                    <td className="py-3 px-4 font-medium">
                                      {getDimensionLabel(dimension)}
                                    </td>
                                    <td className="text-center py-3 px-4">
                                      <span className="inline-flex items-center justify-center w-12 h-8 rounded bg-primary/10 text-foreground font-semibold">
                                        {valueA}
                                      </span>
                                    </td>
                                    <td className="text-center py-3 px-4">
                                      <span className="inline-flex items-center justify-center w-12 h-8 rounded bg-primary/10 text-foreground font-semibold">
                                        {valueB}
                                      </span>
                                    </td>
                                    <td className="text-center py-3 px-4">
                                      <div className={`inline-flex items-center gap-1 font-semibold ${
                                        delta.trend === 'up' ? 'text-green-500' : 
                                        delta.trend === 'down' ? 'text-red-500' : 
                                        'text-muted-foreground'
                                      }`}>
                                        {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                        {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                        {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                        {delta.value > 0 ? '+' : ''}{delta.value}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          * Linhas destacadas indicam variações significativas (≥10 pontos)
                        </p>
                      </div>
                    </>
                  )}

                  {(!selectedYearA || !selectedYearB) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione dois anos para visualizar a comparação</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analysis View */}
            <TabsContent value="analysis" className="space-y-4">
              {/* Year Selectors */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Selecionar Anos para Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ano Base</Label>
                      <Select 
                        value={selectedYearA?.toString() || ''} 
                        onValueChange={(value) => setSelectedYearA(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano base" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ano Comparado</Label>
                      <Select 
                        value={selectedYearB?.toString() || ''} 
                        onValueChange={(value) => setSelectedYearB(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano comparado" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="gradient-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Anos Registrados</p>
                        <p className="text-3xl font-bold">{profiles.length}</p>
                      </div>
                      <Calendar className="h-10 w-10 text-primary/50" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="gradient-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Período</p>
                        <p className="text-xl font-bold">
                          {profiles[0]?.year} - {profiles[profiles.length - 1]?.year}
                        </p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-success/50" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="gradient-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Colaboradores</p>
                        <p className="text-3xl font-bold">{uniqueNames.length || 1}</p>
                      </div>
                      <FileText className="h-10 w-10 text-primary/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI-Generated Analysis Section */}
              {selectedYearA && selectedYearB && (
                <Card className="gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Análise Comportamental por IA
                    </CardTitle>
                    <CardDescription>
                      Análise profissional gerada pela Nanda usando a base de conhecimento PDA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIAnalysis 
                      profileA={profiles.find(p => p.year === selectedYearA)} 
                      profileB={profiles.find(p => p.year === selectedYearB)}
                    />
                  </CardContent>
                </Card>
              )}

              {/* REPNA Dimension Cards */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Dimensões REPNA
                  </CardTitle>
                  <CardDescription>
                    Mudanças no perfil comportamental entre {selectedYearA} e {selectedYearB}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* R - Risco */}
                    <Card className="border-orange-500/30 bg-orange-500/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">R</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Risco</CardTitle>
                            {(() => {
                              const delta = calculateDelta(selectedYearA, selectedYearB, 'r');
                              const profileA = profiles.find(p => p.year === selectedYearA);
                              const profileB = profiles.find(p => p.year === selectedYearB);
                              const valueA = profileA?.analysis_result?.r || 0;
                              const valueB = profileB?.analysis_result?.r || 0;
                              return (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">{valueA} → {valueB}</span>
                                  <span className={`flex items-center font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground">
                          Gestão de incertezas e tomada de decisão sob pressão. Incrementos indicam maior inovação.
                        </p>
                      </CardContent>
                    </Card>

                    {/* E - Extroversão */}
                    <Card className="border-yellow-500/30 bg-yellow-500/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">E</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Extroversão</CardTitle>
                            {(() => {
                              const delta = calculateDelta(selectedYearA, selectedYearB, 'e');
                              const profileA = profiles.find(p => p.year === selectedYearA);
                              const profileB = profiles.find(p => p.year === selectedYearB);
                              const valueA = profileA?.analysis_result?.e || 0;
                              const valueB = profileB?.analysis_result?.e || 0;
                              return (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">{valueA} → {valueB}</span>
                                  <span className={`flex items-center font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground">
                          Estratégia relacional e comunicacional. Elevações indicam expansão da rede de influência.
                        </p>
                      </CardContent>
                    </Card>

                    {/* P - Paciência */}
                    <Card className="border-blue-500/30 bg-blue-500/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Paciência</CardTitle>
                            {(() => {
                              const delta = calculateDelta(selectedYearA, selectedYearB, 'p');
                              const profileA = profiles.find(p => p.year === selectedYearA);
                              const profileB = profiles.find(p => p.year === selectedYearB);
                              const valueA = profileA?.analysis_result?.p || 0;
                              const valueB = profileB?.analysis_result?.p || 0;
                              return (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">{valueA} → {valueB}</span>
                                  <span className={`flex items-center font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground">
                          Ritmo de trabalho e gestão do tempo. Aumentos correlacionam-se com resiliência.
                        </p>
                      </CardContent>
                    </Card>

                    {/* N - Normas */}
                    <Card className="border-green-500/30 bg-green-500/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">N</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Normas</CardTitle>
                            {(() => {
                              const delta = calculateDelta(selectedYearA, selectedYearB, 'n');
                              const profileA = profiles.find(p => p.year === selectedYearA);
                              const profileB = profiles.find(p => p.year === selectedYearB);
                              const valueA = profileA?.analysis_result?.n || 0;
                              const valueB = profileB?.analysis_result?.n || 0;
                              return (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">{valueA} → {valueB}</span>
                                  <span className={`flex items-center font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground">
                          Relação com estruturas e processos. Incrementos sugerem valorização de metodologias.
                        </p>
                      </CardContent>
                    </Card>

                    {/* A - Autocontrole */}
                    <Card className="border-purple-600/30 bg-purple-600/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">A</span>
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">Autocontrole</CardTitle>
                            {(() => {
                              const delta = calculateDelta(selectedYearA, selectedYearB, 'a');
                              const profileA = profiles.find(p => p.year === selectedYearA);
                              const profileB = profiles.find(p => p.year === selectedYearB);
                              const valueA = profileA?.analysis_result?.a || 0;
                              const valueB = profileB?.analysis_result?.a || 0;
                              return (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">{valueA} → {valueB}</span>
                                  <span className={`flex items-center font-semibold ${
                                    delta.trend === 'up' ? 'text-green-500' : 
                                    delta.trend === 'down' ? 'text-red-500' : 
                                    'text-muted-foreground'
                                  }`}>
                                    {delta.trend === 'up' && <ArrowUp className="h-3 w-3" />}
                                    {delta.trend === 'down' && <ArrowDown className="h-3 w-3" />}
                                    {delta.trend === 'neutral' && <Minus className="h-3 w-3" />}
                                    {delta.value > 0 ? '+' : ''}{delta.value}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-sm text-muted-foreground">
                          Gestão emocional e autorregulação. Elevações apontam sofisticação na diplomacia.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Indicadores Complementares */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Indicadores Complementares
                  </CardTitle>
                  <CardDescription>
                    Mudanças nas métricas adicionais entre {selectedYearA} e {selectedYearB}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dimension) => {
                      const delta = calculateDelta(selectedYearA, selectedYearB, dimension);
                      const profileA = profiles.find(p => p.year === selectedYearA);
                      const profileB = profiles.find(p => p.year === selectedYearB);
                      const valueA = profileA?.analysis_result?.[dimension] || 0;
                      const valueB = profileB?.analysis_result?.[dimension] || 0;
                      
                      return (
                        <div key={dimension} className="space-y-3 p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{getDimensionLabel(dimension)}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{valueA} → {valueB}</span>
                              <span className={`flex items-center gap-1 text-lg font-bold ${
                                delta.trend === 'up' ? 'text-green-500' : 
                                delta.trend === 'down' ? 'text-red-500' : 
                                'text-muted-foreground'
                              }`}>
                                {delta.trend === 'up' && <ArrowUp className="h-4 w-4" />}
                                {delta.trend === 'down' && <ArrowDown className="h-4 w-4" />}
                                {delta.trend === 'neutral' && <Minus className="h-4 w-4" />}
                                {delta.value > 0 ? '+' : ''}{delta.value}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dimension === 'tomada_decisoes' && 'Capacidade de avaliar cenários e escolher estratégias adequadas'}
                            {dimension === 'intensidade_perfil' && 'Grau de expressão e consistência comportamental'}
                            {dimension === 'energia' && 'Nível de energia e disposição para atividades'}
                            {dimension === 'equilibrio_energia' && 'Distribuição balanceada de energia entre atividades'}
                            {dimension === 'modificacao_perfil' && 'Grau de ajuste consciente do comportamento às demandas situacionais'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tabela Comparativa Compacta */}
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dados Históricos
                  </CardTitle>
                  <CardDescription>
                    Visão consolidada dos indicadores por ano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold sticky left-0 bg-card">Indicador</th>
                          {profiles.map((profile) => (
                            <th key={profile.id} className="text-center py-3 px-4 font-semibold whitespace-nowrap">
                              {profile.year}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['r', 'e', 'p', 'n', 'a', 'tomada_decisoes', 'intensidade_perfil', 'energia', 'equilibrio_energia', 'modificacao_perfil'].map((dimension, idx) => (
                          <tr key={dimension} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                            <td className="py-3 px-4 font-medium sticky left-0 bg-inherit">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
