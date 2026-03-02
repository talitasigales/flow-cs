

## Problema

O link de redefinição de senha enviado pelo Supabase redireciona para uma página quebrada. Isso acontece por **dois motivos**:

1. **Configuração do Supabase Auth** — O "Site URL" no painel do Supabase provavelmente aponta para `localhost:3000` ou para o preview do Lovable, e não para `cs.grougp.com.br`. Isso faz o link no email ser inválido. **Isso precisa ser configurado manualmente no painel do Supabase** (não é possível alterar via código).

2. **Código do `redirectTo`** — O `Auth.tsx` usa `window.location.origin`, que funciona se o usuário estiver acessando de `cs.grougp.com.br`, mas o Supabase tem uma lista de Redirect URLs permitidas que precisa incluir esse domínio.

## O que precisa ser feito

### 1. Configuração no Supabase Dashboard (manual, obrigatório)
Acesse [Auth → URL Configuration](https://supabase.com/dashboard/project/hapzzpwywnahovmddlej/auth/url-configuration):

- **Site URL**: `https://cs.grougp.com.br`
- **Redirect URLs** (adicionar todos):
  - `https://cs.grougp.com.br/reset-password`
  - `https://flow-cs.lovable.app/reset-password`
  - `https://cs.grougp.com.br/**`

### 2. Alteração no código — Hardcode do redirectTo (mudança no código)
Alterar `Auth.tsx` para usar `https://cs.grougp.com.br/reset-password` como URL fixa de redirect, em vez de depender de `window.location.origin` (que pode ser o preview do Lovable):

```typescript
redirectTo: 'https://cs.grougp.com.br/reset-password'
```

### 3. Melhoria no ResetPassword.tsx — tratamento de erro
Adicionar tratamento para quando o token é inválido ou expirou, em vez de mostrar uma página quebrada com spinner infinito. Exibir mensagem clara com link para solicitar novo email.

## Resumo das alterações em código
- **`src/pages/Auth.tsx`**: Fixar `redirectTo` para `https://cs.grougp.com.br/reset-password`
- **`src/pages/ResetPassword.tsx`**: Adicionar timeout e mensagem de erro quando o link é inválido/expirado

