-- ─── Migration v16 — Pathshala Study State ─────────────────────────────────
-- Persists basic Pathshala return loops so users can bookmark texts and
-- continue where they last studied.

CREATE TABLE IF NOT EXISTS public.pathshala_user_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tradition       text NOT NULL CHECK (tradition IN ('hindu', 'sikh', 'buddhist', 'jain')),
  section_id      text NOT NULL,
  entry_id        text NOT NULL,
  last_opened_at  timestamptz NOT NULL DEFAULT now(),
  bookmarked_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_pathshala_user_state_recent
  ON public.pathshala_user_state(user_id, last_opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_pathshala_user_state_bookmarks
  ON public.pathshala_user_state(user_id, bookmarked_at DESC);

ALTER TABLE public.pathshala_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their pathshala state"
  ON public.pathshala_user_state;
DROP POLICY IF EXISTS "Users can insert their pathshala state"
  ON public.pathshala_user_state;
DROP POLICY IF EXISTS "Users can update their pathshala state"
  ON public.pathshala_user_state;
DROP POLICY IF EXISTS "Users can delete their pathshala state"
  ON public.pathshala_user_state;

CREATE POLICY "Users can read their pathshala state"
  ON public.pathshala_user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their pathshala state"
  ON public.pathshala_user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pathshala state"
  ON public.pathshala_user_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their pathshala state"
  ON public.pathshala_user_state FOR DELETE
  USING (auth.uid() = user_id);
