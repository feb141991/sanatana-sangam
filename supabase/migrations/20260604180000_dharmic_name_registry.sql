-- 1. Create name_stories table
CREATE TABLE IF NOT EXISTS public.name_stories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name_input          TEXT NOT NULL,
  tradition           TEXT NOT NULL CHECK (tradition IN ('hindu', 'sikh', 'buddhist', 'jain', 'all')),
  etymology_text      TEXT NOT NULL,
  deity_connection    TEXT NULL,
  origin_tradition    TEXT NULL,
  historical_bearers  TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  meaning_summary     TEXT NOT NULL,
  scripture_line      TEXT NULL,
  scripture_source    TEXT NULL,
  generated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_public           BOOLEAN DEFAULT TRUE NOT NULL,
  share_slug          TEXT UNIQUE NOT NULL,
  UNIQUE (user_id)
);

-- 2. Enable RLS
ALTER TABLE public.name_stories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read for public name stories" ON public.name_stories;
CREATE POLICY "Allow public read for public name stories"
  ON public.name_stories
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow manage own name stories" ON public.name_stories;
CREATE POLICY "Allow manage own name stories"
  ON public.name_stories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_name_stories_share_slug ON public.name_stories(share_slug);
CREATE INDEX IF NOT EXISTS idx_name_stories_user_id ON public.name_stories(user_id);
