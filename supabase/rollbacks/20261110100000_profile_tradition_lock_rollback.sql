-- Rollback for 20261110100000_profile_tradition_lock.sql. The trigger only rejects writes; dropping it restores the previous behaviour and
-- changes no data. If the migration was recorded in the history table, also run:
--   supabase migration repair --linked --status reverted 20261110100000
begin;
set local lock_timeout = '5s';
drop trigger if exists guard_profile_tradition_lock on public.profiles;
drop function if exists public.guard_profile_tradition_lock();
commit;
