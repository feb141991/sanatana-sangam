-- Store the practice context for Mala sessions.
-- This lets insights show which mala style is used most and lets future
-- reminders personalize nudges by the user's actual preferred practice pattern.

ALTER TABLE public.mala_sessions
  ADD COLUMN IF NOT EXISTS mala_id text,
  ADD COLUMN IF NOT EXISTS background_scene text;

CREATE INDEX IF NOT EXISTS idx_mala_sessions_user_mala
  ON public.mala_sessions(user_id, mala_id);
