import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Download, Upload, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { exportMatriz9Box } from '@/utils/exportUtils';

interface Employee {
  id: string;
  employee_name: string;
  performance: number;
  potential: number;
  notes: string | null;
}

interface QuadrantDef {
  label: string;
  description: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const QUADRANTS: QuadrantDef[][] = [
  // Row 0 = top (Muito bom potential)
  [
    { label: 'Enigma', description: 'Alto potencial, baixo desempenho', color: '#0ea5e9', bgClass: 'bg-sky-100 dark:bg-sky-950/40', textClass: 'text-sky-800 dark:text-sky-200', borderClass: 'border-sky-300 dark:border-sky-700' },
    { label: 'Forte Desempenho', description: 'Alto potencial, desempenho mediano', color: '#3b82f6', bgClass: 'bg-blue-100 dark:bg-blue-950/40', textClass: 'text-blue-800 dark:text-blue-200', borderClass: 'border-blue-300 dark:border-blue-700' },
    { label: 'Alto Potencial', description: 'Alto potencial, alto desempenho', color: '#22c55e', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40', textClass: 'text-emerald-800 dark:text-emerald-200', borderClass: 'border-emerald-300 dark:border-emerald-700' },
  ],
  // Row 1 = middle (Aceitável potential)
  [
    { label: 'Questionável', description: 'Potencial aceitável, baixo desempenho', color: '#f97316', bgClass: 'bg-orange-100 dark:bg-orange-950/40', textClass: 'text-orange-800 dark:text-orange-200', borderClass: 'border-orange-300 dark:border-orange-700' },
    { label: 'Mantenedor', description: 'Potencial aceitável, desempenho mediano', color: '#14b8a6', bgClass: 'bg-teal-100 dark:bg-teal-950/40', textClass: 'text-teal-800 dark:text-teal-200', borderClass: 'border-teal-300 dark:border-teal-700' },
    { label: 'Forte Desempenho', description: 'Potencial aceitável, alto desempenho', color: '#3b82f6', bgClass: 'bg-blue-100 dark:bg-blue-950/40', textClass: 'text-blue-800 dark:text-blue-200', borderClass: 'border-blue-300 dark:border-blue-700' },
  ],
  // Row 2 = bottom (Baixo potential)
  [
    { label: 'Insuficiente', description: 'Baixo potencial, baixo desempenho', color: '#ef4444', bgClass: 'bg-red-100 dark:bg-red-950/40', textClass: 'text-red-800 dark:text-red-200', borderClass: 'border-red-300 dark:border-red-700' },
    { label: 'Eficaz', description: 'Baixo potencial, desempenho mediano', color: '#f97316', bgClass: 'bg-orange-100 dark:bg-orange-950/40', textClass: 'text-orange-800 dark:text-orange-200', borderClass: 'border-orange-300 dark:border-orange-700' },
    { label: 'Comprometido', description: 'Baixo potencial, alto desempenho', color: '#14b8a6', bgClass: 'bg-teal-100 dark:bg-teal-950/40', textClass: 'text-teal-800 dark:text-teal-200', borderClass: 'border-teal-300 dark:border-teal-700' },
  ],
];

const Y_LABELS = ['Muito bom', 'Aceitável', 'Baixo'];
const X_LABELS = ['Insuficiente', 'Mediano', 'Excepcional'];

function getTier(value: number): number {
  if (value <= 33) return 0;
  if (value <= 66) return 1;
  return 2;
}

function getQuadrant(performance: number, potential: number): { row: number; col: number } {
  const col = getTier(performance);
  // potential: high = row 0, mid = row 1, low = row 2
  const potentialTier = getTier(potential);
  const row = 2 - potentialTier;
  return { row, col };
}

const Matriz9Box = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailQuadrant, setDetailQuadrant] = useState<{ row: number; col: number } | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ employee_name: '', performance: 50, potential: 50, notes: '' });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('matriz_9box')
      .select('*')
      .order('employee_name');
    if (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } else {
      setEmployees(data || []);
    }
    setDataLoading(false);
  };

  const employeesByQuadrant = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) map[`${r}-${c}`] = [];
    employees.forEach(emp => {
      const { row, col } = getQuadrant(emp.performance, emp.potential);
      map[`${row}-${col}`].push(emp);
    });
    return map;
  }, [employees]);

  const openAdd = () => {
    setEditingEmployee(null);
    setFormData({ employee_name: '', performance: 50, potential: 50, notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ employee_name: emp.employee_name, performance: emp.performance, potential: emp.potential, notes: emp.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.employee_name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!user) return;

    if (editingEmployee) {
      const { error } = await supabase.from('matriz_9box').update({
        employee_name: formData.employee_name.trim(),
        performance: formData.performance,
        potential: formData.potential,
        notes: formData.notes || null,
      }).eq('id', editingEmployee.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Colaborador atualizado');
    } else {
      const { error } = await supabase.from('matriz_9box').insert({
        user_id: user.id,
        employee_name: formData.employee_name.trim(),
        performance: formData.performance,
        potential: formData.potential,
        notes: formData.notes || null,
      });
      if (error) { toast.error('Erro ao adicionar'); return; }
      toast.success('Colaborador adicionado');
    }
    setDialogOpen(false);
    fetchEmployees();
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    const { error } = await supabase.from('matriz_9box').delete().eq('id', deletingEmployee.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Colaborador removido');
    setDeleteDialogOpen(false);
    setDeletingEmployee(null);
    fetchEmployees();
  };

  const handleExport = () => {
    if (employees.length === 0) { toast.error('Nenhum dado para exportar'); return; }
    exportMatriz9Box(employees.map(e => ({
      employee_name: e.employee_name,
      performance: e.performance,
      potential: e.potential,
      notes: e.notes || '',
    })));
    toast.success('CSV exportado');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV vazio ou inválido'); return; }
      const rows = lines.slice(1).map(line => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return { name: parts[0], performance: parseInt(parts[1]) || 0, potential: parseInt(parts[2]) || 0, notes: parts[3] || '' };
      }).filter(r => r.name);

      const inserts = rows.map(r => ({
        user_id: user.id,
        employee_name: r.name,
        performance: Math.min(100, Math.max(0, r.performance)),
        potential: Math.min(100, Math.max(0, r.potential)),
        notes: r.notes || null,
      }));

      const { error } = await supabase.from('matriz_9box').insert(inserts);
      if (error) { toast.error('Erro ao importar'); console.error(error); return; }
      toast.success(`${inserts.length} colaboradores importados`);
      fetchEmployees();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading || !user) return null;

  const detailEmployees = detailQuadrant ? employeesByQuadrant[`${detailQuadrant.row}-${detailQuadrant.col}`] : [];
  const detailDef = detailQuadrant ? QUADRANTS[detailQuadrant.row][detailQuadrant.col] : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Matriz 9Box</h1>
            <p className="text-sm text-muted-foreground">Desempenho (compatibilidade PDA com cargo) × Potencial (liderança)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Exportar
            </Button>
            <label>
              <Button size="sm" variant="outline" asChild>
                <span><Upload className="w-4 h-4 mr-1" /> Importar CSV</span>
              </Button>
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
        </div>

        {/* 9Box Grid */}
        <div className="flex gap-2">
          {/* Y axis label */}
          <div className="flex flex-col justify-between py-1 pr-1 shrink-0">
            <div className="flex-1 flex items-center">
              <span className="text-xs font-semibold text-muted-foreground -rotate-90 whitespace-nowrap origin-center">Potencial (liderança)</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {/* Y tier labels + grid rows */}
            {[0, 1, 2].map(row => (
              <div key={row} className="flex gap-1 items-stretch">
                <div className="w-16 shrink-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-medium text-muted-foreground text-right">{Y_LABELS[row]}</span>
                </div>
                {[0, 1, 2].map(col => {
                  const def = QUADRANTS[row][col];
                  const emps = employeesByQuadrant[`${row}-${col}`];
                  return (
                    <button
                      key={col}
                      onClick={() => setDetailQuadrant({ row, col })}
                      className={`flex-1 min-h-[120px] rounded-lg border-2 p-3 transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer ${def.bgClass} ${def.borderClass}`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <p className={`text-sm font-bold ${def.textClass}`}>{def.label}</p>
                          <p className={`text-[10px] leading-tight mt-0.5 opacity-70 ${def.textClass}`}>{def.description}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Users className={`w-3.5 h-3.5 ${def.textClass}`} />
                          <span className={`text-lg font-bold ${def.textClass}`}>{emps.length}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* X axis labels */}
            <div className="flex gap-1">
              <div className="w-16 shrink-0" />
              {X_LABELS.map(label => (
                <div key={label} className="flex-1 text-center">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-semibold text-muted-foreground">Desempenho (compatibilidade com cargo PDA)</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">Total: {employees.length} colaborador{employees.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
            <DialogDescription>Preencha os dados do colaborador para posicioná-lo na matriz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Colaborador *</Label>
              <Input value={formData.employee_name} onChange={e => setFormData(p => ({ ...p, employee_name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Desempenho — Compatibilidade com Cargo PDA (0–100)</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={formData.performance} onChange={e => setFormData(p => ({ ...p, performance: +e.target.value }))} className="flex-1 accent-primary" />
                <Input type="number" min={0} max={100} value={formData.performance} onChange={e => setFormData(p => ({ ...p, performance: Math.min(100, Math.max(0, +e.target.value)) }))} className="w-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">0-33 Insuficiente · 34-66 Mediano · 67-100 Excepcional</p>
            </div>
            <div>
              <Label>Potencial — Liderança (0–100)</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={formData.potential} onChange={e => setFormData(p => ({ ...p, potential: +e.target.value }))} className="flex-1 accent-primary" />
                <Input type="number" min={0} max={100} value={formData.potential} onChange={e => setFormData(p => ({ ...p, potential: Math.min(100, Math.max(0, +e.target.value)) }))} className="w-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">0-33 Baixo · 34-66 Aceitável · 67-100 Muito bom</p>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Observações opcionais" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingEmployee ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Deseja realmente remover {deletingEmployee?.employee_name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quadrant Detail Dialog */}
      <Dialog open={!!detailQuadrant} onOpenChange={() => setDetailQuadrant(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={detailDef?.textClass}>{detailDef?.label}</DialogTitle>
            <DialogDescription>{detailDef?.description} — {detailEmployees.length} colaborador{detailEmployees.length !== 1 ? 'es' : ''}</DialogDescription>
          </DialogHeader>
          {detailEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum colaborador neste quadrante.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-20">Desemp.</TableHead>
                  <TableHead className="w-20">Potenc.</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.employee_name}</p>
                        {emp.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{emp.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{emp.performance}</TableCell>
                    <TableCell>{emp.potential}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDetailQuadrant(null); openEdit(emp); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setDetailQuadrant(null); setDeletingEmployee(emp); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Matriz9Box;
