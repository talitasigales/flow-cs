import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, BookOpen } from 'lucide-react';
import { useEffect } from 'react';

export default function ProgramGeneric() {
  const { slug } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: program, isLoading: loadingProgram } = useQuery({
    queryKey: ['program', slug],
    queryFn: async () => {
      const { data } = await supabase.from('programs').select('*').eq('slug', slug).single();
      return data;
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['program-classes-public', program?.id],
    enabled: !!program?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_classes')
        .select('*')
        .eq('program_id', program!.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });
      return data || [];
    },
  });

  if (loading || loadingProgram) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!program) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Programa não encontrado.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{program.name}</h1>
          {program.description && <p className="text-muted-foreground text-sm mt-1">{program.description}</p>}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Próximas Turmas</h2>
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma turma agendada no momento.</p>
              </CardContent>
            </Card>
          ) : (
            classes.map((c: any) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      {c.start_date && (
                        <>
                          <p className="text-2xl font-bold text-primary">{format(new Date(c.start_date + 'T12:00:00'), 'dd')}</p>
                          <p className="text-xs font-medium text-primary uppercase">{format(new Date(c.start_date + 'T12:00:00'), 'MMM yyyy', { locale: ptBR })}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{c.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {c.start_date && <Badge variant="secondary">{format(new Date(c.start_date + 'T12:00:00'), 'dd/MM/yyyy')}</Badge>}
                      {c.end_date && <span className="text-muted-foreground text-sm">até {format(new Date(c.end_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
