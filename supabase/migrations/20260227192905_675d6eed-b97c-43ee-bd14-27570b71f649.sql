-- Allow users to read their own audit logs for the activity history feature
CREATE POLICY "Users can view own logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);