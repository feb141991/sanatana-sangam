-- Database backstop: never write an in-app notification for an account that is
-- in its 30-day deletion cool-off.
--
-- Account deletion promises that notifications stop immediately, but only some
-- senders check profiles.is_deleting. An audit found the Nitya morning cron,
-- festival, tithi and vrat reminders, the weekly summary, digest and others
-- writing notification rows for deleting accounts, and the Nitya cron did so
-- every day of a real cool-off. Most senders also insert the row first and push
-- only to the users whose insert actually happened, so dropping the insert here
-- also stops their push, without editing each sender.
--
-- Transactional messages (security, account, moderation and similar) are
-- exempt, matching the resolver's transactional_safety class, so a deleting
-- user can still be told about something that concerns their account.
--
-- Rollback guidance: supabase/rollbacks/20261003150100_skip_notifications_for_deleting_accounts_rollback.sql
-- drops the trigger and function. No data is changed by this migration or its
-- rollback; rows suppressed while it was active are not recoverable.
--
-- Privilege review: SECURITY DEFINER with an empty search_path so the lookup of
-- public.profiles works for every inserting role (service role, the reaction
-- trigger, authenticated clients). EXECUTE is revoked from PUBLIC, anon and
-- authenticated; trigger functions do not need EXECUTE for the inserting role.
-- It only reads profiles.is_deleting for NEW.user_id and never writes.

begin;

create or replace function public.skip_notifications_for_deleting_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type in ('security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert') then
    return new;
  end if;

  if new.user_id is not null and exists (
    select 1 from public.profiles p where p.id = new.user_id and p.is_deleting
  ) then
    return null;
  end if;

  return new;
end;
$$;

revoke all on function public.skip_notifications_for_deleting_accounts() from public, anon, authenticated;

drop trigger if exists notifications_skip_deleting_accounts on public.notifications;
create trigger notifications_skip_deleting_accounts
  before insert on public.notifications
  for each row execute function public.skip_notifications_for_deleting_accounts();

commit;
