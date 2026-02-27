

# Plano: Relatórios PDF, Histórico de Atividades e Página de Perfil Completa

## Funcionalidade 6 — Relatórios e Exportações em PDF

**Abordagem**: Usar a biblioteca `jspdf` + `html2canvas` para gerar PDFs com gráficos renderizados.

### Implementação
1. **Instalar dependências**: `jspdf` e `html2canvas`
2. **Criar `src/utils/pdfExportUtils.ts`** com funções para:
   - `exportPDAPdf()` — relatório de evolução PDA com gráfico radar capturado via html2canvas
   - `exportPDIPdf()` — relatório de PDI com etapas, ações e check-ins
   - `export9BoxPdf()` — relatório da Matriz 9Box com grid visual e lista de colaboradores
   - Cada PDF terá: header com logo Grou, data de geração, nome do usuário, e dados tabulares formatados
3. **Adicionar botões "Exportar PDF"** nas páginas `ProfileEvolution.tsx`, `PDI.tsx`, `PDIDetail.tsx` e `Matriz9Box.tsx` (ao lado dos botões CSV existentes)

## Funcionalidade 7 — Histórico de Atividades do Usuário

**Abordagem**: Consultar a tabela `audit_logs` existente (já registra INSERT/UPDATE/DELETE via triggers) + tabelas específicas para montar uma timeline.

### Implementação
1. **Criar página `src/pages/ActivityHistory.tsx`** com:
   - Timeline vertical estilizada mostrando ações do usuário
   - Filtros por tipo de ação e período
   - Ícones por categoria (módulo concluído, PDI criado, check-in, perfil PDA adicionado, 9Box atualizado)
   - Tradução das ações do banco para labels legíveis em PT-BR
2. **Criar `src/components/activity/ActivityTimeline.tsx`** — componente de timeline reutilizável
3. **Adicionar rota `/activity-history`** em `App.tsx`
4. **Adicionar item no sidebar** `AppSidebar.tsx` com ícone `History`
5. **Consultas**: buscar de `audit_logs` WHERE `user_id = auth.uid()`, ordenar por `created_at DESC`, paginar com limit/offset

## Funcionalidade 8 — Página de Perfil Completa

**Abordagem**: Criar uma página dedicada centralizando todas as informações do usuário.

### Implementação
1. **Criar página `src/pages/UserProfile.tsx`** com tabs:
   - **Dados Pessoais**: nome, email, empresa (editar inline, reutilizando lógica do `UserProfileDialog`)
   - **Dados PDA**: último perfil REPNA com mini radar chart, link para evolução completa
   - **LGPD**: data de aceite, texto do termo, botão para revogar consentimento
   - **Segurança**: data da última troca de senha, botão para alterar senha
   - **Resumo**: contadores (PDIs ativos, perfis PDA, colaboradores na 9Box, módulos concluídos)
2. **Adicionar rota `/profile`** em `App.tsx`
3. **Atualizar `UserAvatarMenu.tsx`** — "Editar Perfil" agora navega para `/profile` em vez de abrir o dialog
4. **Adicionar item no sidebar** com ícone `User`

## Detalhes Técnicos

```text
Novas dependências: jspdf, html2canvas

Novas rotas:
  /activity-history  →  ActivityHistory.tsx
  /profile           →  UserProfile.tsx

Sidebar atualizado:
  Menu Principal:
    + Meu Perfil        (ícone User)
    + Histórico         (ícone History)

Arquivos novos:
  src/utils/pdfExportUtils.ts
  src/pages/ActivityHistory.tsx
  src/pages/UserProfile.tsx
  src/components/activity/ActivityTimeline.tsx

Arquivos modificados:
  src/App.tsx                    (2 novas rotas)
  src/components/AppSidebar.tsx  (2 novos itens no menu)
  src/components/UserAvatarMenu.tsx  (navegar para /profile)
  src/pages/ProfileEvolution.tsx (botão PDF)
  src/pages/PDI.tsx              (botão PDF)
  src/pages/Matriz9Box.tsx       (botão PDF)
```

Nenhuma alteração de banco necessária — `audit_logs` já existe com RLS e os dados necessários.

