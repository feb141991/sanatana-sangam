-- ─── Migration v54 — Robust Storage RLS & Increased Limits ──────────────
-- 1. Increase file size limit to 5MB to match UI expectations
UPDATE storage.buckets 
SET file_size_limit = 5242880 
WHERE id = 'avatars';

-- 2. Drop old policies to avoid confusion
DROP POLICY IF EXISTS "Guardians can upload kul banner" ON storage.objects;
DROP POLICY IF EXISTS "Guardians can update kul banner" ON storage.objects;
DROP POLICY IF EXISTS "Guardians can delete kul banner" ON storage.objects;

-- 3. Robust INSERT policy (using simple LIKE for reliability)
-- Indexing storage.foldername(name) can sometimes be flaky if the path is not what's expected.
CREATE POLICY "Guardians can upload kul assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'kuls/' || public.auth_kul_id()::text || '/%'
    AND public.auth_kul_role() = 'guardian'
  );

-- 4. Robust UPDATE policy
CREATE POLICY "Guardians can update kul assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'kuls/' || public.auth_kul_id()::text || '/%'
    AND public.auth_kul_role() = 'guardian'
  );

-- 5. Robust DELETE policy
CREATE POLICY "Guardians can delete kul assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'kuls/' || public.auth_kul_id()::text || '/%'
    AND public.auth_kul_role() = 'guardian'
  );
