ALTER TABLE public.program_classes
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_reminder_1h_sent_at timestamptz;