
-- Create program_modules table
CREATE TABLE public.program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage program modules" ON public.program_modules
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view program modules" ON public.program_modules
  FOR SELECT TO authenticated
  USING (true);

-- Add module_id and category to program_materials
ALTER TABLE public.program_materials
  ADD COLUMN module_id UUID REFERENCES public.program_modules(id) ON DELETE CASCADE,
  ADD COLUMN category TEXT DEFAULT 'material';
