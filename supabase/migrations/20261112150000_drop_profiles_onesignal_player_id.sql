-- Drops profiles.onesignal_player_id, the last OneSignal column. NOT applied to any database by this commit.
-- Migration 20260828140000_drop_onesignal_player_id is recorded as applied in production, but the column is still there
-- (checked 2026-11-12: type text, nullable, 0 non-null values). This repeats the drop and refuses to run if any value exists.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped. native_push_monitoring_counts mentions the
--     provider value 'onesignal' in notification_deliveries, not this column, and is unaffected.
--  2. Caller contract: no code in either repository reads or writes the column (only two test mocks list it). A client that selects
--     it by name would get an error; none does. select('*') simply stops returning it.
--  3. User data and opt-out safety: no UPDATE. The migration refuses to run if any profile holds a value (0 on 2026-11-12).
--  4. Locks: DROP COLUMN is metadata-only (brief ACCESS EXCLUSIVE on profiles, no rewrite); lock_timeout 5s fails fast.
--  5. Rollback: supabase/rollbacks/20261112150000_drop_profiles_onesignal_player_id_rollback.sql re-adds the empty nullable column.
-- After applying: regenerate src/types/database.generated.ts and remove the column from src/lib/mocks/profile.ts and mandali.ts.

begin;
set local lock_timeout = '5s';

do $check$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'onesignal_player_id') then
    if exists (select 1 from public.profiles where onesignal_player_id is not null) then
      raise exception 'profiles.onesignal_player_id still holds values: refusing to drop';
    end if;
  end if;
end
$check$;

alter table public.profiles drop column if exists onesignal_player_id;

commit;
