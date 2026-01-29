
# Plano: Redefinição de Senha Alternativa (Sem Email)

## Visão Geral

Implementar duas alternativas para redefinição de senha que não dependam do envio de email:

1. **Reset Administrativo**: Administradores podem resetar a senha de qualquer usuário diretamente pelo painel
2. **Senha Provisória na Tela de Login**: Usuários podem solicitar uma nova senha provisória que será exibida diretamente na tela

---

## Alternativa 1: Reset por Administrador

### O que será feito
- Adicionar botão "Resetar Senha" na tabela de usuários do painel administrativo
- O admin poderá resetar a senha de qualquer usuário para uma senha provisória
- O usuário será obrigado a trocar a senha no próximo login

### Fluxo
1. Admin acessa `/admin/users`
2. Clica em "Resetar Senha" ao lado do usuário
3. Sistema gera senha provisória (parte antes do @ do email)
4. Admin recebe confirmação com a senha para repassar ao usuário
5. Usuário faz login e é obrigado a trocar a senha

---

## Alternativa 2: Auto-Reset com Senha Provisória

### O que será feito
- Na tela de login, substituir o fluxo de "Esqueceu a senha?" por email
- Novo fluxo: usuário insere email e recebe uma senha provisória diretamente na tela
- Sistema valida se o email existe antes de gerar a senha

### Fluxo
1. Usuário clica em "Esqueceu a senha?"
2. Insere seu email cadastrado
3. Sistema valida o email e gera nova senha provisória
4. Senha provisória é exibida diretamente na tela para o usuário anotar
5. Usuário faz login com a nova senha
6. Sistema força troca de senha obrigatória

---

## Arquivos a Modificar

### 1. `src/pages/AdminUsers.tsx`
- Adicionar coluna de ação "Resetar Senha"
- Implementar dialog de confirmação
- Chamar Edge Function `reset-password` existente
- Exibir senha provisória gerada para o admin

### 2. `src/pages/Auth.tsx`
- Modificar fluxo de "forgot-password"
- Remover envio de email
- Chamar Edge Function para reset
- Exibir senha provisória diretamente na tela

### 3. `supabase/functions/reset-password/index.ts`
- Adicionar geração automática de senha provisória (se não fornecida)
- Retornar a senha gerada na resposta
- Manter compatibilidade com reset administrativo

---

## Detalhes Técnicos

### Geração de Senha Provisória
```text
Formato: parte antes do @ do email
Exemplo: usuario@empresa.com -> senha: "usuario"
```

### Edge Function Atualizada
```text
POST /reset-password
Body: { email: string, newPassword?: string }

Se newPassword não for fornecida:
- Gerar automaticamente a partir do email
- Retornar { success: true, provisionalPassword: "..." }

Se newPassword for fornecida:
- Usar a senha informada
- Retornar { success: true, message: "..." }
```

### Segurança
- Validar que o email existe antes de gerar senha
- Sempre marcar `password_changed: false` após reset
- Dialog de troca obrigatória no próximo login
- Rate limiting implícito via Edge Function

### Interface - Tela de Login
```text
Estado "forgot-password":
1. Campo de email
2. Botão "Gerar Nova Senha"
3. Após sucesso: Exibir card com a senha provisória
4. Instruções para anotar e fazer login
5. Botão para voltar ao login
```

### Interface - Painel Admin
```text
Na tabela de usuários:
- Novo botão "Resetar Senha" por linha
- Dialog de confirmação
- Exibir senha gerada após sucesso
```
