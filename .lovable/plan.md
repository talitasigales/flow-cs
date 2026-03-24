

## Problema

A Edge Function `import-enrollments` não insere registros em `pending_enrollments` quando o email do aluno não tem conta na plataforma. Ela simplesmente marca como "não encontrado". O fluxo de pré-matrícula (que já funciona no `register-user`) nunca é acionado porque os dados pendentes nunca são criados.

## Solução

Modificar `supabase/functions/import-enrollments/index.ts` para que, quando um email não for encontrado em `profiles`, insira um registro em `pending_enrollments` em vez de apenas adicioná-lo à lista `notFound`.

### Mudança no `import-enrollments/index.ts`

Onde hoje faz:
```typescript
if (!profile) {
  notFound.push(email);
  continue;
}
```

Passará a fazer:
```typescript
if (!profile) {
  // Insert into pending_enrollments for auto-enrollment on future registration
  const pendingData = { email, program_id, class_id: (class_id && class_id !== 'none') ? class_id : null };
  const { error: pendingErr } = await supabase
    .from('pending_enrollments')
    .insert(pendingData);
  if (pendingErr && pendingErr.code === '23505') {
    alreadyEnrolled.push(email);
  } else {
    enrolled.push(email); // or a new "pending" counter
  }
  continue;
}
```

### Resposta da API

Adicionar um campo `pending` ao retorno para informar quantos emails foram pré-matriculados (sem conta ainda), distinguindo de matrículas imediatas. O retorno ficará:

```json
{
  "enrolled": 3,
  "pending": 2,
  "alreadyEnrolled": 1,
  "notFound": [],
  "total": 6
}
```

### UI no Admin

No `AdminPrograms.tsx`, atualizar a mensagem de resultado da importação para incluir a contagem de pré-matrículas pendentes, algo como: "2 alunos pré-matriculados (serão ativados no primeiro cadastro)".

### Unique constraint

Adicionar uma migration com unique constraint em `pending_enrollments(email, program_id)` para evitar duplicatas, caso ainda não exista.

