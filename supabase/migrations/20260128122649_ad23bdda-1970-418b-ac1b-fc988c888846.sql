-- Adicionar role de admin ao usuário existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'tltsgls@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;