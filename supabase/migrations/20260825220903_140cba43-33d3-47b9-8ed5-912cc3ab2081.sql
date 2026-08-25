CREATE TABLE IF NOT EXISTS public.class_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.program_classes(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_start_time time,
  reminder_type text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  recipients_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, session_date, reminder_type, channel)
);

GRANT SELECT ON public.class_reminder_logs TO authenticated;
GRANT ALL ON public.class_reminder_logs TO service_role;

ALTER TABLE public.class_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder logs"
ON public.class_reminder_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));