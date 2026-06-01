-- Extend Sattvic/Zen sessions with engine context.

ALTER TABLE public.sattvic_sessions
  ADD COLUMN IF NOT EXISTS tradition text,
  ADD COLUMN IF NOT EXISTS ambient_id text,
  ADD COLUMN IF NOT EXISTS completion_type text DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS source_route text;

CREATE INDEX IF NOT EXISTS idx_sattvic_sessions_user_tradition
  ON public.sattvic_sessions(user_id, tradition, completed_at DESC);
