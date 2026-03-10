-- Allow authenticated users to upload PDA reports to program-materials bucket (pda-reports/ folder)
CREATE POLICY "Users can upload own PDA reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'program-materials'
  AND (storage.foldername(name))[1] = 'pda-reports'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow authenticated users to update/replace their own PDA reports
CREATE POLICY "Users can update own PDA reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'program-materials'
  AND (storage.foldername(name))[1] = 'pda-reports'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow authenticated users to delete their own PDA reports
CREATE POLICY "Users can delete own PDA reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'program-materials'
  AND (storage.foldername(name))[1] = 'pda-reports'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);