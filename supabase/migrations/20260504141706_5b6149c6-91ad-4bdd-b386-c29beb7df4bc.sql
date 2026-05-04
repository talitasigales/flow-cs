-- Tabela de especialistas padrão por módulo (vale para todas as turmas)
CREATE TABLE IF NOT EXISTS public.module_default_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  specialist_id UUID NOT NULL,
  order_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, specialist_id)
);

CREATE INDEX IF NOT EXISTS idx_mds_module ON public.module_default_specialists(module_id);

ALTER TABLE public.module_default_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view module default specialists"
  ON public.module_default_specialists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage module default specialists"
  ON public.module_default_specialists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: ao inserir/atualizar/deletar especialistas padrão de um módulo,
-- replicar para todas as turmas que já contêm esse módulo (class_modules)
CREATE OR REPLACE FUNCTION public.sync_module_specialists_to_classes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _module_id := OLD.module_id;
  ELSE
    _module_id := NEW.module_id;
  END IF;

  -- Reescreve class_module_specialists para esse módulo em todas as turmas que o possuem
  DELETE FROM public.class_module_specialists
   WHERE module_id = _module_id
     AND class_id IN (SELECT class_id FROM public.class_modules WHERE module_id = _module_id);

  INSERT INTO public.class_module_specialists (class_id, module_id, specialist_id, order_number)
  SELECT cm.class_id, mds.module_id, mds.specialist_id, mds.order_number
    FROM public.class_modules cm
    JOIN public.module_default_specialists mds ON mds.module_id = cm.module_id
   WHERE cm.module_id = _module_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_mds_iud ON public.module_default_specialists;
CREATE TRIGGER trg_sync_mds_iud
AFTER INSERT OR UPDATE OR DELETE ON public.module_default_specialists
FOR EACH ROW EXECUTE FUNCTION public.sync_module_specialists_to_classes();

-- Trigger: quando um módulo é adicionado a uma turma (class_modules INSERT),
-- aplicar automaticamente os especialistas padrão do módulo
CREATE OR REPLACE FUNCTION public.apply_default_specialists_on_class_module()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.class_module_specialists (class_id, module_id, specialist_id, order_number)
  SELECT NEW.class_id, NEW.module_id, mds.specialist_id, mds.order_number
    FROM public.module_default_specialists mds
   WHERE mds.module_id = NEW.module_id
  ON CONFLICT (class_id, module_id, specialist_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_default_specialists ON public.class_modules;
CREATE TRIGGER trg_apply_default_specialists
AFTER INSERT ON public.class_modules
FOR EACH ROW EXECUTE FUNCTION public.apply_default_specialists_on_class_module();