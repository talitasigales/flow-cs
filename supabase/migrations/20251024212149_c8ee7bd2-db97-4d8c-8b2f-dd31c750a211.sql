-- Allow admins to view all matriz_9box data
CREATE POLICY "Admins can view all matriz data"
ON public.matriz_9box
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profile_evolution data
CREATE POLICY "Admins can view all evolution data"
ON public.profile_evolution
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));