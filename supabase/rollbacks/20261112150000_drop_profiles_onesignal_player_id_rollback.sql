-- Rollback for 20261112150000_drop_profiles_onesignal_player_id.sql: re-adds the column as it was (text, nullable, no default, empty).
begin;
set local lock_timeout = '5s';
alter table public.profiles add column if not exists onesignal_player_id text;
commit;
