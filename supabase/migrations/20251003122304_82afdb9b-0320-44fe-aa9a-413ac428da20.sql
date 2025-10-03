-- Add DELETE policy for profile_evolution table
CREATE POLICY "Users can delete their own evolution data"
ON public.profile_evolution
FOR DELETE
USING (auth.uid() = user_id);