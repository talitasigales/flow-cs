-- Remove constraints antigos que estão causando o erro
ALTER TABLE public.matriz_9box 
  DROP CONSTRAINT IF EXISTS check_performance_score;

ALTER TABLE public.matriz_9box 
  DROP CONSTRAINT IF EXISTS check_role_fit_score;

-- Garante que apenas os constraints corretos existem
-- (performance_score_range e role_fit_score_range já foram criados na migração anterior)