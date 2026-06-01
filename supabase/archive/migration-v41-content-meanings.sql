CREATE TABLE IF NOT EXISTS public.content_meanings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id text NOT NULL,
  language text NOT NULL CHECK (language IN ('hi', 'pa')),
  meaning text NOT NULL,
  source_label text,
  source_meaning_hash text,
  source_status text NOT NULL DEFAULT 'ai_generated' CHECK (source_status IN ('ai_generated', 'human_reviewed', 'approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, language)
);

ALTER TABLE public.content_meanings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read localized content meanings" ON public.content_meanings;
CREATE POLICY "Anyone can read localized content meanings"
  ON public.content_meanings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can cache localized content meanings" ON public.content_meanings;
CREATE POLICY "Authenticated users can cache localized content meanings"
  ON public.content_meanings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can refresh localized content meanings" ON public.content_meanings;
CREATE POLICY "Authenticated users can refresh localized content meanings"
  ON public.content_meanings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
