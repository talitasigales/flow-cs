
-- Drop restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can view all responses" ON public.workshop_responses;
DROP POLICY IF EXISTS "Users can view own responses" ON public.workshop_responses;

-- Recreate as PERMISSIVE so either condition grants access
CREATE POLICY "Admins can view all responses" ON public.workshop_responses
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own responses" ON public.workshop_responses
  FOR SELECT TO public USING (auth.uid() = user_id);
