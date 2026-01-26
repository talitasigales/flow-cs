-- ============================================
-- CORREÇÕES DE SEGURANÇA
-- ============================================

-- 1. Corrigir search_path da função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Remover política permissiva de audit_logs e criar uma mais restritiva
DROP POLICY IF EXISTS "System can insert logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);