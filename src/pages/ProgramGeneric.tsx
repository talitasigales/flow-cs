import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { useEffect } from 'react';
import { ProgramWelcomePopup } from '@/components/ProgramWelcomePopup';
import { ProgramDevelopmentContent } from '@/components/academy/ProgramDevelopmentContent';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
      <ProgramWelcomePopup programId={program.id} />
      <div className="max-w-6xl mx-auto">
        <ProgramDevelopmentContent programSlug={slug!} />
      </div>
    </AppLayout>
  );
}
