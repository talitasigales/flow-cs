CREATE TABLE public.message_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.program_classes(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  user_id uuid,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  channel text NOT NULL,
  message_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  provider_response jsonb,
  session_date date,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.message_delivery_logs TO authenticated;
GRANT ALL ON public.message_delivery_logs TO service_role;

ALTER TABLE public.message_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view delivery logs"
ON public.message_delivery_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mdl_class ON public.message_delivery_logs(class_id, created_at DESC);
CREATE INDEX idx_mdl_created ON public.message_delivery_logs(created_at DESC);

CREATE TRIGGER update_message_delivery_logs_updated_at
BEFORE UPDATE ON public.message_delivery_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();