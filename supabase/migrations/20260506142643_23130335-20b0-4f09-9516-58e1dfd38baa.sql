ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS resilience_url text,
  ADD COLUMN IF NOT EXISTS dilemmas_url text;

ALTER TABLE public.pending_enrollments
  ADD COLUMN IF NOT EXISTS resilience_url text,
  ADD COLUMN IF NOT EXISTS dilemmas_url text;