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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, CalendarIcon, Plus, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '5551918920490';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre os programas e turmas disponíveis.')}`;

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
        .gt('start_date', today)
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
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Calendário de Turmas</h1>
                <p className="text-muted-foreground text-sm">Próximas turmas de todos os programas e workshops</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Nova Turma</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Turma</DialogTitle>
                    <DialogDescription>Preencha os dados abaixo para criar uma nova turma.</DialogDescription>
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
        </div>

        {/* WhatsApp CTA Banner */}
        <div className="liquid-glass liquid-glass-hover rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 cursor-pointer group transition-all duration-300"
          onClick={() => window.open(WHATSAPP_URL, '_blank')}>
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(142,70%,45%)]/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-[hsl(142,70%,50%)]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold">Quer saber mais sobre algum programa?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fale com nosso time comercial pelo WhatsApp e tire suas dúvidas sobre turmas, datas e investimento.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white shrink-0"
            asChild
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>

        {/* Calendar Grid */}
        {Object.keys(grouped).length === 0 ? (
          <div className="liquid-glass rounded-2xl p-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">Nenhuma turma agendada no momento.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="space-y-3">
              {/* Month header */}
              <div className="flex items-center gap-3 pl-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-bold capitalize gradient-text">{month}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
              </div>

              {/* Class cards */}
              <div className="grid gap-3">
                {items.map((c: any) => {
                  const startDateObj = c.start_date ? new Date(c.start_date + 'T12:00:00') : null;
                  const endDateObj = c.end_date ? new Date(c.end_date + 'T12:00:00') : null;
                  const programName = (c as any).programs?.name || '—';

                  return (
                    <div
                      key={c.id}
                      className="liquid-glass liquid-glass-hover rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-300 group"
                    >
                      {/* Date badge */}
                      {startDateObj && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/15 border border-primary/20 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-primary leading-none">
                            {format(startDateObj, 'dd')}
                          </span>
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-0.5">
                            {format(startDateObj, 'MMM', { locale: ptBR })}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                        >
                          {programName}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base leading-tight">{c.name}</h3>
                          <Badge className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
                            INSCRIÇÕES ABERTAS
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {startDateObj && <span>{format(startDateObj, 'dd/MM/yyyy')}</span>}
                          {endDateObj && (
                            <>
                              <span>—</span>
                              <span>{format(endDateObj, 'dd/MM/yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp action */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground hover:text-[hsl(142,70%,50%)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre a turma "${c.name}" do programa ${programName}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Saber mais
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Bottom CTA */}
        <div className="text-center pb-4">
          <p className="text-xs text-muted-foreground mb-2">
            Não encontrou o que procura? Entre em contato para turmas personalizadas.
          </p>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              Falar com o time comercial
            </a>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
