-- Account deletion cool-off period.
--
-- `src/app/(main)/profile/ProfileClient.tsx` (requestAccountDeletion /
-- cancelAccountDeletion) has shipped a "30-day cool-off" Delete Account UI
-- since an earlier session, but the two columns it writes to
-- (profiles.is_deleting, profiles.deletion_requested_at) were never actually
-- created -- every click has been failing with a PostgREST
-- "Could not find the '<column>' column of 'profiles' in the schema cache"
-- error. This migration adds the missing columns and an index to support the
-- purge cron (src/app/api/cron/purge-deleted-accounts/route.ts) that
-- actually completes the deletion once the 30-day window elapses -- that
-- part never existed anywhere either, so previously even a successful write
-- to these columns would have left the account "scheduled" forever with no
-- mechanism to finish the job.
--
-- No RLS policy change needed: "Users can update own profile" already
-- grants row-level (not column-restricted) UPDATE to the owning user
-- (auth.uid() = id), so the existing policy already covers these two new
-- columns.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleting boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.is_deleting IS
  'True while a user-initiated account deletion is in its 30-day cancellable cool-off window. Set/cleared client-side from the Profile page Danger Zone. Purged by the daily purge-deleted-accounts cron once deletion_requested_at is 30+ days old.';
COMMENT ON COLUMN public.profiles.deletion_requested_at IS
  'Timestamp the user requested account deletion. NULL when not pending deletion (default, or after cancellation). The account is hard-deleted 30 days after this timestamp by the purge-deleted-accounts cron unless the user cancels first.';

-- Supports the purge cron's WHERE is_deleting = true AND deletion_requested_at < (now() - interval '30 days')
CREATE INDEX IF NOT EXISTS profiles_pending_deletion_idx
  ON public.profiles (deletion_requested_at)
  WHERE is_deleting = true;
