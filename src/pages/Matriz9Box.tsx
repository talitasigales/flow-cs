import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Matriz9Box = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-muted/30 border border-border/50 rounded-2xl p-10 max-w-md space-y-4">
          <Construction className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Matriz 9Box em Manutenção</h1>
          <p className="text-muted-foreground">
            Esta ferramenta está temporariamente indisponível enquanto realizamos melhorias. Voltaremos em breve!
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Matriz9Box;
