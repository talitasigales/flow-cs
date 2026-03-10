
-- Junction table: which modules belong to which class
CREATE TABLE public.class_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.program_classes(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(class_id, module_id)
);

ALTER TABLE public.class_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class_modules" ON public.class_modules
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view class_modules" ON public.class_modules
  FOR SELECT TO authenticated
  USING (true);
