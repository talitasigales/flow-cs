ALTER TABLE public.program_classes
ADD COLUMN IF NOT EXISTS dilemmas_released boolean NOT NULL DEFAULT false;