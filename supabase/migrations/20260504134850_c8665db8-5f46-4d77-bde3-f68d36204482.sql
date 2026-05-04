
-- Tabela de junção: especialistas por módulo dentro de uma turma
CREATE TABLE IF NOT EXISTS public.class_module_specialists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  module_id uuid NOT NULL,
  specialist_id uuid NOT NULL,
  order_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, module_id, specialist_id)
);

CREATE INDEX IF NOT EXISTS idx_cms_class_module ON public.class_module_specialists (class_id, module_id);
CREATE INDEX IF NOT EXISTS idx_cms_specialist ON public.class_module_specialists (specialist_id);

ALTER TABLE public.class_module_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view class module specialists"
  ON public.class_module_specialists FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage class module specialists"
  ON public.class_module_specialists FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
