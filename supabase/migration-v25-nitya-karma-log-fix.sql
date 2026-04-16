-- Migration v25 — Nitya Karma log fix
-- The v24 migration used CREATE TABLE IF NOT EXISTS, so if the table already
-- existed (without the log_date column), the column was never added.
-- This migration safely adds the missing column and recreates the unique constraint.

-- 1. Add log_date column if it doesn't already exist
ALTER TABLE public.nitya_karma_log
  ADD COLUMN IF NOT EXISTS log_date date NOT NULL DEFAULT CURRENT_DATE;

-- 2. Add completed_at column if it doesn't already exist (same issue may apply)
ALTER TABLE public.nitya_karma_log
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NOT NULL DEFAULT now();

-- 3. Add step_id column if it doesn't already exist
ALTER TABLE public.nitya_karma_log
  ADD COLUMN IF NOT EXISTS step_id text;

-- 4. Recreate unique constraint safely (skip if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'nitya_karma_log_user_id_log_date_step_id_key'
      AND conrelid = 'public.nitya_karma_log'::regclass
  ) THEN
    ALTER TABLE public.nitya_karma_log
      ADD CONSTRAINT nitya_karma_log_user_id_log_date_step_id_key
      UNIQUE (user_id, log_date, step_id);
  END IF;
END $$;

-- 5. Recreate index if it doesn't exist
CREATE INDEX IF NOT EXISTS nitya_karma_log_user_date
  ON public.nitya_karma_log(user_id, log_date);

-- 6. Make sure RLS is enabled
ALTER TABLE public.nitya_karma_log ENABLE ROW LEVEL SECURITY;

-- 7. Recreate policies (DROP IF EXISTS first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own karma log" ON public.nitya_karma_log;
DROP POLICY IF EXISTS "Users can insert own karma log" ON public.nitya_karma_log;
DROP POLICY IF EXISTS "Users can upsert own karma log" ON public.nitya_karma_log;

CREATE POLICY "Users can view own karma log"
  ON public.nitya_karma_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own karma log"
  ON public.nitya_karma_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow upsert (needed for ON CONFLICT DO UPDATE)
CREATE POLICY "Users can upsert own karma log"
  ON public.nitya_karma_log FOR UPDATE
  USING (auth.uid() = user_id);
