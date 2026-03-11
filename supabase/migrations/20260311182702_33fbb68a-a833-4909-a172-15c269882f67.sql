ALTER TABLE public.bussola_assignments 
ADD COLUMN encounter_count integer NOT NULL DEFAULT 5,
ADD COLUMN status text NOT NULL DEFAULT 'active',
ADD COLUMN young_name text,
ADD COLUMN young_email text;