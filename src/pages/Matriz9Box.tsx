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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Download, Upload, ArrowLeft, Users, Search, TrendingUp, Target } from 'lucide-react';
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

const QUADRANTS: QuadrantDef[][] = [
  // Row 0 = Potencial MUITO BOM (top)
  [
    { label: 'Enigma', description: 'Potencial muito bom + Desempenho insuficiente', bg: 'bg-emerald-900/50', border: 'border-emerald-500/60', text: 'text-emerald-300' },
    { label: 'Forte Desempenho', description: 'Potencial muito bom + Desempenho mediano', bg: 'bg-emerald-900/50', border: 'border-emerald-500/60', text: 'text-emerald-300' },
    { label: 'Alto Potencial', description: 'Potencial muito bom + Desempenho excepcional', bg: 'bg-emerald-900/60', border: 'border-emerald-500/70', text: 'text-emerald-300' },
  ],
  // Row 1 = Potencial ACEITÁVEL (middle)
  [
    { label: 'Questionável', description: 'Potencial aceitável + Desempenho insuficiente', bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-300' },
    { label: 'Mantenedor', description: 'Potencial aceitável + Desempenho mediano', bg: 'bg-amber-900/40', border: 'border-amber-500/50', text: 'text-amber-300' },
    { label: 'Forte Desempenho', description: 'Potencial aceitável + Desempenho excepcional', bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  ],
  // Row 2 = Potencial BAIXO (bottom)
  [
    { label: 'Insuficiente', description: 'Potencial baixo + Desempenho insuficiente', bg: 'bg-red-900/40', border: 'border-red-500/50', text: 'text-red-300' },
    { label: 'Eficaz', description: 'Potencial baixo + Desempenho mediano', bg: 'bg-red-900/30', border: 'border-red-500/40', text: 'text-red-300' },
    { label: 'Comprometido', description: 'Potencial baixo + Desempenho excepcional', bg: 'bg-blue-900/40', border: 'border-blue-500/50', text: 'text-blue-300' },
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

function getTierLabel(value: number): string {
  if (value <= 33) return 'Baixo';
  if (value <= 66) return 'Médio';
  return 'Alto';
}

function getQuadrant(performance: number, potential: number): { row: number; col: number } {
  const col = getTier(potential);
  const row = 2 - getTier(performance);
  return { row, col };
}

function getQuadrantLabel(performance: number, potential: number): string {
  const { row, col } = getQuadrant(performance, potential);
  return QUADRANTS[row][col].label;
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

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterPerformance, setFilterPerformance] = useState<string>('all');
  const [filterFit, setFilterFit] = useState<string>('all');

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

  // Filtered employees for the grid
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (searchName && !emp.employee_name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (filterPerformance !== 'all' && getTierLabel(emp.performance).toLowerCase() !== filterPerformance) return false;
      if (filterFit !== 'all' && getTierLabel(emp.potential).toLowerCase() !== filterFit) return false;
      return true;
    });
  }, [employees, searchName, filterPerformance, filterFit]);

  const employeesByQuadrant = useMemo(() => {
    const map: Record<string, Employee[]> = {};
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) map[`${r}-${c}`] = [];
    filteredEmployees.forEach(emp => {
      const { row, col } = getQuadrant(emp.performance, emp.potential);
      map[`${row}-${col}`].push(emp);
    });
    return map;
  }, [filteredEmployees]);

  // Metrics
  const avgPerformance = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length) : 0;
  const avgFit = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.potential, 0) / employees.length) : 0;
  const topQuadrantCount = employees.filter(e => getTier(e.performance) === 2 && getTier(e.potential) === 2).length;

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
  const hasFilters = searchName || filterPerformance !== 'all' || filterFit !== 'all';

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

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Total de Colaboradores</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgPerformance}</p>
                <p className="text-xs text-muted-foreground">Média Desempenho</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgFit}%</p>
                <p className="text-xs text-muted-foreground">Média Compatibilidade</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{topQuadrantCount}</p>
                <p className="text-xs text-muted-foreground">Estrelas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterPerformance} onValueChange={setFilterPerformance}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Desempenho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os desempenhos</SelectItem>
                <SelectItem value="alto">Alto (67-100)</SelectItem>
                <SelectItem value="médio">Médio (34-66)</SelectItem>
                <SelectItem value="baixo">Baixo (0-33)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterFit} onValueChange={setFilterFit}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Compatibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as compatibilidades</SelectItem>
                <SelectItem value="alto">Alto (67-100)</SelectItem>
                <SelectItem value="médio">Médio (34-66)</SelectItem>
                <SelectItem value="baixo">Baixo (0-33)</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchName(''); setFilterPerformance('all'); setFilterFit('all'); }}>
                Limpar filtros
              </Button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-2">
              Mostrando {filteredEmployees.length} de {employees.length} colaboradores
            </p>
          )}
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
          <div className="flex flex-col items-center justify-center mr-2 shrink-0">
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              DESEMPENHO
            </span>
          </div>

          <div className="flex-1">
            <div className="flex mb-1.5">
              <div className="w-14 shrink-0" />
              {X_LABELS.map(label => (
                <div key={label} className="flex-1 text-center">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {[0, 1, 2].map(row => (
                <div key={row} className="flex gap-1.5 items-stretch">
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

            <p className="text-center text-[11px] font-bold tracking-widest text-muted-foreground mt-3">
              COMPATIBILIDADE COM O CARGO
            </p>
          </div>
        </div>

        {/* Full employee list */}
        {employees.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Todos os Colaboradores ({filteredEmployees.length})</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="w-24">Desempenho</TableHead>
                  <TableHead className="w-24">Fit</TableHead>
                  <TableHead className="w-32">Quadrante</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(emp.employee_name)}`}>
                          {getInitials(emp.employee_name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{emp.employee_name}</p>
                          {emp.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{emp.notes}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{emp.performance}</span>
                      <span className="text-xs text-muted-foreground ml-1">({getTierLabel(emp.performance)})</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{emp.potential}%</span>
                      <span className="text-xs text-muted-foreground ml-1">({getTierLabel(emp.potential)})</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">{getQuadrantLabel(emp.performance, emp.potential)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(emp)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setDeletingEmployee(emp); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
