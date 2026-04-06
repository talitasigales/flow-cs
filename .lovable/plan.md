

## Plano: Configurar domínio verificado no Resend para envio de certificados

### Problema
O envio de e-mails falha porque usa `onboarding@resend.dev` (sandbox), que só entrega para o e-mail cadastrado na conta Resend.

### Solução

#### 1. Verificar domínio no Resend (ação do usuário)
- Acessar [resend.com/domains](https://resend.com/domains)
- Adicionar o domínio `grougp.com.br`
- Configurar os registros DNS (MX, SPF, DKIM) conforme instruções do Resend
- Aguardar verificação (pode levar até 72h)

#### 2. Atualizar Edge Function `send-certificate-email`
- Alterar o campo `from` de `'Grou <onboarding@resend.dev>'` para `'Grou <certificados@grougp.com.br>'`
- Redesplegar a função

### Alteração no código
Arquivo: `supabase/functions/send-certificate-email/index.ts`
```typescript
// Linha atual:
from: 'Grou <onboarding@resend.dev>',
// Alterar para:
from: 'Grou <certificados@grougp.com.br>',
```

### Pré-requisito do usuário
O domínio `grougp.com.br` precisa estar verificado no painel do Resend antes que os e-mails sejam entregues. Posso fazer a alteração no código agora — os e-mails passarão a funcionar assim que a verificação DNS estiver concluída.

