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
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [csRole, setCsRole] = useState<CSRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCsRole(null);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from('cs_user_access')
        .select('cs_role')
        .eq('user_id', user.id)
        .maybeSingle();
      setCsRole((data?.cs_role as CSRole) ?? null);
      setLoading(false);
    })();
  }, [user]);

  const hasAccess = isAdmin || csRole !== null;
  const canManage = isAdmin || csRole === 'cs_admin';
  const canEdit = canManage || csRole === 'cs_editor';

  return { loading, hasAccess, csRole, canEdit, canManage };
}
