
-- Recreate public_profiles view WITHOUT security_invoker so all authenticated users can see public profile data
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
  SELECT user_id,
    full_name,
    company,
    job_title,
    avatar_url,
    linkedin_url,
    bio,
    pda_profile_name,
    pda_dominant_axis,
    pda_r_value,
    pda_e_value,
    pda_p_value,
    pda_n_value,
    pda_a_value
  FROM profiles;
