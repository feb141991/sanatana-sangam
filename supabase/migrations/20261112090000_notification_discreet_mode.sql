-- Lock-screen discretion: let a person choose that their push notifications say only that they have a notification.
--
-- WRITTEN, NOT APPLIED. Founder queue item 4 (2026-11-08).
--
-- WHAT IT ADDS
--   profiles.notification_discreet_mode boolean NOT NULL DEFAULT false.
--   When true, the push sender (src/lib/push-server.ts) replaces the title and body of every push to that person with
--   a neutral line ("Shoonaya" / "You have a new notification."), except security notices. Taps still open the right
--   screen, because the destination travels in the push data, not in its text. In-app notification rows are unchanged.
--   Default false: nothing changes for anyone until they switch it on in Settings.
--
-- ROC pre-flight (AGENTS.md section 4)
--   1. Function overload trap: no function is created, changed or dropped.
--   2. Caller contract: no existing caller reads or writes the column. The profile route allow-lists it in the same
--      release; an app or backend of either age keeps working (the app reads it separately and disables the switch if
--      the column does not exist yet; the sender treats a missing column as "nobody has asked").
--   3. User data / opt-outs: ADD COLUMN with a constant default is a metadata-only change; no row is rewritten or updated.
--      Pre-flight counts are not needed because no existing value is touched; after applying, every row reads false.
--   4. Locks: ACCESS EXCLUSIVE on profiles for the instant of the catalog change. lock_timeout makes it fail fast
--      instead of queueing behind a long transaction and blocking live traffic; re-run if it times out.
--   5. Rollback: supabase/rollbacks/20261112090000_notification_discreet_mode_rollback.sql (drops the column and the
--      preference in it).
--   RLS: unchanged. The new column is covered by profiles' existing row policies; authenticated already holds
--   table-level SELECT and UPDATE (read 2026-11-10), so no grant is added.

set local lock_timeout = '5s';

alter table public.profiles
  add column if not exists notification_discreet_mode boolean not null default false;

comment on column public.profiles.notification_discreet_mode is
  'When true, push notifications to this account show only a neutral line, not their real title and body (security notices excepted). Set by the person in Settings. Default false.';

do $check$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'notification_discreet_mode'
      and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false'
  ) then
    raise exception 'discreet mode self-check: profiles.notification_discreet_mode must be boolean NOT NULL DEFAULT false';
  end if;
  if exists (select 1 from public.profiles where notification_discreet_mode is distinct from false) then
    raise exception 'discreet mode self-check: no existing profile may be switched on by the migration';
  end if;
end
$check$;
