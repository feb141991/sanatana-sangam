-- Rollback for 20261112130000_account_deletion_completeness_and_retention.sql: restores the previous foreign keys and unschedules the four jobs.
-- Log rows the jobs already deleted cannot be restored. created_by on pathshala_study_circles is made NOT NULL again only if no row has become NULL
-- (a NULL there means a creator's account was deleted after the migration; those rows must be re-homed or deleted before this can run).
begin;
set local lock_timeout = '5s';

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

alter table public.push_token_events drop constraint push_token_events_user_id_fkey;
alter table public.push_token_events
  add constraint push_token_events_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.pathshala_study_circles drop constraint pathshala_study_circles_created_by_fkey;
do $$
begin
  if exists (select 1 from public.pathshala_study_circles where created_by is null) then
    raise exception 'pathshala_study_circles has rows with created_by NULL: re-home or delete them before restoring NOT NULL';
  end if;
end;
$$;
alter table public.pathshala_study_circles alter column created_by set not null;

alter table public.kul_family_link_invitations drop constraint kul_family_link_invitations_created_by_fkey;
alter table public.kul_family_link_invitations
  add constraint kul_family_link_invitations_created_by_fkey
  foreign key (created_by) references auth.users(id);

commit;
