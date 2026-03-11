import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useRef } from 'react';

interface UseBussolaWorkbookOptions {
  programId: string;
  encounterNumber: number;
  isPrework?: boolean;
}

export function useBussolaWorkbook({ programId, encounterNumber, isPrework = false }: UseBussolaWorkbookOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const queryKey = ['bussola-workbook', user?.id, programId, encounterNumber, isPrework];

  const { data: workbook, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('bussola_workbooks' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .eq('encounter_number', encounterNumber)
        .eq('is_prework', isPrework)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!programId,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: Record<string, any>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('bussola_workbooks' as any)
        .upsert({
          user_id: user.id,
          program_id: programId,
          encounter_number: encounterNumber,
          is_prework: isPrework,
          data: formData,
        }, { onConflict: 'user_id,program_id,encounter_number,is_prework' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const autoSave = useCallback((formData: Record<string, any>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(formData);
    }, 1500);
  }, [saveMutation]);

  const saveNow = useCallback((formData: Record<string, any>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveMutation.mutate(formData);
  }, [saveMutation]);

  return {
    data: (workbook as any)?.data as Record<string, any> | undefined,
    isLoading,
    isSaving: saveMutation.isPending,
    autoSave,
    saveNow,
  };
}
