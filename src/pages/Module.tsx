import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, Play, FileText } from 'lucide-react';
import { toast } from 'sonner';
interface Module {
  id: string;
  title: string;
  description: string;
  module_order: number;
  video_url: string;
  materials: any;
}
interface UserProgress {
  id?: string;
  module_id: string;
  completed: boolean;
  video_watched: boolean;
  materials_downloaded: string[];
  completed_at?: string;
}
export default function Module() {
  const {
    moduleId
  } = useParams<{
    moduleId: string;
  }>();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (user && moduleId) {
      fetchModuleData();
    }
  }, [user, moduleId]);
  const fetchModuleData = async () => {
    try {
      // Fetch all modules for navigation
      const {
        data: modulesData,
        error: modulesError
      } = await supabase.from('modules').select('*').order('module_order');
      if (modulesError) throw modulesError;
      setAllModules(modulesData || []);

      // Fetch current module
      const {
        data: moduleData,
        error: moduleError
      } = await supabase.from('modules').select('*').eq('id', moduleId).single();
      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Fetch user progress
      const {
        data: progressData,
        error: progressError
      } = await supabase.from('user_progress').select('*').eq('user_id', user?.id).eq('module_id', moduleId).maybeSingle();
      if (progressError) throw progressError;
      if (progressData) {
        setProgress(progressData);
      } else {
        // Create initial progress record
        const {
          data: newProgress,
          error: createError
        } = await supabase.from('user_progress').insert({
          user_id: user?.id,
          module_id: moduleId,
          completed: false,
          video_watched: false,
          materials_downloaded: []
        }).select().single();
        if (createError) throw createError;
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error fetching module data:', error);
      toast.error('Erro ao carregar módulo');
    } finally {
      setLoading(false);
    }
  };
  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!progress || !user) return;
    try {
      const {
        error
      } = await supabase.from('user_progress').update(updates).eq('id', progress.id);
      if (error) throw error;
      setProgress({
        ...progress,
        ...updates
      });
      toast.success('Progresso atualizado!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };
  const markVideoWatched = () => {
    updateProgress({
      video_watched: true
    });
  };
  const markModuleComplete = () => {
    updateProgress({
      completed: true,
      completed_at: new Date().toISOString()
    });
  };
  const downloadMaterial = (materialTitle: string, materialUrl: string) => {
    const currentDownloaded = progress?.materials_downloaded || [];
    if (!currentDownloaded.includes(materialTitle)) {
      updateProgress({
        materials_downloaded: [...currentDownloaded, materialTitle]
      });
    }
    window.open(materialUrl, '_blank');
  };
  const getCurrentModuleIndex = () => {
    return allModules.findIndex(m => m.id === moduleId);
  };
  const navigateToModule = (direction: 'prev' | 'next') => {
    const currentIndex = getCurrentModuleIndex();
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < allModules.length) {
      navigate(`/module/${allModules[targetIndex].id}`);
    }
  };
  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>;
  }
  if (!module) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Módulo não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>;
  }
  const currentIndex = getCurrentModuleIndex();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allModules.length - 1;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Módulo {module.module_order} de {allModules.length}
              </span>
              <Progress value={module.module_order / allModules.length * 100} className="w-24" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Módulo {module.module_order}
              </h1>
              <p className="text-lg text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
            {progress?.completed && <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Completo</span>
              </div>}
          </div>
        </div>

        {/* Video Section */}
        <Card className="mb-8 gradient-card border-border/50">
          <CardHeader>
            
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
              {module.video_url ? <iframe src={module.video_url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onLoad={markVideoWatched} /> : <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Vídeo em breve</p>
                </div>}
            </div>
            {!progress?.video_watched && module.video_url && <Button onClick={markVideoWatched} variant="outline" size="sm">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar como assistido
              </Button>}
            {progress?.video_watched && <div className="flex items-center gap-2 text-primary text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Vídeo assistido
              </div>}
          </CardContent>
        </Card>

        {/* Materials Section */}
        {module.materials && module.materials.length > 0 && <Card className="mb-8 gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Materiais do Módulo
              </CardTitle>
              <CardDescription>
                Baixe os materiais complementares para este módulo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {module.materials.map((material, index) => {
              const isDownloaded = progress?.materials_downloaded?.includes(material.title);
              return <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{material.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {material.type}
                          </p>
                        </div>
                      </div>
                      <Button variant={isDownloaded ? 'outline' : 'default'} size="sm" onClick={() => downloadMaterial(material.title, material.url)}>
                        <Download className="mr-2 h-4 w-4" />
                        {isDownloaded ? 'Baixado' : 'Baixar'}
                      </Button>
                    </div>;
            })}
              </div>
            </CardContent>
          </Card>}

        {/* Complete Module Section */}
        {!progress?.completed && <Card className="mb-8 border-primary/50 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Finalizou?</h3>
                  <p className="text-sm text-muted-foreground">
                    Marque como completo para continuar sua jornada
                  </p>
                </div>
                <Button onClick={markModuleComplete} size="lg" className="gradient-primary">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Marcar como Completo
                </Button>
              </div>
            </CardContent>
          </Card>}

        <Separator className="my-8" />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          
          <Button onClick={() => navigate('/dashboard')} variant="ghost">
            Ver Todos os Módulos
          </Button>
          <Button variant="outline" onClick={() => navigateToModule('next')} disabled={!hasNext}>
            Próximo módulo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}