-- Sanskara tracker, M5: the three retention jobs (majority sweep, consent purge, audit and request-log retention).
-- Contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md section 9 (E7, E8) and decision D5. Design: section 6.
-- Depends on M1 to M4a. NOT applied to any database by this commit. Scheduling the jobs happens when this is applied.
--
-- WHAT THIS ADDS
--   sanskara_job_majority_sweep(now, dry_run, batch)  E7. Dependents whose 12-month former-manager window has ended and who were
--                                                     never claimed are DELETED. Dependents who have reached 18 are marked
--                                                     frozen, their shares are revoked and their followers' reminder
--                                                     subscriptions are deleted (which cancels the pending reminders).
--   sanskara_job_consent_purge(now, dry_run, batch)   E8. A person's own timeline is deleted 30 days after consent to religious
--                                                     data was withdrawn, if it is still withdrawn when the job looks.
--   sanskara_job_retention(now, dry_run, batch)       D5. Audit rows older than 12 months and idempotency rows older than
--                                                     7 days are deleted.
--   three pg_cron entries, daily, off the hour.
--
-- WHAT KEEPS THEM SAFE
--   * Correctness never depends on a job having run. sanskara_can derives the former-manager window, the end of access and the
--     consent state from the dates and the profile at every read, so a job that is late, skipped or failing leaves data
--     inert, never exposed. The jobs only decide when inert data is DELETED. Deleting late is the safe error.
--   * Every delete re-reads its condition under a row lock (FOR UPDATE SKIP LOCKED) in the same transaction. A hand-over
--     being accepted, consent being restored or a subject being edited at that moment wins: the job skips the row and
--     tries again tomorrow. The consent purge also re-reads the owner's live consent, not only suspended_at, so a stale
--     marker can never delete a timeline whose owner has since consented.
--   * A row is purged only by the marker set for it. A person whose consent is false but whose suspended_at was never set is
--     NOT purged (fail closed: the data stays inert). Counting such rows is a launch-checklist query, not a job.
--   * Each run handles at most p_batch rows per step (default 200), so a backlog cannot hold locks for long; the rest is
--     picked up on the next day's run.
--   * p_dry_run counts what would happen and changes nothing. Use it for the pre-flight report before this is first scheduled.
--   * Audit rows written here are metadata only: action 'purged' or 'grant_revoked', the subject id, a reason in detail, and no
--     actor and no target. Nothing about the person, the child's name or any record.
--
-- WHAT THEY DELIBERATELY DO NOT DO
--   * No notification and no analytics event is sent. A deletion is not announced by pushing the thing that was deleted.
--   * A dependent whose managers have ALL withdrawn consent is not purged. E8 names the owner's consent only; for a dependent
--     the data stays inert until the 12-month window ends or a manager consents again. Whether to purge it earlier is a policy
--     decision for the founder (design section 10, item 7).
--   * The reminder producer is not here. It is TypeScript, and the design says it must not be scheduled until the dispatcher
--     calls sanskara_reminder_still_valid.
--
-- Privilege review: SECURITY DEFINER, empty search_path, fully qualified names; EXECUTE revoked from every role. They run
-- from pg_cron as the scheduling role (postgres) or by the project owner in the SQL editor; no client can call them.
-- p_now exists so the tests control time; nothing passes it in production.
-- Rollback: supabase/rollbacks/20261103100000_sanskara_scheduled_jobs_rollback.sql. Rows the jobs have already deleted cannot
-- be restored; that is their purpose.

begin;

create function public.sanskara_job_majority_sweep(
  p_now timestamptz default now(), p_dry_run boolean default false, p_batch integer default 200
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_today date := (p_now at time zone 'utc')::date;
  v_batch integer := greatest(1, least(coalesce(p_batch, 200), 2000));
  s record;
  g record;
  v_deleted integer := 0;
  v_frozen integer := 0;
  v_grants integer := 0;
  v_subs integer := 0;
  v_n integer;
begin
  -- 1. The window has ended and nobody claimed the records (a claim deletes the dependent when it is accepted, so a dependent
  -- that still exists after the window was never claimed). Same boundary as sanskara_can and sanskara_accept_claim.
  for s in
    select sj.id from public.sanskara_subjects sj
    where sj.kind = 'dependent' and sj.birth_date is not null
      and v_today >= (((sj.birth_date + interval '18 years')::date) + interval '12 months')::date
    order by sj.id limit v_batch
  loop
    if p_dry_run then
      v_deleted := v_deleted + 1;
      continue;
    end if;
    perform 1 from public.sanskara_subjects sj
    where sj.id = s.id and sj.kind = 'dependent' and sj.birth_date is not null
      and v_today >= (((sj.birth_date + interval '18 years')::date) + interval '12 months')::date
    for update skip locked;
    if not found then continue; end if;
    insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
    values (null, 'purged', s.id, null, jsonb_build_object('reason', 'former_manager_window_ended'));
    delete from public.sanskara_subjects where id = s.id;
    v_deleted := v_deleted + 1;
  end loop;

  -- 2. Reached 18 and still inside the window (a dependent past it is step 1's, even when the batch limit left it for
  -- tomorrow): freeze. Their managers are former managers (read-only); shares made by the
  -- managers end with their authority; reminders for the records stop.
  for s in
    select sj.id from public.sanskara_subjects sj
    where sj.kind = 'dependent' and sj.state = 'active' and sj.birth_date is not null
      and v_today >= (sj.birth_date + interval '18 years')::date
      and v_today < (((sj.birth_date + interval '18 years')::date) + interval '12 months')::date
    order by sj.id limit v_batch
  loop
    if p_dry_run then
      v_frozen := v_frozen + 1;
      continue;
    end if;
    perform 1 from public.sanskara_subjects sj
    where sj.id = s.id and sj.kind = 'dependent' and sj.state = 'active' and sj.birth_date is not null
      and v_today >= (sj.birth_date + interval '18 years')::date
      and v_today < (((sj.birth_date + interval '18 years')::date) + interval '12 months')::date
    for update skip locked;
    if not found then continue; end if;

    update public.sanskara_subjects set state = 'frozen', frozen_at = p_now, updated_at = p_now where id = s.id;
    v_frozen := v_frozen + 1;

    for g in
      update public.sanskara_grants x set revoked_at = p_now, revoked_by = null
      where x.subject_id = s.id and x.revoked_at is null
      returning x.subject_id
    loop
      insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
      values (null, 'grant_revoked', g.subject_id, null, jsonb_build_object('reason', 'subject_reached_majority'));
      v_grants := v_grants + 1;
    end loop;

    -- Deleting a subscription cancels its pending reminders (trigger sanskara_subscription_removed).
    delete from public.sanskara_subscriptions
    where record_id in (select r.id from public.sanskara_records r where r.subject_id = s.id);
    get diagnostics v_n = row_count;
    v_subs := v_subs + v_n;
  end loop;

  return jsonb_build_object('dry_run', p_dry_run, 'deleted_after_window', v_deleted, 'frozen', v_frozen,
                            'grants_revoked', v_grants, 'subscriptions_deleted', v_subs);
end;
$$;

create function public.sanskara_job_consent_purge(
  p_now timestamptz default now(), p_dry_run boolean default false, p_batch integer default 200
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_batch integer := greatest(1, least(coalesce(p_batch, 200), 2000));
  v_cutoff timestamptz := p_now - interval '30 days';
  s record;
  v_purged integer := 0;
begin
  for s in
    select sj.id from public.sanskara_subjects sj
    where sj.kind = 'account' and sj.suspended_at is not null and sj.suspended_at <= v_cutoff
      and not exists (select 1 from public.profiles p where p.id = sj.account_id and p.consent_religious_data is true)
    order by sj.id limit v_batch
  loop
    if p_dry_run then
      v_purged := v_purged + 1;
      continue;
    end if;
    perform 1 from public.sanskara_subjects sj
    where sj.id = s.id and sj.kind = 'account' and sj.suspended_at is not null and sj.suspended_at <= v_cutoff
      and not exists (select 1 from public.profiles p where p.id = sj.account_id and p.consent_religious_data is true)
    for update skip locked;
    if not found then continue; end if;
    insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
    values (null, 'purged', s.id, null, jsonb_build_object('reason', 'consent_withdrawn_30_days'));
    -- Records, private fields, shares, claims and every follower's subscription go with the subject. The timeline is created
    -- again, empty, the next time the person opens it after consenting.
    delete from public.sanskara_subjects where id = s.id;
    v_purged := v_purged + 1;
  end loop;
  return jsonb_build_object('dry_run', p_dry_run, 'timelines_purged', v_purged);
end;
$$;

create function public.sanskara_job_retention(
  p_now timestamptz default now(), p_dry_run boolean default false, p_batch integer default 5000
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_batch integer := greatest(1, least(coalesce(p_batch, 5000), 50000));
  v_audit integer;
  v_log integer;
begin
  if p_dry_run then
    select count(*) into v_audit from (select 1 from public.sanskara_audit where at < p_now - interval '12 months' limit v_batch) a;
    select count(*) into v_log from (select 1 from public.sanskara_request_log where created_at < p_now - interval '7 days' limit v_batch) l;
  else
    delete from public.sanskara_audit
    where id in (select a.id from public.sanskara_audit a where a.at < p_now - interval '12 months' order by a.id limit v_batch);
    get diagnostics v_audit = row_count;
    delete from public.sanskara_request_log
    where ctid = any (array(select l.ctid from public.sanskara_request_log l where l.created_at < p_now - interval '7 days' limit v_batch));
    get diagnostics v_log = row_count;
  end if;
  return jsonb_build_object('dry_run', p_dry_run, 'audit_rows_deleted', v_audit, 'request_log_rows_deleted', v_log);
end;
$$;

revoke all on function public.sanskara_job_majority_sweep(timestamptz, boolean, integer) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_job_consent_purge(timestamptz, boolean, integer) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_job_retention(timestamptz, boolean, integer) from public, anon, authenticated, service_role;

-- Daily, after the UTC date has turned (the functions use the UTC date, like sanskara_can). Off the hour, away from the
-- other jobs in this project (03:37 auth diagnostics).
select cron.schedule('sanskara-majority-sweep-daily', '41 3 * * *', $$select public.sanskara_job_majority_sweep()$$);
select cron.schedule('sanskara-consent-purge-daily', '43 3 * * *', $$select public.sanskara_job_consent_purge()$$);
select cron.schedule('sanskara-retention-daily', '47 3 * * *', $$select public.sanskara_job_retention()$$);

commit;
