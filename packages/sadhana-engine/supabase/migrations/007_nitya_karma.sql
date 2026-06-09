-- ============================================================
-- Migration 007: Nitya Karma daily step log
-- Persists one row per completed step per user per calendar day.
-- This mirrors the app-level v24/v25 migrations.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nitya_karma_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date     date NOT NULL DEFAULT CURRENT_DATE,
  step_id      text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, step_id)
);

CREATE TABLE IF NOT EXISTS public.nitya_karma_streaks (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  int DEFAULT 0,
  longest_streak  int DEFAULT 0,
  last_full_date  date,
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nitya_karma_log_user_date
  ON public.nitya_karma_log(user_id, log_date);

CREATE INDEX IF NOT EXISTS nitya_karma_log_user_step_date
  ON public.nitya_karma_log(user_id, step_id, log_date DESC);

ALTER TABLE public.nitya_karma_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nitya_karma_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own karma log" ON public.nitya_karma_log;
DROP POLICY IF EXISTS "Users can insert own karma log" ON public.nitya_karma_log;
DROP POLICY IF EXISTS "Users can upsert own karma log" ON public.nitya_karma_log;
DROP POLICY IF EXISTS "Users can delete own karma log" ON public.nitya_karma_log;

CREATE POLICY "Users can view own karma log"
  ON public.nitya_karma_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own karma log"
  ON public.nitya_karma_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can upsert own karma log"
  ON public.nitya_karma_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own karma log"
  ON public.nitya_karma_log FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own nitya streaks" ON public.nitya_karma_streaks;
DROP POLICY IF EXISTS "Users can insert own nitya streaks" ON public.nitya_karma_streaks;
DROP POLICY IF EXISTS "Users can update own nitya streaks" ON public.nitya_karma_streaks;

CREATE POLICY "Users can view own nitya streaks"
  ON public.nitya_karma_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nitya streaks"
  ON public.nitya_karma_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nitya streaks"
  ON public.nitya_karma_streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
