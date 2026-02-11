
-- Atualizar a função para SECURITY DEFINER para bypassar RLS
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Adicionar triggers faltantes para checkins e closures
DROP TRIGGER IF EXISTS audit_pdi_checkins ON public.pdi_checkins;
CREATE TRIGGER audit_pdi_checkins AFTER INSERT OR UPDATE OR DELETE ON public.pdi_checkins
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_pdi_closures ON public.pdi_closures;
CREATE TRIGGER audit_pdi_closures AFTER INSERT OR UPDATE OR DELETE ON public.pdi_closures
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
