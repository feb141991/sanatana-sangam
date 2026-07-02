-- Migration v84: allow youtube_channel_id to be NULL for pending/unverified streams
-- Previously NOT NULL, which prevented inserting streams before their channel ID is confirmed.
-- The sync-cron (sync-live-darshans) already skips rows where youtube_channel_id IS NULL.

ALTER TABLE public.live_darshans
  ALTER COLUMN youtube_channel_id DROP NOT NULL;

-- The 68 new streams are managed via LIVE_STREAMS static registry and surface only
-- when the team verifies them. Use the AG verification prompt + INSERT below to publish:
--
-- INSERT INTO public.live_darshans
--   (id, title, location, schedule, category, tradition, youtube_channel_id, current_video_id, is_active)
-- VALUES
--   ('<stream_id>', '<title>', '<location>', '<schedule>', '<category>', '<tradition>',
--    '<UC_channel_id>', '<video_id>', true)
-- ON CONFLICT (id) DO UPDATE SET
--   youtube_channel_id = EXCLUDED.youtube_channel_id,
--   current_video_id   = EXCLUDED.current_video_id,
--   is_active          = EXCLUDED.is_active;
