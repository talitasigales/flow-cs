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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Trash2, Edit, Info, Search, Filter, Upload, Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportMatriz9Box } from '@/utils/exportUtils';

interface MatrizEntry {
  id: string;
  employee_name: string;
  performance_score: number;
  role_fit_score: number;
  notes: string;
}

interface Category {
  name: string;
  description: string;
  performance: number;
  roleFit: number;
  color: string;
}

// Helper function to convert 0-100 score to category level (1=Baixo, 2=Médio, 3=Alto)
const getScoreLevel = (score: number): number => {
  if (score >= 0 && score <= 33) return 1;
  if (score > 33 && score <= 66) return 2;
  return 3;
};

const CATEGORIES: Category[] = [
  { name: 'Estrela', description: 'Alto desempenho e alto fit - Talentos-chave', performance: 3, roleFit: 3, color: 'bg-emerald-500/30 border-emerald-600 hover:bg-emerald-500/40' },
  { name: 'Destaque', description: 'Alto desempenho, médio fit - Considerar novas posições', performance: 3, roleFit: 2, color: 'bg-emerald-400/25 border-emerald-500 hover:bg-emerald-400/35' },
  { name: 'Especialista', description: 'Alto desempenho, baixo fit - Revisar posicionamento', performance: 3, roleFit: 1, color: 'bg-blue-500/25 border-blue-500 hover:bg-blue-500/35' },
  { name: 'Alto Potencial', description: 'Médio desempenho, alto fit - Investir em desenvolvimento', performance: 2, roleFit: 3, color: 'bg-emerald-400/25 border-emerald-400 hover:bg-emerald-400/35' },
  { name: 'Sólido', description: 'Desempenho e fit médios - Colaboradores consistentes', performance: 2, roleFit: 2, color: 'bg-blue-400/25 border-blue-400 hover:bg-blue-400/35' },
  { name: 'Confiável', description: 'Baixo desempenho, médio fit - Desenvolver ou realocar', performance: 2, roleFit: 1, color: 'bg-blue-300/25 border-blue-300 hover:bg-blue-300/35' },
  { name: 'Enigma', description: 'Baixo desempenho, alto fit - Entender barreiras', performance: 1, roleFit: 3, color: 'bg-amber-500/30 border-amber-600 hover:bg-amber-500/40' },
  { name: 'Desenvolvimento', description: 'Médio desempenho, baixo fit - Plano de desenvolvimento', performance: 1, roleFit: 2, color: 'bg-amber-400/25 border-amber-500 hover:bg-amber-400/35' },
  { name: 'Atenção', description: 'Baixo em ambos - Ação urgente necessária', performance: 1, roleFit: 1, color: 'bg-red-500/30 border-red-600 hover:bg-red-500/40' },
];

export default function Matriz9Box() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MatrizEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MatrizEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    performance_score: 50,
    role_fit_score: 50,
    notes: ''
  });

  // Get unique employee names for filter dropdown
  const employeeNames = useMemo(() => {
    const names = new Set(entries.map(e => e.employee_name));
    return Array.from(names).sort();
  }, [entries]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('matriz_9box')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      // Map database column names to frontend names
      const mappedData = (data || []).map(item => ({
        id: item.id,
        employee_name: item.employee_name,
        performance_score: item.performance,
        role_fit_score: item.potential,
        notes: item.notes || ''
      }));
      setEntries(mappedData);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Erro ao carregar dados da matriz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.employee_name.trim()) {
      toast.error('Nome do colaborador é obrigatório');
      return;
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('matriz_9box')
          .update({
            employee_name: formData.employee_name,
            performance: formData.performance_score,
            potential: formData.role_fit_score,
            notes: formData.notes
          })
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast.success('Colaborador atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('matriz_9box')
          .insert({
            user_id: user?.id,
            employee_name: formData.employee_name,
            performance: formData.performance_score,
            potential: formData.role_fit_score,
            notes: formData.notes
          });
        
        if (error) throw error;
        toast.success('Colaborador adicionado com sucesso');
      }

      setDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Erro ao salvar dados');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('matriz_9box')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Colaborador removido com sucesso');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Erro ao remover colaborador');
    }
  };

  const openEditDialog = (entry: MatrizEntry) => {
    setEditingEntry(entry);
    setFormData({
      employee_name: entry.employee_name,
      performance_score: entry.performance_score,
      role_fit_score: entry.role_fit_score,
      notes: entry.notes
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      employee_name: '',
      performance_score: 50,
      role_fit_score: 50,
      notes: ''
    });
  };

  // Filter entries by search term and selected employee
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEmployee = selectedEmployee === 'all' || entry.employee_name === selectedEmployee;
      return matchesSearch && matchesEmployee;
    });
  }, [entries, searchTerm, selectedEmployee]);

  const getEntriesForCell = (performance: number, roleFit: number) => {
    return filteredEntries.filter(e => 
      getScoreLevel(e.performance_score) === performance && 
      getScoreLevel(e.role_fit_score) === roleFit
    );
  };

  const getCategoryForScore = (performanceLevel: number, roleFitLevel: number) => {
    return CATEGORIES.find(cat => cat.performance === performanceLevel && cat.roleFit === roleFitLevel);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCountByCategory = (categoryName: string | string[]) => {
    if (Array.isArray(categoryName)) {
      return filteredEntries.filter(e => {
        const cat = getCategoryForScore(getScoreLevel(e.performance_score), getScoreLevel(e.role_fit_score));
        return cat && categoryName.includes(cat.name);
      }).length;
    }
    return filteredEntries.filter(e => {
      const cat = getCategoryForScore(getScoreLevel(e.performance_score), getScoreLevel(e.role_fit_score));
      return cat?.name === categoryName;
    }).length;
  };

  const calculateAveragePerformance = () => {
    if (filteredEntries.length === 0) return '0';
    const sum = filteredEntries.reduce((acc, e) => acc + e.performance_score, 0);
    return (sum / filteredEntries.length).toFixed(1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Arquivo CSV vazio ou inválido');
        setIsImporting(false);
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validar headers obrigatórios
      const requiredHeaders = ['nome', 'performance', 'fit'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Colunas obrigatórias faltando: ${missingHeaders.join(', ')}`);
        setIsImporting(false);
        return;
      }

      const nameIndex = headers.indexOf('nome');
      const performanceIndex = headers.indexOf('performance');
      const fitIndex = headers.indexOf('fit');
      const notesIndex = headers.indexOf('observacoes') !== -1 ? headers.indexOf('observacoes') : headers.indexOf('notas');

      // Parse data
      const dataToInsert = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        const name = values[nameIndex];
        const performance = parseFloat(values[performanceIndex]);
        const fit = parseInt(values[fitIndex]);
        const notes = notesIndex !== -1 ? values[notesIndex] : '';

        // Validações
        if (!name) {
          errors.push(`Linha ${i + 1}: Nome não pode estar vazio`);
          continue;
        }

        if (isNaN(performance) || performance < 0 || performance > 100) {
          errors.push(`Linha ${i + 1}: Performance deve ser um número entre 0 e 100`);
          continue;
        }

        if (isNaN(fit) || fit < 0 || fit > 100) {
          errors.push(`Linha ${i + 1}: Fit deve ser um número entre 0 e 100`);
          continue;
        }

        dataToInsert.push({
          user_id: user?.id,
          employee_name: name,
          performance: performance,
          potential: fit,
          notes: notes || ''
        });
      }

      // Mostrar erros se houver
      if (errors.length > 0) {
        toast.error(`${errors.length} erro(s) encontrado(s). Verifique o console para detalhes.`);
        console.error('Erros de importação:', errors);
      }

      // Inserir dados válidos
      if (dataToInsert.length > 0) {
        const { error } = await supabase
          .from('matriz_9box')
          .insert(dataToInsert);

        if (error) throw error;

        toast.success(`${dataToInsert.length} colaborador(es) importado(s) com sucesso!`);
        setImportDialogOpen(false);
        fetchEntries();
      } else {
        toast.error('Nenhum dado válido para importar');
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Erro ao importar arquivo CSV');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'nome,performance,fit,observacoes\nJoão Silva,85,75,Excelente colaborador\nMaria Santos,60,50,Em desenvolvimento';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_matriz_9box.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template baixado com sucesso!');
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
              <h1 className="text-2xl font-bold gradient-text">Matriz 9Box</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  exportMatriz9Box(entries);
                  toast.success('Dados exportados com sucesso!');
                }}
                disabled={entries.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Colaboradores em Massa</DialogTitle>
                    <DialogDescription>
                      Faça upload de um arquivo CSV com os dados dos colaboradores
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Formato do Arquivo CSV</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>O arquivo deve conter as seguintes colunas:</p>
                        <ul className="list-disc list-inside ml-2">
                          <li><strong>nome</strong>: Nome do colaborador (obrigatório)</li>
                          <li><strong>performance</strong>: Pontuação de 0-100 (obrigatório)</li>
                          <li><strong>fit</strong>: Pontuação de 0-100 (obrigatório)</li>
                          <li><strong>observacoes</strong>: Notas adicionais (opcional)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={downloadTemplate}
                        className="w-full gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Template CSV
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="csv-upload">Selecionar Arquivo CSV</Label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={isImporting}
                      />
                      {isImporting && (
                        <p className="text-sm text-muted-foreground">Importando dados...</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setImportDialogOpen(false)}
                      disabled={isImporting}
                    >
                      Fechar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Colaborador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEntry ? 'Editar' : 'Adicionar'} Colaborador
                    </DialogTitle>
                    <DialogDescription>
                      Posicione o colaborador na matriz de acordo com seu desempenho e fit com a função
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Colaborador</Label>
                      <Input 
                        id="name" 
                        value={formData.employee_name} 
                        onChange={e => setFormData({...formData, employee_name: e.target.value})} 
                        placeholder="Ex: João Silva" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="performance">
                        Desempenho / Performance
                        <span className="text-xs text-muted-foreground ml-2">(0-100)</span>
                      </Label>
                      <Input 
                        id="performance"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.performance_score} 
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setFormData({...formData, performance_score: val});
                        }}
                        onBlur={e => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val) || val < 0) {
                            setFormData({...formData, performance_score: 0});
                          } else if (val > 100) {
                            setFormData({...formData, performance_score: 100});
                          }
                        }}
                        placeholder="Ex: 85"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleFit">
                        Fit com a Função (% Compatibilidade)
                        <span className="text-xs text-muted-foreground ml-2">(0-100%)</span>
                      </Label>
                      <Input 
                        id="roleFit"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.role_fit_score} 
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFormData({...formData, role_fit_score: val});
                        }}
                        onBlur={e => {
                          const val = parseInt(e.target.value);
                          if (isNaN(val) || val < 0) {
                            setFormData({...formData, role_fit_score: 0});
                          } else if (val > 100) {
                            setFormData({...formData, role_fit_score: 100});
                          }
                        }}
                        placeholder="Ex: 75"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea 
                        id="notes" 
                        value={formData.notes} 
                        onChange={e => setFormData({...formData, notes: e.target.value})} 
                        placeholder="Adicione observações sobre o colaborador..." 
                        rows={3} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingEntry ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{filteredEntries.length}</p>
              <p className="text-sm text-muted-foreground">
                {selectedEmployee === 'all' && !searchTerm ? 'Total de Colaboradores' : 'Colaboradores Filtrados'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/50">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-emerald-500">{getCountByCategory('Estrela')}</p>
              <p className="text-sm text-muted-foreground">Estrelas</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/50">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-amber-500">
                {getCountByCategory(['Enigma', 'Desenvolvimento', 'Atenção'])}
              </p>
              <p className="text-sm text-muted-foreground">Precisam Atenção</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/50">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-blue-500">{calculateAveragePerformance()}</p>
              <p className="text-sm text-muted-foreground">Performance Média</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search by name */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por Nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar colaborador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter by employee */}
              <div className="space-y-2">
                <Label htmlFor="employee-filter">Filtrar por Colaborador</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger id="employee-filter">
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Colaboradores</SelectItem>
                    {employeeNames.map(name => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter summary */}
            {(searchTerm || selectedEmployee !== 'all') && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Exibindo {filteredEntries.length} de {entries.length} colaboradores
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre a Matriz 9Box
            </CardTitle>
            <CardDescription>
              A Matriz 9Box é uma ferramenta de avaliação que classifica colaboradores com base em dois critérios:
              <strong> Desempenho</strong> (resultado atual) e <strong>Fit com a Função</strong> (potencial e alinhamento).
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Legenda das Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map(cat => (
                <div key={cat.name} className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded border-2 shrink-0", cat.color)} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 9Box Matrix - Desktop View */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Y-axis label (outside grid) */}
            <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
              <div className="transform -rotate-90 whitespace-nowrap font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Desempenho
              </div>
            </div>

            {/* Main Grid Container */}
            <div className="ml-4">
              {/* Column Headers */}
              <div className="grid grid-cols-4 gap-3 mb-2">
                <div className="w-20" /> {/* Spacer for row labels */}
                <div className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Baixo</div>
                <div className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Médio</div>
                <div className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Alto</div>
              </div>

              {/* Rows */}
              {[3, 2, 1].map(performance => (
                <div key={performance} className="grid grid-cols-4 gap-3 mb-3">
                  {/* Row Label */}
                  <div className="w-20 flex items-center justify-end pr-3">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {performance === 3 ? 'Alto' : performance === 2 ? 'Médio' : 'Baixo'}
                    </span>
                  </div>

                  {/* Cells */}
                  {[1, 2, 3].map(roleFit => {
                    const cellEntries = getEntriesForCell(performance, roleFit);
                    const category = getCategoryForScore(performance, roleFit);
                    
                    return (
                      <Card 
                        key={`${performance}-${roleFit}`} 
                        className={cn(
                          "min-h-[220px] max-h-[280px] border-2 transition-all",
                          category?.color
                        )}
                      >
                        <CardContent className="p-4 h-full flex flex-col">
                          <p className="text-sm font-bold mb-3 text-center">
                            {category?.name}
                          </p>
                          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-custom">
                            {cellEntries.map(entry => (
                              <div 
                                key={entry.id} 
                                className="bg-card p-3 rounded-lg border border-border hover:shadow-md transition-all group"
                              >
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-primary/20 text-xs font-bold">
                                      {getInitials(entry.employee_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{entry.employee_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-muted-foreground">P: {entry.performance_score}</span>
                                      <span className="text-xs text-muted-foreground">F: {entry.role_fit_score}%</span>
                                    </div>
                                  </div>
                                  
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7"
                                      onClick={() => openEditDialog(entry)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => handleDelete(entry.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {entry.notes && (
                                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                    {entry.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}

              {/* X-axis label */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                <div className="w-20" />
                <div className="col-span-3 text-center font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  Compatibilidade com o Cargo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Vertical List */}
        <div className="md:hidden space-y-4">
          {CATEGORIES.map(category => {
            const categoryEntries = getEntriesForCell(category.performance, category.roleFit);
            
            if (categoryEntries.length === 0) return null;
            
            return (
              <Card key={category.name} className={cn("border-2", category.color)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <CardDescription className="text-xs">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className="bg-background p-3 rounded-lg border group"
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-xs font-bold">
                            {getInitials(entry.employee_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{entry.employee_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">P: {entry.performance_score}</span>
                            <span className="text-xs text-muted-foreground">F: {entry.role_fit_score}%</span>
                          </div>
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex gap-1 shrink-0">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
