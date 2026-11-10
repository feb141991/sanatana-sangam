-- Rollback for 20261112090000_notification_discreet_mode.sql.
-- Drops the column, so every person's discretion preference is lost (they would have to switch it on again).
-- Deploy a backend without the push-server lookup first, or leave it: the sender treats a missing column as
-- "nobody has asked" and sends full text again, which is the behaviour before the migration.

set local lock_timeout = '5s';

alter table public.profiles drop column if exists notification_discreet_mode;

do $check$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'notification_discreet_mode'
  ) then
    raise exception 'rollback left profiles.notification_discreet_mode behind';
  end if;
end
$check$;
