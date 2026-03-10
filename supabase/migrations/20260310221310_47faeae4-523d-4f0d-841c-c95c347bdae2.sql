
CREATE TABLE public.pda_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.pda_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PDA reports" ON public.pda_reports
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDA reports" ON public.pda_reports
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PDA reports" ON public.pda_reports
  FOR UPDATE TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDA reports" ON public.pda_reports
  FOR DELETE TO public USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all PDA reports" ON public.pda_reports
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'));
