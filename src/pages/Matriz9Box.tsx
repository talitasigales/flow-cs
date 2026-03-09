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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Download, Upload, ArrowLeft } from 'lucide-react';
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
  bg: string;
  border: string;
  text: string;
}

// Grid layout: rows = Desempenho (Y axis), cols = Compatibilidade com o Cargo (X axis)
// Row 0 = ALTO desempenho (top), Row 2 = BAIXO desempenho (bottom)
// Col 0 = BAIXO fit (left), Col 2 = ALTO fit (right)
const QUADRANTS: QuadrantDef[][] = [
  // Row 0 — ALTO desempenho
  [
    { label: 'Especialista', description: 'Alto desempenho + Baixo fit', bg: 'bg-indigo-900/60', border: 'border-indigo-500/60', text: 'text-indigo-300' },
    { label: 'Destaque', description: 'Alto desempenho + Médio fit', bg: 'bg-teal-900/50', border: 'border-teal-500/60', text: 'text-teal-300' },
    { label: 'Estrela', description: 'Alto desempenho + Alto fit', bg: 'bg-emerald-900/50', border: 'border-emerald-500/60', text: 'text-emerald-300' },
  ],
  // Row 1 — MÉDIO desempenho
  [
    { label: 'Confiável', description: 'Médio desempenho + Baixo fit', bg: 'bg-slate-800/60', border: 'border-slate-500/40', text: 'text-slate-300' },
    { label: 'Sólido', description: 'Médio desempenho + Médio fit', bg: 'bg-blue-900/40', border: 'border-blue-500/50', text: 'text-blue-300' },
    { label: 'Alto Potencial', description: 'Médio desempenho + Alto fit', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  ],
  // Row 2 — BAIXO desempenho
  [
    { label: 'Atenção', description: 'Baixo desempenho + Baixo fit', bg: 'bg-red-900/40', border: 'border-red-500/50', text: 'text-red-300' },
    { label: 'Desenvolvimento', description: 'Baixo desempenho + Médio fit', bg: 'bg-amber-900/30', border: 'border-amber-500/40', text: 'text-amber-300' },
    { label: 'Enigma', description: 'Baixo desempenho + Alto fit', bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-300' },
  ],
];

const LEGEND = [
  { label: 'Estrela', description: 'Alto desempenho + Alto fit - Talentos-chave', color: 'bg-emerald-500' },
  { label: 'Destaque', description: 'Alto desempenho + Médio fit - Considerar novas posições', color: 'bg-teal-500' },
  { label: 'Especialista', description: 'Alto desempenho + Baixo fit - Revisar posicionamento', color: 'bg-indigo-500' },
  { label: 'Alto Potencial', description: 'Médio desempenho + Alto fit - Investir em desenvolvimento', color: 'bg-emerald-400' },
  { label: 'Sólido', description: 'Médio desempenho + Médio fit - Colaboradores consistentes', color: 'bg-blue-500' },
  { label: 'Confiável', description: 'Médio desempenho + Baixo fit - Desenvolver ou realocar', color: 'bg-slate-500' },
  { label: 'Enigma', description: 'Baixo desempenho + Alto fit - Entender barreiras', color: 'bg-amber-500' },
  { label: 'Desenvolvimento', description: 'Baixo desempenho + Médio fit - Plano de desenvolvimento', color: 'bg-amber-600' },
  { label: 'Atenção', description: 'Baixo desempenho + Baixo fit - Ação urgente necessária', color: 'bg-red-500' },
];

const Y_LABELS = ['ALTO', 'MÉDIO', 'BAIXO'];
const X_LABELS = ['BAIXO', 'MÉDIO', 'ALTO'];

function getTier(value: number): number {
  if (value <= 33) return 0;
  if (value <= 66) return 1;
  return 2;
}

function getQuadrant(performance: number, potential: number): { row: number; col: number } {
  const col = getTier(potential); // X = compatibility/fit
  const perfTier = getTier(performance); // Y = performance/desempenho
  const row = 2 - perfTier; // high perf = row 0 (top)
  return { row, col };
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600',
  'bg-pink-600', 'bg-cyan-600', 'bg-amber-600', 'bg-red-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
    const { data, error } = await supabase.from('matriz_9box').select('*').order('employee_name');
    if (error) { toast.error('Erro ao carregar dados'); console.error(error); }
    else setEmployees(data || []);
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
      employee_name: e.employee_name, performance: e.performance, potential: e.potential, notes: e.notes || '',
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
        user_id: user.id, employee_name: r.name,
        performance: Math.min(100, Math.max(0, r.performance)),
        potential: Math.min(100, Math.max(0, r.potential)),
        notes: r.notes || null,
      }));
      const { error } = await supabase.from('matriz_9box').insert(inserts);
      if (error) { toast.error('Erro ao importar'); return; }
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Matriz 9Box</h1>
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
              <Plus className="w-4 h-4 mr-1" /> Adicionar Colaborador
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground mb-3">Legenda das Categorias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LEGEND.map(item => (
              <div key={item.label} className="flex items-start gap-2.5">
                <div className={`w-4 h-4 rounded-sm shrink-0 mt-0.5 ${item.color}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9Box Grid */}
        <div className="flex">
          {/* Y axis */}
          <div className="flex flex-col items-center justify-center mr-2 shrink-0">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              DESEMPENHO
            </span>
          </div>

          <div className="flex-1">
            {/* X axis labels (top) */}
            <div className="flex mb-1.5">
              <div className="w-14 shrink-0" />
              {X_LABELS.map(label => (
                <div key={label} className="flex-1 text-center">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="space-y-1.5">
              {[0, 1, 2].map(row => (
                <div key={row} className="flex gap-1.5 items-stretch">
                  {/* Y tier label */}
                  <div className="w-14 shrink-0 flex items-center justify-end pr-2">
                    <span className="text-[11px] font-bold text-muted-foreground">{Y_LABELS[row]}</span>
                  </div>
                  {[0, 1, 2].map(col => {
                    const def = QUADRANTS[row][col];
                    const emps = employeesByQuadrant[`${row}-${col}`];
                    return (
                      <button
                        key={col}
                        onClick={() => setDetailQuadrant({ row, col })}
                        className={`flex-1 min-h-[140px] rounded-xl border-2 p-3 transition-all hover:brightness-110 hover:shadow-lg cursor-pointer ${def.bg} ${def.border}`}
                      >
                        <p className={`text-sm font-bold mb-2 ${def.text}`}>{def.label}</p>
                        <div className="space-y-1.5">
                          {emps.slice(0, 4).map(emp => (
                            <div key={emp.id} className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getAvatarColor(emp.employee_name)}`}>
                                {getInitials(emp.employee_name)}
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{emp.employee_name}</p>
                                <p className="text-[10px] text-muted-foreground">P: {emp.performance}  F: {emp.potential}%</p>
                              </div>
                            </div>
                          ))}
                          {emps.length > 4 && (
                            <p className="text-[10px] text-muted-foreground">+{emps.length - 4} mais</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* X axis label (bottom) */}
            <p className="text-center text-[11px] font-bold tracking-widest text-muted-foreground mt-3">
              COMPATIBILIDADE COM O CARGO
            </p>
          </div>
        </div>
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
              <Label>Desempenho (0–100)</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={formData.performance} onChange={e => setFormData(p => ({ ...p, performance: +e.target.value }))} className="flex-1 accent-primary" />
                <Input type="number" min={0} max={100} value={formData.performance} onChange={e => setFormData(p => ({ ...p, performance: Math.min(100, Math.max(0, +e.target.value)) }))} className="w-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">0-33 Baixo · 34-66 Médio · 67-100 Alto</p>
            </div>
            <div>
              <Label>Compatibilidade com o Cargo / Fit (0–100)</Label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} value={formData.potential} onChange={e => setFormData(p => ({ ...p, potential: +e.target.value }))} className="flex-1 accent-primary" />
                <Input type="number" min={0} max={100} value={formData.potential} onChange={e => setFormData(p => ({ ...p, potential: Math.min(100, Math.max(0, +e.target.value)) }))} className="w-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">0-33 Baixo · 34-66 Médio · 67-100 Alto</p>
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
            <DialogTitle>{detailDef?.label}</DialogTitle>
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
                  <TableHead className="w-20">Fit</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(emp.employee_name)}`}>
                          {getInitials(emp.employee_name)}
                        </div>
                        <div>
                          <p className="font-medium">{emp.employee_name}</p>
                          {emp.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{emp.notes}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.performance}</TableCell>
                    <TableCell>{emp.potential}%</TableCell>
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
