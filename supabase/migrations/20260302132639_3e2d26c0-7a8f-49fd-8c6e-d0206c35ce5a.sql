
-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to knowledge-files bucket
CREATE POLICY "Admins can upload knowledge files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-files' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to read knowledge files
CREATE POLICY "Admins can read knowledge files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-files' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete knowledge files
CREATE POLICY "Admins can delete knowledge files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-files' AND public.has_role(auth.uid(), 'admin'));
