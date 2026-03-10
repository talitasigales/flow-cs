
-- Table for dynamic exercises within modules
CREATE TABLE public.module_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  exercise_type TEXT NOT NULL DEFAULT 'open_text', -- open_text, multiple_choice, scale, yes_no, checklist
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.module_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage module exercises" ON public.module_exercises
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view module exercises" ON public.module_exercises
  FOR SELECT TO authenticated
  USING (true);

-- Table for exercise responses
CREATE TABLE public.exercise_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.module_exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exercise responses" ON public.exercise_responses
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise responses" ON public.exercise_responses
  FOR UPDATE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own exercise responses" ON public.exercise_responses
  FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exercise responses" ON public.exercise_responses
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for linking platform features to modules
CREATE TABLE public.module_feature_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- pdi, job-construction, matriz-9box, profile-evolution, community, webinars, chat-nanda, members
  label TEXT, -- custom label override
  description TEXT, -- custom description
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.module_feature_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage module feature links" ON public.module_feature_links
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view module feature links" ON public.module_feature_links
  FOR SELECT TO authenticated
  USING (true);
