

## Plano: Persistir e visualizar resultados da Construção de Cargos

### Problema
Os resultados da Construção de Cargos existem apenas na memória (passados via `navigate state`). Não há tabela no banco para armazená-los, então admins não conseguem ver quem realizou a análise nem os resultados.

### Solução

#### 1. Criar tabela `job_constructions` no banco
Campos: `id`, `user_id`, `job_title` (opcional, nome do cargo analisado), `r_score`, `e_score`, `p_score`, `n_score`, `a_score`, `answers` (jsonb com as 20 respostas), `created_at`.
RLS: usuário vê os próprios; admin vê todos.

#### 2. Salvar resultado ao submeter o questionário
No `JobConstructionResult.tsx`, ao carregar a página com scores, inserir automaticamente na tabela `job_constructions`. Adicionar campo opcional para o usuário nomear o cargo antes de ver o resultado.

#### 3. Registrar ação no audit_logs
Chamar `log_user_action` com `_action: 'JOB_CONSTRUCTION'` ao salvar, para aparecer nos logs administrativos.

#### 4. Permitir admins visualizarem os resultados
No `AdminLogs.tsx`, os registros já aparecerão via audit_logs. Opcionalmente, criar uma seção dedicada ou filtro para "Construção de Cargos" nos logs.

#### 5. Histórico para o próprio usuário
Na página `/job-construction`, mostrar uma lista de análises anteriores do usuário com data e scores, permitindo revisitar resultados passados.

---

### Detalhes Técnicos

**Migration SQL:**
```sql
CREATE TABLE public.job_constructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text DEFAULT '',
  r_score integer NOT NULL,
  e_score integer NOT NULL,
  p_score integer NOT NULL,
  n_score integer NOT NULL,
  a_score integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_constructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job constructions"
  ON public.job_constructions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job constructions"
  ON public.job_constructions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own job constructions"
  ON public.job_constructions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all job constructions"
  ON public.job_constructions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

**Arquivos modificados:**
- `JobConstruction.tsx` -- ao submeter, salvar no banco e registrar log; mostrar histórico de análises anteriores
- `JobConstructionResult.tsx` -- receber `id` do registro salvo para evitar duplicatas; permitir editar nome do cargo
- `AdminLogs.tsx` -- os logs já aparecerão automaticamente via audit_logs (ação `JOB_CONSTRUCTION`)

