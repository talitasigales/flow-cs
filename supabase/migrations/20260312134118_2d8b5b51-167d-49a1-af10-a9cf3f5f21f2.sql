
-- 1. Create bussola_payments table for audit/dedup
CREATE TABLE public.bussola_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dom_transaction_id text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  encounter_count integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'approved',
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bussola_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments"
  ON public.bussola_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert payments"
  ON public.bussola_payments FOR INSERT
  WITH CHECK (true);

-- 2. Make psychologist_id nullable on bussola_assignments
ALTER TABLE public.bussola_assignments ALTER COLUMN psychologist_id DROP NOT NULL;
