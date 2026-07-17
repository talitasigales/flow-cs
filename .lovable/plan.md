## Objetivo

Enviar WhatsApp automaticamente para alunos matriculados de uma turma:
- **24h antes** do início da turma: lembrete com data/horário e link da sala.
- **30 min antes**: aviso "está começando" com link da sala.

Provedor: **Meta WhatsApp Cloud API** (oficial). Requer templates HSM aprovados na Meta (obrigatório para mensagens proativas fora da janela de 24h).

## Mudanças necessárias

### 1. Schema (migration)

**`program_classes`** — adicionar horário e controle de envios:
- `start_time time` (ex.: 19:00) — horário de início.
- `timezone text default 'America/Sao_Paulo'`.
- `whatsapp_reminder_24h_sent_at timestamptz` — evita duplicidade.
- `whatsapp_reminder_30min_sent_at timestamptz`.
- `whatsapp_reminders_enabled boolean default true` — permite desligar por turma.

**`profiles.phone`** já existe — usaremos como fonte do WhatsApp (E.164, ex.: `+5551999999999`).

**`pending_enrollments`** — adicionar `phone text` para pré-matrículas também receberem.

### 2. Secrets (Meta Cloud API)

Solicitar via `add_secret`:
- `WHATSAPP_ACCESS_TOKEN` — token permanente do System User.
- `WHATSAPP_PHONE_NUMBER_ID` — ID do número emissor.
- `WHATSAPP_TEMPLATE_REMINDER_24H` — nome do template aprovado (24h).
- `WHATSAPP_TEMPLATE_REMINDER_30MIN` — nome do template aprovado (30min).
- `WHATSAPP_TEMPLATE_LANGUAGE` — ex.: `pt_BR`.

Antes de solicitar, explicar ao usuário: precisa criar 2 templates HSM na Meta Business Manager com variáveis `{{1}} nome do aluno`, `{{2}} nome do programa`, `{{3}} data/horário`, `{{4}} link da sala`. Sem templates aprovados, a Meta bloqueia envio.

### 3. Edge Function: `send-class-whatsapp-reminder`

- Recebe `{ class_id, reminder_type: '24h' | '30min' }`.
- Busca turma + programa + `video_conference_url` obrigatório.
- Une destinatários de `program_enrollments` (join com `profiles.full_name, phone`) + `pending_enrollments` (full_name, phone) para aquela `class_id`.
- Normaliza telefone (adiciona `+55` se faltar, remove máscaras) e ignora quem não tem telefone (loga skip).
- Para cada destinatário, faz `POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages` com o template + variáveis.
- Retorna `{ sent, skipped, failed, errors[] }`.
- Marca `whatsapp_reminder_{tipo}_sent_at = now()` no fim.
- Config: `verify_jwt = false` no `supabase/config.toml`, validação manual do token; suporta `test_phone` para envio de teste (igual ao padrão do `send-dilemmas-reminder`).

### 4. Agendamento (pg_cron + pg_net)

Cron **a cada 5 minutos**, executando SQL que:
1. Seleciona `program_classes` onde `whatsapp_reminders_enabled = true` e:
   - Para 24h: `start_date + start_time` cai entre "agora + 23h55" e "agora + 24h05" **e** `whatsapp_reminder_24h_sent_at IS NULL`.
   - Para 30min: idem com janela 25–35 min **e** `whatsapp_reminder_30min_sent_at IS NULL`.
2. Para cada turma elegível, chama `net.http_post` para a edge function com o payload correspondente.

Isso evita depender de horário exato do cron e cobre pequenos atrasos.

### 5. Admin UI

Em `ProgramCalendar.tsx` / dialog de edição de turma (admin):
- Campo hora de início (`start_time`).
- Campo URL da sala (`video_conference_url`) — já existe na tabela, expor no formulário.
- Toggle "Enviar lembretes de WhatsApp".
- Botão "Enviar lembrete agora (teste)" que chama a edge function com `test_phone` do admin.
- Indicadores: "24h enviado em ...", "30min enviado em ...".

Em `AdminUsers` / edição de perfil: garantir que o campo `phone` seja preenchível/visível (já existe).

## Fluxo resumido

```text
Admin cria turma  ──►  define start_date + start_time + video_conference_url
                                   │
                cron a cada 5 min  ▼
              seleciona turmas na janela 24h ou 30min
                                   │
                                   ▼
              edge function envia WhatsApp via Meta Cloud API
                                   │
                                   ▼
              marca sent_at, evita reenvio
```

## Pré-requisitos que o usuário precisa preparar

1. **Conta Meta Business** com WhatsApp Business Platform ativa.
2. **Templates HSM aprovados** (2): lembrete 24h e aviso 30min, ambos com 4 variáveis.
3. **Access Token permanente** (System User) e **Phone Number ID**.
4. **Números dos alunos preenchidos em `profiles.phone`** — sem telefone, o aluno é ignorado.

## Fora do escopo desta plano

- Envio manual em massa por turma (podemos adicionar depois; hoje o botão de teste já cobre validação).
- Confirmação de leitura / webhook de status da Meta.
- Templates em outros idiomas além do configurado em `WHATSAPP_TEMPLATE_LANGUAGE`.
