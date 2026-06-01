-- ─── Migration v58 — Robust Avatars Storage RLS ──────────────────────────────
-- This fixes the "Hero/Kul upload" failures by allowing specific path-based access.

-- 1. Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Guardians can manage kul assets" ON storage.objects;

-- 2. CREATE POLICY: Users manage their own profile assets
-- Path: profiles/USER_ID/* or USER_ID/*
CREATE POLICY "Users manage own assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      -- Case 1: USER_ID/filename.ext
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Case 2: profiles/USER_ID/filename.ext
      (
        (storage.foldername(name))[1] = 'profiles' 
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      -- Case 1: USER_ID/filename.ext
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Case 2: profiles/USER_ID/filename.ext
      (
        (storage.foldername(name))[1] = 'profiles' 
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

-- 3. CREATE POLICY: Kul Guardians manage their Kul assets
-- Path: kuls/KUL_ID/*
CREATE POLICY "Guardians manage kul assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'kuls'
    AND (storage.foldername(name))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'kuls'
    AND (storage.foldername(name))[2] = public.auth_kul_id()::text
    AND public.auth_kul_role() = 'guardian'
  );
