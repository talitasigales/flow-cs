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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Edit, Info } from 'lucide-react';
import { toast } from 'sonner';
interface MatrizEntry {
  id: string;
  employee_name: string;
  performance_score: number;
  role_fit_score: number;
  notes: string;
}
export default function Matriz9Box() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MatrizEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MatrizEntry | null>(null);
  const [formData, setFormData] = useState({
    employee_name: '',
    performance_score: 2,
    role_fit_score: 2,
    notes: ''
  });
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
      const {
        data,
        error
      } = await supabase.from('matriz_9box').select('*').eq('user_id', user?.id);
      if (error) throw error;
      setEntries(data || []);
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
        const {
          error
        } = await supabase.from('matriz_9box').update({
          employee_name: formData.employee_name,
          performance_score: formData.performance_score,
          role_fit_score: formData.role_fit_score,
          notes: formData.notes
        }).eq('id', editingEntry.id);
        if (error) throw error;
        toast.success('Colaborador atualizado com sucesso');
      } else {
        const {
          error
        } = await supabase.from('matriz_9box').insert({
          user_id: user?.id,
          employee_name: formData.employee_name,
          performance_score: formData.performance_score,
          role_fit_score: formData.role_fit_score,
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
      const {
        error
      } = await supabase.from('matriz_9box').delete().eq('id', id);
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
      performance_score: 2,
      role_fit_score: 2,
      notes: ''
    });
  };
  const getEntriesForCell = (performance: number, roleFit: number) => {
    return entries.filter(e => e.performance_score === performance && e.role_fit_score === roleFit);
  };
  const getCellColor = (performance: number, roleFit: number) => {
    const total = performance + roleFit;
    if (total >= 5) return 'bg-success/20 border-success/50';
    if (total >= 4) return 'bg-primary/20 border-primary/50';
    if (total >= 3) return 'bg-warning/20 border-warning/50';
    return 'bg-destructive/20 border-destructive/50';
  };
  const getCellLabel = (performance: number, roleFit: number) => {
    if (performance === 3 && roleFit === 3) return 'Estrela';
    if (performance === 3 && roleFit === 2) return 'Destaque';
    if (performance === 3 && roleFit === 1) return 'Especialista';
    if (performance === 2 && roleFit === 3) return 'Alto Potencial';
    if (performance === 2 && roleFit === 2) return 'Sólido';
    if (performance === 2 && roleFit === 1) return 'Confiável';
    if (performance === 1 && roleFit === 3) return 'Enigma';
    if (performance === 1 && roleFit === 2) return 'Desenvolvimento';
    return 'Atenção';
  };
  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background">
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
            <Dialog open={dialogOpen} onOpenChange={open => {
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
                    <Input id="name" value={formData.employee_name} onChange={e => setFormData({
                    ...formData,
                    employee_name: e.target.value
                  })} placeholder="Ex: João Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="performance">Média</Label>
                    <Input id="performance" type="number" value={formData.performance_score} onChange={e => setFormData({
                    ...formData,
                    performance_score: parseFloat(e.target.value) || 0
                  })} placeholder="Digite o valor da métrica" step="0.01" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleFit">Compatibilidade com o cargo (%)
                  </Label>
                    <Input id="roleFit" type="number" value={formData.role_fit_score} onChange={e => setFormData({
                    ...formData,
                    role_fit_score: parseFloat(e.target.value) || 0
                  })} placeholder="Digite a porcentagem (0-100)" step="1" min="0" max="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
                    ...formData,
                    notes: e.target.value
                  })} placeholder="Adicione observações sobre o colaborador..." rows={3} />
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

      <div className="container mx-auto px-6 py-8">
        {/* Info Card */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre a Matriz 9Box
            </CardTitle>
            <CardDescription>
              A Matriz 9Box é uma ferramenta de avaliação que classifica colaboradores com base em dois critérios:
              <br />
              <strong>Desempenho:</strong> Resultado atual do colaborador
              <br />
              <strong>Fit com a Função:</strong> Potencial e alinhamento com a posição
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 9Box Matrix */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Matriz de Avaliação</h2>
          <div className="grid grid-cols-4 gap-4">
            {/* Y-axis label */}
            <div className="flex items-center justify-center min-w-[80px]">
              
            </div>
            {/* X-axis labels */}
            <div className="text-center font-semibold text-sm text-foreground">Baixo</div>
            <div className="text-center font-semibold text-sm text-foreground">Médio</div>
            <div className="text-center font-semibold text-sm text-foreground">Alto</div>

            {/* Row 3 (Alto Fit) */}
            <div className="flex items-center justify-end pr-4 font-semibold text-sm text-foreground">
              Alto
            </div>
            {[1, 2, 3].map(performance => {
            const cellEntries = getEntriesForCell(performance, 3);
            return <Card key={`${performance}-3`} className={`min-h-[200px] ${getCellColor(performance, 3)} border-2`}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold mb-3 text-center">
                      {getCellLabel(performance, 3)}
                    </p>
                    <div className="space-y-2">
                      {cellEntries.map(entry => <div key={entry.id} className="bg-card p-2 rounded border border-border text-sm group relative">
                          <p className="font-medium truncate pr-14">{entry.employee_name}</p>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditDialog(entry)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>;
          })}

            {/* Row 2 (Médio Fit) */}
            <div className="flex items-center justify-end pr-4 font-semibold text-sm text-foreground">
              Médio
            </div>
            {[1, 2, 3].map(performance => {
            const cellEntries = getEntriesForCell(performance, 2);
            return <Card key={`${performance}-2`} className={`min-h-[200px] ${getCellColor(performance, 2)} border-2`}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold mb-3 text-center">
                      {getCellLabel(performance, 2)}
                    </p>
                    <div className="space-y-2">
                      {cellEntries.map(entry => <div key={entry.id} className="bg-card p-2 rounded border border-border text-sm group relative">
                          <p className="font-medium truncate pr-14">{entry.employee_name}</p>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditDialog(entry)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>;
          })}

            {/* Row 1 (Baixo Fit) */}
            <div className="flex items-center justify-end pr-4 font-semibold text-sm text-foreground">
              Baixo
            </div>
            {[1, 2, 3].map(performance => {
            const cellEntries = getEntriesForCell(performance, 1);
            return <Card key={`${performance}-1`} className={`min-h-[200px] ${getCellColor(performance, 1)} border-2`}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold mb-3 text-center">
                      {getCellLabel(performance, 1)}
                    </p>
                    <div className="space-y-2">
                      {cellEntries.map(entry => <div key={entry.id} className="bg-card p-2 rounded border border-border text-sm group relative">
                          <p className="font-medium truncate pr-14">{entry.employee_name}</p>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditDialog(entry)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>;
          })}

            {/* Bottom spacing row */}
            <div></div>
            
          </div>
        </div>
      </div>
    </div>;
}