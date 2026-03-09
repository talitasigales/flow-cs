
-- 1. Programs catalog
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active programs" ON public.programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert programs" ON public.programs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update programs" ON public.programs
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete programs" ON public.programs
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Enrollments
CREATE TABLE public.program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id)
);

ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" ON public.program_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON public.program_enrollments
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert enrollments" ON public.program_enrollments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete enrollments" ON public.program_enrollments
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Workshop responses
CREATE TABLE public.workshop_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id)
);

ALTER TABLE public.workshop_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own responses" ON public.workshop_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON public.workshop_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON public.workshop_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses" ON public.workshop_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Program events (cross-sell calendar)
CREATE TABLE public.program_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  location text,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view events" ON public.program_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert events" ON public.program_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events" ON public.program_events
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events" ON public.program_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed Líder 360
INSERT INTO public.programs (name, description, slug)
VALUES ('Líder 360', 'Workshop de Autogestão — Questionário de Autoconhecimento para líderes', 'lider-360');
