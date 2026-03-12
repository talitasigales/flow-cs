
-- Add psychologist role to Talita
INSERT INTO public.user_roles (user_id, role)
VALUES ('06a05a59-d8c9-4a7c-97da-836e278ffb81', 'psychologist')
ON CONFLICT (user_id, role) DO NOTHING;

-- Enroll in Bússola program
INSERT INTO public.program_enrollments (program_id, user_id)
VALUES ('28164e37-2168-4695-904a-5f5a52676ccf', '06a05a59-d8c9-4a7c-97da-836e278ffb81')
ON CONFLICT DO NOTHING;
