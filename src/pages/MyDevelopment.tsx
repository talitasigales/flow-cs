import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, CalendarDays, GraduationCap } from 'lucide-react';

export default function MyDevelopment() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments-detail', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_enrollments')
        .select('id, enrolled_at, class_id, programs(id, name, slug, description), program_classes(id, name, start_date, end_date)')
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });
      return data || [];
    },
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
          <h1 className="text-2xl font-bold gradient-text">Meu Desenvolvimento</h1>
          <p className="text-muted-foreground text-sm">Acompanhe sua evolução nos programas e turmas em que está matriculado</p>
        </div>

        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Você ainda não está matriculado em nenhum programa.</p>
              <p className="text-xs mt-1">Consulte o Calendário de Turmas para conhecer os próximos programas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e: any) => {
              const program = e.programs;
              const cls = e.program_classes;
              return (
                <Card key={e.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => program?.slug && navigate(`/programas/${program.slug}`)}>
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base">{program?.name || 'Programa'}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">Matriculado</Badge>
                      </div>
                      {program?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {cls && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {cls.name}
                          </span>
                        )}
                        {cls?.start_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {format(new Date(cls.start_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {cls.end_date && ` — ${format(new Date(cls.end_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          Matriculado em {format(new Date(e.enrolled_at), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
