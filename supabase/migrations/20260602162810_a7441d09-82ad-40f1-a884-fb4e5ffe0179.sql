CREATE TABLE public.pda_sinaleira_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL,
  account_name text NOT NULL,
  available_credits integer NOT NULL DEFAULT 0,
  used_credits_total integer NOT NULL DEFAULT 0,
  last_month_consumption integer NOT NULL DEFAULT 0,
  signal text NOT NULL DEFAULT 'unknown',
  credits_expiration date,
  account_expiration date,
  account_type text,
  alert text,
  consulted_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pda_sinaleira_snapshot_id ON public.pda_sinaleira_snapshot(snapshot_id);
CREATE INDEX idx_pda_sinaleira_consulted ON public.pda_sinaleira_snapshot(consulted_at DESC);

GRANT SELECT ON public.pda_sinaleira_snapshot TO authenticated;
GRANT ALL ON public.pda_sinaleira_snapshot TO service_role;

ALTER TABLE public.pda_sinaleira_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CS users can view sinaleira snapshot"
ON public.pda_sinaleira_snapshot
FOR SELECT
TO authenticated
USING (public.has_cs_access(auth.uid()));

CREATE POLICY "Admins manage sinaleira snapshot"
ON public.pda_sinaleira_snapshot
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));