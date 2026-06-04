-- 1. Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date               DATE NOT NULL,
  content                  TEXT NOT NULL,
  mood                     TEXT NOT NULL CHECK (mood IN ('peaceful', 'grateful', 'seeking', 'struggling', 'joyful')),
  tradition_context        TEXT NULL,
  tags                     TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_shared_to_kul         BOOLEAN DEFAULT FALSE NOT NULL,
  ai_reflection_generated  BOOLEAN DEFAULT FALSE NOT NULL,
  created_at               TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, entry_date)
);

-- 2. Create journal_reflections table
CREATE TABLE IF NOT EXISTS public.journal_reflections (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_at             TIMESTAMPTZ DEFAULT now() NOT NULL,
  period                   TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly')),
  reflection_text          TEXT NOT NULL,
  entry_ids                UUID[] NOT NULL,
  themes                   TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_shared_to_kul         BOOLEAN DEFAULT FALSE NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_reflections ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for journal_entries
DROP POLICY IF EXISTS "Users can manage own journal entries" ON public.journal_entries;
CREATE POLICY "Users can manage own journal entries"
  ON public.journal_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shared kul journal entries" ON public.journal_entries;
CREATE POLICY "Users can view shared kul journal entries"
  ON public.journal_entries
  FOR SELECT
  TO authenticated
  USING (
    is_shared_to_kul = true
    AND EXISTS (
      SELECT 1 FROM public.kul_members km1
      JOIN public.kul_members km2 ON km1.kul_id = km2.kul_id
      WHERE km1.user_id = public.journal_entries.user_id
        AND km2.user_id = auth.uid()
    )
  );

-- 5. RLS Policies for journal_reflections
DROP POLICY IF EXISTS "Users can manage own reflections" ON public.journal_reflections;
CREATE POLICY "Users can manage own reflections"
  ON public.journal_reflections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shared kul reflections" ON public.journal_reflections;
CREATE POLICY "Users can view shared kul reflections"
  ON public.journal_reflections
  FOR SELECT
  TO authenticated
  USING (
    is_shared_to_kul = true
    AND EXISTS (
      SELECT 1 FROM public.kul_members km1
      JOIN public.kul_members km2 ON km1.kul_id = km2.kul_id
      WHERE km1.user_id = public.journal_reflections.user_id
        AND km2.user_id = auth.uid()
    )
  );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_reflections_user ON public.journal_reflections(user_id, generated_at DESC);
