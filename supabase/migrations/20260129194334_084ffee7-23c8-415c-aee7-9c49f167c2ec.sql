-- Atualizar todos os usuários existentes para password_changed = true
-- (assumindo que são usuários legítimos que já definiram suas senhas)
UPDATE public.profiles 
SET password_changed = true, 
    last_password_change = now()
WHERE password_changed = false OR password_changed IS NULL;