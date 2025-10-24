-- Criar tabela de base de conhecimento para a Nanda
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  keywords text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_knowledge_content_fts ON public.knowledge_base 
USING gin(to_tsvector('portuguese', content));

CREATE INDEX idx_knowledge_keywords ON public.knowledge_base 
USING gin(keywords);

-- Políticas RLS (público para leitura, apenas admin para escrita)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge base"
ON public.knowledge_base
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert knowledge"
ON public.knowledge_base
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');