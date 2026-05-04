ALTER TABLE public.program_classes
  ADD COLUMN IF NOT EXISTS pda_report_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resilience_url TEXT,
  ADD COLUMN IF NOT EXISTS dilemmas_url TEXT;