-- 1. Create pending_enrollments table
CREATE TABLE IF NOT EXISTS public.pending_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.program_classes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, program_id)
);

ALTER TABLE public.pending_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending_enrollments"
  ON public.pending_enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Create new class for Turma 1 - Página 5
INSERT INTO public.program_classes (id, program_id, name, start_date, end_date)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '98734144-59d0-4dc7-b7ef-f8fd5733ad6d',
  'Turma 1 - Página 5',
  '2026-03-11',
  '2026-04-01'
);

-- 3. Create class_modules links
INSERT INTO public.class_modules (class_id, module_id) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b4b1222e-0e84-436d-bade-38461ebefe43'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '372a3031-f950-4451-947d-f9e5ffa5136a'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '191e4656-2e03-476d-83f8-65a524d4667b'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '771bdc24-57f7-4c14-9b46-6e1a58027bc4'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '8aaf713d-e81d-4d27-b2c7-f5974eac6e8e');

-- 4. Create class_schedules with correct dates (modules 1-2 on March 11-12)
INSERT INTO public.class_schedules (class_id, module_id, schedule_date, title, order_number) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b4b1222e-0e84-436d-bade-38461ebefe43', '2026-03-11', 'Módulo 1 - Reflexão', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '372a3031-f950-4451-947d-f9e5ffa5136a', '2026-03-12', 'Módulo 2 - Descoberta', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '191e4656-2e03-476d-83f8-65a524d4667b', '2026-03-18', 'Módulo 3 - Prática', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '771bdc24-57f7-4c14-9b46-6e1a58027bc4', '2026-03-19', 'Módulo 4 - Transformação', 4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '8aaf713d-e81d-4d27-b2c7-f5974eac6e8e', '2026-04-01', 'Mentoria', 5);

-- 5. Seed 17 students into pending_enrollments
INSERT INTO public.pending_enrollments (email, program_id, class_id) VALUES
  ('adriana.marinho@cresol.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('alex.lopes@cresolsicoper.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('aroldo.anderson@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('caiofonseca@remax.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('carlos.cramer@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('cleciane.lorenzato@grupodass.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('helena.martins@cresol.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('leandro.honorio@fiergs.org.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('lucas.carvalho@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('luciana.salvaro@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('mtogo@findes.org.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('michele.flora@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('retiele.rodrigues@arezzo.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('sabrina.soares@fiergs.org.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('sandra.mara@ilovemyjob.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('elizangela.bento@grupoenzo.com.br', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('tltsgls@gmail.com', '98734144-59d0-4dc7-b7ef-f8fd5733ad6d', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (email, program_id) DO NOTHING;