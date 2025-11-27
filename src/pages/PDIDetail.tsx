import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { PDA_AXES } from '@/data/pdiTemplates';

export default function PDIDetail() {
  const { pdiId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pdi, setPdi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && pdiId) {
      fetchPDI();
    }
  }, [user, pdiId]);

  const fetchPDI = async () => {
    try {
      const { data, error } = await supabase
        .from('pdis')
        .select('*')
        .eq('id', pdiId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setPdi(data);
    } catch (error) {
      console.error('Erro ao carregar PDI:', error);
      toast.error('Erro ao carregar PDI');
      navigate('/pdi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando PDI...</p>
        </div>
      </div>
    );
  }

  if (!pdi) return null;

  const axisInfo = PDA_AXES[pdi.pda_axis];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/pdi')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">PDI - {pdi.employee_name}</h1>
                <p className="text-muted-foreground">{pdi.employee_role}</p>
              </div>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Eixo PDA</p>
                  <p className="font-medium">{axisInfo?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="font-medium">{pdi.overall_progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
