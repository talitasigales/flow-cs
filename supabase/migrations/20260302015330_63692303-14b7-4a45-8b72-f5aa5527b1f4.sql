
-- Add community visibility toggle to profiles
ALTER TABLE public.profiles ADD COLUMN community_visible boolean NOT NULL DEFAULT false;

-- Update the public_profiles view to only show users who opted into community
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT
  p.user_id,
  p.full_name,
  p.company,
  p.job_title,
  p.avatar_url,
  p.linkedin_url,
  p.bio,
  CASE WHEN p.pda_public THEN p.pda_r_value ELSE NULL END AS pda_r_value,
  CASE WHEN p.pda_public THEN p.pda_e_value ELSE NULL END AS pda_e_value,
  CASE WHEN p.pda_public THEN p.pda_p_value ELSE NULL END AS pda_p_value,
  CASE WHEN p.pda_public THEN p.pda_n_value ELSE NULL END AS pda_n_value,
  CASE WHEN p.pda_public THEN p.pda_a_value ELSE NULL END AS pda_a_value,
  CASE WHEN p.pda_public THEN p.pda_profile_name ELSE NULL END AS pda_profile_name,
  CASE WHEN p.pda_public THEN p.pda_dominant_axis ELSE NULL END AS pda_dominant_axis
FROM public.profiles p
WHERE p.community_visible = true;
