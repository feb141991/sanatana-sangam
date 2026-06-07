-- Migration: add health-tracking fields to live_darshans
--
-- Streams whose health_status transitions to 'offline' are automatically
-- excluded from user-facing playlists without being hard-deleted.
-- The check-live-darshans cron writes these fields; the sync cron resets
-- them to 'healthy' whenever a working live video is confirmed.
--
-- health_status values:
--   healthy      — last check passed; show normally with Live badge
--   suspect      — one consecutive failure; still shown, no hard action
--   offline      — 2+ consecutive failures; excluded from playlists
--   needs_review — manually flagged by admin; excluded from playlists

ALTER TABLE public.live_darshans
  ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'healthy'
    CHECK (health_status IN ('healthy', 'suspect', 'offline', 'needs_review')),
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_health_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_health_error text,
  ADD COLUMN IF NOT EXISTS last_working_video_id text;

-- Fast resolver filtering: is_active + health_status
CREATE INDEX IF NOT EXISTS idx_live_darshans_health
  ON public.live_darshans (is_active, health_status);

COMMENT ON COLUMN public.live_darshans.health_status IS
  'Reliability state: healthy|suspect|offline|needs_review. offline and needs_review rows are excluded from playlists.';
COMMENT ON COLUMN public.live_darshans.failure_count IS
  'Consecutive health-check failures. Resets to 0 on first success.';
COMMENT ON COLUMN public.live_darshans.last_health_checked_at IS
  'Timestamp of the most recent automated health check (UTC).';
COMMENT ON COLUMN public.live_darshans.last_health_error IS
  'Last error message from a failed health check. Cleared on success.';
COMMENT ON COLUMN public.live_darshans.last_working_video_id IS
  'Most recently verified working YouTube video ID. Preserved even when current_video_id becomes stale, enabling fast recovery.';
