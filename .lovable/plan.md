

## Diagnóstico do Problema

O fluxo atual tem uma falha crítica: o componente `ChatbotNanda.tsx` chama a edge function `update-knowledge-complete` **toda vez que é montado**, e essa função **apaga toda a base de conhecimento** e reinsere dados hardcoded. Isso significa que qualquer conteúdo adicionado pelo admin na página de Base de Conhecimento é **destruído** quando alguém abre o chatbot.

Além disso, a busca na `nanda-chat` é limitada (full-text search com limite de 3 docs, fallback de apenas 4), e não há suporte para upload de arquivos.

---

## Plano de Correção e Melhorias

### 1. Remover a chamada destrutiva ao `update-knowledge-complete`

- Remover o `useEffect` em `ChatbotNanda.tsx` que chama `update-knowledge-complete` a cada montagem
- Verificar se `ChatNanda.tsx` tem comportamento similar e corrigir
- A base de conhecimento passa a ser gerenciada **exclusivamente** pela interface admin

### 2. Adicionar upload de arquivos na Base de Conhecimento

- Criar edge function `parse-knowledge-file` que recebe arquivos (PDF, TXT, DOCX) e extrai o texto
- Adicionar botão "Importar Arquivo" na página `AdminKnowledgeBase.tsx`
- O admin faz upload, o conteúdo é extraído e inserido como uma nova entrada (título derivado do nome do arquivo, conteúdo extraído)
- Usar o bucket `module-materials` existente ou criar um novo `knowledge-files`

### 3. Melhorar a busca de contexto no `nanda-chat`

- Aumentar limite de documentos retornados (de 3 para 5)
- Adicionar busca por keywords além de full-text no content
- Aumentar o fallback de 4 para buscar todos os documentos disponíveis (com limite razoável de ~10)
- Incluir o campo `keywords` no contexto enviado ao modelo

### 4. Adicionar suporte a FAQs na interface admin

- Adicionar categoria "FAQ" às categorias padrão
- Adicionar campo opcional "Pergunta Frequente" no formulário de criação/edição, para facilitar a organização de perguntas e respostas
- A Nanda priorizará FAQs quando a pergunta do usuário tiver alta correspondência

---

## Detalhes Técnicos

**Arquivos a modificar:**
- `src/components/ChatbotNanda.tsx` — remover useEffect de update-knowledge
- `src/pages/AdminKnowledgeBase.tsx` — adicionar upload de arquivo e categoria FAQ
- `supabase/functions/nanda-chat/index.ts` — melhorar busca de contexto (keywords + mais docs)
- Criar `supabase/functions/parse-knowledge-file/index.ts` — extração de texto de arquivos
- Criar migration para bucket de storage `knowledge-files`
- Atualizar `supabase/config.toml` com nova function

**Fluxo resultante:**
```text
Admin adiciona conteúdo (texto manual ou upload de arquivo)
        ↓
  knowledge_base (tabela Supabase)
        ↓
  nanda-chat busca contexto relevante (keywords + full-text)
        ↓
  Nanda responde com base no conteúdo atualizado
```

