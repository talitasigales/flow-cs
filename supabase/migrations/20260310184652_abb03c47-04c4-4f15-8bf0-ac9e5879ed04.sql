
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.program_classes(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.program_modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class schedules" ON public.class_schedules
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view class schedules" ON public.class_schedules
  FOR SELECT TO authenticated
  USING (true);
