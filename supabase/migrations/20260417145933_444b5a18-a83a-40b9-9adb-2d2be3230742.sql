-- 1. cs_integrations
CREATE TABLE public.cs_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  last_full_sync_at timestamptz,
  last_delta_sync_at timestamptz,
  sync_frequency_minutes integer NOT NULL DEFAULT 30,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integrations"
  ON public.cs_integrations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cs_integrations_updated_at
  BEFORE UPDATE ON public.cs_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cs_integrations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.cs_integrations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 2. cs_sync_logs
CREATE TABLE public.cs_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  run_type text NOT NULL,
  status text NOT NULL,
  companies_imported integer NOT NULL DEFAULT 0,
  contacts_imported integer NOT NULL DEFAULT 0,
  touchpoints_imported integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  triggered_by uuid
);

ALTER TABLE public.cs_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sync logs"
  ON public.cs_sync_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert sync logs"
  ON public.cs_sync_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cs_sync_logs_started_at ON public.cs_sync_logs(started_at DESC);

-- 3. external columns on existing tables
ALTER TABLE public.cs_companies
  ADD COLUMN external_provider text,
  ADD COLUMN external_id text,
  ADD COLUMN external_data jsonb,
  ADD COLUMN last_synced_at timestamptz;

CREATE UNIQUE INDEX idx_cs_companies_external
  ON public.cs_companies(external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

ALTER TABLE public.cs_contacts
  ADD COLUMN external_provider text,
  ADD COLUMN external_id text,
  ADD COLUMN external_data jsonb,
  ADD COLUMN last_synced_at timestamptz;

CREATE UNIQUE INDEX idx_cs_contacts_external
  ON public.cs_contacts(external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

ALTER TABLE public.cs_touchpoints
  ADD COLUMN external_provider text,
  ADD COLUMN external_id text,
  ADD COLUMN external_data jsonb;

CREATE UNIQUE INDEX idx_cs_touchpoints_external
  ON public.cs_touchpoints(external_provider, external_id)
  WHERE external_provider IS NOT NULL AND external_id IS NOT NULL;

-- 4. Seed inactive RD CRM integration row
INSERT INTO public.cs_integrations (provider, is_active, sync_frequency_minutes)
VALUES ('rd_crm', false, 30)
ON CONFLICT (provider) DO NOTHING;

-- 5. Cron job (pg_cron + pg_net) — calls edge function every 30min
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'rd-crm-delta-sync',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hapzzpwywnahovmddlej.supabase.co/functions/v1/rd-crm-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-trigger', 'true'
    ),
    body := jsonb_build_object('run_type', 'delta')
  ) AS request_id;
  $$
);