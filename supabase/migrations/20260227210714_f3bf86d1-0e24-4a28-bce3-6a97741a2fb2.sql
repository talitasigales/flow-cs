
-- Add column to control public PDA visibility
ALTER TABLE public.profiles ADD COLUMN pda_public boolean NOT NULL DEFAULT true;

-- Recreate the public_profiles view to respect pda_public flag
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  user_id,
  full_name,
  company,
  job_title,
  avatar_url,
  linkedin_url,
  bio,
  CASE WHEN pda_public THEN pda_profile_name ELSE NULL END AS pda_profile_name,
  CASE WHEN pda_public THEN pda_dominant_axis ELSE NULL END AS pda_dominant_axis,
  CASE WHEN pda_public THEN pda_r_value ELSE NULL END AS pda_r_value,
  CASE WHEN pda_public THEN pda_e_value ELSE NULL END AS pda_e_value,
  CASE WHEN pda_public THEN pda_p_value ELSE NULL END AS pda_p_value,
  CASE WHEN pda_public THEN pda_n_value ELSE NULL END AS pda_n_value,
  CASE WHEN pda_public THEN pda_a_value ELSE NULL END AS pda_a_value
FROM public.profiles;
