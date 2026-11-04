-- Integration assertions for 20261103110000_sanskara_handover_notices.sql (Sanskara tracker, hand-over notices).
-- Run against a scratch database after the notification pipeline migrations and M1 to M4 and the migration under test, as the
-- migration owner. Everything is rolled back at the end.
begin;
set local timezone to 'UTC';

create function public._t(n text) returns uuid language sql immutable as $$ select md5('handover-test:' || n)::uuid $$;
create function public._ok(p_label text, p_cond boolean) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAIL %', p_label using errcode = 'P0004'; end if;
end $$;
create function public._t_expect(p_sqlstate text, p_message text, p_label text, p_stmt text) returns void language plpgsql as $$
declare v_state text; v_msg text;
begin
  begin
    execute p_stmt;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    if v_state <> p_sqlstate or (p_message is not null and v_msg <> p_message) then
      raise exception 'FAIL %: expected % / %, got % / %', p_label, p_sqlstate, p_message, v_state, v_msg using errcode = 'P0004';
    end if;
    return;
  end;
  raise exception 'FAIL %: the statement was accepted', p_label using errcode = 'P0004';
end $$;

-- A birth date whose 18th birthday (the civil date the rule uses) is exactly p_adult_on.
create function public._t_birth(p_adult_on date) returns date language plpgsql as $$
declare d date := (p_adult_on - interval '18 years')::date;
begin
  for i in 0..3 loop
    if (d + interval '18 years')::date = p_adult_on then return d; end if;
    d := d - 1;
  end loop;
  raise exception 'no birth date for %', p_adult_on;
end $$;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- A manages every dependent; B co-manages S90. C has no relation. D is a manager who has not opted in. E is a manager whose
-- consent is withdrawn. All in UTC so 09:00 tomorrow is 9 to 33 hours ahead whatever the hour the test runs.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E']) n;
insert into public.profiles (id, consent_religious_data, is_deleting, wants_sanskara_reminders, timezone, username, full_name)
select public._t(n), c, false, w, 'UTC', 'u_' || lower(n), 'Name ' || n
from (values ('A', true, true), ('B', true, true), ('C', true, true), ('D', true, false), ('E', false, true)) v(n, c, w);

-- adult_on: S90 +91, S30 +31, S7 +8, S0 +1 (all become tomorrow's open_N). Sc30 and Sc7 are past 18 with the window ending in
-- 31 and 8 days (tomorrow's closing_N); their former managers are A.
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S90'), 'dependent', 'Asha', public._t_birth(current_date + 91)),
  (public._t('S30'), 'dependent', 'Ravi', public._t_birth(current_date + 31)),
  (public._t('S7'),  'dependent', 'Mira', public._t_birth(current_date + 8)),
  (public._t('S0'),  'dependent', 'Dev',  public._t_birth(current_date + 1)),
  (public._t('Sc30'), 'dependent', 'Isha', public._t_birth((current_date + 31 - interval '12 months')::date)),
  (public._t('Sc7'),  'dependent', 'Kara', public._t_birth((current_date + 8 - interval '12 months')::date));
insert into public.sanskara_subject_managers (subject_id, account_id)
select public._t(s), public._t('A') from unnest(array['S90', 'S30', 'S7', 'S0', 'Sc30', 'Sc7']) s;
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S90'), public._t('B')), (public._t('S30'), public._t('D')), (public._t('S30'), public._t('E'));

create function public._t_due() returns table (s text, a text, notice text, audience text) language sql as $$
  select (select n from unnest(array['S90', 'S30', 'S7', 'S0', 'Sc30', 'Sc7']) n where public._t(n) = d.subject_id),
         (select n from unnest(array['A', 'B', 'C', 'D', 'E']) n where public._t(n) = d.account_id), d.notice, d.audience_variant
  from public.sanskara_handover_due() d order by 1, 2, 3 $$;

-- Insert a candidate the way the producer would, with optional overrides of columns or metadata.
create function public._t_ins(p_subject text, p_account text, p_notice text, p_patch jsonb default '{}'::jsonb, p_meta jsonb default '{}'::jsonb) returns uuid
language plpgsql as $$
declare v_birth date; v_date date; v_pgen integer; v_id uuid; base jsonb; meta jsonb;
begin
  select birth_date into v_birth from public.sanskara_subjects where id = public._t(p_subject);
  v_date := public.sanskara_handover_notice_date(v_birth, p_notice);
  select sanskara_opt_in_generation into v_pgen from public.profiles where id = public._t(p_account);
  base := jsonb_build_object('event_id', public._t(p_subject)::text, 'event_instance', 'H' || p_notice,
    'audience', case when p_notice like 'open\_%' then 'manager' else 'former_manager' end,
    'scheduled_for', (v_date + time '09:00') at time zone 'UTC', 'local_date', v_date,
    'title', 'Saved date', 'body', 'A saved date is near. Please open the app.', 'action_url', '/kul/sanskara', 'timezone', 'UTC') || p_patch;
  meta := jsonb_build_object('subject_id', public._t(p_subject), 'notice', p_notice, 'profile_generation', v_pgen,
                             'local_date', (base ->> 'local_date'), 'timezone', base ->> 'timezone') || p_meta;
  -- A cancelled candidate for the same key would collide with the table's unique key (as in production); the test re-arms, so clear it.
  delete from public.notification_candidates where user_id = public._t(p_account) and event_type = 'sanskar_milestone'
    and event_id = base ->> 'event_id' and event_instance = base ->> 'event_instance' and local_date = (base ->> 'local_date')::date and status = 'cancelled';
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at,
                                              title, body, action_url, language, timezone, metadata)
  values (public._t(p_account), 'sanskar_milestone', base ->> 'event_id', base ->> 'event_instance', (base ->> 'local_date')::date, base ->> 'audience',
          (base ->> 'scheduled_for')::timestamptz, (base ->> 'scheduled_for')::timestamptz + interval '15 hours',
          base ->> 'title', base ->> 'body', base ->> 'action_url', 'en', base ->> 'timezone', meta)
  returning id into v_id;
  return v_id;
end $$;
create function public._t_sched(p_subject text, p_account text, p_notice text) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
  values (public._t(p_account), 'Sanskara reminder', 'x', now() + interval '2 hours', 'sanskar_milestone', 'pending',
          'sanskar_milestone:' || gen_random_uuid(), jsonb_build_object('subject_id', public._t(p_subject), 'notice', p_notice)) returning id into v_id;
  return v_id;
end $$;
-- Live handover rows (candidates + schedule) for a subject/account.
create function public._t_live(p_subject text, p_account text default null) returns integer language sql as $$
  select (select count(*) from public.notification_candidates c where c.event_type = 'sanskar_milestone' and c.event_instance ~ '^H'
            and c.event_id = public._t(p_subject)::text and (p_account is null or c.user_id = public._t(p_account)) and c.status in ('pending', 'resolving'))::int
       + (select count(*) from public.notification_schedule s where s.notification_type = 'sanskar_milestone' and s.metadata ->> 'notice' is not null
            and s.metadata ->> 'subject_id' = public._t(p_subject)::text and (p_account is null or s.user_id = public._t(p_account)) and s.status in ('pending', 'sending'))::int $$;
create function public._t_arm(p_subject text, p_account text, p_notice text) returns void language plpgsql as $$
begin
  perform public._t_ins(p_subject, p_account, p_notice);
  perform public._t_sched(p_subject, p_account, p_notice);
end $$;

-- ── 1. Privileges ───────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['sanskara_handover_due(timestamptz, interval, interval)', 'sanskara_handover_still_valid(uuid, uuid, text, integer, date)'] loop
    perform public._ok('service_role can run ' || f, has_function_privilege('service_role', 'public.' || f, 'execute'));
    perform public._ok('authenticated cannot run ' || f, not has_function_privilege('authenticated', 'public.' || f, 'execute'));
    perform public._ok('anon cannot run ' || f, not has_function_privilege('anon', 'public.' || f, 'execute'));
  end loop;
  foreach f in array array['sanskara_handover_notice_date(date, text)', 'sanskara_cancel_handover(uuid, uuid, boolean, text)',
                           'sanskara_validate_handover_candidate()', 'sanskara_handover_profile_change()'] loop
    perform public._ok('nobody can run internal ' || f, not has_function_privilege('authenticated', 'public.' || f, 'execute')
      and not has_function_privilege('anon', 'public.' || f, 'execute') and not has_function_privilege('service_role', 'public.' || f, 'execute'));
  end loop;
end $$;

-- ── 2. Dates ────────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare b date := date '2010-03-15';
begin
  perform public._ok('open_90', public.sanskara_handover_notice_date(b, 'open_90') = date '2028-03-15' - 90);
  perform public._ok('open_30', public.sanskara_handover_notice_date(b, 'open_30') = date '2028-03-15' - 30);
  perform public._ok('open_7', public.sanskara_handover_notice_date(b, 'open_7') = date '2028-03-15' - 7);
  perform public._ok('open_0 is the 18th birthday', public.sanskara_handover_notice_date(b, 'open_0') = date '2028-03-15');
  perform public._ok('closing_30', public.sanskara_handover_notice_date(b, 'closing_30') = date '2029-03-15' - 30);
  perform public._ok('closing_7', public.sanskara_handover_notice_date(b, 'closing_7') = date '2029-03-15' - 7);
  perform public._ok('an unknown notice has no date', public.sanskara_handover_notice_date(b, 'open_1') is null);
  -- 29 February birth: the same arithmetic as sanskara_can (28 February in a non-leap year).
  perform public._ok('29 Feb birth', public.sanskara_handover_notice_date(date '2008-02-29', 'open_0') = (date '2008-02-29' + interval '18 years')::date);
end $$;

-- ── 3. What is due: exactly these, nothing else ─────────────────────────────────────────────────────────────────────
do $$
declare n integer;
begin
  select count(*) into n from public._t_due();
  perform public._ok('7 notices are due (got ' || n || ')', n = 7);
  perform public._ok('S90: A and B, open_90, as managers',
    (select count(*) from public._t_due() where s = 'S90' and notice = 'open_90' and audience = 'manager' and a in ('A', 'B')) = 2);
  perform public._ok('S30: only A (D has not opted in, E has no consent)',
    (select count(*) from public._t_due() where s = 'S30') = 1 and exists (select 1 from public._t_due() where s = 'S30' and a = 'A' and notice = 'open_30'));
  perform public._ok('S7: A open_7', exists (select 1 from public._t_due() where s = 'S7' and a = 'A' and notice = 'open_7' and audience = 'manager'));
  perform public._ok('S0: A open_0', exists (select 1 from public._t_due() where s = 'S0' and a = 'A' and notice = 'open_0'));
  perform public._ok('Sc30: A closing_30 as a former manager', exists (select 1 from public._t_due() where s = 'Sc30' and a = 'A' and notice = 'closing_30' and audience = 'former_manager'));
  perform public._ok('Sc7: A closing_7', exists (select 1 from public._t_due() where s = 'Sc7' and a = 'A' and notice = 'closing_7'));
  perform public._ok('C (no relation) is never a recipient', not exists (select 1 from public._t_due() where a = 'C'));
  perform public._ok('an account never appears twice for the same notice',
    (select count(*) from (select s, a, notice from public._t_due() group by 1, 2, 3 having count(*) > 1) x) = 0);
end $$;

-- ── 4. Window arithmetic: the horizon and the late allowance ────────────────────────────────────────────────────────
do $$
begin
  perform public._ok('nothing is due 60 hours before the first notice',
    (select count(*) from public.sanskara_handover_due(now() - interval '60 hours')) = 0);
  perform public._ok('everything is still due 2 hours after its moment (inside the late allowance)',
    (select count(*) from public.sanskara_handover_due(date_trunc('day', now()) + interval '1 day 11 hours')) = 7);
  perform public._ok('nothing is due 4 hours after its moment',
    (select count(*) from public.sanskara_handover_due(date_trunc('day', now()) + interval '1 day 13 hours 1 minute')) = 0);
end $$;

-- ── 5. Insert-time validation: the accepted shape ───────────────────────────────────────────────────────────────────
select public._t_ins('S90', 'A', 'open_90');
select public._t_ins('Sc7', 'A', 'closing_7');
do $$
begin
  perform public._ok('the accepted candidates exist', (select count(*) from public.notification_candidates where event_type = 'sanskar_milestone' and event_instance ~ '^H') = 2);
  perform public._ok('what was created is no longer due (A/S90/open_90, A/Sc7/closing_7)',
    not exists (select 1 from public._t_due() where s = 'S90' and a = 'A') and not exists (select 1 from public._t_due() where s = 'Sc7'));
  perform public._ok('B is still due for S90 (the dedupe is per account)', exists (select 1 from public._t_due() where s = 'S90' and a = 'B'));
  perform public._ok('the other notices are untouched', (select count(*) from public._t_due()) = 5);
end $$;

-- ── 6. Insert-time validation: every refusal ────────────────────────────────────────────────────────────────────────
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'an extra metadata key',
  $q$select public._t_ins('S30', 'A', 'open_30', '{}', jsonb_build_object('child', 'x'))$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'event_id not the subject',
  $q$select public._t_ins('S30', 'A', 'open_30', jsonb_build_object('event_id', public._t('S7')::text))$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'event_instance not H + notice',
  $q$select public._t_ins('S30', 'A', 'open_30', '{"event_instance":"Hopen_7"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'a non-uuid subject id',
  $q$select public._t_ins('S30', 'A', 'open_30', '{}', '{"subject_id":"nope"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'an unknown notice',
  $q$select public._t_ins('S30', 'A', 'open_30', '{"event_instance":"Hopen_1"}', '{"notice":"open_1"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'a missing profile generation',
  $q$select public._t_ins('S30', 'A', 'open_30', '{}', '{"profile_generation":null}')$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'metadata local_date differing from the column',
  $q$select public._t_ins('S30', 'A', 'open_30', '{}', '{"local_date":"2100-01-01"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a stale profile generation',
  $q$select public._t_ins('S30', 'A', 'open_30', '{}', '{"profile_generation":99}')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a date other than the one the rule gives',
  $q$select public._t_ins('S30', 'A', 'open_30', jsonb_build_object('local_date', (current_date + 3)::text, 'scheduled_for', (current_date + 3) + time '09:00'), jsonb_build_object('local_date', (current_date + 3)::text))$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a recipient who is not a manager',
  $q$select public._t_ins('S30', 'C', 'open_30')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a manager who has not opted in',
  $q$select public._t_ins('S30', 'D', 'open_30')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a manager whose consent is withdrawn',
  $q$select public._t_ins('S30', 'E', 'open_30')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a subject that is not a dependent',
  $q$insert into public.sanskara_subjects (id, kind, account_id) values (public._t('SA'), 'account', public._t('A')); select public._t_ins('SA', 'A', 'open_30')$q$);
select public._t_expect('23514', 'sanskara_candidate_wrong_audience', 'a wrong audience',
  $q$select public._t_ins('S30', 'A', 'open_30', '{"audience":"former_manager"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_outside_horizon', 'scheduled more than 48 hours ahead',
  $q$select public._t_ins('S30', 'A', 'open_30', jsonb_build_object('scheduled_for', now() + interval '3 days'))$q$);
select public._t_expect('23514', 'sanskara_candidate_link_not_generic', 'a link with an id',
  $q$select public._t_ins('S30', 'A', 'open_30', jsonb_build_object('action_url', '/kul/sanskara/' || public._t('S30')))$q$);
select public._t_expect('23514', 'sanskara_candidate_link_not_generic', 'a link with a query',
  $q$select public._t_ins('S30', 'A', 'open_30', '{"action_url":"/kul/sanskara?x=1"}')$q$);
select public._t_expect('23514', 'sanskara_candidate_not_discreet', 'text that repeats the child''s name',
  $q$select public._t_ins('S30', 'A', 'open_30', '{"body":"It is time for ravi."}')$q$);
-- Kara is a name; the stock text "Sanskara reminder" contains it.
select public._t_expect('23514', 'sanskara_candidate_not_discreet', 'a child named Kara and the stock title',
  $q$select public._t_ins('Sc7', 'A', 'closing_7', '{"title":"Sanskara reminder"}')$q$);
select public._ok('...and the plain wording is accepted for the same child',
  public._t_ins('Sc30', 'A', 'closing_30', '{"title":"Saved date","body":"A saved date is near. Please open the app."}') is not null);

-- The two validators do not cross: a milestone-shaped row with an H instance is judged by the handover rules, an L row is
-- judged by the milestone rules.
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'a milestone-shaped payload under an H instance',
  $q$insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, scheduled_for, expires_at, title, body, action_url, timezone, metadata)
     values (public._t('A'), 'sanskar_milestone', gen_random_uuid()::text, 'Hopen_30', current_date, now(), now() + interval '1 hour', 't', 'b', '/kul/sanskara', 'UTC',
             jsonb_build_object('subscription_id', gen_random_uuid(), 'subscription_generation', 0, 'record_version', 1, 'profile_generation', 0))$q$);
select public._t_expect('23514', null, 'a handover-shaped payload under an L instance is still refused by the milestone validator',
  $q$insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, scheduled_for, expires_at, title, body, action_url, timezone, metadata)
     values (public._t('A'), 'sanskar_milestone', public._t('S30')::text, 'L7', current_date, now(), now() + interval '1 hour', 't', 'b', '/kul/sanskara', 'UTC',
             jsonb_build_object('subject_id', public._t('S30'), 'notice', 'open_30', 'profile_generation', 0, 'local_date', current_date, 'timezone', 'UTC'))$q$);

-- ── 7. A pending claim: open_* stops, closing_* does not ────────────────────────────────────────────────────────────
do $$
begin
  perform public._t_arm('S7', 'A', 'open_7');
  perform public._t_sched('Sc30', 'A', 'closing_30');  -- its candidate already exists from section 6
  perform public._ok('armed: one open and one closing notice are live', public._t_live('S7') = 2 and public._t_live('Sc30') >= 2);
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at)
  values (public._t('S7'), public._t('A'), repeat('a', 64), now() + interval '3 days');
  perform public._ok('starting a claim cancels the open notices of that subject (live ' || public._t_live('S7') || ')', public._t_live('S7') = 0);
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at)
  values (public._t('Sc30'), public._t('A'), repeat('b', 64), now() + interval '3 days');
  perform public._ok('a claim does not cancel a closing notice', public._t_live('Sc30') >= 2);
  perform public._ok('while a claim is pending: open_* is not valid, closing_* is',
    not public.sanskara_handover_still_valid(public._t('S7'), public._t('A'), 'open_7', (select sanskara_opt_in_generation from public.profiles where id = public._t('A')), public.sanskara_handover_notice_date((select birth_date from public.sanskara_subjects where id = public._t('S7')), 'open_7'))
    and public.sanskara_handover_still_valid(public._t('Sc30'), public._t('A'), 'closing_30', (select sanskara_opt_in_generation from public.profiles where id = public._t('A')), public.sanskara_handover_notice_date((select birth_date from public.sanskara_subjects where id = public._t('Sc30')), 'closing_30')));
  perform public._ok('a pending claim also hides open_* from the selector', not exists (select 1 from public._t_due() where s = 'S7'));
  update public.sanskara_claims set status = 'cancelled' where subject_id = public._t('S7');
  perform public._ok('a cancelled claim no longer suppresses (the selector offers S7 again unless one was already created for the day)',
    exists (select 1 from public._t_due() where s = 'S7') or exists (select 1 from public.notification_candidates where event_id = public._t('S7')::text and event_instance = 'Hopen_7'));
end $$;

-- ── 8. Cancellation hooks ───────────────────────────────────────────────────────────────────────────────────────────
-- A milestone reminder (an 'L' instance) that no handover hook may touch. The milestone validator is switched off for this one
-- fixture insert only, inside this transaction.
alter table public.notification_candidates disable trigger sanskara_validate_candidate;
insert into public.notification_candidates (id, user_id, event_type, event_id, event_instance, local_date, scheduled_for, expires_at, title, body, action_url, timezone, status, metadata)
values (public._t('milestone-candidate'), public._t('A'), 'sanskar_milestone', public._t('S30')::text, 'L7', current_date, now(), now() + interval '1 hour', 't', 'b', '/kul/sanskara', 'UTC', 'pending', '{}');
insert into public.notification_schedule (user_id, title, body, send_at, notification_type, status, notification_key, metadata)
values (public._t('A'), 't', 'b', now() + interval '1 hour', 'sanskar_milestone', 'pending', 'sanskar_milestone:milestone-fixture', jsonb_build_object('subscription_id', gen_random_uuid()));
alter table public.notification_candidates enable trigger sanskara_validate_candidate;

-- manager removed: only that account's notices for that subject
select public._t_arm('S90', 'B', 'open_90');
select public._t_sched('S90', 'A', 'open_90');  -- A's candidate already exists from section 5
do $$
begin
  perform public._ok('armed A and B on S90', public._t_live('S90', 'A') >= 2 and public._t_live('S90', 'B') = 2);
  delete from public.sanskara_subject_managers where subject_id = public._t('S90') and account_id = public._t('B');
  perform public._ok('removing B cancels B''s notices on S90', public._t_live('S90', 'B') = 0);
  perform public._ok('...and leaves A''s', public._t_live('S90', 'A') >= 2);
end $$;

-- profile changes: opt-out, consent withdrawal, deletion cool-off, each cancels that account's notices on every subject
select public._t_arm('S30', 'A', 'open_30');
select public._t_arm('S0', 'A', 'open_0');
select public._t_sched('Sc7', 'A', 'closing_7');  -- its candidate already exists from section 5
do $$
begin
  perform public._ok('armed A across subjects', public._t_live('S30', 'A') = 2 and public._t_live('S0', 'A') = 2 and public._t_live('Sc7', 'A') >= 2);
  update public.profiles set wants_sanskara_reminders = false where id = public._t('A');
  perform public._ok('opting out cancels A''s notices on all subjects', public._t_live('S30', 'A') = 0 and public._t_live('S0', 'A') = 0 and public._t_live('Sc7', 'A') = 0);
  update public.profiles set wants_sanskara_reminders = true where id = public._t('A');
end $$;
select public._t_arm('S30', 'A', 'open_30');
do $$
begin
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._ok('withdrawing consent cancels A''s notices', public._t_live('S30', 'A') = 0);
  update public.profiles set consent_religious_data = true where id = public._t('A');
end $$;
select public._t_arm('S30', 'A', 'open_30');
do $$
begin
  update public.profiles set is_deleting = true where id = public._t('A');
  perform public._ok('the deletion cool-off cancels A''s notices', public._t_live('S30', 'A') = 0);
  update public.profiles set is_deleting = false where id = public._t('A');
end $$;
select public._t_arm('S30', 'A', 'open_30');
do $$
begin
  update public.profiles set full_name = 'Renamed' where id = public._t('A');
  perform public._ok('an unrelated profile edit cancels nothing', public._t_live('S30', 'A') = 2);
  update public.profiles set wants_sanskara_reminders = true where id = public._t('A');
  perform public._ok('re-writing the same opt-in value cancels nothing', public._t_live('S30', 'A') = 2);
end $$;

-- the dependent is deleted: its manager rows cascade away and with them every account's notices for it; other subjects are untouched
select public._t_arm('S0', 'A', 'open_0');
do $$
begin
  perform public._ok('armed S0 and S30', public._t_live('S0') >= 2 and public._t_live('S30') >= 2);
  delete from public.sanskara_subjects where id = public._t('S0');
  perform public._ok('deleting the dependent cancels its notices', public._t_live('S0') = 0);
  perform public._ok('...and not another dependent''s', public._t_live('S30') >= 2);
end $$;

-- ── 9. Send-time validity follows the live data ─────────────────────────────────────────────────────────────────────
do $$
declare
  v_pgen integer := (select sanskara_opt_in_generation from public.profiles where id = public._t('A'));
  v_date date := public.sanskara_handover_notice_date((select birth_date from public.sanskara_subjects where id = public._t('S30')), 'open_30');
begin
  perform public._ok('valid as prepared', public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', v_pgen, v_date));
  perform public._ok('not valid for another notice name', not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_7', v_pgen, v_date));
  perform public._ok('not valid for another date', not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', v_pgen, v_date + 1));
  perform public._ok('not valid on a stale generation', not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', v_pgen + 1, v_date));
  perform public._ok('not valid for a stranger', not public.sanskara_handover_still_valid(public._t('S30'), public._t('C'), 'open_30', v_pgen, v_date));
  perform public._ok('null in any argument is not valid', not public.sanskara_handover_still_valid(null, public._t('A'), 'open_30', v_pgen, v_date)
    and not public.sanskara_handover_still_valid(public._t('S30'), null, 'open_30', v_pgen, v_date)
    and not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), null, v_pgen, v_date)
    and not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', null, v_date)
    and not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', v_pgen, null));
  perform public._ok('a subject that does not exist is not valid', not public.sanskara_handover_still_valid(gen_random_uuid(), public._t('A'), 'open_30', v_pgen, v_date));
  -- A changed birth date moves the notice date, so a prepared notice goes stale.
  update public.sanskara_subjects set birth_date = birth_date - 10 where id = public._t('S30');
  perform public._ok('a changed birth date makes the prepared notice stale', not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'open_30', v_pgen, v_date));
  update public.sanskara_subjects set birth_date = birth_date + 10 where id = public._t('S30');
  -- Past the end of the window nothing is valid.
  update public.sanskara_subjects set birth_date = (current_date - interval '19 years 1 day')::date where id = public._t('S30');
  perform public._ok('past the end of the window nothing is valid', not public.sanskara_handover_still_valid(public._t('S30'), public._t('A'), 'closing_7', v_pgen,
    public.sanskara_handover_notice_date((select birth_date from public.sanskara_subjects where id = public._t('S30')), 'closing_7')));
end $$;

-- ── 10. Nothing above touched a milestone reminder ──────────────────────────────────────────────────────────────────
do $$
begin
  perform public._ok('the milestone candidate is still pending after every handover cancellation',
    (select status from public.notification_candidates where id = public._t('milestone-candidate')) = 'pending');
  perform public._ok('the milestone schedule row is still pending',
    (select status from public.notification_schedule where notification_key = 'sanskar_milestone:milestone-fixture') = 'pending');
end $$;

do $$ begin raise notice 'ALL HANDOVER NOTICE ASSERTIONS PASSED'; end $$;
rollback;
