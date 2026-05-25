import { useEffect, useState } from 'react';
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
  const [csRole, setCsRole] = useState<CSRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCsRole(null);
      setRoleLoading(false);
      return;
    }
    (async () => {
      setRoleLoading(true);
      const { data, error } = await (supabase as any)
        .from('cs_user_access')
        .select('cs_role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) console.error('[useCSAccess]', error);
      setCsRole((data?.cs_role as CSRole) ?? null);
      setRoleLoading(false);
    })();
  }, [user, authLoading]);

  const loading = authLoading || adminLoading || roleLoading;


  const hasAccess = isAdmin || csRole !== null;
  const canManage = isAdmin || csRole === 'cs_admin';
  const canEdit = canManage || csRole === 'cs_editor';

  return { loading, hasAccess, csRole, canEdit, canManage };
}
