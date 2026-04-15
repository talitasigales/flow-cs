
CREATE TABLE public.csat_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trigger_type text NOT NULL, -- 'login_5th', 'module_complete', 'first_use_feature'
  trigger_reference text DEFAULT '', -- module_id, feature_key, etc.
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own csat responses"
  ON public.csat_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own csat responses"
  ON public.csat_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own csat responses"
  ON public.csat_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all csat responses"
  ON public.csat_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_csat_user_trigger ON public.csat_responses (user_id, trigger_type, trigger_reference);
