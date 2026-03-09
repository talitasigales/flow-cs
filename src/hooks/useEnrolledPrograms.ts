import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useEnrolledPrograms() {
  const { user } = useAuth();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrolled-programs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_enrollments')
        .select('program_id, programs(id, name, slug, active)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || [])
        .filter((e: any) => e.programs?.active)
        .map((e: any) => e.programs);
    },
  });

  return { enrollments, isLoading, isEnrolled: enrollments.length > 0 };
}
