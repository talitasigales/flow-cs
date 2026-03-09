import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, CalendarIcon, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ProgramCalendar() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [className, setClassName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: programs = [] } = useQuery({
    queryKey: ['all-programs'],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('id, name').eq('active', true).order('name');
      return data || [];
    },
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['all-program-classes-calendar'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('program_classes')
        .select('*, programs(name, slug)')
        .or(`end_date.gte.${today},end_date.is.null,start_date.gte.${today}`)
        .order('start_date', { ascending: true });
      return data || [];
    },
  });

  const grouped: Record<string, any[]> = {};
  classes.forEach((c: any) => {
    const key = c.start_date ? format(new Date(c.start_date + 'T12:00:00'), 'MMMM yyyy', { locale: ptBR }) : 'Sem data';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  const handleSave = async () => {
    if (!className.trim() || !selectedProgram) {
      toast.error('Selecione um programa e informe o nome da turma');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('program_classes').insert({
        program_id: selectedProgram,
        name: className.trim(),
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });
      if (error) throw error;
      toast.success('Turma criada com sucesso');
      setClassName('');
      setSelectedProgram('');
      setStartDate(undefined);
      setEndDate(undefined);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['all-program-classes-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['program-classes'] });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar turma');
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Calendário de Turmas</h1>
            <p className="text-muted-foreground text-sm">Próximas turmas de todos os programas e workshops</p>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Turma</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Turma</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Programa</Label>
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da Turma</Label>
                    <Input value={className} onChange={e => setClassName(e.target.value)} placeholder="Ex: Turma Mar/2026" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Criar Turma'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma turma agendada no momento.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="space-y-3">
              <h2 className="text-lg font-semibold capitalize text-primary">{month}</h2>
              {items.map((c: any) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 rounded-lg p-3 text-center min-w-[70px]">
                        {c.start_date && (
                          <>
                            <p className="text-2xl font-bold text-primary">{format(new Date(c.start_date + 'T12:00:00'), 'dd')}</p>
                            <p className="text-xs font-medium text-primary uppercase">{format(new Date(c.start_date + 'T12:00:00'), 'MMM', { locale: ptBR })}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-1">{(c as any).programs?.name || '—'}</Badge>
                      <h3 className="font-semibold">{c.name}</h3>
                      <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
                        {c.start_date && <span>{format(new Date(c.start_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                        {c.end_date && <span>— {format(new Date(c.end_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
