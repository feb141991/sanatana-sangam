-- Account-deletion completeness and log retention, from the 2026-11-12 privacy audit. NOT applied to any database by this commit.
--
-- Found by comparing every foreign key to auth.users with what the 30-day purge does (production, 2026-11-12):
--  1. kul_family_link_invitations.created_by has NO ACTION: once any account creates a family-link invitation, deleting that account
--     fails (auth.admin.deleteUser returns a foreign-key error) and the account is stuck in its grace period forever. 0 rows today.
--  2. pathshala_study_circles.created_by is NOT NULL and has no foreign key: a deleted creator's id stays behind as a dangling value.
--  3. push_token_events keeps the device push token. Its user_id is SET NULL on deletion, so an erased account's token events stay,
--     and no retention job covers the table (735 rows, oldest 2026-09-13).
--  4. notification_deliveries (2,308 rows, 287 older than 90 days) and notification_dispatch_events (3,537 rows) have no retention
--     job either, although every other notification log is purged at 90 days.
--  5. A family circle (kuls) whose last member's account is deleted stays behind with its relatives' names. 0 orphans today.
--
-- What this does NOT change: SET NULL on thread_messages.sender_id, kul_events/kul_family_members/kul_invitations/kuls.created_by,
-- tirtha_place_media/notes/reports.user_id and sanskara_records.created_by. Those keep other people's shared content after an author
-- leaves; whether and how to erase it is a product and counsel decision (docs/PRIVACY_IMPLEMENTATION_AUDIT_2026-11-12.md).
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): no function is created, replaced or dropped.
--  2. Caller contract: no signature changes. Behaviour changes only for deletion: a user's family-link invitations and push-token
--     events now go with the user, and a study circle keeps existing with created_by = NULL. Code that reads
--     pathshala_study_circles.created_by must tolerate NULL (searched: it is only displayed or compared for equality).
--  3. User data and opt-out safety: nothing updates a profile or any preference column. No existing row is deleted BY THIS
--     MIGRATION. The new jobs delete, at 21:50-22:05 UTC after it is applied: push_token_events older than 90 days (0 rows today),
--     notification_dispatch_events older than 90 days (0 rows), notification_deliveries older than 90 days (287 rows), and
--     family circles with no member for over a day (0 rows). Re-read those four counts on the day it is applied.
--     push_token_events rows with user_id NULL are NOT deleted: many are registrations that arrived before sign-in, so NULL does not
--     mean "erased account"; the 90-day job bounds them.
--  4. Locks: the foreign-key changes are on tables with 0 rows (kul_family_link_invitations) or small tables; each is added NOT VALID
--     then validated; lock_timeout 5s fails fast. push_token_events (735 rows) is re-pointed the same way.
--  5. Rollback: supabase/rollbacks/20261112130000_account_deletion_completeness_and_retention_rollback.sql restores the three foreign
--     keys, the NOT NULL on created_by (only if no row is NULL) and unschedules the four jobs. Deleted log rows cannot be restored.

begin;
set local lock_timeout = '5s';

-- 1. Invitations a person created go with the person.
alter table public.kul_family_link_invitations drop constraint kul_family_link_invitations_created_by_fkey;
alter table public.kul_family_link_invitations
  add constraint kul_family_link_invitations_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete cascade not valid;
alter table public.kul_family_link_invitations validate constraint kul_family_link_invitations_created_by_fkey;

-- 2. A study circle outlives its creator, who is no longer named on it.
alter table public.pathshala_study_circles alter column created_by drop not null;
alter table public.pathshala_study_circles
  add constraint pathshala_study_circles_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.pathshala_study_circles validate constraint pathshala_study_circles_created_by_fkey;

-- 3. Push-token events (they hold the device token) go with the account instead of being left unlinked.
alter table public.push_token_events drop constraint push_token_events_user_id_fkey;
alter table public.push_token_events
  add constraint push_token_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.push_token_events validate constraint push_token_events_user_id_fkey;

-- 4. 90-day retention for the three notification logs that had none, and a daily sweep for family circles nobody belongs to.
do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job
    where jobname in ('purge-push-token-events-daily', 'purge-notification-deliveries-daily', 'purge-notification-dispatch-events-daily', 'purge-orphan-kuls-daily')
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule('purge-push-token-events-daily', '50 21 * * *',
  $$delete from public.push_token_events where created_at < now() - interval '90 days'$$);
select cron.schedule('purge-notification-deliveries-daily', '55 21 * * *',
  $$delete from public.notification_deliveries where created_at < now() - interval '90 days'$$);
select cron.schedule('purge-notification-dispatch-events-daily', '0 22 * * *',
  $$delete from public.notification_dispatch_events where created_at < now() - interval '90 days'$$);
-- Every child of kuls is ON DELETE CASCADE (members, family members, events, tasks, messages, invitations, wishes), so this removes the
-- relatives' names too. The one-day wait keeps a circle that is being created from being swept before its creator is added.
select cron.schedule('purge-orphan-kuls-daily', '5 22 * * *',
  $$delete from public.kuls k where k.created_at < now() - interval '1 day' and not exists (select 1 from public.kul_members m where m.kul_id = k.id)$$);

do $verify$
begin
  assert (select confdeltype from pg_constraint where conname = 'kul_family_link_invitations_created_by_fkey') = 'c', 'invitations cascade';
  assert (select confdeltype from pg_constraint where conname = 'push_token_events_user_id_fkey') = 'c', 'push-token events cascade';
  assert (select confdeltype from pg_constraint where conname = 'pathshala_study_circles_created_by_fkey') = 'n', 'study circles set null';
  assert (select count(*) from cron.job where jobname in ('purge-push-token-events-daily', 'purge-notification-deliveries-daily', 'purge-notification-dispatch-events-daily', 'purge-orphan-kuls-daily')) = 4, 'four jobs';
  assert (select count(*) from pg_constraint where conrelid = 'public.kul_family_link_invitations'::regclass and confrelid = 'auth.users'::regclass and confdeltype = 'a') = 0, 'no blocking key left on invitations';
end
$verify$;

commit;
