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
import { ArrowLeft, Plus, TrendingUp, FileText, Calendar, BarChart, Trash2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { EditProfileDialog } from '@/components/EditProfileDialog';

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
  const [selectedName, setSelectedName] = useState<string>('all');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
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

  // Extract unique names and years
  const uniqueNames = useMemo(() => {
    const names = profiles
      .map(p => p.analysis_result?.employee_name)
      .filter((name): name is string => !!name);
    return Array.from(new Set(names));
  }, [profiles]);

  const uniqueYears = useMemo(() => {
    const years = profiles.map(p => p.year);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }, [profiles]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const nameMatch = selectedName === 'all' || profile.analysis_result?.employee_name === selectedName;
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
          employee_name: formData.employee_name,
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
                            {profile.analysis_result?.employee_name || 'Colaborador'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {profile.analysis_result && (
                            <EditProfileDialog
                              profileId={profile.id}
                              currentData={{
                                r: profile.analysis_result.r || 0,
                                e: profile.analysis_result.e || 0,
                                p: profile.analysis_result.p || 0,
                                n: profile.analysis_result.n || 0,
                                a: profile.analysis_result.a || 0,
                                tomada_decisoes: profile.analysis_result.tomada_decisoes || 0,
                                intensidade_perfil: profile.analysis_result.intensidade_perfil || 0,
                                energia: profile.analysis_result.energia || 0,
                                equilibrio_energia: profile.analysis_result.equilibrio_energia || 0,
                                modificacao_perfil: profile.analysis_result.modificacao_perfil || 0,
                              }}
                              onSuccess={fetchProfiles}
                            />
                          )}
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
                      {profile.analysis_result && (
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
                                      const value = profile.analysis_result?.[dim] || 0;
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
                                const value = profile.analysis_result?.[key];
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
                            <div className="bg-primary rounded-lg overflow-hidden">
                              <div className="grid grid-cols-6 text-center text-white font-bold">
                                <div className="py-4 px-2 border-r border-primary-foreground/20">
                                  Perfil
                                </div>
                                {['R', 'E', 'P', 'N', 'A'].map((letter, idx) => (
                                  <div
                                    key={letter}
                                    className={`py-4 px-2 ${idx < 4 ? 'border-r border-primary-foreground/20' : ''}`}
                                  >
                                    {letter}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-6 text-center bg-primary/90 text-white font-semibold text-lg">
                                <div className="py-3 px-2 border-r border-primary-foreground/20">
                                  {profile.year}
                                </div>
                                {['r', 'e', 'p', 'n', 'a'].map((key, idx) => (
                                  <div
                                    key={key}
                                    className={`py-3 px-2 ${idx < 4 ? 'border-r border-primary-foreground/20' : ''}`}
                                  >
                                    {profile.analysis_result?.[key] || 0}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {profile.analysis_result?.notes && (
                            <div className="pt-4 border-t border-border">
                              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Observações</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {profile.analysis_result.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
