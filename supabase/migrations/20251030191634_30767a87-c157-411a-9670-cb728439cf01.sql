-- Add Netflix-style fields to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Fundamentos',
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

-- Add comment to explain the new columns
COMMENT ON COLUMN public.modules.thumbnail_url IS 'URL da thumbnail/imagem do módulo (formato 16:9 recomendado)';
COMMENT ON COLUMN public.modules.category IS 'Categoria do módulo para organização (ex: Fundamentos, Avançado, Casos Práticos)';
COMMENT ON COLUMN public.modules.duration_minutes IS 'Duração estimada do módulo em minutos';
COMMENT ON COLUMN public.modules.difficulty IS 'Nível de dificuldade: beginner, intermediate, advanced';