
CREATE TABLE public.job_constructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text DEFAULT '',
  r_score integer NOT NULL,
  e_score integer NOT NULL,
  p_score integer NOT NULL,
  n_score integer NOT NULL,
  a_score integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_constructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job constructions"
  ON public.job_constructions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job constructions"
  ON public.job_constructions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job constructions"
  ON public.job_constructions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all job constructions"
  ON public.job_constructions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
