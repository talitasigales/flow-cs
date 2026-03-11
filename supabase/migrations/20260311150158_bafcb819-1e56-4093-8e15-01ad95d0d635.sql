
-- Bussola tables

-- Assignments: psychologist <-> young user
CREATE TABLE public.bussola_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id uuid NOT NULL,
  young_user_id uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (psychologist_id, young_user_id, program_id)
);
ALTER TABLE public.bussola_assignments ENABLE ROW LEVEL SECURITY;

-- Sessions: encounter tracking
CREATE TABLE public.bussola_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  young_user_id uuid NOT NULL,
  psychologist_user_id uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  encounter_number integer NOT NULL CHECK (encounter_number BETWEEN 0 AND 5),
  status text NOT NULL DEFAULT 'pending',
  scheduled_date date,
  completed_at timestamptz,
  notes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (young_user_id, program_id, encounter_number)
);
ALTER TABLE public.bussola_sessions ENABLE ROW LEVEL SECURITY;

-- Workbooks: form responses
CREATE TABLE public.bussola_workbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  encounter_number integer NOT NULL CHECK (encounter_number BETWEEN 0 AND 5),
  is_prework boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, encounter_number, is_prework)
);
ALTER TABLE public.bussola_workbooks ENABLE ROW LEVEL SECURITY;

-- RLS: bussola_assignments
CREATE POLICY "Admins can manage assignments" ON public.bussola_assignments FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Psychologists can view own assignments" ON public.bussola_assignments FOR SELECT USING (auth.uid() = psychologist_id);
CREATE POLICY "Young users can view own assignment" ON public.bussola_assignments FOR SELECT USING (auth.uid() = young_user_id);

-- RLS: bussola_sessions
CREATE POLICY "Admins can manage sessions" ON public.bussola_sessions FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Psychologists can manage own sessions" ON public.bussola_sessions FOR ALL USING (auth.uid() = psychologist_user_id) WITH CHECK (auth.uid() = psychologist_user_id);
CREATE POLICY "Young users can view own sessions" ON public.bussola_sessions FOR SELECT USING (auth.uid() = young_user_id);

-- RLS: bussola_workbooks
CREATE POLICY "Young users can manage own workbooks" ON public.bussola_workbooks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all workbooks" ON public.bussola_workbooks FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Psychologists can view assigned young workbooks" ON public.bussola_workbooks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bussola_assignments
    WHERE bussola_assignments.psychologist_id = auth.uid()
    AND bussola_assignments.young_user_id = bussola_workbooks.user_id
  )
);

-- Seed: create Bussola program
INSERT INTO public.programs (name, slug, description, active)
VALUES ('Bússola', 'bussola', 'Programa de orientação vocacional para jovens, conduzido por psicólogos especializados. 5 encontros de 60 minutos com pré e pós-trabalhos.', true);

-- Updated_at triggers
CREATE TRIGGER update_bussola_sessions_updated_at BEFORE UPDATE ON public.bussola_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bussola_workbooks_updated_at BEFORE UPDATE ON public.bussola_workbooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
