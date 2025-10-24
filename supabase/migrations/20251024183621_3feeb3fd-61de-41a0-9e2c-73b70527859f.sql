-- Add UPDATE policy for profile_evolution table
CREATE POLICY "Users can update their own evolution data"
ON profile_evolution
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);