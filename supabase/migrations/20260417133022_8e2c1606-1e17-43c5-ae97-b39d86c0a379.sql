-- 1. Enum de papel CS
CREATE TYPE public.cs_role AS ENUM ('cs_admin', 'cs_editor', 'cs_viewer');

-- 2. Tabela de controle de acesso ao módulo CS
CREATE TABLE public.cs_user_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cs_role public.cs_role NOT NULL DEFAULT 'cs_viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.cs_user_access ENABLE ROW LEVEL SECURITY;

-- 3. Funções SECURITY DEFINER (antes das policies)
CREATE OR REPLACE FUNCTION public.has_cs_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cs_user_access WHERE user_id = _user_id
  ) OR public.has_role(_user_id, 'admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.has_cs_role(_user_id uuid, _role public.cs_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.cs_user_access
    WHERE user_id = _user_id AND cs_role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_cs_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.cs_user_access
    WHERE user_id = _user_id AND cs_role = 'cs_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_cs_edit(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.cs_user_access
    WHERE user_id = _user_id AND cs_role IN ('cs_admin', 'cs_editor')
  );
$$;

-- 4. Policies para cs_user_access (apenas admins globais gerenciam)
CREATE POLICY "Admins can manage cs_user_access"
ON public.cs_user_access FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CS users can view own access"
ON public.cs_user_access FOR SELECT
USING (auth.uid() = user_id);

-- 5. Tabela de empresas
CREATE TABLE public.cs_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text,
  status text NOT NULL DEFAULT 'onboarding'
    CHECK (status IN ('onboarding', 'ativo', 'risco', 'churn', 'expansao')),
  start_date date,
  owner_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.cs_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CS users can view companies"
ON public.cs_companies FOR SELECT
USING (public.has_cs_access(auth.uid()));

CREATE POLICY "CS editors can insert companies"
ON public.cs_companies FOR INSERT
WITH CHECK (public.can_cs_edit(auth.uid()));

CREATE POLICY "CS editors can update companies"
ON public.cs_companies FOR UPDATE
USING (
  public.is_cs_admin(auth.uid())
  OR (public.can_cs_edit(auth.uid()) AND owner_user_id = auth.uid())
);

CREATE POLICY "CS admins can delete companies"
ON public.cs_companies FOR DELETE
USING (public.is_cs_admin(auth.uid()));

-- 6. Tabela de contatos
CREATE TABLE public.cs_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.cs_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  role_title text,
  email text,
  phone text,
  influence text NOT NULL DEFAULT 'usuario'
    CHECK (influence IN ('decisor', 'influenciador', 'usuario')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CS users can view contacts"
ON public.cs_contacts FOR SELECT
USING (public.has_cs_access(auth.uid()));

CREATE POLICY "CS editors can insert contacts"
ON public.cs_contacts FOR INSERT
WITH CHECK (public.can_cs_edit(auth.uid()));

CREATE POLICY "CS editors can update contacts"
ON public.cs_contacts FOR UPDATE
USING (public.can_cs_edit(auth.uid()));

CREATE POLICY "CS admins can delete contacts"
ON public.cs_contacts FOR DELETE
USING (public.is_cs_admin(auth.uid()));

-- 7. Tabela de touchpoints (timeline)
CREATE TABLE public.cs_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.cs_companies(id) ON DELETE CASCADE,
  owner_user_id uuid,
  type text NOT NULL DEFAULT 'outro'
    CHECK (type IN ('reuniao_estrategica','onboarding','apresentacao','construcao_cargo','visita','follow_up','suporte','expansao','outro')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'realizado'
    CHECK (status IN ('realizado','agendado','cancelado')),
  title text,
  description text,
  tags text[] DEFAULT ARRAY[]::text[],
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cs_touchpoints_company_occurred ON public.cs_touchpoints(company_id, occurred_at DESC);
CREATE INDEX idx_cs_touchpoints_type ON public.cs_touchpoints(type);
CREATE INDEX idx_cs_companies_status ON public.cs_companies(status);
CREATE INDEX idx_cs_companies_owner ON public.cs_companies(owner_user_id);
CREATE INDEX idx_cs_contacts_company ON public.cs_contacts(company_id);

CREATE POLICY "CS users can view touchpoints"
ON public.cs_touchpoints FOR SELECT
USING (public.has_cs_access(auth.uid()));

CREATE POLICY "CS editors can insert touchpoints"
ON public.cs_touchpoints FOR INSERT
WITH CHECK (public.can_cs_edit(auth.uid()));

CREATE POLICY "CS editors can update touchpoints"
ON public.cs_touchpoints FOR UPDATE
USING (
  public.is_cs_admin(auth.uid())
  OR (public.can_cs_edit(auth.uid()) AND owner_user_id = auth.uid())
);

CREATE POLICY "CS admins can delete touchpoints"
ON public.cs_touchpoints FOR DELETE
USING (public.is_cs_admin(auth.uid()));

-- 8. Tabela N:N touchpoint x contato
CREATE TABLE public.cs_touchpoint_contacts (
  touchpoint_id uuid NOT NULL REFERENCES public.cs_touchpoints(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.cs_contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (touchpoint_id, contact_id)
);

ALTER TABLE public.cs_touchpoint_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CS users can view touchpoint_contacts"
ON public.cs_touchpoint_contacts FOR SELECT
USING (public.has_cs_access(auth.uid()));

CREATE POLICY "CS editors can manage touchpoint_contacts"
ON public.cs_touchpoint_contacts FOR ALL
USING (public.can_cs_edit(auth.uid()))
WITH CHECK (public.can_cs_edit(auth.uid()));

-- 9. Triggers de updated_at
CREATE TRIGGER trg_cs_companies_updated_at
BEFORE UPDATE ON public.cs_companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cs_contacts_updated_at
BEFORE UPDATE ON public.cs_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cs_touchpoints_updated_at
BEFORE UPDATE ON public.cs_touchpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Triggers de auditoria
CREATE TRIGGER trg_cs_companies_audit
AFTER INSERT OR UPDATE OR DELETE ON public.cs_companies
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trg_cs_contacts_audit
AFTER INSERT OR UPDATE OR DELETE ON public.cs_contacts
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trg_cs_touchpoints_audit
AFTER INSERT OR UPDATE OR DELETE ON public.cs_touchpoints
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER trg_cs_user_access_audit
AFTER INSERT OR UPDATE OR DELETE ON public.cs_user_access
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();