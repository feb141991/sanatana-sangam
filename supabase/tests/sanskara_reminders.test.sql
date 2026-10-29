-- Integration assertions for 20261029160300_sanskara_reminders.sql (Sanskara tracker M4).
-- Run against an isolated Supabase branch / scratch database after applying the notification pipeline migrations and M1 to M4,
-- as the migration owner (it must be able to SET ROLE authenticated). Everything is rolled back at the end.
begin;
set local timezone to 'UTC';

-- ── Helpers (live only in this transaction) ─────────────────────────────────────────────────────────────────────────
create function public._t(n text) returns uuid language sql immutable as $$ select md5('sanskara-test:' || n)::uuid $$;
create function public._t_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
  execute 'set local role authenticated';
end $$;
create function public._t_admin() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;
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

-- A record on SA (or another subject) with a Class B rite and a planned date offset from today.
create sequence public._t_day;
create function public._t_rec(p_subject uuid, p_name text, p_rite text, p_offset integer) returns uuid language plpgsql as $$
begin
  insert into public.sanskara_records (id, subject_id, rite_key, planned_date) values (public._t(p_name), p_subject, p_rite, case when p_offset is null then null else current_date + p_offset end);
  return public._t(p_name);
end $$;
-- A subscription, written directly.
create function public._t_sub(p_name text, p_record uuid, p_account uuid, p_lead integer default 7) returns uuid language plpgsql as $$
begin
  insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days) values (public._t(p_name), p_record, p_account, p_lead);
  return public._t(p_name);
end $$;
-- The audience a subscription's reminder is addressed to.
create function public._t_aud(p_sub uuid) returns text language sql as $$
  select case when sj.kind = 'account' and sj.account_id = s.account_id then 'self'
              when exists (select 1 from public.sanskara_subject_managers m where m.subject_id = sj.id and m.account_id = s.account_id) then 'manager'
              else 'viewer' end
  from public.sanskara_subscriptions s join public.sanskara_records r on r.id = s.record_id join public.sanskara_subjects sj on sj.id = r.subject_id where s.id = p_sub $$;
-- Insert a candidate the way a producer would, with optional overrides (a jsonb of column values).
create function public._t_ins(p_sub uuid, p_patch jsonb default '{}'::jsonb, p_status text default 'pending') returns uuid language plpgsql as $$
declare s record; base jsonb; v_id uuid;
begin
  select sub.account_id acc, sub.lead_days lead, sub.generation gen, r.version ver, p.sanskara_opt_in_generation pgen
    into s from public.sanskara_subscriptions sub join public.sanskara_records r on r.id = sub.record_id join public.profiles p on p.id = sub.account_id where sub.id = p_sub;
  base := jsonb_build_object('user_id', s.acc, 'event_id', p_sub::text, 'event_instance', 'L' || s.lead, 'audience', public._t_aud(p_sub),
    'scheduled_for', now() + interval '2 hours', 'title', 'A family date is coming up', 'body', 'Open Shoonaya to see it.', 'action_url', '/kul',
    'local_date', date '2100-01-01' + nextval('public._t_day')::int, 'timezone', 'UTC',
    'metadata', jsonb_build_object('subscription_id', p_sub, 'subscription_generation', s.gen, 'record_version', s.ver, 'profile_generation', s.pgen)) || p_patch;
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at, title, body, action_url, language, timezone, metadata, status)
  values ((base ->> 'user_id')::uuid, 'sanskar_milestone', base ->> 'event_id', base ->> 'event_instance', (base ->> 'local_date')::date, base ->> 'audience',
          (base ->> 'scheduled_for')::timestamptz, (base ->> 'scheduled_for')::timestamptz + interval '6 hours', base ->> 'title', base ->> 'body', base ->> 'action_url', 'en',
          base ->> 'timezone', base -> 'metadata', p_status)
  returning id into v_id;
  return v_id;
end $$;
-- A pending schedule row for a subscription (what the resolver promotes a candidate into).
create function public._t_sched(p_sub uuid, p_status text default 'pending') returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
  select s.account_id, 'A family date is coming up', 'Open Shoonaya to see it.', now() + interval '2 hours', 'sanskar_milestone', p_status,
         'sanskar_milestone:' || p_sub || ':' || gen_random_uuid(), jsonb_build_object('subscription_id', p_sub, 'candidate_id', gen_random_uuid())
  from public.sanskara_subscriptions s where s.id = p_sub returning id into v_id;
  return v_id;
end $$;
-- How many reminders of a subscription are still alive in the pipeline.
create function public._t_live(p_sub uuid) returns integer language sql as $$
  select (select count(*) from public.notification_candidates where event_type = 'sanskar_milestone' and event_id = p_sub::text and status in ('pending', 'resolving'))::int
       + (select count(*) from public.notification_schedule where notification_type = 'sanskar_milestone' and metadata ->> 'subscription_id' = p_sub::text and status in ('pending', 'sending'))::int $$;
-- Give a subscription one live candidate and one live schedule row.
create function public._t_arm(p_sub uuid) returns void language plpgsql as $$
begin
  perform public._t_ins(p_sub);
  perform public._t_sched(p_sub);
  if public._t_live(p_sub) <> 2 then raise exception 'FAIL fixture: expected 2 live rows for %', p_sub using errcode = 'P0004'; end if;
end $$;
create function public._t_gone(p_label text, p_sub uuid) returns void language plpgsql as $$
begin
  if public._t_live(p_sub) <> 0 then raise exception 'FAIL %: % reminder(s) are still alive', p_label, public._t_live(p_sub) using errcode = 'P0004'; end if;
end $$;
create function public._t_alive(p_label text, p_sub uuid) returns void language plpgsql as $$
begin
  if public._t_live(p_sub) <> 2 then raise exception 'FAIL %: expected the reminders to be left alone, % alive', p_label, public._t_live(p_sub) using errcode = 'P0004'; end if;
end $$;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- A owns SA and manages S1 with B; A is the former manager of S2. C a stranger, D and H viewers, Q a viewer who has not
-- opted in, E in another Kul, F without consent, G in the deletion cool-off, N the claimant, P another owner.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'N', 'P', 'Q']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, wants_sanskara_reminders, timezone, username, full_name)
select public._t(n), case when k = '-' then null else public._t(k) end, c, g, w, tz, 'user_' || lower(n), 'Name ' || n
from (values ('A', 'K1', true, false, true, 'Asia/Kolkata'), ('B', 'K1', true, false, true, null), ('C', 'K1', true, false, false, null),
             ('D', 'K1', true, false, true, 'America/New_York'), ('E', 'K2', true, false, true, null), ('F', 'K1', false, false, true, null),
             ('G', 'K1', true, true, true, null), ('H', 'K1', true, false, true, 'Not/AZone'), ('N', '-', true, false, true, null),
             ('P', 'K1', true, false, true, null), ('Q', 'K1', true, false, false, null)) v(n, k, c, g, w, tz);
insert into public.kul_members (kul_id, user_id, role)
select public._t(k), public._t(n), r
from (values ('A', 'K1', 'guardian'), ('B', 'K1', 'sadhak'), ('C', 'K1', 'guardian'), ('D', 'K1', 'sadhak'), ('E', 'K2', 'guardian'),
             ('F', 'K1', 'sadhak'), ('G', 'K1', 'sadhak'), ('H', 'K1', 'sadhak'), ('P', 'K1', 'sadhak'), ('Q', 'K1', 'sadhak')) v(n, k, r);
-- Class B rites rb1..rb30, a Class B rite for fixed records, and a prenatal Class A rite.
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) select 'rb' || i, 'B', false from generate_series(1, 30) i;
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_pre', 'A', true);

insert into public.sanskara_subjects (id, kind, account_id) values
  (public._t('SA'), 'account', public._t('A')), (public._t('SN'), 'account', public._t('N')), (public._t('SP'), 'account', public._t('P'));
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', current_date - interval '5 years'),
  (public._t('S2'), 'dependent', 'Ravi', current_date - interval '18 years' - interval '3 months');
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('A')), (public._t('S1'), public._t('B')), (public._t('S2'), public._t('A'));

insert into public.sanskara_records (id, subject_id, rite_key, custom_title, planned_date, completed_date) values
  (public._t('ra_b'), public._t('SA'), 'rb1', null, current_date + 30, null),
  (public._t('ra_pre'), public._t('SA'), 'rite_pre', null, current_date + 40, null),
  (public._t('ra_c'), public._t('SA'), 'custom', 'Family gathering', current_date + 50, null),
  (public._t('ra_nodate'), public._t('SA'), 'rb2', null, null, null),
  (public._t('ra_done'), public._t('SA'), 'rb3', null, current_date - 10, current_date - 5),
  (public._t('r1_b'), public._t('S1'), 'rb1', null, current_date + 20, null),
  (public._t('r2_b'), public._t('S2'), 'rb1', null, current_date + 10, null),
  (public._t('rn_own'), public._t('SN'), 'rb4', null, current_date + 12, null);
insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id) values
  (public._t('g_d'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b')),
  (public._t('g_dpre'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_pre'));
insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope) values
  (public._t('g_h'), public._t('SA'), public._t('H'), public._t('A'), public._t('K1'), 'timeline'),
  (public._t('g_q'), public._t('SA'), public._t('Q'), public._t('A'), public._t('K1'), 'timeline');

-- ── 1. Structure and privileges ─────────────────────────────────────────────────────────────────────────────────────
do $t$
declare f text;
begin
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.sanskara_subscriptions'::regclass), 'subscriptions: RLS must be enabled and forced';
  assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sanskara_subscriptions'), 'subscriptions: no policy may exist';
  assert not has_table_privilege('anon', 'public.sanskara_subscriptions', 'select, insert, update, delete'), 'subscriptions: anon has no rights';
  assert not has_table_privilege('authenticated', 'public.sanskara_subscriptions', 'select, insert, update, delete'), 'subscriptions: authenticated has no rights';
  assert has_table_privilege('service_role', 'public.sanskara_subscriptions', 'select, insert, update, delete'), 'subscriptions: service_role needs access';
  foreach f in array array['public.sanskara_set_reminder(uuid, uuid, integer, boolean)', 'public.sanskara_my_reminders()'] loop
    assert has_function_privilege('authenticated', f, 'execute'), f || ': signed-in users must be able to call it';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not be able to call it';
  end loop;
  foreach f in array array['public.sanskara_reminders_due(timestamptz, interval, interval)', 'public.sanskara_reminder_still_valid(uuid, integer, integer, integer)'] loop
    assert has_function_privilege('service_role', f, 'execute'), f || ': server code needs it';
    assert not has_function_privilege('authenticated', f, 'execute'), f || ': clients must not call it';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not call it';
  end loop;
  foreach f in array array['public.sanskara_cancel_reminder_rows(text[], text)', 'public.sanskara_cancel_reminders(uuid, uuid, uuid, text)',
    'public.sanskara_subscription_removed()', 'public.sanskara_subscription_changed()', 'public.sanskara_record_changed()',
    'public.sanskara_profile_reminder_guard()', 'public.sanskara_kul_membership_end()', 'public.sanskara_validate_candidate()',
    'public.sanskara_on_access_lost(uuid, uuid)', 'public.sanskara_on_record_completed(uuid)'] loop
    assert not has_function_privilege('authenticated', f, 'execute'), f || ': clients must not call internal functions';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not call internal functions';
    assert not has_function_privilege('service_role', f, 'execute'), f || ': not even the service role needs it';
  end loop;
  perform public._t_as(public._t('A'));
  perform public._t_expect('42501', 'direct read of subscriptions', 'select * from public.sanskara_subscriptions');
  perform public._t_expect('42501', 'direct write of subscriptions', $q$insert into public.sanskara_subscriptions (record_id, account_id, lead_days) values (public._t('ra_b'), public._t('A'), 7)$q$);
  perform public._t_expect('42501', 'internal cancel', $q$select public.sanskara_cancel_reminders(public._t('A'), null, null, 'x')$q$);
  perform public._t_as(null);
  perform public._t_expect('SK401', 'signed out', 'select public.sanskara_my_reminders()');
  perform public._t_admin();
end
$t$;

-- ── 2. Switching a reminder on and off ──────────────────────────────────────────────────────────────────────────────
do $t$
declare v jsonb; w jsonb; e jsonb; sub uuid; gen integer;
begin
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_reminder(public._t('s1'), public._t('ra_b'), 7, true);
  w := public.sanskara_set_reminder(public._t('s1'), public._t('ra_b'), 7, true);
  assert v->>'id' = w->>'id' and (w->>'replayed')::boolean, 'a retried switch-on returns the first answer';
  assert (v->>'enabled')::boolean and (v->>'generation')::int = 0, 'a new subscription starts at generation 0';
  v := public.sanskara_set_reminder(public._t('s2'), public._t('ra_b'), 1, true);
  v := public.sanskara_set_reminder(public._t('s3'), public._t('ra_pre'), 3, true);
  perform public._t_admin();
  assert (select count(*) from public.sanskara_audit) = 0, 'switching a reminder on is not an audit event and leaves no content';
  perform public._t_as(public._t('A'));

  -- Validation and who may.
  perform public._t_expect('SK400', 'a lead time that is not allowed', $q$select public.sanskara_set_reminder(public._t('s4'), public._t('ra_b'), 5, true)$q$);
  perform public._t_expect('SK400', 'no lead time', $q$select public.sanskara_set_reminder(public._t('s5'), public._t('ra_b'), null, true)$q$);
  perform public._t_expect('SK400', 'no on/off', $q$select public.sanskara_set_reminder(public._t('s6'), public._t('ra_b'), 7, null)$q$);
  perform public._t_expect('SK400', 'no request id', $q$select public.sanskara_set_reminder(null, public._t('ra_b'), 7, true)$q$);
  perform public._t_expect('SK404', 'a record that does not exist', $q$select public.sanskara_set_reminder(public._t('s7'), public._t('nothing'), 7, true)$q$);
  perform public._t_expect('SK422', 'a record with no date', $q$select public.sanskara_set_reminder(public._t('s8'), public._t('ra_nodate'), 7, true)$q$);
  perform public._t_expect('SK422', 'a completed record', $q$select public.sanskara_set_reminder(public._t('s9'), public._t('ra_done'), 7, true)$q$);
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'a manager of someone else''s timeline', $q$select public.sanskara_set_reminder(public._t('s10'), public._t('ra_b'), 7, true)$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger', $q$select public.sanskara_set_reminder(public._t('s11'), public._t('ra_b'), 7, true)$q$);
  perform public._t_as(public._t('F'));
  perform public._t_expect('SK403', 'without consent', $q$select public.sanskara_set_reminder(public._t('s12'), public._t('ra_b'), 7, true)$q$);
  perform public._t_as(public._t('Q'));
  perform public._t_expect('SK422', 'a viewer who has not turned reminders on', $q$select public.sanskara_set_reminder(public._t('s13'), public._t('ra_b'), 7, true)$q$);
  perform public._t_as(public._t('D'));
  perform public._t_expect('SK404', 'a viewer of a Class A record (never)', $q$select public.sanskara_set_reminder(public._t('s14'), public._t('ra_pre'), 7, true)$q$);
  v := public.sanskara_set_reminder(public._t('s15'), public._t('ra_b'), 7, true);
  assert (v->>'enabled')::boolean, 'a viewer may follow a Class B record';
  perform public._t_as(public._t('B'));
  v := public.sanskara_set_reminder(public._t('s16'), public._t('r1_b'), 7, true);
  assert (v->>'enabled')::boolean, 'a manager may follow a dependent''s record';
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager', $q$select public.sanskara_set_reminder(public._t('s17'), public._t('r2_b'), 7, true)$q$);

  -- my_reminders: only my own, with access.
  e := public.sanskara_my_reminders();
  assert jsonb_array_length(e) = 3 and not exists (select 1 from jsonb_array_elements(e) x where x->>'record_id' = public._t('r1_b')::text), 'A sees A''s three, not B''s';
  perform public._t_as(public._t('D'));
  assert jsonb_array_length(public.sanskara_my_reminders()) = 1, 'D sees D''s one';
  perform public._t_as(public._t('C'));
  assert public.sanskara_my_reminders() = '[]'::jsonb, 'a stranger has none';

  -- Off and on again: every change moves the generation and cancels what was pending.
  perform public._t_admin();
  sub := (select id from public.sanskara_subscriptions where account_id = public._t('A') and lead_days = 7);
  perform public._t_arm(sub);
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_reminder(public._t('s18'), public._t('ra_b'), 7, false);
  assert not (v->>'enabled')::boolean and (v->>'generation')::int = 1, 'switching off moves the generation';
  perform public._t_admin();
  perform public._t_gone('switching a reminder off', sub);
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_reminder(public._t('s19'), public._t('ra_b'), 7, true);
  assert (v->>'enabled')::boolean and (v->>'generation')::int = 2, 'switching on again moves it again';
  v := public.sanskara_set_reminder(public._t('s20'), public._t('ra_b'), 14, false);
  assert (v->>'id') is null and not (v->>'enabled')::boolean, 'switching off what was never on does nothing';
  assert (select count(*) from jsonb_array_elements(public.sanskara_my_reminders()) x where (x->>'enabled')::boolean) = 3, 'three are on';

  -- The limit of 50 subscriptions per account, counting rows; changing an existing one is not a new one.
  perform public._t_admin();
  insert into public.sanskara_records (subject_id, rite_key, planned_date) select public._t('SA'), 'rb' || (4 + i), current_date + 60 from generate_series(1, 9) i;
  insert into public.sanskara_subscriptions (record_id, account_id, lead_days)
  select r.id, public._t('A'), l from public.sanskara_records r, unnest(array[0, 1, 3, 7, 14, 30]) l
  where r.subject_id = public._t('SA') and r.rite_key in (select 'rb' || (4 + i) from generate_series(1, 9) i) limit 47;
  assert (select count(*) from public.sanskara_subscriptions where account_id = public._t('A')) = 50, 'fixture: A holds 50';
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK422', 'the 51st subscription', $q$select public.sanskara_set_reminder(public._t('s21'), public._t('ra_c'), 30, true)$q$);
  v := public.sanskara_set_reminder(public._t('s22'), public._t('ra_b'), 7, false);
  assert not (v->>'enabled')::boolean, 'changing an existing one still works at the limit';
  perform public._t_admin();
  delete from public.sanskara_subscriptions where record_id in (select id from public.sanskara_records where rite_key in (select 'rb' || (4 + i) from generate_series(1, 9) i));
  delete from public.sanskara_records where rite_key in (select 'rb' || (4 + i) from generate_series(1, 9) i);
  delete from public.sanskara_subscriptions;
end
$t$;

-- ── 3. What cancels a reminder ──────────────────────────────────────────────────────────────────────────────────────
do $t$
declare v jsonb; w jsonb; sa uuid; sb uuid; sd uuid; sh uuid; rec uuid; rec2 uuid; tok text; c uuid; sc uuid; sched uuid;
begin
  -- 3a. A date is edited: only the changed date cancels, and only that record's reminders.
  rec := public._t_rec(public._t('SA'), 'rec_a', 'rb5', 30);
  rec2 := public._t_rec(public._t('SA'), 'rec_a2', 'rb6', 30);
  sa := public._t_sub('sub_a', rec, public._t('A'));
  sb := public._t_sub('sub_a2', rec2, public._t('A'));
  sc := public._t_sub('sub_c', public._t('ra_c'), public._t('A'));
  perform public._t_arm(sa); perform public._t_arm(sb); perform public._t_arm(sc);
  perform public._t_as(public._t('A'));
  v := public.sanskara_update_record(public._t('u1'), public._t('ra_c'), 'A new title', current_date + 50, 1);
  perform public._t_admin();
  perform public._t_alive('a title change alone', sc);
  perform public._t_as(public._t('A'));
  v := public.sanskara_update_record(public._t('u2'), rec, null, current_date + 30, 1);
  perform public._t_admin();
  perform public._t_alive('saving the same date', sa);
  perform public._t_as(public._t('A'));
  v := public.sanskara_update_record(public._t('u3'), rec, null, current_date + 31, 2);
  perform public._t_admin();
  perform public._t_gone('a changed date', sa);
  perform public._t_alive('another record''s reminders', sb);
  assert (select enabled from public.sanskara_subscriptions where id = sa), 'the subscription itself stays on after a date change';

  -- 3b. A record is completed: its reminders end and are switched off; reopening does not switch them back on.
  perform public._t_arm(sa);
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_completion(public._t('c1'), rec, current_date, 3);
  perform public._t_admin();
  perform public._t_gone('completion', sa);
  assert not (select enabled from public.sanskara_subscriptions where id = sa), 'completion switches the subscription off';
  perform public._t_alive('another record when one is completed', sb);
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_completion(public._t('c2'), rec, null, 4);
  perform public._t_admin();
  assert not (select enabled from public.sanskara_subscriptions where id = sa), 'reopening does not revive the reminder';

  -- 3c. A record is deleted: the subscription goes with it and so do the pending reminders (sb is still armed from 3a).
  perform public._t_as(public._t('A'));
  v := public.sanskara_delete_record(public._t('d1'), rec2);
  perform public._t_admin();
  perform public._t_gone('a deleted record', sb);
  assert not exists (select 1 from public.sanskara_subscriptions where id = sb), 'the subscription is gone with the record';

  -- 3d. A share is revoked: the grantee''s subscription and reminders go; another viewer''s are untouched.
  rec := public._t_rec(public._t('SA'), 'rec_d', 'rb7', 30);
  sd := public._t_sub('sub_d', rec, public._t('D'));
  sh := public._t_sub('sub_h', rec, public._t('H'));
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('g_d2'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', rec);
  perform public._t_arm(sd); perform public._t_arm(sh);
  perform public._t_as(public._t('A'));
  v := public.sanskara_revoke_grant(public._t('r1'), public._t('g_d2'));
  perform public._t_admin();
  perform public._t_gone('a revoked share', sd);
  assert not exists (select 1 from public.sanskara_subscriptions where id = sd), 'the revoked person''s subscription is deleted';
  perform public._t_alive('another viewer''s reminder', sh);
  assert exists (select 1 from public.sanskara_subscriptions where id = sh), 'another viewer keeps theirs';
  -- A grantee who leaves a share loses their reminders too.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('g_d3'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', rec);
  sd := public._t_sub('sub_d2', rec, public._t('D'), 3);
  perform public._t_arm(sd);
  perform public._t_as(public._t('D'));
  v := public.sanskara_revoke_grant(public._t('r2'), public._t('g_d3'));
  perform public._t_admin();
  perform public._t_gone('leaving a share', sd);

  -- 3e. A manager is removed: their subscription goes, the other manager's stays.
  sa := public._t_sub('sub_m1', public._t('r1_b'), public._t('A'));
  sb := public._t_sub('sub_m2', public._t('r1_b'), public._t('B'));
  perform public._t_arm(sa); perform public._t_arm(sb);
  perform public._t_as(public._t('A'));
  v := public.sanskara_remove_manager(public._t('m1'), public._t('S1'), public._t('B'));
  perform public._t_admin();
  perform public._t_gone('a removed manager', sb);
  assert not exists (select 1 from public.sanskara_subscriptions where id = sb), 'the removed manager''s subscription is deleted';
  perform public._t_alive('the remaining manager', sa);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('B'));
  delete from public.sanskara_subscriptions where id = sa;

  -- 3f. Records are handed over at 18: the former manager's and every other follower's subscriptions on them go;
  -- the new adult's own survive.
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values (public._t('S4'), 'dependent', 'Dev', current_date - interval '5 years');
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S4'), public._t('A'));
  rec := public._t_rec(public._t('S4'), 'rec_s4', 'rb8', 25);
  sa := public._t_sub('sub_c1', rec, public._t('A'));
  sd := public._t_sub('sub_c2', public._t('rn_own'), public._t('N'));
  perform public._t_arm(sa); perform public._t_arm(sd);
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' - interval '3 months' where id = public._t('S4');
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('cl1'), public._t('S4'));
  tok := v->>'token';
  perform public._t_as(public._t('N'));
  w := public.sanskara_accept_claim(public._t('cl2'), tok);
  perform public._t_admin();
  perform public._t_gone('a handed-over record', sa);
  assert not exists (select 1 from public.sanskara_subscriptions where id = sa), 'the former manager''s subscription is deleted';
  perform public._t_alive('the new adult''s own reminder', sd);
  delete from public.sanskara_subscriptions where id = sd;

  -- 3g. A dependent is erased, and a person erases their own timeline.
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values (public._t('S9'), 'dependent', 'Temp', current_date - 100);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S9'), public._t('B'));
  rec := public._t_rec(public._t('S9'), 'rec_s9', 'rb9', 25);
  sa := public._t_sub('sub_e1', rec, public._t('B'));
  perform public._t_arm(sa);
  perform public._t_as(public._t('B'));
  v := public.sanskara_delete_dependent(public._t('e1'), public._t('S9'));
  perform public._t_admin();
  perform public._t_gone('an erased dependent', sa);
  rec := public._t_rec(public._t('SP'), 'rec_p', 'rb10', 25);
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('SP'), public._t('D'), public._t('P'), public._t('K1'), 'record', rec);
  sa := public._t_sub('sub_e2', rec, public._t('P'));
  sd := public._t_sub('sub_e3', rec, public._t('D'));
  perform public._t_arm(sa); perform public._t_arm(sd);
  perform public._t_as(public._t('P'));
  v := public.sanskara_delete_mine(public._t('e2'));
  perform public._t_admin();
  perform public._t_gone('an erased timeline (owner)', sa);
  perform public._t_gone('an erased timeline (a follower)', sd);
end
$t$;

do $t$
declare sa uuid; sd uuid; sh uuid; rec uuid; c uuid; old_gen integer;
begin
  rec := public._t_rec(public._t('SA'), 'rec_l', 'rb11', 30);
  sa := public._t_sub('sub_l1', rec, public._t('A'));
  sd := public._t_sub('sub_l2', rec, public._t('D'));
  sh := public._t_sub('sub_l3', rec, public._t('H'));
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('g_l'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', rec);

  -- 3h. A Kul membership ends: the reminders that rested on it stop, the subscription is kept and works again with the membership.
  perform public._t_arm(sd);
  delete from public.kul_members where user_id = public._t('D');
  perform public._t_gone('a member who left the Kul', sd);
  assert exists (select 1 from public.sanskara_subscriptions where id = sd and enabled), 'the subscription is kept';
  perform public._t_as(public._t('D'));
  assert public.sanskara_my_reminders() = '[]'::jsonb, 'but it is not offered while the person has no access';
  perform public._t_admin();
  assert not public.sanskara_can('receive_reminder', public._t('SA'), public._t('D'), rec), 'but it cannot receive while outside the Kul';
  insert into public.kul_members (kul_id, user_id) values (public._t('K1'), public._t('D'));
  assert public.sanskara_can('receive_reminder', public._t('SA'), public._t('D'), rec), 'and can again when the membership returns';
  perform public._t_as(public._t('D'));
  assert jsonb_array_length(public.sanskara_my_reminders()) = 1, 'and is offered again';
  perform public._t_admin();
  assert (select count(*) from public.notification_candidates where event_id = sd::text and status = 'cancelled') >= 1, 'what was cancelled stays cancelled';
  -- ... and the sharer leaving stops the followers'' pending reminders as well.
  perform public._t_arm(sh);
  delete from public.kul_members where user_id = public._t('A');
  perform public._t_gone('the sharer left the Kul (a viewer)', sh);
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K1'), public._t('A'), 'guardian');

  -- 3i. The owner withdraws consent: everyone''s pending reminders for their records stop, the timeline is marked
  -- suspended, and it is unmarked when consent returns.
  perform public._t_arm(sa); perform public._t_arm(sd); perform public._t_arm(sh);
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_gone('owner consent withdrawn (the owner)', sa);
  perform public._t_gone('owner consent withdrawn (a viewer)', sd);
  perform public._t_gone('owner consent withdrawn (another viewer)', sh);
  assert (select suspended_at from public.sanskara_subjects where id = public._t('SA')) is not null, 'the timeline is marked suspended';
  assert (select count(*) from public.sanskara_audit where action = 'consent_suspended' and actor_id = public._t('A')) = 1, 'one audit row';
  update public.profiles set consent_religious_data = false where id = public._t('A');
  update public.profiles set consent_religious_data = true where id = public._t('A');
  assert (select suspended_at from public.sanskara_subjects where id = public._t('SA')) is null, 'consent returning clears it';

  -- 3j. A follower turns reminders off: their own pending stop; the subscription stays but cannot be sent on the old generation.
  perform public._t_arm(sd); perform public._t_arm(sh);
  select sanskara_opt_in_generation into old_gen from public.profiles where id = public._t('D');
  update public.profiles set wants_sanskara_reminders = false where id = public._t('D');
  perform public._t_gone('a follower turned reminders off', sd);
  perform public._t_alive('another follower', sh);
  update public.profiles set wants_sanskara_reminders = true where id = public._t('D');
  assert not public.sanskara_reminder_still_valid(sd, 0, (select version from public.sanskara_records where id = rec), old_gen), 'a reminder prepared before the change is stale';
  assert public.sanskara_reminder_still_valid(sd, 0, (select version from public.sanskara_records where id = rec), (select sanskara_opt_in_generation from public.profiles where id = public._t('D'))), 'a fresh one is valid';

  -- 3k. An owner in the deletion cool-off.
  perform public._t_arm(sd);
  update public.profiles set is_deleting = true where id = public._t('A');
  perform public._t_gone('the owner entered the deletion cool-off', sd);
  update public.profiles set is_deleting = false where id = public._t('A');

  -- 3l. An owner's account is deleted outright: the followers' pending reminders go with it.
  insert into public.sanskara_subjects (id, kind, account_id) values (public._t('SC'), 'account', public._t('C'));
  rec := public._t_rec(public._t('SC'), 'rec_c', 'rb12', 30);
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('SC'), public._t('H'), public._t('C'), public._t('K1'), 'record', rec);
  sh := public._t_sub('sub_x1', rec, public._t('H'));
  perform public._t_arm(sh);
  delete from auth.users where id = public._t('C');
  perform public._t_gone('an owner''s account was deleted', sh);

  -- 3m. Things that must NOT be touched: reminders already accepted or sent, other event types, other subscriptions.
  rec := public._t_rec(public._t('SA'), 'rec_n', 'rb13', 30);
  sa := public._t_sub('sub_n1', rec, public._t('A'));
  c := public._t_ins(sa, '{}'::jsonb, 'accepted');
  perform public._t_sched(sa, 'sent');
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at, title, body, action_url, metadata)
  values (public._t('A'), 'japa', 'x', 'y', current_date, 'general', now() + interval '1 hour', now() + interval '3 hours', 't', 'b', '/japa', jsonb_build_object('subscription_id', sa));
  insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
  values (public._t('A'), 't', 'b', now() + interval '1 hour', 'japa', 'pending', 'japa:test', jsonb_build_object('subscription_id', sa));
  delete from public.sanskara_subscriptions where id = sa;
  assert (select status from public.notification_candidates where id = c) = 'accepted', 'an accepted reminder is left alone';
  assert exists (select 1 from public.notification_schedule where metadata ->> 'subscription_id' = sa::text and notification_type = 'sanskar_milestone' and status = 'sent'), 'a sent reminder is left alone';
  assert exists (select 1 from public.notification_candidates where event_type = 'japa' and status = 'pending'), 'another kind of candidate is left alone';
  assert exists (select 1 from public.notification_schedule where notification_type = 'japa' and status = 'pending'), 'another kind of schedule row is left alone';
  assert public.sanskara_cancel_reminder_rows(array[]::text[], 'x') = 0 and public.sanskara_cancel_reminder_rows(null, 'x') = 0, 'cancelling nothing does nothing';
  perform public._t_expect('22023', 'cancelling with no scope', $q$select public.sanskara_cancel_reminders(null, null, null, 'x')$q$);

  -- 3n. Rows already in flight are cancelled too: a candidate being resolved and a schedule row being sent.
  rec := public._t_rec(public._t('SA'), 'rec_f', 'rb17', 30);
  sa := public._t_sub('sub_f1', rec, public._t('A'));
  perform public._t_ins(sa, '{}'::jsonb, 'resolving');
  perform public._t_sched(sa, 'sending');
  assert public._t_live(sa) = 2, 'fixture: a resolving candidate and a sending row';
  update public.sanskara_subscriptions set enabled = false where id = sa;
  perform public._t_gone('rows already in flight', sa);

  -- 3o. Raw writes to a record are caught by the database, not only the functions: completion, and a move to another timeline.
  rec := public._t_rec(public._t('SA'), 'rec_g', 'rb18', 30);
  sa := public._t_sub('sub_g1', rec, public._t('A'));
  perform public._t_arm(sa);
  update public.sanskara_records set completed_date = current_date where id = rec;
  perform public._t_gone('a record completed by a direct write', sa);
  rec := public._t_rec(public._t('SA'), 'rec_h', 'rb19', 30);
  sa := public._t_sub('sub_h1', rec, public._t('A'));
  perform public._t_arm(sa);
  update public.sanskara_records set subject_id = public._t('S1') where id = rec;
  perform public._t_gone('a record moved by a direct write', sa);
end
$t$;

-- ── 4. The send-time check ──────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare s uuid; rec uuid; gen integer; ver integer; pgen integer;
begin
  rec := public._t_rec(public._t('SA'), 'rec_v', 'rb14', 30);
  s := public._t_sub('sub_v', rec, public._t('A'));
  select generation into gen from public.sanskara_subscriptions where id = s;
  select version into ver from public.sanskara_records where id = rec;
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a fresh reminder is valid';
  assert not public.sanskara_reminder_still_valid(s, gen + 1, ver, pgen), 'a changed subscription generation is stale';
  assert not public.sanskara_reminder_still_valid(s, gen, ver + 1, pgen), 'a changed record version is stale';
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen + 1), 'a changed opt-in generation is stale';
  assert not public.sanskara_reminder_still_valid(public._t('nothing'), gen, ver, pgen), 'an unknown subscription is not valid';
  assert not public.sanskara_reminder_still_valid(null, null, null, null), 'nothing is not valid';

  update public.sanskara_subscriptions set enabled = false where id = s;
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a switched-off subscription is not valid';
  update public.sanskara_subscriptions set enabled = true where id = s;
  update public.sanskara_records set completed_date = current_date where id = rec;
  assert not public.sanskara_reminder_still_valid(s, gen, ver + 0, pgen), 'a completed record is not valid';
  update public.sanskara_records set completed_date = null where id = rec;
  select version into ver from public.sanskara_records where id = rec;
  assert public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'valid again once reopened (same version)';
  update public.sanskara_records set planned_date = null where id = rec;
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a record with no date is not valid';
  update public.sanskara_records set planned_date = current_date + 30 where id = rec;
  update public.profiles set wants_sanskara_reminders = false where id = public._t('A');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a recipient who opted out is not valid';
  update public.profiles set wants_sanskara_reminders = true where id = public._t('A');
  update public.profiles set consent_religious_data = false where id = public._t('A');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a recipient without consent is not valid';
  update public.profiles set consent_religious_data = true where id = public._t('A');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'valid again with everything back';
  update public.profiles set is_deleting = true where id = public._t('A');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert not public.sanskara_reminder_still_valid(s, gen, ver, pgen), 'a recipient in the deletion cool-off is not valid';
  update public.profiles set is_deleting = false where id = public._t('A');

  -- Access lost: a viewer whose share ended, and an account that is a former manager.
  s := public._t_sub('sub_v2', public._t('ra_b'), public._t('D'));
  select version into ver from public.sanskara_records where id = public._t('ra_b');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('D');
  assert public.sanskara_reminder_still_valid(s, 0, ver, pgen), 'a viewer with a live share is valid';
  update public.sanskara_grants set revoked_at = now() where id = public._t('g_d');
  assert not public.sanskara_reminder_still_valid(s, 0, ver, pgen), 'a viewer whose share ended is not valid';
  update public.sanskara_grants set revoked_at = null where id = public._t('g_d');
  s := public._t_sub('sub_v3', public._t('r2_b'), public._t('A'));
  select version into ver from public.sanskara_records where id = public._t('r2_b');
  select sanskara_opt_in_generation into pgen from public.profiles where id = public._t('A');
  assert not public.sanskara_reminder_still_valid(s, 0, ver, pgen), 'a former manager is not valid';
end
$t$;

-- ── 5. Insert-time validation of candidates ─────────────────────────────────────────────────────────────────────────
do $t$
declare s uuid; rec uuid; r record; c uuid; m jsonb; d uuid;
begin
  rec := public._t_rec(public._t('SA'), 'rec_i', 'rb15', 30);
  s := public._t_sub('sub_i', rec, public._t('A'));
  select sub.generation gen, rr.version ver, p.sanskara_opt_in_generation pgen into r
    from public.sanskara_subscriptions sub join public.sanskara_records rr on rr.id = sub.record_id join public.profiles p on p.id = sub.account_id where sub.id = s;
  m := jsonb_build_object('subscription_id', s, 'subscription_generation', r.gen, 'record_version', r.ver, 'profile_generation', r.pgen);

  perform public._t_expect('23514', 'extra data in the payload', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || '{"rite_key":"rb15"}')::text));
  perform public._t_expect('23514', 'a person''s name in the payload', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || '{"name":"Asha"}')::text));
  perform public._t_expect('23514', 'a missing key', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m - 'record_version')::text));
  perform public._t_expect('23514', 'a payload that is not an object', format($q$select public._t_ins(%L, %L)$q$, s, '{"metadata": "x"}'));
  perform public._t_expect('23514', 'a subscription id that is not a uuid', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || '{"subscription_id":"nope"}')::text));
  perform public._t_expect('23514', 'a subscription that does not exist', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('event_id', public._t('nothing')::text, 'metadata', m || jsonb_build_object('subscription_id', public._t('nothing')))::text));
  perform public._t_expect('23514', 'an event id that is not the subscription', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('event_id', public._t('other')::text)::text));
  perform public._t_expect('23514', 'a reminder for someone else', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('user_id', public._t('B'))::text));
  perform public._t_expect('23514', 'the wrong lead time', format($q$select public._t_ins(%L, %L)$q$, s, '{"event_instance": "L3"}'));
  perform public._t_expect('23514', 'the wrong audience', format($q$select public._t_ins(%L, %L)$q$, s, '{"audience": "viewer"}'));
  perform public._t_expect('23514', 'a stale subscription generation', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || jsonb_build_object('subscription_generation', r.gen + 1))::text));
  perform public._t_expect('23514', 'a stale record version', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || jsonb_build_object('record_version', r.ver + 1))::text));
  perform public._t_expect('23514', 'a stale opt-in generation', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || jsonb_build_object('profile_generation', r.pgen + 1))::text));
  perform public._t_expect('23514', 'a local date that disagrees with the payload', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || '{"local_date":"2000-01-01"}')::text));
  perform public._t_expect('23514', 'a timezone that disagrees with the payload', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('metadata', m || '{"timezone":"Asia/Tokyo"}')::text));
  perform public._t_expect('23514', 'scheduled too far ahead', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('scheduled_for', now() + interval '3 days')::text));
  perform public._t_expect('23514', 'a link with a query', format($q$select public._t_ins(%L, %L)$q$, s, '{"action_url": "/kul?record=1"}'));
  perform public._t_expect('23514', 'a link with an id', format($q$select public._t_ins(%L, %L)$q$, s, jsonb_build_object('action_url', '/kul/' || rec::text)::text));
  perform public._t_expect('23514', 'an absolute link', format($q$select public._t_ins(%L, %L)$q$, s, '{"action_url": "https://example.com/kul"}'));
  perform public._t_expect('23514', 'the rite in the text', format($q$select public._t_ins(%L, %L)$q$, s, '{"body": "Your rb15 is close"}'));
  perform public._t_expect('23514', 'the rite in the text, read as words', format($q$select public._t_ins(%L, %L)$q$, s, '{"title": "Rb15 reminder"}'));
  update public.sanskara_subscriptions set enabled = false where id = s;
  perform public._t_expect('23514', 'a switched-off subscription', format($q$select public._t_ins(%L)$q$, s));
  update public.sanskara_subscriptions set enabled = true where id = s;

  -- A custom title and a dependent's name are never repeated in the text.
  d := public._t_sub('sub_i2', public._t('r1_b'), public._t('A'), 3);
  perform public._t_expect('23514', 'a child''s name in the text', format($q$select public._t_ins(%L, %L)$q$, d, '{"body": "A date for asha is coming"}'));
  d := public._t_sub('sub_i3', public._t('ra_c'), public._t('A'), 3);
  perform public._t_expect('23514', 'a milestone title in the text', format($q$select public._t_ins(%L, %L)$q$, d, '{"title": "A NEW TITLE soon"}'));

  -- Access lost: a viewer whose share ended cannot get a candidate.
  d := public._t_sub('sub_i4', public._t('ra_b'), public._t('D'), 14);
  update public.sanskara_grants set revoked_at = now() where id = public._t('g_d');
  perform public._t_expect('23514', 'a viewer whose share ended', format($q$select public._t_ins(%L)$q$, d));
  update public.sanskara_grants set revoked_at = null where id = public._t('g_d');

  -- A valid one is accepted; a second live one for the same reminder is refused; after cancelling, another is allowed; an
  -- accepted one does not block; another kind of candidate is not subject to any of this.
  c := public._t_ins(s);
  assert (select status from public.notification_candidates where id = c) = 'pending', 'a valid candidate is accepted';
  perform public._t_expect('23505', 'a second live reminder for the same subscription and lead time', format($q$select public._t_ins(%L, %L)$q$, s, '{"local_date": "2030-01-01"}'));
  update public.notification_candidates set status = 'resolving' where id = c;
  perform public._t_expect('23505', 'a second one while the first is being resolved', format($q$select public._t_ins(%L, %L)$q$, s, '{"local_date": "2030-01-01"}'));
  update public.notification_candidates set status = 'accepted' where id = c;
  perform public._t_ins(s, '{"local_date": "2030-01-01"}'::jsonb);
  assert (select count(*) from public.notification_candidates where event_id = s::text) = 2, 'an earlier accepted reminder does not block the next occurrence';
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at, title, body, action_url, metadata)
  values (public._t('A'), 'nitya', 'z', '', current_date, 'general', now() + interval '300 hours', now() + interval '301 hours', 'Anything', 'Anything at all', '/nitya-karma?x=1', '{"anything": true}');
  assert true, 'another kind of candidate is unaffected';
  assert not exists (select 1 from public.notification_candidates where event_type = 'sanskar_milestone' and to_jsonb(notification_candidates)::text ~* '(rb15|asha|gathering|notes|private|rite_key)'),
    'no stored Sanskara candidate repeats a rite, a name, a title or a private field';
end
$t$;

-- ── 6. What is due ──────────────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare n integer; rec uuid; a uuid; d uuid; h uuid; b uuid; x record; now_at timestamptz; at_a timestamptz;
begin
  delete from public.sanskara_subscriptions;
  delete from public.notification_candidates where event_type = 'sanskar_milestone';
  -- ra_b is planned 30 days out; with lead 7 the reminder falls on day 23 at 09:00 local.
  a := public._t_sub('due_a', public._t('ra_b'), public._t('A'));
  d := public._t_sub('due_d', public._t('ra_b'), public._t('D'));
  h := public._t_sub('due_h', public._t('ra_b'), public._t('H'));
  b := public._t_sub('due_b', public._t('r1_b'), public._t('B'), 14);
  now_at := (current_date + 23)::timestamp at time zone 'UTC';

  select count(*) into n from public.sanskara_reminders_due(now_at);
  assert n = 3, 'A, D and H are due on day 23 (B''s is 14 days before day 20, not yet)';
  select * into x from public.sanskara_reminders_due(now_at) where subscription_id = a;
  assert x.audience_variant = 'self' and x.local_date = current_date + 23 and x.lead_days = 7, 'the owner: self, the right date';
  assert x.scheduled_for = ((current_date + 23)::timestamp + time '09:00') at time zone 'Asia/Kolkata', '09:00 in the owner''s own timezone';
  assert x.subscription_generation = 0 and x.record_version = 1 and x.profile_generation = (select sanskara_opt_in_generation from public.profiles where id = public._t('A')), 'the versions to carry';
  assert x.timezone = 'Asia/Kolkata' and x.language = 'en', 'timezone and language for the producer';
  select * into x from public.sanskara_reminders_due(now_at) where subscription_id = d;
  assert x.audience_variant = 'viewer' and x.scheduled_for = ((current_date + 23)::timestamp + time '09:00') at time zone 'America/New_York', 'a viewer, in their own timezone';
  select * into x from public.sanskara_reminders_due(now_at) where subscription_id = h;
  assert x.scheduled_for = ((current_date + 23)::timestamp + time '09:00') at time zone 'UTC' and x.timezone = 'UTC', 'an unknown timezone falls back to UTC';
  select * into x from public.sanskara_reminders_due((current_date + 6)::timestamp at time zone 'UTC') where subscription_id = b;
  assert x.audience_variant = 'manager', 'a manager''s reminder is addressed to a manager';

  -- The window: horizon ahead, a little lateness allowed, nothing older.
  at_a := ((current_date + 23)::timestamp + time '09:00') at time zone 'Asia/Kolkata';
  assert exists (select 1 from public.sanskara_reminders_due(at_a - interval '35 hours') where subscription_id = a), 'inside the 36-hour horizon';
  assert not exists (select 1 from public.sanskara_reminders_due(at_a - interval '37 hours') where subscription_id = a), 'outside the horizon';
  assert exists (select 1 from public.sanskara_reminders_due(at_a + interval '2 hours') where subscription_id = a), 'a little late is still due';
  assert not exists (select 1 from public.sanskara_reminders_due(at_a + interval '4 hours') where subscription_id = a), 'too late is dropped, never sent stale';

  -- Everything that removes a reminder from the list.
  update public.sanskara_subscriptions set enabled = false where id = a;
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = a), 'switched off';
  update public.sanskara_subscriptions set enabled = true where id = a;
  update public.profiles set wants_sanskara_reminders = false where id = public._t('A');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = a), 'opted out';
  update public.profiles set wants_sanskara_reminders = true where id = public._t('A');
  update public.profiles set consent_religious_data = false where id = public._t('A');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id in (a, d, h)), 'owner consent withdrawn removes everyone''s';
  update public.profiles set consent_religious_data = true where id = public._t('A');
  update public.profiles set is_deleting = true where id = public._t('D');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = d), 'a recipient in the deletion cool-off';
  update public.profiles set is_deleting = false where id = public._t('D');
  update public.sanskara_grants set revoked_at = now() where id = public._t('g_d');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = d), 'a viewer whose share ended';
  update public.sanskara_grants set revoked_at = null where id = public._t('g_d');
  update public.sanskara_records set completed_date = current_date where id = public._t('ra_b');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = a), 'a completed record';
  update public.sanskara_records set completed_date = null where id = public._t('ra_b');
  update public.sanskara_records set planned_date = null where id = public._t('ra_b');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = a), 'a record with no date';
  update public.sanskara_records set planned_date = current_date + 30 where id = public._t('ra_b');
  delete from public.kul_members where user_id = public._t('D');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = d), 'a viewer outside the Kul';
  insert into public.kul_members (kul_id, user_id) values (public._t('K1'), public._t('D'));
  assert exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = d), 'and back inside';

  -- Already created: one candidate for the date, whatever its status, removes it (no duplicate, no re-creation after a cancel).
  perform public._t_ins(a, jsonb_build_object('local_date', current_date + 23), 'cancelled');
  assert not exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = a), 'a reminder already created for that date (even cancelled) is not offered again';
  assert exists (select 1 from public.sanskara_reminders_due(now_at) where subscription_id = d), 'but another person''s still is';

  -- A Class A record is never offered to a viewer.
  insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days) values (public._t('due_x'), public._t('ra_pre'), public._t('D'), 7);
  assert not exists (select 1 from public.sanskara_reminders_due((current_date + 33)::timestamp at time zone 'UTC') where subscription_id = public._t('due_x')), 'a viewer''s subscription on a Class A record is never due';
  insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days) values (public._t('due_y'), public._t('ra_pre'), public._t('A'), 7);
  assert exists (select 1 from public.sanskara_reminders_due((current_date + 33)::timestamp at time zone 'UTC') where subscription_id = public._t('due_y')), 'but the owner''s is';
end
$t$;

rollback;
