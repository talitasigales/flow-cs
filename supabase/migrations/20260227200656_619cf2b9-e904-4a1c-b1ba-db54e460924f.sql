
-- Coluna para URL da imagem no post
ALTER TABLE public.community_posts ADD COLUMN image_url text;

-- Bucket para imagens da comunidade
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

-- Políticas de storage
CREATE POLICY "Authenticated can view community images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-images');

CREATE POLICY "Authenticated can upload community images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own community images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
