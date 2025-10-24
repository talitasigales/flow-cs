-- Adicionar coluna de nome na tabela profile_evolution
ALTER TABLE public.profile_evolution 
  ADD COLUMN IF NOT EXISTS employee_name TEXT;