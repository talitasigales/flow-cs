
-- Create storage bucket for program materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-materials', 'program-materials', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for program-materials bucket
CREATE POLICY "Authenticated can read program materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'program-materials');

CREATE POLICY "Admins can upload program materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'program-materials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete program materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'program-materials' AND public.has_role(auth.uid(), 'admin'));
