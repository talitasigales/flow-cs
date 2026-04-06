

## Plano: Geração de Certificados pelo Admin + Envio por E-mail

### Contexto
Atualmente, o admin habilita certificados para alunos e eles geram o PDF por conta própria. O pedido é:
1. Admin poder gerar o PDF do certificado diretamente (pelo aluno)
2. Admin poder disparar o certificado por e-mail para os alunos selecionados

### Implementação

#### 1. Botão "Gerar pelo Aluno" no CertificateManager
- Na tabela de alunos que já têm certificado habilitado, adicionar um botão/ícone "Baixar PDF" na coluna de status
- Esse botão chama `generateCertificatePdf()` com os dados do certificado + nome do aluno (já disponíveis no componente)
- Buscar dados da turma (specialist, start_date, end_date) para preencher o certificado corretamente

#### 2. Botão "Enviar por E-mail" no CertificateManager
- Adicionar seleção de alunos que já possuem certificado habilitado para envio de e-mail
- Botão "Enviar Certificado por E-mail" que dispara para os selecionados
- Criar uma Edge Function `send-certificate-email` que:
  - Recebe: certificateId, userId
  - Gera o PDF server-side (ou recebe o PDF como base64)
  - Envia via Resend (já configurado no projeto) com o PDF em anexo ou link

**Abordagem escolhida para e-mail:** Como o sistema já usa Resend e a infraestrutura de e-mail Lovable não suporta anexos, a abordagem será:
- O admin gera o PDF client-side, faz upload para o Storage (bucket `program-materials`) 
- Cria uma URL pública/assinada do PDF
- A Edge Function envia o e-mail via Resend com um link para download do certificado
- Atualizar a tabela `certificates` com `emailed_at` para rastrear envios

#### 3. Migration: adicionar coluna `emailed_at` na tabela `certificates`
```sql
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
```

#### 4. Edge Function `send-certificate-email`
- Recebe: `certificateIds[]`, token de auth
- Valida que o usuário é admin
- Para cada certificado, busca dados do aluno e a URL do PDF
- Envia e-mail via Resend com template HTML contendo link de download
- Atualiza `emailed_at`

#### 5. Alterações no CertificateManager.tsx
- Para certificados habilitados: botão de download PDF (gera client-side)
- Checkbox para selecionar certificados habilitados para envio por e-mail
- Botão "Enviar por E-mail (N)" que:
  1. Gera os PDFs client-side um a um
  2. Faz upload de cada para o Storage
  3. Chama a Edge Function com as URLs dos PDFs
- Indicador visual de quais já foram enviados (`emailed_at`)

### Arquivos Modificados
- `src/components/admin/CertificateManager.tsx` — botões de gerar PDF e enviar e-mail
- `src/utils/certificateUtils.ts` — extrair função que retorna o blob do PDF (além de salvar)
- `supabase/functions/send-certificate-email/index.ts` — nova Edge Function
- Migration — adicionar `emailed_at`

### Detalhes Técnicos
- O PDF continua sendo gerado client-side via jsPDF (reutilizando `generateCertificatePdf`)
- Uma variante da função retornará o `Blob` em vez de fazer `doc.save()` para permitir upload
- Upload para `program-materials/certificates/{certificate_code}.pdf`
- E-mail enviado via Resend com HTML simples contendo link de download e branding Grou
- Badge "Enviado" aparecerá na tabela para certificados já enviados

