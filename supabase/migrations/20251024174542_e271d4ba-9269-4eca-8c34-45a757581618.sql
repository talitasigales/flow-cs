-- Remove os constraints antigos que limitam valores de 1-9
ALTER TABLE public.matriz_9box 
  DROP CONSTRAINT IF EXISTS matriz_9box_performance_score_check;

ALTER TABLE public.matriz_9box 
  DROP CONSTRAINT IF EXISTS matriz_9box_role_fit_score_check;

-- Os constraints corretos (performance_score_range e role_fit_score_range) 
-- já existem e permitem valores de 0-100