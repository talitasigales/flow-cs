

## Plano: Certificados de Conclusão para Alunos

### Resumo

Criar sistema onde admins marcam quais alunos podem gerar certificado, e alunos elegíveis visualizam um botao para gerar um PDF profissional com dados do curso, carga horaria, codigo unico e espaco para assinatura da diretora.

---

### Parte 1 — Banco de Dados

**Nova tabela `certificates`**:
- `id` (uuid, PK)
- `enrollment_id` (uuid, FK para `program_enrollments`)
- `user_id` (uuid, referencia auth.users)
- `program_id` (uuid, FK para `programs`)
- `class_id` (uuid, nullable, FK para `program_classes`)
- `certificate_code` (text, unique) — codigo unico gerado (ex: `GROU-2026-XXXX`)
- `course_hours` (integer) — carga horaria em horas
- `course_dates` (text) — datas do curso (ex: "10/03/2026 a 14/03/2026")
- `director_name` (text) — nome da diretora que assina
- `director_signature_url` (text, nullable) — URL da imagem de assinatura
- `enabled_by` (uuid) — admin que habilitou
- `enabled_at` (timestamptz, default now())
- `generated_at` (timestamptz, nullable) — quando o aluno baixou
- `created_at` (timestamptz, default now())

**RLS**:
- Admins: ALL (via `has_role`)
- Alunos: SELECT onde `user_id = auth.uid()`

---

### Parte 2 — Admin: Gestao de Certificados

**Onde**: Nova aba "Certificados" dentro de `AdminPrograms.tsx` (ao lado das abas existentes).

**Funcionalidades**:
1. Selecionar programa e turma
2. Ver lista de alunos matriculados com checkbox
3. Campos globais para a turma: carga horaria, datas do curso, nome da diretora
4. Upload de imagem de assinatura (usar bucket `program-materials`)
5. Botao "Habilitar Certificado" que cria registros na tabela `certificates` para os alunos selecionados
6. Visualizar quais alunos ja tem certificado habilitado/gerado

---

### Parte 3 — Aluno: Gerar Certificado

**Onde**: Dentro da pagina do programa (`ProgramGeneric` / `ProgramDevelopmentContent`), exibir um card/botao "Gerar Certificado" quando existir registro em `certificates` para aquele aluno/programa.

**PDF gerado no frontend** (jsPDF, padrao ja existente no projeto):
- Header com branding Grou (padrão existente em `pdfExportUtils.ts`)
- Titulo: "Certificado de Conclusão"
- Nome completo do aluno
- Nome do programa/curso
- Carga horaria
- Datas do curso
- Codigo unico de verificacao
- Espaco para assinatura (imagem da assinatura da diretora + nome)
- Layout paisagem (landscape) para formato de certificado profissional

---

### Parte 4 — Arquivos a Criar/Editar

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `certificates` + RLS |
| `src/pages/AdminPrograms.tsx` | Adicionar aba "Certificados" |
| `src/components/academy/ProgramDevelopmentContent.tsx` | Adicionar card de certificado para aluno |
| `src/utils/certificateUtils.ts` | Novo — funcao de geracao do PDF do certificado |

---

### Detalhes Tecnicos

- **Codigo unico**: Gerado no momento da habilitacao pelo admin, formato `GROU-{ANO}-{6 chars alfanumericos}` (gerado no frontend com `crypto.randomUUID()` truncado)
- **Assinatura**: Imagem PNG/JPG enviada pelo admin, armazenada no bucket `program-materials`, inserida no PDF via `doc.addImage()`
- **PDF landscape A4**: `new jsPDF('l', 'mm', 'a4')` com design de certificado formal
- **Storage bucket**: Reutilizar `program-materials` (ja publico) para imagens de assinatura

