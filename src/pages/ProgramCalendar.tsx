import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, BookOpen } from 'lucide-react';
import { useEffect } from 'react';

export default function ProgramCalendar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['all-program-classes-calendar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('program_classes')
        .select('*, programs(name, slug)')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });
      return data || [];
    },
  });

  // Group by month
  const grouped: Record<string, any[]> = {};
  classes.forEach((c: any) => {
    const key = c.start_date ? format(new Date(c.start_date + 'T12:00:00'), 'MMMM yyyy', { locale: ptBR }) : 'Sem data';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

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
        <div>
          <h1 className="text-2xl font-bold gradient-text">Calendário de Programas</h1>
          <p className="text-muted-foreground text-sm">Próximas turmas de todos os programas e workshops</p>
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
