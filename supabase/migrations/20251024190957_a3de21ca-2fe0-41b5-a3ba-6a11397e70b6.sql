-- Verificar e criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  keywords text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_keywords') THEN
    CREATE INDEX idx_knowledge_keywords ON public.knowledge_base USING gin(keywords);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read knowledge base' AND tablename = 'knowledge_base') THEN
    CREATE POLICY "Anyone can read knowledge base"
    ON public.knowledge_base
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert knowledge' AND tablename = 'knowledge_base') THEN
    CREATE POLICY "Authenticated users can insert knowledge"
    ON public.knowledge_base
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;