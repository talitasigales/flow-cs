

## Plan: Programas e Workshops — Líder 360

### Overview
Create a new gated section "Programas e Workshops" in the sidebar, visible only to users enrolled in at least one program. The first sub-item is "Líder 360", containing a self-assessment questionnaire and a cross-sell calendar of upcoming Grou events.

### Database (4 new tables + RLS)

**1. `programs`** — catalog of workshops/courses
- `id`, `name`, `description`, `slug` (e.g. "lider-360"), `active`, `created_at`
- RLS: authenticated SELECT, admin-only INSERT/UPDATE/DELETE

**2. `program_enrollments`** — controls who can access each program
- `id`, `program_id` (FK → programs), `user_id` (FK-style, no FK to auth), `enrolled_at`
- Unique constraint on (program_id, user_id)
- RLS: users SELECT own rows, admins full CRUD
- Admin imports CSV of emails → edge function resolves emails to user_ids and inserts enrollments

**3. `workshop_responses`** — stores questionnaire answers
- `id`, `program_id`, `user_id`, `answers` (jsonb — keys are question IDs, values are text answers), `submitted_at`, `updated_at`
- RLS: users can INSERT/UPDATE/SELECT own, admins can SELECT all

**4. `program_events`** — calendar of upcoming courses for cross-sell
- `id`, `title`, `description`, `event_date`, `event_time`, `location`, `program_id` (nullable FK), `external_url`, `created_at`
- RLS: authenticated SELECT, admin-only INSERT/UPDATE/DELETE

### Seed Data
Insert the "Líder 360" program into `programs` table.

### Sidebar Changes (`AppSidebar.tsx`)
- New collapsible group "Programas e Workshops" with icon `Award`
- Only rendered if the user has at least 1 row in `program_enrollments`
- Sub-items rendered dynamically based on enrolled programs (starting with "Líder 360")
- Hook: `useEnrolledPrograms()` — queries `program_enrollments` joined with `programs`

### Pages

**1. `src/pages/ProgramLider360.tsx`** — route `/programas/lider-360`
- Two tabs: "Exercícios" and "Calendário"
- **Exercícios tab**: The questionnaire from the document with 9 questions:
  - Q1-Q6: open text questions about leadership style
  - Q7: "Ponto forte do perfil natural" (text)
  - Q8: "Oportunidade de desenvolvimento" (text)
  - Q9: PDA axis checkboxes (Risco, Extroversão, Paciência, Norma, Autocontrole — each with baixo/alto option)
  - Save/update answers to `workshop_responses` as JSON
  - Show "submitted" badge if already answered; allow editing
- **Calendário tab**: Lists upcoming `program_events` in a card-based timeline, with date, title, description, and optional external link (for registration)

**2. Admin: Manage enrollments** (inside existing `/admin/users` or new sub-page)
- Upload CSV (email list) to enroll students in a specific program
- View/remove enrollments
- View submitted questionnaire responses (read-only, per student)

### Edge Function: `import-enrollments`
- Receives CSV content + program_id
- Parses emails, looks up user_ids from `profiles.email`
- Inserts into `program_enrollments`, skipping duplicates
- Returns summary (enrolled count, not-found emails)

### Files to create/modify
- **Create**: `src/hooks/useEnrolledPrograms.ts`
- **Create**: `src/pages/ProgramLider360.tsx`
- **Create**: `src/pages/AdminPrograms.tsx` (enrollment management + response viewer)
- **Create**: `supabase/functions/import-enrollments/index.ts`
- **Modify**: `src/components/AppSidebar.tsx` — add "Programas e Workshops" group
- **Modify**: `src/App.tsx` — add routes
- **DB migration**: 4 tables + RLS + seed "Líder 360" program

