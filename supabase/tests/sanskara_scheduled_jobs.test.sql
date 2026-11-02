-- Integration assertions for 20261103100000_sanskara_scheduled_jobs.sql (Sanskara tracker, M5).
-- Run against an isolated Supabase branch / scratch database after applying M1 to M4a, the lifecycle migration and the
-- migration above, as the migration owner. Everything is rolled back at the end.
--
-- Contract section 9, E7 and E8, and decision D5. What each case pins:
--   * the 12-month former-manager window ends on exactly the day sanskara_can stops honouring it, and a dependent that
--     reached 18 inside the window is frozen, not deleted;
--   * the consent purge uses the 30-day marker AND the owner's live consent, so a stale marker never deletes anything, and
--     an account that was never marked is never purged;
--   * a dry run changes nothing; a batch limit is honoured; a second run changes nothing;
--   * nothing about a person is written to the audit trail, and no client role can call a job.
begin;
set local timezone to 'UTC';

create function public._t(n text) returns uuid language sql immutable as $$ select md5('sanskara-jobs:' || n)::uuid $$;
create function public._t_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
  execute 'set local role authenticated';
end $$;
create function public._t_admin() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
create function public._t_expect(p_sqlstate text, p_label text, p_stmt text) returns void language plpgsql as $$
declare v_state text;
begin
  begin
    execute p_stmt;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    if v_state <> p_sqlstate then
      raise exception 'FAIL %: expected SQLSTATE %, got % (%)', p_label, p_sqlstate, v_state, sqlerrm using errcode = 'P0004';
    end if;
    return;
  end;
  raise exception 'FAIL %: the statement was accepted', p_label using errcode = 'P0004';
end $$;
grant execute on function public._t(text), public._t_as(uuid), public._t_admin(), public._t_expect(text, text, text) to authenticated, anon;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- Accounts: M manages every dependent. G is a Kul member who has been shown records and follows them. Owners O1 to O5 have
-- their own timelines (see section 4). All are in Kul K1.
insert into auth.users (id) select public._t(n) from unnest(array['M', 'G', 'O1', 'O2', 'O3', 'O4', 'O5']) n;
insert into public.kuls (id) values (public._t('K1'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, username, full_name)
select public._t(n), public._t('K1'), true, false, 'user_' || lower(n), 'Name ' || n
from unnest(array['M', 'G', 'O1', 'O2', 'O3', 'O4', 'O5']) n;
insert into public.kul_members (kul_id, user_id, role)
select public._t('K1'), public._t(n), case when n = 'M' then 'guardian' else 'sadhak' end
from unnest(array['M', 'G', 'O1', 'O2', 'O3', 'O4', 'O5']) n;
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_b', 'B', false), ('rite_b2', 'B', false);

-- Dependents. adult_on = birth + 18 years; the window ends 12 months after that.
--   Dm   a minor                                              untouched
--   Dt   turns 18 today                                       frozen, in the window
--   Dy   18 three months ago                                  frozen, in the window
--   De   window ends tomorrow                                 frozen, not deleted
--   Dw   window ends today                                    deleted (sanskara_can already refuses at this date)
--   Do   window ended years ago                               deleted
--   Dz   already frozen earlier, window still open            left as it is
insert into public.sanskara_subjects (id, kind, display_name, birth_date, state, frozen_at) values
  (public._t('Dm'), 'dependent', 'Minor', current_date - interval '10 years', 'active', null),
  (public._t('Dt'), 'dependent', 'Today', current_date - interval '18 years', 'active', null),
  (public._t('Dy'), 'dependent', 'Young', current_date - interval '18 years' - interval '3 months', 'active', null),
  (public._t('De'), 'dependent', 'Edge', current_date - interval '19 years' + interval '1 day', 'active', null),
  (public._t('Dw'), 'dependent', 'Window', current_date - interval '19 years', 'active', null),
  (public._t('Do'), 'dependent', 'Old', current_date - interval '24 years', 'active', null),
  (public._t('Dz'), 'dependent', 'Done', current_date - interval '18 years' - interval '1 month', 'frozen', now() - interval '10 days');
insert into public.sanskara_subject_managers (subject_id, account_id)
select public._t(d), public._t('M') from unnest(array['Dm', 'Dt', 'Dy', 'De', 'Dw', 'Do', 'Dz']) d;
insert into public.sanskara_records (id, subject_id, rite_key, planned_date)
select public._t('r' || d), public._t(d), 'rite_b', current_date + 30 from unnest(array['Dm', 'Dt', 'Dy', 'De', 'Dw', 'Do', 'Dz']) d;
-- G follows each record. The manager shared each with G while the child was a minor (inserted directly: sanskara_can reads
-- the managers, so the shares would also have been honoured for a minor).
insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
select public._t(d), public._t('G'), public._t('M'), public._t('K1'), 'record', public._t('r' || d)
from unnest(array['Dm', 'Dt', 'Dy', 'De', 'Dw', 'Do', 'Dz']) d;
insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days)
select public._t('sub' || d), public._t('r' || d), public._t('M'), 7 from unnest(array['Dm', 'Dt', 'Dy', 'De', 'Dw', 'Do', 'Dz']) d;
-- A pending reminder for each subscription, as the resolver would have left it.
insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
select public._t('M'), 't', 'b', now() + interval '1 day', 'sanskar_milestone', 'pending', 'sanskara-test:' || d,
       jsonb_build_object('subscription_id', public._t('sub' || d))
from unnest(array['Dm', 'Dt', 'Dy', 'De', 'Dw', 'Do', 'Dz']) d;

-- Account timelines. suspended_at is the consent-withdrawal marker; the trigger on profiles sets it, here it is set by hand
-- so the age can be controlled.
--   O1  consent false, marked 31 days ago                       purged
--   O2  consent false, marked exactly 30 days ago               purged (the boundary is inclusive)
--   O3  consent false, marked 29 days ago                       kept (the 30 days have not passed)
--   O4  consent TRUE, marker 31 days old (stale)                kept (live consent wins)
--   O5  consent false, never marked                             kept (fail closed)
update public.profiles set consent_religious_data = false where id in (public._t('O1'), public._t('O2'), public._t('O3'), public._t('O5'));
insert into public.sanskara_subjects (id, kind, account_id, suspended_at) values
  (public._t('SO1'), 'account', public._t('O1'), now() - interval '31 days'),
  (public._t('SO2'), 'account', public._t('O2'), now() - interval '30 days'),
  (public._t('SO3'), 'account', public._t('O3'), now() - interval '29 days'),
  (public._t('SO4'), 'account', public._t('O4'), now() - interval '31 days'),
  (public._t('SO5'), 'account', public._t('O5'), null);
insert into public.sanskara_records (id, subject_id, rite_key, planned_date)
select public._t('r' || s), public._t(s), 'rite_b', current_date + 30 from unnest(array['SO1', 'SO2', 'SO3', 'SO4', 'SO5']) s;
insert into public.sanskara_record_private (record_id, notes) select public._t('r' || s), 'private note ' || s from unnest(array['SO1', 'SO2', 'SO3', 'SO4', 'SO5']) s;
insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
select public._t(s), public._t('G'), public._t(replace(s, 'S', '')), public._t('K1'), 'record', public._t('r' || s)
from unnest(array['SO1', 'SO2', 'SO3', 'SO4', 'SO5']) s;
insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days)
select public._t('sub' || s), public._t('r' || s), public._t('G'), 7 from unnest(array['SO1', 'SO2', 'SO3', 'SO4', 'SO5']) s;
insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
select public._t('G'), 't', 'b', now() + interval '1 day', 'sanskar_milestone', 'pending', 'sanskara-test:' || s,
       jsonb_build_object('subscription_id', public._t('sub' || s))
from unnest(array['SO1', 'SO2', 'SO3', 'SO4', 'SO5']) s;

-- Retention fixtures (identified by subject_id so other audit rows do not matter).
insert into public.sanskara_audit (at, action, subject_id) values
  (now() - interval '13 months', 'record_created', public._t('au_old1')),
  (now() - interval '12 months' - interval '1 day', 'record_created', public._t('au_old2')),
  (now() - interval '11 months', 'record_created', public._t('au_new'));
insert into public.sanskara_request_log (account_id, request_id, operation, created_at) values
  (public._t('M'), public._t('rl_old1'), 'op', now() - interval '8 days'),
  (public._t('M'), public._t('rl_old2'), 'op', now() - interval '7 days' - interval '1 minute'),
  (public._t('M'), public._t('rl_new'), 'op', now() - interval '6 days');

-- ── 0. Who may call a job ───────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare r text; f text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    foreach f in array array['sanskara_job_majority_sweep', 'sanskara_job_consent_purge', 'sanskara_job_retention'] loop
      assert not has_function_privilege(r, format('public.%I(timestamptz, boolean, integer)', f), 'EXECUTE'), r || ' can run ' || f;
    end loop;
  end loop;
  perform public._t_as(public._t('M'));
  perform public._t_expect('42501', 'a signed-in client cannot run the sweep', 'select public.sanskara_job_majority_sweep()');
  perform public._t_expect('42501', 'a signed-in client cannot run the purge', 'select public.sanskara_job_consent_purge()');
  perform public._t_expect('42501', 'a signed-in client cannot run the retention job', 'select public.sanskara_job_retention()');
  perform public._t_admin();
  assert (select count(*) from cron.job where jobname in ('sanskara-majority-sweep-daily', 'sanskara-consent-purge-daily', 'sanskara-retention-daily')) = 3,
    'all three jobs are scheduled';
  assert (select count(*) from cron.job where jobname like 'sanskara-%' and schedule ~ '^[0-9]+ 3 \* \* \*$') = 3, 'they run daily at 03:xx UTC';
end
$t$;

-- ── 1. Sanity: the fixtures sit where the comments say, according to sanskara_can itself ────────────────────────────────
do $t$
begin
  assert public.sanskara_can('read_meta', public._t('Dm'), public._t('M'), null), 'a minor is managed';
  assert public.sanskara_can('read_record', public._t('Dy'), public._t('M'), public._t('rDy')), 'inside the window the manager still reads';
  assert public.sanskara_can('read_record', public._t('De'), public._t('M'), public._t('rDe')), 'the day before the window ends the manager still reads';
  assert not public.sanskara_can('read_record', public._t('Dw'), public._t('M'), public._t('rDw')), 'on the day the window ends access is already gone';
  assert not public.sanskara_can('read_record', public._t('Do'), public._t('M'), public._t('rDo')), 'long after, access is gone';
end
$t$;

-- ── 2. Dry runs change nothing and report what would happen ─────────────────────────────────────────────────────────────
do $t$
declare r jsonb; before_ bigint; after_ bigint;
begin
  select count(*) into before_ from public.sanskara_subjects;
  r := public.sanskara_job_majority_sweep(now(), true);
  assert (r ->> 'dry_run')::boolean, 'the sweep says it was a dry run';
  assert (r ->> 'deleted_after_window')::int = 2, 'the dry run counts the two dependents past the window: ' || r::text;
  assert (r ->> 'frozen')::int = 3, 'the dry run counts the three to freeze (Dt, Dy, De): ' || r::text;
  assert (select count(*) from public.sanskara_subjects) = before_, 'the dry run deleted nothing';
  assert (select count(*) from public.sanskara_subjects where state = 'frozen') = 1, 'the dry run froze nothing';
  assert (select count(*) from public.sanskara_grants where revoked_at is not null) = 0, 'the dry run revoked nothing';

  r := public.sanskara_job_consent_purge(now(), true);
  assert (r ->> 'timelines_purged')::int = 2, 'the dry run counts O1 and O2: ' || r::text;
  assert (select count(*) from public.sanskara_subjects where kind = 'account') = 5, 'the dry run purged nothing';

  r := public.sanskara_job_retention(now(), true);
  assert (r ->> 'audit_rows_deleted')::int >= 2 and (r ->> 'request_log_rows_deleted')::int = 2, 'the dry run counts old rows: ' || r::text;
  assert (select count(*) from public.sanskara_request_log) = 3, 'the dry run deleted nothing from the request log';
  assert (select count(*) from public.sanskara_audit where subject_id in (public._t('au_old1'), public._t('au_old2'), public._t('au_new'))) = 3, 'nor from the audit';
  assert (select count(*) from public.sanskara_audit where action in ('purged')) = 0, 'a dry run writes no audit row';
end
$t$;

-- ── 3. The majority sweep ───────────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare r jsonb; d text;
begin
  r := public.sanskara_job_majority_sweep();
  assert (r ->> 'deleted_after_window')::int = 2 and (r ->> 'frozen')::int = 3, 'the sweep reports 2 deleted, 3 frozen: ' || r::text;

  -- Deleted: the subject and everything under it.
  foreach d in array array['Dw', 'Do'] loop
    assert not exists (select 1 from public.sanskara_subjects where id = public._t(d)), d || ' is deleted';
    assert not exists (select 1 from public.sanskara_records where id = public._t('r' || d)), d || ': the record is gone';
    assert not exists (select 1 from public.sanskara_grants where subject_id = public._t(d)), d || ': the share is gone';
    assert not exists (select 1 from public.sanskara_subscriptions where id = public._t('sub' || d)), d || ': the subscription is gone';
    assert not exists (select 1 from public.sanskara_subject_managers where subject_id = public._t(d)), d || ': the manager row is gone';
    assert (select status from public.notification_schedule where notification_key = 'sanskara-test:' || d) = 'cancelled', d || ': the pending reminder was cancelled';
  end loop;

  -- Frozen: still there, read-only for the former manager, shares revoked, reminders and subscriptions gone.
  foreach d in array array['Dt', 'Dy', 'De'] loop
    assert (select state from public.sanskara_subjects where id = public._t(d)) = 'frozen', d || ' is frozen';
    assert (select frozen_at from public.sanskara_subjects where id = public._t(d)) = now(), d || ' records when it was frozen';
    assert exists (select 1 from public.sanskara_records where id = public._t('r' || d)), d || ': the record is kept';
    assert (select revoked_at from public.sanskara_grants where subject_id = public._t(d)) is not null, d || ': the share is revoked';
    assert (select revoked_by from public.sanskara_grants where subject_id = public._t(d)) is null, d || ': by no person';
    assert not exists (select 1 from public.sanskara_subscriptions where id = public._t('sub' || d)), d || ': the subscription is gone';
    assert (select status from public.notification_schedule where notification_key = 'sanskara-test:' || d) = 'cancelled', d || ': the pending reminder was cancelled';
    assert public.sanskara_can('read_record', public._t(d), public._t('M'), public._t('r' || d)), d || ': the former manager can still read';
    assert not public.sanskara_can('write_record', public._t(d), public._t('M'), public._t('r' || d)), d || ': but not write';
    assert not public.sanskara_can('read_record', public._t(d), public._t('G'), public._t('r' || d)), d || ': and the person it was shared with cannot';
  end loop;

  -- Untouched: the minor, and the one frozen earlier (its date stays).
  assert (select state from public.sanskara_subjects where id = public._t('Dm')) = 'active', 'the minor stays active';
  assert exists (select 1 from public.sanskara_subscriptions where id = public._t('subDm')), 'the minor keeps its subscription';
  assert (select revoked_at from public.sanskara_grants where subject_id = public._t('Dm')) is null, 'the minor keeps its share';
  assert (select status from public.notification_schedule where notification_key = 'sanskara-test:Dm') = 'pending', 'the minor keeps its reminder';
  assert (select frozen_at from public.sanskara_subjects where id = public._t('Dz')) = now() - interval '10 days', 'a subject frozen earlier keeps its date';

  -- Audit: metadata only.
  assert (select count(*) from public.sanskara_audit where action = 'purged' and detail ->> 'reason' = 'former_manager_window_ended') = 2, 'two purges audited';
  assert (select count(*) from public.sanskara_audit where action = 'grant_revoked' and detail ->> 'reason' = 'subject_reached_majority') = 3, 'three revocations audited';
  assert not exists (select 1 from public.sanskara_audit where detail ->> 'reason' in ('former_manager_window_ended', 'subject_reached_majority')
                       and (actor_id is not null or target_id is not null)), 'the sweep names no person in the audit';
  assert not exists (select 1 from public.sanskara_audit where detail ->> 'reason' in ('former_manager_window_ended', 'subject_reached_majority')
                       and (select count(*) from jsonb_object_keys(detail)) <> 1), 'and carries nothing but its reason';

  -- A second run has nothing left to do.
  r := public.sanskara_job_majority_sweep();
  assert r = jsonb_build_object('dry_run', false, 'deleted_after_window', 0, 'frozen', 0, 'grants_revoked', 0, 'subscriptions_deleted', 0), 'a second run changes nothing: ' || r::text;
  assert (select count(*) from public.sanskara_audit where action = 'purged') = 2, 'and writes no further audit';
end
$t$;

-- ── 4. The consent purge ────────────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare r jsonb; s text;
begin
  r := public.sanskara_job_consent_purge();
  assert (r ->> 'timelines_purged')::int = 2, 'two timelines purged: ' || r::text;
  foreach s in array array['SO1', 'SO2'] loop
    assert not exists (select 1 from public.sanskara_subjects where id = public._t(s)), s || ' is purged';
    assert not exists (select 1 from public.sanskara_records where id = public._t('r' || s)), s || ': the record is gone';
    assert not exists (select 1 from public.sanskara_record_private where record_id = public._t('r' || s)), s || ': the private note is gone';
    assert not exists (select 1 from public.sanskara_grants where subject_id = public._t(s)), s || ': the share is gone';
    assert not exists (select 1 from public.sanskara_subscriptions where id = public._t('sub' || s)), s || ': the follower''s subscription is gone';
    assert (select status from public.notification_schedule where notification_key = 'sanskara-test:' || s) = 'cancelled', s || ': the pending reminder was cancelled';
  end loop;
  foreach s in array array['SO3', 'SO4', 'SO5'] loop
    assert exists (select 1 from public.sanskara_subjects where id = public._t(s)), s || ' is kept';
    assert exists (select 1 from public.sanskara_record_private where record_id = public._t('r' || s)), s || ': the private note is kept';
    assert exists (select 1 from public.sanskara_subscriptions where id = public._t('sub' || s)), s || ': the subscription is kept';
    assert (select status from public.notification_schedule where notification_key = 'sanskara-test:' || s) = 'pending', s || ': the reminder is kept';
  end loop;
  assert (select count(*) from public.sanskara_audit where action = 'purged' and detail ->> 'reason' = 'consent_withdrawn_30_days') = 2, 'two purges audited';
  assert not exists (select 1 from public.sanskara_audit where detail ->> 'reason' = 'consent_withdrawn_30_days' and (actor_id is not null or target_id is not null)),
    'the purge names no person in the audit';
  assert exists (select 1 from public.profiles where id = public._t('O1')), 'the person''s account is untouched';

  -- Consent returns before the job looks: the stale marker alone must not delete. (O3 gets consent back, then 31 days pass.)
  update public.profiles set consent_religious_data = true where id = public._t('O3');
  update public.sanskara_subjects set suspended_at = now() - interval '40 days' where id = public._t('SO3');
  r := public.sanskara_job_consent_purge();
  assert (r ->> 'timelines_purged')::int = 0 and exists (select 1 from public.sanskara_subjects where id = public._t('SO3')), 'live consent beats a stale marker';

  -- Once a marker is old enough and consent is still withdrawn, it goes.
  update public.profiles set consent_religious_data = false where id = public._t('O3');
  r := public.sanskara_job_consent_purge();
  assert (r ->> 'timelines_purged')::int = 1 and not exists (select 1 from public.sanskara_subjects where id = public._t('SO3')), 'and then it is purged';

  -- The timeline of a person who consents again is created fresh, empty, by the normal path (not tested here: M2).
  r := public.sanskara_job_consent_purge();
  assert (r ->> 'timelines_purged')::int = 0, 'a second run changes nothing';
end
$t$;

-- ── 5. Retention and the batch limit ────────────────────────────────────────────────────────────────────────────────────
do $t$
declare r jsonb;
begin
  r := public.sanskara_job_retention(now(), false, 1);
  assert (r ->> 'audit_rows_deleted')::int = 1 and (r ->> 'request_log_rows_deleted')::int = 1, 'a batch of one deletes one row of each: ' || r::text;
  r := public.sanskara_job_retention();
  assert (select count(*) from public.sanskara_audit where subject_id in (public._t('au_old1'), public._t('au_old2'))) = 0, 'old audit rows are gone';
  assert exists (select 1 from public.sanskara_audit where subject_id = public._t('au_new')), 'an 11-month-old audit row is kept';
  assert (select count(*) from public.sanskara_request_log where request_id in (public._t('rl_old1'), public._t('rl_old2'))) = 0, 'old request-log rows are gone';
  assert exists (select 1 from public.sanskara_request_log where request_id = public._t('rl_new')), 'a 6-day-old request-log row is kept';
  assert exists (select 1 from public.sanskara_audit where action = 'purged'), 'the purge audit rows themselves are younger than 12 months and stay';
  r := public.sanskara_job_retention();
  assert (r ->> 'audit_rows_deleted')::int = 0 and (r ->> 'request_log_rows_deleted')::int = 0, 'a second run changes nothing: ' || r::text;
end
$t$;

-- ── 6. The batch limit on the sweep ─────────────────────────────────────────────────────────────────────────────────────
do $t$
declare r jsonb;
begin
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
    (public._t('Bx1'), 'dependent', 'B1', current_date - interval '25 years'),
    (public._t('Bx2'), 'dependent', 'B2', current_date - interval '25 years');
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('Bx1'), public._t('M')), (public._t('Bx2'), public._t('M'));
  r := public.sanskara_job_majority_sweep(now(), false, 1);
  assert (r ->> 'deleted_after_window')::int = 1, 'a batch of one deletes one: ' || r::text;
  assert (select count(*) from public.sanskara_subjects where id in (public._t('Bx1'), public._t('Bx2'))) = 1, 'and leaves the other for the next run';
  r := public.sanskara_job_majority_sweep();
  assert (r ->> 'deleted_after_window')::int = 1, 'the next run takes it';
end
$t$;

rollback;
