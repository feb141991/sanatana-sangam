-- ─── Migration v15 — Guided Path Progress ───────────────────────────────────
-- Persists first-week onboarding / home guidance state so personalized cards
-- can be dismissed or completed instead of living forever on the dashboard.

CREATE TABLE IF NOT EXISTS public.guided_path_progress (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_id             text NOT NULL,
  status              text NOT NULL CHECK (status IN ('active', 'dismissed', 'completed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  last_interacted_at  timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,
  UNIQUE (user_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_guided_path_progress_user_status
  ON public.guided_path_progress(user_id, status, updated_at DESC);

ALTER TABLE public.guided_path_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their guided path progress"
  ON public.guided_path_progress;
DROP POLICY IF EXISTS "Users can insert their guided path progress"
  ON public.guided_path_progress;
DROP POLICY IF EXISTS "Users can update their guided path progress"
  ON public.guided_path_progress;
DROP POLICY IF EXISTS "Users can delete their guided path progress"
  ON public.guided_path_progress;

CREATE POLICY "Users can read their guided path progress"
  ON public.guided_path_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their guided path progress"
  ON public.guided_path_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their guided path progress"
  ON public.guided_path_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their guided path progress"
  ON public.guided_path_progress FOR DELETE
  USING (auth.uid() = user_id);
