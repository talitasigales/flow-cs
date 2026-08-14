# Compartilhamento do PDI com o colaborador (sem login)

## Objetivo
Permitir que a pessoa em desenvolvimento acompanhe o próprio PDI através de um link seguro, sem precisar de conta na plataforma. Quem cria o PDI continua sendo o único que edita.

## Como vai funcionar (visão do usuário)
1. Dentro do PDI, um botão "Compartilhar com o colaborador" gera um link único (token secreto).
2. O gestor pode copiar o link ou enviar por e-mail direto pela plataforma.
3. O colaborador abre o link e vê uma página somente leitura com: dados gerais, eixo PDA, etapa atual, ações do plano (SMART, prazos, status), check-ins e o fechamento — sem menus internos, sem outros PDIs.
4. O gestor pode revogar o link ou definir validade (padrão: sem expiração, revogável a qualquer momento).
5. Opcional no mesmo painel: ocultar as anotações privadas ("notas") do gestor no modo compartilhado.

## Segurança
- Token aleatório longo (não adivinhável) armazenado no banco; o link não expõe o ID do PDI.
- Leitura pública acontece apenas por uma função de servidor que valida o token e devolve somente aquele PDI. Nenhuma tabela fica aberta ao público.
- Revogação imediata: ao revogar, o link para de funcionar.
- Nenhum dado de outros colaboradores é acessível pelo link.

## Detalhes técnicos
1. **Banco (migration)**: nova tabela `pdi_shares` com `pdi_id`, `token` (único), `created_by`, `is_active`, `expires_at`, `hide_notes`, `last_viewed_at`, `view_count`, timestamps. GRANTs apenas para `authenticated` (dono do PDI) e `service_role`; RLS restringindo por `pdi_id` pertencente a `auth.uid()`. Sem acesso `anon`.
2. **Edge function `pdi-public-view`** (`verify_jwt = false`): recebe o token, valida `is_active` e `expires_at` via `service_role`, agrega `pdis` + `pdi_actions` + `pdi_checkins` + `pdi_closures` + `pdi_mentors`, remove campos sensíveis quando `hide_notes`, incrementa contador de visualizações e devolve JSON.
3. **Rota pública** `/pdi/compartilhado/:token` (fora do `AppLayout`/auth), página somente leitura reaproveitando os componentes visuais do PDI (timeline, ações, check-ins) em modo read-only, com o logo Grou e a paleta tiffany.
4. **UI no `PDIDetail`**: diálogo "Compartilhar" com gerar/copiar link, alternância de "ocultar minhas anotações", validade opcional e botão revogar; mostra quantas vezes foi visualizado.
5. **Envio por e-mail (opcional, mesmo diálogo)**: reutiliza o padrão Resend já usado nas outras funções para mandar o link ao e-mail informado.

## Fora do escopo
- O colaborador não edita nem comenta no plano (pode ser uma segunda fase: check-in do colaborador via link).
