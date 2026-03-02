

## Problema Atual

A busca de contexto da Nanda tem limitações significativas:

1. **Documentos importados ficam como uma entrada gigante** (38K-50K caracteres) - ao ser encontrado, o documento inteiro vai como contexto, estourando limites de tokens
2. **Keywords são geradas apenas do nome do arquivo** (ex: "manual", "técnico", "pda") - não refletem o conteúdo real
3. **A busca ILIKE com palavras individuais** é imprecisa em documentos grandes - quase sempre encontra algo, mas envia o documento inteiro

## Solução: Chunking + Auto-Keywords

### 1. Dividir documentos em chunks na importação (`parse-knowledge-file`)

Ao importar um arquivo, em vez de criar UMA entrada com todo o conteúdo, dividir em múltiplas entradas menores (~2000 caracteres cada), cada uma com:
- Titulo: `"Nome do Arquivo - Parte 1"`, `"Parte 2"`, etc.
- Keywords geradas automaticamente do conteúdo de cada chunk (palavras mais frequentes e relevantes)
- Mesma categoria

Isso permite que a busca encontre apenas os trechos relevantes, não o documento inteiro.

### 2. Melhorar geração de keywords por chunk

Extrair as palavras mais significativas de cada chunk (excluindo stopwords), selecionando as 10-15 mais frequentes como keywords. Isso torna a busca por overlap de keywords muito mais eficaz.

### 3. Melhorar a busca no `nanda-chat`

- Aumentar o limite de documentos retornados
- Adicionar um limite de caracteres total no contexto enviado (~15K chars) para não estourar o prompt
- Priorizar chunks com mais palavras em comum com a pergunta

### Detalhes Técnicos

**`parse-knowledge-file/index.ts`**:
- Após extrair o texto, dividir em chunks de ~2000 chars respeitando quebras de parágrafo
- Para cada chunk, gerar keywords automaticamente (top 15 palavras com >3 chars, excluindo stopwords em português)
- Inserir múltiplas linhas na `knowledge_base` em vez de uma

**`nanda-chat/index.ts`**:
- Limitar o contexto total a ~15.000 caracteres para caber no prompt
- Manter as 3 estratégias de busca existentes, mas com melhor ranqueamento
- Ordenar resultados por relevância (mais keywords em comum primeiro)

**Nenhuma mudança no banco de dados** - a tabela `knowledge_base` já suporta tudo necessário.

