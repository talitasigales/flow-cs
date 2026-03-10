UPDATE public.profiles p
SET last_access_at = u.last_sign_in_at
FROM auth.users u
WHERE u.id = p.user_id
AND p.last_access_at IS NULL
AND u.last_sign_in_at IS NOT NULL;