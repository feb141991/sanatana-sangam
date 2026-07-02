-- Canonical practice context for Mala/Japa engine recommendations.
-- The UI can remain simple, but the engine needs enough context to understand
-- what was practised, when, in which tradition, and under which sensory setup.

ALTER TABLE public.mala_sessions
  ADD COLUMN IF NOT EXISTS tradition text,
  ADD COLUMN IF NOT EXISTS practice_type text DEFAULT 'mala',
  ADD COLUMN IF NOT EXISTS intention text,
  ADD COLUMN IF NOT EXISTS completion_type text DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS target_rounds integer,
  ADD COLUMN IF NOT EXISTS completed_rounds integer,
  ADD COLUMN IF NOT EXISTS ambient_id text,
  ADD COLUMN IF NOT EXISTS spiritual_time_window text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS source_route text,
  ADD COLUMN IF NOT EXISTS panchang_context jsonb;

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_tradition
  ON public.mala_sessions(user_id, tradition, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_practice_type
  ON public.mala_sessions(user_id, practice_type, completed_at DESC);
