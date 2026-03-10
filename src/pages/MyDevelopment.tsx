import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrolledPrograms } from '@/hooks/useEnrolledPrograms';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export default function MyDevelopment() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { enrollments, isLoading } = useEnrolledPrograms();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  // Redirect to first enrolled program
  useEffect(() => {
    if (!isLoading && enrollments.length > 0) {
      navigate(`/programas/${enrollments[0].slug}`, { replace: true });
    }
  }, [isLoading, enrollments, navigate]);

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
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Você ainda não está matriculado em nenhum programa.</p>
            <p className="text-xs mt-1">Consulte o Calendário de Turmas para conhecer os próximos programas.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
