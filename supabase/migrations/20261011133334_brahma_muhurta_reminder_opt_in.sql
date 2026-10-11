-- Brahma Muhurta pre-dawn reminders become an explicit opt-in.
--
-- Until now /api/cron/brahma-muhurta enqueued a push for every profile with
-- saved coordinates, with no preference column at all, so users received a
-- ~03:00-05:00 local push they had never asked for (142 of 210 sends in the
-- 30 days to 2026-10-11 fell between 22:00 and 06:00 local time).
--
-- Default false: nobody receives it until they switch it on in Settings.
-- Existing users are deliberately NOT backfilled to true.
--
-- RLS/privileges: profiles already has table-level UPDATE for authenticated
-- with the own-row policy "Users can update own profile"; no new grant needed.
--
-- Rollback:
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS wants_brahma_muhurta_reminders;
--   (and redeploy the previous cron, which ignores the column)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wants_brahma_muhurta_reminders boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.wants_brahma_muhurta_reminders IS
  'Explicit opt-in for the pre-dawn Brahma Muhurta push. Default off. When on, the default night quiet window does not apply; a user-set quiet window still does.';
