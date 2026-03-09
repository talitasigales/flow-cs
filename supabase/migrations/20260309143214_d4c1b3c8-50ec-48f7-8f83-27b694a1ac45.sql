
-- Create program_classes table
CREATE TABLE public.program_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage classes" ON public.program_classes FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view classes" ON public.program_classes FOR SELECT TO authenticated
  USING (true);

-- Add class_id to program_enrollments
ALTER TABLE public.program_enrollments ADD COLUMN class_id uuid REFERENCES public.program_classes(id) ON DELETE SET NULL;

-- Insert 5 new programs
INSERT INTO public.programs (name, slug, description, active) VALUES
  ('NR1 Aplicada à Liderança', 'nr1-lideranca', 'Programa de NR1 aplicada à liderança organizacional', true),
  ('Certificação Analista PDA', 'certificacao-pda', 'Certificação para analistas PDA', true),
  ('Master Líder', 'master-lider', 'Programa avançado de desenvolvimento de liderança', true),
  ('Entrevista por Competências', 'entrevista-competencias', 'Workshop de entrevista por competências', true),
  ('Inteligência Comportamental para Vendas', 'inteligencia-vendas', 'Programa de inteligência comportamental aplicada a vendas', true);
