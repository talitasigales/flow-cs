
-- Junction table for multiple modules per schedule
CREATE TABLE public.schedule_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, module_id)
);

ALTER TABLE public.schedule_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedule_modules"
  ON public.schedule_modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage schedule_modules"
  ON public.schedule_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing data from class_schedules.module_id
INSERT INTO public.schedule_modules (schedule_id, module_id)
SELECT id, module_id FROM public.class_schedules WHERE module_id IS NOT NULL;
