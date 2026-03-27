CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.program_classes(id) ON DELETE SET NULL,
  certificate_code text UNIQUE NOT NULL,
  course_hours integer NOT NULL DEFAULT 0,
  course_dates text NOT NULL DEFAULT '',
  director_name text NOT NULL DEFAULT '',
  director_signature_url text,
  enabled_by uuid NOT NULL,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own certificate generated_at"
  ON public.certificates FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());