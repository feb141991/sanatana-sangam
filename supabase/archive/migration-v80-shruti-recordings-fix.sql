-- Fix 1: Make chunk_id nullable (library entries don't have DB chunk UUIDs)
ALTER TABLE pathshala_recordings
  ALTER COLUMN chunk_id DROP NOT NULL;

-- Fix 2: Drop the FK constraint (library-content verse IDs are synthetic strings)
ALTER TABLE pathshala_recordings
  DROP CONSTRAINT IF EXISTS pathshala_recordings_chunk_id_fkey;

-- Fix 3: Add verse_ref column for synthetic path/verse IDs
ALTER TABLE pathshala_recordings
  ADD COLUMN IF NOT EXISTS verse_ref TEXT;

-- Fix 4: Storage bucket policy for pathshala-recordings
-- Run this separately in Supabase dashboard → Storage → Policies:
-- Bucket: pathshala-recordings
-- Policy name: "Authenticated users can upload own recordings"
-- Operation: INSERT
-- WITH CHECK: (auth.uid()::text = (storage.foldername(name))[1])

-- Fix 5: Add select policy for storage
-- Policy name: "Users can read own recordings"
-- Operation: SELECT
-- USING: (auth.uid()::text = (storage.foldername(name))[1])
