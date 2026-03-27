

## Plano: Camada Completa de Segurança e Governança de Dados

### Visão Geral

Duas frentes: (1) correções técnicas de segurança reais no código/banco, e (2) geração de documentação profissional em PDF + página pública de Security Overview no app.

---

### Parte 1 — Correções Técnicas de Segurança

**Migration SQL** para corrigir vulnerabilidades:

1. **Revisar RLS policies com `true`** em INSERT/UPDATE/DELETE — avaliar caso a caso e restringir
2. **Ativar Leaked Password Protection**: Orientar o usuário a ativar no dashboard Supabase
3. **Edge Functions**: Verificar validação de input consistente e headers CORS em todas as functions

**Frontend**:
- Nenhum uso de `dangerouslySetInnerHTML` com dados de usuário — ok
- Rate limiting já tratado no frontend para login

---

### Parte 2 — 4 PDFs Profissionais (salvos em `/mnt/documents/`)

#### PDF 1: Políticas de Governança de Dados (~8 páginas)
- Política de coleta, armazenamento e tratamento
- Classificação de dados (público, interno, sensível, confidencial)
- Política de retenção e exclusão (LGPD art. 15-16)
- RBAC (admin/user via `user_roles` + `has_role()`)
- Auditoria via `audit_logs`
- Conformidade LGPD: consentimento explícito, direito de exclusão, minimização

#### PDF 2: Arquitetura de Segurança (~6 páginas)
- HTTPS/TLS + AES-256 em repouso (Supabase)
- Autenticação: Supabase Auth, troca forçada no primeiro acesso
- OWASP Top 10: XSS, SQLi (SDK parametrizado), CSRF (token-based)
- Rate limiting, RLS por `user_id`, backups automáticos

#### PDF 3: Relatório de Pentest Simulado (~10 páginas)
- Escopo: app web + Edge Functions + banco
- Metodologia: OWASP Testing Guide v4.2
- Vulnerabilidades encontradas com severidade
- Recomendações e status de correção

#### PDF 4: Security Overview Comercial (~4 páginas)
- Linguagem não-técnica para vendas B2B
- Proteção de dados, padrões seguidos, monitoramento, privacidade

---

### Parte 3 — Página Security Overview no App

Criar `/security` (página pública, sem login):
- Cards visuais: Criptografia, Autenticação, RBAC, Auditoria, LGPD
- Badges de compliance
- Design alinhado com branding existente

**Arquivos**: `src/pages/SecurityOverview.tsx` + rota no `App.tsx`

---

### Parte 4 — Checklist Contínuo

Seção final do PDF de Governança + tab na página Security:
- Revisão de acessos (mensal), dependências (semanal), vulnerabilidades (trimestral), rotação de credenciais, logs e alertas

---

### Sequência

1. Correções de segurança (migrations)
2. Gerar 4 PDFs
3. Criar página SecurityOverview
4. QA visual dos PDFs

