-- ─── Migration v53 — Fix Kul cover storage permissions ──────────────
-- Allow guardians to upload to the 'kuls/' folder in the avatars bucket

DROP POLICY IF EXISTS "Guardians can upload kul banner" ON storage.objects;
CREATE POLICY "Guardians can upload kul banner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'kuls'
    AND (storage.foldername(name))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  );

DROP POLICY IF EXISTS "Guardians can update kul banner" ON storage.objects;
CREATE POLICY "Guardians can update kul banner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'kuls'
    AND (storage.foldername(name))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  );

DROP POLICY IF EXISTS "Guardians can delete kul banner" ON storage.objects;
CREATE POLICY "Guardians can delete kul banner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'kuls'
    AND (storage.foldername(name))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  );
