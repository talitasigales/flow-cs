-- Fix notifications INSERT policy: restrict actor_id to auth.uid()
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications as actor"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Fix bussola_payments: remove permissive INSERT, restrict to admin only  
DROP POLICY IF EXISTS "Authenticated can insert payments" ON public.bussola_payments;
CREATE POLICY "Only admins can insert payments"
  ON public.bussola_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));