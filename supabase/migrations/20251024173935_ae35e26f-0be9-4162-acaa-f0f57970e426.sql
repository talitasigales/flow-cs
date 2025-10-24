-- Update matriz_9box table to use 0-100 scale for both performance and role fit

-- Modify performance_score to use 0-100 scale
ALTER TABLE public.matriz_9box 
  ALTER COLUMN performance_score TYPE NUMERIC(5,2);

-- Add check constraints for the new ranges
ALTER TABLE public.matriz_9box 
  ADD CONSTRAINT performance_score_range CHECK (performance_score >= 0 AND performance_score <= 100);

ALTER TABLE public.matriz_9box 
  ADD CONSTRAINT role_fit_score_range CHECK (role_fit_score >= 0 AND role_fit_score <= 100);

-- Add missing UPDATE policy for matriz_9box if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'matriz_9box' 
    AND policyname = 'Users can update their own matriz data'
  ) THEN
    CREATE POLICY "Users can update their own matriz data"
      ON public.matriz_9box
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;