-- Drop the old restrictive constraint
ALTER TABLE public.pdis DROP CONSTRAINT IF EXISTS pdis_status_check;

-- Add new constraint with all statuses the app needs
ALTER TABLE public.pdis ADD CONSTRAINT pdis_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'devolutiva'::text, 'construcao'::text, 'acompanhamento'::text, 'fechamento'::text, 'completed'::text, 'cancelled'::text]));

-- Update any existing PDIs with status 'active' to 'devolutiva' if they were created from the wizard (stage 2)
UPDATE public.pdis SET status = 'devolutiva' WHERE status = 'active' AND current_stage = 2;