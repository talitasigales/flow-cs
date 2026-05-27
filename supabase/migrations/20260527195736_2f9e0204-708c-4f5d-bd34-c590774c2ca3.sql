
-- 1) Matricular os 3 alunos que já têm conta na turma 19/05/2026
WITH new_enrollments AS (
  INSERT INTO public.program_enrollments (user_id, program_id, class_id, enrolled_at)
  VALUES
    ('37d7a533-3e74-4dc7-9f94-e8d5ced0e7b3', 'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e', now()),
    ('9f228e17-26ea-4e70-893e-f2d43ee4ce3a', 'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e', now()),
    ('1274a6db-9bf9-4b76-bda5-69e7f7546cf1', 'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e', now())
  RETURNING id, user_id, program_id, class_id
)
-- 2) Liberar certificado para cada matrícula recém-criada
INSERT INTO public.certificates (
  enrollment_id, user_id, program_id, class_id,
  certificate_code, course_hours, course_dates,
  director_name, director_signature_url,
  enabled_by, enabled_at
)
SELECT
  ne.id, ne.user_id, ne.program_id, ne.class_id,
  'GROU-EPC-' || upper(substr(md5(random()::text || ne.id::text), 1, 8)),
  3,
  '19/05/2026',
  'Luciana Masiero',
  'https://hapzzpwywnahovmddlej.supabase.co/storage/v1/object/public/program-materials/signatures/luciana-masiero.png',
  '0614a4d5-5087-4334-8e44-cda1b0f053b9',
  now()
FROM new_enrollments ne;

-- 3) Pré-matricular os 11 alunos sem conta (pending_enrollments)
INSERT INTO public.pending_enrollments (email, program_id, class_id)
VALUES
  ('laiany_borba@sicredi.com.br',       'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('jess_biacchi@sicredi.com.br',       'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('andreia.sarturi@urbano.com.br',     'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('raffaelamkm29@outlook.com',         'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('rosanacristinos@hotmail.com',       'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('adriana.marinho@cresol.com.br',     'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('marinasantos0823@gmail.com',        'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('alinesoares1@hotmail.com',          'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('pagottoleticia03@gmail.com',        'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('aline-rangel@hotmail.com',          'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e'),
  ('cileneholz@gmail.com',              'fd44c8e5-98d4-498a-91f7-8d9bacf415a9', '071d8357-ec88-4405-921d-257a84a69a0e')
ON CONFLICT (email, program_id) DO NOTHING;
