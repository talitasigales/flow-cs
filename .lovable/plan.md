

## Problema

O `pdfjs-dist` no ambiente Deno Edge Functions não consegue extrair todo o texto de PDFs — o arquivo "Masterclass Construção de Cargo 2025" que deveria ter muito conteúdo ficou com apenas 933 caracteres. Os warnings de `Path2D` e `DOMMatrix` confirmam que a biblioteca não funciona bem nesse ambiente.

## Solução: Fallback com IA (Vision) para PDFs com extração fraca

### Abordagem

1. **Manter `pdfjs-dist` como tentativa primária** (rápido e gratuito quando funciona)
2. **Adicionar fallback com a Lovable API (GPT-4o)** quando o texto extraído for curto demais:
   - Converter o PDF para base64
   - Enviar como documento para o modelo via API, pedindo extração de todo o texto
   - Usar o `LOVABLE_API_KEY` que já está configurado no projeto
3. **Critério de fallback**: se o texto extraído tiver menos de 500 caracteres ou menos de 100 palavras significativas, acionar o fallback

### Alterações

**`supabase/functions/parse-knowledge-file/index.ts`**:
- Adicionar função `extractPdfWithVisionAPI(pdfBytes)` que envia o PDF base64 para a Lovable API com prompt de extração
- Modificar `extractTextFromPDF` para verificar qualidade do resultado e chamar fallback automaticamente
- Logar qual método foi usado (nativo vs vision) para debugging

### Limitações
- PDFs muito grandes (>20MB) podem exceder limites da API — nesse caso mantém a extração nativa
- O fallback consome créditos da API, mas só é acionado quando necessário

