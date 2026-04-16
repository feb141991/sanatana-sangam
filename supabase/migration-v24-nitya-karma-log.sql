-- Migration v24 — Nitya Karma daily log
-- Persists step completions per user per calendar day.
-- Primary key ensures each step is only ticked once per day.
-- Resets naturally at midnight (new date = new rows).

CREATE TABLE IF NOT EXISTS public.nitya_karma_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date    date NOT NULL DEFAULT CURRENT_DATE,
  step_id     text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date, step_id)
);

-- RLS: users can only read/write their own rows
ALTER TABLE public.nitya_karma_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own karma log"
  ON public.nitya_karma_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own karma log"
  ON public.nitya_karma_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast daily lookup
CREATE INDEX IF NOT EXISTS nitya_karma_log_user_date
  ON public.nitya_karma_log(user_id, log_date);
