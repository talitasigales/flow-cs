import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { exportJobProfile } from '@/utils/exportUtils';
import { ResultDisplay } from '@/components/job-construction';
import { JobProfileScores } from '@/utils/jobProfileCalculator';

export default function JobConstructionResult() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scores = location.state?.scores as JobProfileScores | undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!scores) {
    navigate('/job-construction');
    return null;
  }

  const handleNewAnalysis = () => {
    navigate('/job-construction');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/job-construction')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Questionário
            </Button>

            {/* Result Display */}
            <ResultDisplay scores={scores} />

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                onClick={() => {
                  exportJobProfile(scores);
                  toast.success('Perfil exportado com sucesso!');
                }}
                variant="outline"
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Exportar
              </Button>
              <Button 
                onClick={handleNewAnalysis}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Nova Análise
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
