

## Plan: Pre-enroll Líder 360 students with self-registration

### Problem
17 students need to be enrolled in the Líder 360 program. They don't have accounts yet and should create them autonomously via the signup form at cs.grougp.com.br. Upon account creation, the program should automatically be unlocked, with modules 1 and 2 already showing as completed (dates March 11-12).

### Approach

**1. Create a `pending_enrollments` table** to store pre-approved email/program pairs.

- Columns: `id`, `email` (normalized, unique per program), `program_id`, `class_id` (nullable), `created_at`
- RLS: admin-only write, service_role reads in edge function

**2. Seed the 17 students** into this table, linked to the Líder 360 program and the appropriate class (Turma 1 - Página 5).

**3. Modify the `register-user` Edge Function** to check `pending_enrollments` after account creation. If the new user's email matches a pending enrollment, automatically insert into `program_enrollments` and delete the pending record.

**4. Ensure class schedules for modules 1 and 2 have dates of March 11 and 12** so they show as completed in the UI (the existing logic marks modules as completed when `schedule_date < today`).

### Technical Details

**Migration SQL:**
- Create `pending_enrollments` table with `email`, `program_id`, `class_id`, unique constraint on `(email, program_id)`
- Insert 17 rows with normalized emails pointing to the Líder 360 program
- Ensure a class exists for these students (or create "Turma 5" if needed) with schedule dates for modules 1-2 set to 2025-03-11 and 2025-03-12

**Edge Function (`register-user/index.ts`):**
- After creating the user and updating profile, query `pending_enrollments` for the user's email
- For each match, insert into `program_enrollments` (with class_id if present)
- Delete the processed pending enrollment rows

**No frontend changes needed** — the signup form already collects name, email, company, and job_title. The program will appear automatically upon login.

### What the students will experience
1. Receive email with link to cs.grougp.com.br
2. Click "Cadastre-se", fill in name, email, company, cargo, and password
3. Log in → Líder 360 program appears in their sidebar/dashboard
4. Modules 1 and 2 show as "Concluído" (based on class schedule dates being in the past)

