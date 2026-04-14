
INSERT INTO public.certificates (
  enrollment_id, user_id, program_id, class_id,
  certificate_code, course_hours, course_dates,
  director_name, director_signature_url, enabled_by
) VALUES (
  'b0e58181-809e-4b94-932b-15322da03ea4',
  '7d5d6848-fa8f-4157-88f6-3d87fa20f135',
  '8f1cbc71-c437-49e9-8604-f77b3fdcb321',
  '3a9275ac-9f54-42f5-b088-42c7f7c6efdc',
  'GROU-2026-' || substr(md5(random()::text), 1, 6),
  6,
  '25/03/2026 a 27/03/2026',
  'Luciana Masiero',
  'https://hapzzpwywnahovmddlej.supabase.co/storage/v1/object/public/program-materials/signatures/luciana-masiero.png',
  '06a05a59-d8c9-4a7c-97da-836e278ffb81'
);
