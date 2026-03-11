CREATE POLICY "Psychologists can insert assignments" ON public.bussola_assignments
FOR INSERT TO public
WITH CHECK (auth.uid() = psychologist_id);

CREATE POLICY "Psychologists can delete own assignments" ON public.bussola_assignments
FOR DELETE TO public
USING (auth.uid() = psychologist_id);