
-- Campos de perfil PDA público
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_profile_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_dominant_axis text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_r_value integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_e_value integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_p_value integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_n_value integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pda_a_value integer;

-- Atualizar view pública
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
  SELECT user_id, full_name, company, job_title, avatar_url, linkedin_url, bio,
         pda_profile_name, pda_dominant_axis, pda_r_value, pda_e_value, pda_p_value, pda_n_value, pda_a_value
  FROM public.profiles;
