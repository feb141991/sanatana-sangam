-- ─── Quiz Mastery Expansion ─────────────────────────────────────────────────
-- Adds karma_points to profiles, explanation to quiz_responses,
-- and quiz_sessions table for practice mode.
-- Run in Supabase SQL editor or via supabase db push.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. karma_points on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS karma_points INTEGER NOT NULL DEFAULT 0;

-- 2. explanation on quiz_responses (stores why the correct answer is correct)
ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 3. quiz_sessions — tracks each practice mode session
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tradition         text        NOT NULL,
  topic             text        NOT NULL,
  difficulty        text        NOT NULL CHECK (difficulty IN ('seeker', 'gyani', 'pandit')),
  questions_total   integer     NOT NULL DEFAULT 5,
  questions_correct integer     NOT NULL DEFAULT 0,
  karma_earned      integer     NOT NULL DEFAULT 0,
  completed_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON public.quiz_sessions(user_id, completed_at DESC);

-- 4. Atomic karma increment function (safe for concurrent calls)
CREATE OR REPLACE FUNCTION public.increment_karma(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET karma_points = karma_points + p_amount
  WHERE id = p_user_id;
$$;
