import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, BookOpen, Layers, ExternalLink, FileText, FileIcon, ClipboardList, FolderOpen } from 'lucide-react';
import { useEffect } from 'react';
import { ProgramWelcomePopup } from '@/components/ProgramWelcomePopup';

const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  prework: { label: 'Pre-work', icon: ClipboardList },
  material: { label: 'Materiais', icon: FolderOpen },
  exercise: { label: 'Exercícios', icon: FileText },
};

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

  const { data: modules = [] } = useQuery({
    queryKey: ['program-modules', program?.id],
    enabled: !!program?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', program!.id)
        .order('order_number');
      return data || [];
    },
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['program-materials', program?.id],
    enabled: !!program?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('program_materials')
        .select('*')
        .eq('program_id', program!.id)
        .order('order_number');
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

  const getFileIcon = (fileType: string | null) => {
    if (fileType === 'link') return <ExternalLink className="w-4 h-4" />;
    if (fileType === 'pdf') return <FileText className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const renderMaterialItem = (m: any) => (
    <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="mt-0.5 text-muted-foreground">{getFileIcon(m.file_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{m.title}</p>
        {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
      </div>
      {m.file_url && (
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <a href={m.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      )}
    </div>
  );

  const renderMaterialsByCategory = (mats: any[]) => {
    const categories = ['prework', 'material', 'exercise'];
    const grouped = categories.map(cat => ({
      cat,
      items: mats.filter(m => (m.category || 'material') === cat),
    })).filter(g => g.items.length > 0);

    if (grouped.length === 0) return null;

    return (
      <div className="space-y-4">
        {grouped.map(({ cat, items }) => {
          const config = CATEGORY_LABELS[cat] || CATEGORY_LABELS.material;
          const Icon = config.icon;
          return (
            <div key={cat} className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {config.label}
              </h5>
              <div className="space-y-2">{items.map(renderMaterialItem)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const getMaterialsForModule = (moduleId: string) =>
    materials.filter((m: any) => m.module_id === moduleId);

  const unassignedMaterials = materials.filter((m: any) => !m.module_id);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{program.name}</h1>
          {program.description && <p className="text-muted-foreground text-sm mt-1">{program.description}</p>}
        </div>

        {/* Module-based content */}
        {modules.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Módulos
            </h2>
            <Tabs defaultValue={modules[0]?.id}>
              <TabsList className="flex-wrap h-auto gap-1">
                {modules.map((mod: any) => (
                  <TabsTrigger key={mod.id} value={mod.id} className="gap-1.5 text-xs">
                    {mod.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {modules.map((mod: any) => {
                const moduleMaterials = getMaterialsForModule(mod.id);
                return (
                  <TabsContent key={mod.id} value={mod.id} className="space-y-4 mt-4">
                    {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                    {renderMaterialsByCategory(moduleMaterials)}
                    {moduleMaterials.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum material disponível neste módulo ainda.
                      </p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}

        {/* Unassigned materials */}
        {unassignedMaterials.length > 0 && (
          <div className="space-y-4">
            {modules.length === 0 && (
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Materiais
              </h2>
            )}
            {renderMaterialsByCategory(unassignedMaterials)}
          </div>
        )}

        {/* Classes */}
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
