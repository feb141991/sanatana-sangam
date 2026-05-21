INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shoonaya-tts-cache',
  'shoonaya-tts-cache',
  false,
  52428800,
  ARRAY['audio/mpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Service role manages TTS cache objects" ON storage.objects;
CREATE POLICY "Service role manages TTS cache objects"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'shoonaya-tts-cache')
  WITH CHECK (bucket_id = 'shoonaya-tts-cache');
