import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export type CSRole = 'cs_admin' | 'cs_editor' | 'cs_viewer';

interface CSAccess {
  loading: boolean;
  hasAccess: boolean;
  csRole: CSRole | null;
  canEdit: boolean;
  canManage: boolean; // cs_admin or global admin
}

export function useCSAccess(): CSAccess {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const { data: csRole = null, isLoading: roleQueryLoading, isFetched } = useQuery({
    queryKey: ['cs-user-access', user?.id],
    enabled: !!user?.id && !authLoading,
    staleTime: 60_000,
    queryFn: async (): Promise<CSRole | null> => {
      const { data, error } = await (supabase as any)
        .from('cs_user_access')
        .select('cs_role')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) {
        console.error('[useCSAccess]', error);
        return null;
      }
      return (data?.cs_role as CSRole) ?? null;
    },
  });

  // While we don't have a definitive answer yet, treat as loading.
  // This prevents premature "no access" redirects right after mount.
  const roleLoading = !user
    ? authLoading
    : (roleQueryLoading || !isFetched);

  const loading = authLoading || adminLoading || roleLoading;

  const hasAccess = isAdmin || csRole !== null;
  const canManage = isAdmin || csRole === 'cs_admin';
  const canEdit = canManage || csRole === 'cs_editor';

  return { loading, hasAccess, csRole, canEdit, canManage };
}
