-- ─────────────────────────────────────────────────────────────────────────────
-- Sanatana Sangam — Migration v23 (Pathshala Lesson Progress)
-- Run this in Supabase SQL Editor
--
-- Adds per-lesson tracking to guided_path_progress so the lesson viewer can
-- remember where a user left off and which lessons they have completed.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.guided_path_progress
  ADD COLUMN IF NOT EXISTS current_lesson    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_lessons integer[] NOT NULL DEFAULT '{}';

-- Auto-update updated_at when lesson progress changes
CREATE OR REPLACE FUNCTION public.update_guided_path_progress_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guided_path_progress_updated_at
  ON public.guided_path_progress;

CREATE TRIGGER guided_path_progress_updated_at
  BEFORE UPDATE ON public.guided_path_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_guided_path_progress_timestamp();
