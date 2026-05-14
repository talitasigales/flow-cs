## Objetivo
Corrigir o erro de login para que a página trate sessão inválida com segurança e mostre uma mensagem útil quando o problema vier do ambiente Preview.

## O que vou fazer
1. **Blindar a inicialização da autenticação**
   - Ajustar o `AuthContext` para tratar falhas em `getSession()`/refresh token.
   - Quando houver token expirado ou inexistente, limpar a sessão local de forma controlada em vez de deixar o app em estado inconsistente.
   - Remover o caminho que hoje gera o erro `Invalid Refresh Token: Refresh Token Not Found` sem tratamento.

2. **Melhorar o tratamento de erro na tela de login**
   - Atualizar `signInWithPassword` para identificar `TypeError: Failed to fetch`.
   - Mostrar mensagem clara em português explicando que pode ser bloqueio de rede/extensão ou limitação do Preview, em vez de exibir erro cru.
   - Manter mensagens específicas separadas para credenciais inválidas e rate limit.

3. **Validar o comportamento esperado**
   - Confirmar que a página de login continua carregando normalmente.
   - Confirmar que sessão antiga/inválida não trava mais a experiência.
   - Verificar que, no Preview, o usuário passa a ver um diagnóstico claro; e que o fluxo não interfere no domínio publicado/customizado.

## Diagnóstico atual
- O console mostra `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` durante a inicialização da sessão.
- O código atual chama `supabase.auth.getSession()` no `AuthContext` sem tratamento explícito para erro de refresh.
- A tela `Auth.tsx` ainda devolve mensagem genérica quando o navegador falha antes de alcançar o endpoint de autenticação.
- Há forte indício de que parte dos relatos de `Failed to fetch` ocorre no **Lovable Preview**, que pode afetar chamadas ao `/auth/v1/token`, enquanto o site publicado tende a funcionar normalmente.

## Arquivos previstos
- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`

## Detalhes técnicos
- Não precisa de migração de banco.
- A correção fica toda no frontend/auth flow.
- Vou preservar o comportamento atual de redirecionamento e apenas endurecer o boot da sessão e a UX de erro.