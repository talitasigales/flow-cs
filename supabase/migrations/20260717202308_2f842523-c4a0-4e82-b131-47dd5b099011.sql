
ALTER TABLE public.program_classes
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS whatsapp_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_30min_sent_at timestamptz;

ALTER TABLE public.pending_enrollments
  ADD COLUMN IF NOT EXISTS phone text;
