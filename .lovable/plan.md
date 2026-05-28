Disparar o e-mail de redisparo (novo prazo 08/06) para todos os matriculados da turma Master Líder · Grupo Pinho.

## O que será feito
1. Chamar a edge function `send-dilemmas-reminder` via POST com body vazio (`{}`), o que aciona o fluxo completo:
   - Busca em `program_enrollments` (CLASS_ID fixo) + join com `profiles` para nome/e-mail
   - Busca em `pending_enrollments` (não-cadastrados) da mesma turma
   - Envia para cada destinatário, via Resend, o template já atualizado com o novo prazo 08/06 e o link DG individual
2. Retornar o resumo (total enviado / falhas) para conferência.

## Detalhes técnicos
- Função: `supabase/functions/send-dilemmas-reminder/index.ts` (já deployada na versão com prazo 08/06)
- Remetente: `Grou <certificados@grougp.com.br>` (Resend)
- Sem mudanças de código ou banco — apenas execução do disparo
- Há throttle de 250ms entre envios para não estourar rate-limit do Resend