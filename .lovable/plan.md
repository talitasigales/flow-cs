# Plano para corrigir o acesso à área de CS

## Objetivo
Fazer com que usuários com papel de CS consigam abrir `/cs` de forma confiável e também visualizar a entrada de navegação correta no menu lateral.

## O que vou ajustar

1. **Corrigir a leitura do papel CS no hook de acesso**
   - Revisar `useCSAccess` para tratar corretamente a resposta de `cs_user_access`.
   - Garantir que o hook normalize tanto retorno único quanto lista, evitando `csRole` nulo quando o usuário possui acesso.
   - Preservar o estado de loading até a checagem terminar de fato.

2. **Remover a negação prematura da rota `/cs`**
   - Validar `CSDashboard` para só redirecionar quando autenticação + papel admin + papel CS estiverem resolvidos.
   - Se necessário, tornar a verificação mais defensiva para impedir o toast de “Acesso negado” enquanto o papel ainda está sendo carregado.

3. **Ajustar a navegação lateral**
   - Atualizar `AppSidebar` para exibir **Customer Success** para quem tem acesso CS, não apenas para admin global.
   - Manter a área de administração separada apenas para admins.

4. **Validar os fluxos relacionados**
   - Conferir se a mesma lógica de acesso está consistente em páginas CS relacionadas, como detalhe de empresa.
   - Evitar regressão entre usuário admin global e usuário com papel CS dedicado.

## Resultado esperado
- Usuários com `cs_admin`, `cs_editor` ou `cs_viewer` conseguem abrir a área de CS sem serem expulsos para o dashboard.
- O item de menu de CS aparece para quem realmente tem acesso.
- Admins continuam funcionando normalmente.

## Detalhes técnicos
- Arquivos prováveis:
  - `src/hooks/useCSAccess.ts`
  - `src/components/AppSidebar.tsx`
  - possivelmente `src/pages/cs/CSDashboard.tsx` e/ou `src/pages/cs/CompanyDetail.tsx`
- A resposta de rede já mostrou `cs_user_access` retornando `[{"cs_role":"cs_admin"}]`, então a correção principal deve alinhar o hook a esse formato e impedir falso negativo no gating.