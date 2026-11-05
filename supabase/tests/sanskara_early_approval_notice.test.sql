-- Integration assertions for 20261104110000_sanskara_early_approval_notice.sql (notice to the other managers of an early hand-over).
-- Run on a scratch database after the notification pipeline migrations, M1 to M4a, the hand-over notices, the early hand-over and the
-- migration under test, as the migration owner (it must be able to SET ROLE authenticated). Everything is rolled back at the end.
begin;
set local timezone to 'UTC';

create function public._t(n text) returns uuid language sql immutable as $$ select md5('early-notice-test:' || n)::uuid $$;
create function public._ok(p_label text, p_cond boolean) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAIL %', p_label using errcode = 'P0004'; end if;
end $$;
create function public._t_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
  execute 'set local role authenticated';
end $$;
create function public._t_admin() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
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
grant execute on function public._t(text), public._ok(text, boolean), public._t_as(uuid), public._t_admin(), public._t_expect(text, text, text, text) to authenticated, anon;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- S2 (16) is managed by A and B. S3 (15) by A, B and X. S4 (15) by A and D. A starts everything. D has not opted in, W has withdrawn consent
-- (a manager of S5 with A), Z is a stranger.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'X', 'D', 'W', 'Z']) n;
insert into public.profiles (id, consent_religious_data, is_deleting, wants_sanskara_reminders, timezone, username, full_name)
select public._t(n), c, false, w, 'UTC', 'u_' || lower(n), 'Name ' || n
from (values ('A', true, true), ('B', true, true), ('X', true, true), ('D', true, false), ('W', true, true), ('Z', true, true)) v(n, c, w);
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S2'), 'dependent', 'Ravi', (current_date - interval '16 years' - interval '40 days')::date),
  (public._t('S3'), 'dependent', 'Tara', (current_date - interval '15 years' - interval '5 days')::date),
  (public._t('S4'), 'dependent', 'Kiran', (current_date - interval '15 years' - interval '9 days')::date),
  (public._t('S5'), 'dependent', 'Meera', (current_date - interval '15 years' - interval '11 days')::date);
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S2'), public._t('A')), (public._t('S2'), public._t('B')),
  (public._t('S3'), public._t('A')), (public._t('S3'), public._t('B')), (public._t('S3'), public._t('X')),
  (public._t('S4'), public._t('A')), (public._t('S4'), public._t('D')),
  (public._t('S5'), public._t('A')), (public._t('S5'), public._t('W'));

create function public._t_name(p_id uuid) returns text language sql as $$
  select n from unnest(array['A', 'B', 'X', 'D', 'W', 'Z']) n where public._t(n) = p_id $$;
create function public._t_start(p_subject text) returns void language plpgsql as $$
begin
  perform public._t_as(public._t('A'));
  perform public.sanskara_start_early_handover(gen_random_uuid(), public._t(p_subject));
  perform public._t_admin();
end $$;
grant execute on function public._t_start(text) to authenticated;
create function public._t_hid(p_subject text) returns uuid language sql as $$
  select id from public.sanskara_early_handovers where subject_id = public._t(p_subject) and status in ('awaiting_approval', 'ready', 'awaiting_confirmation') $$;
create function public._t_due() returns text language sql as $$
  select coalesce(string_agg(x.label, ',' order by x.label), '') from (
    select public._t_name(d.account_id) || '@' || (select s from unnest(array['S2', 'S3', 'S4', 'S5']) s where public._t_hid(s) = d.handover_id) as label
    from public.sanskara_early_approval_due() d) x $$;

-- Insert a candidate the way the producer would, with optional overrides of columns or metadata.
create function public._t_ins(p_subject text, p_account text, p_patch jsonb default '{}'::jsonb, p_meta jsonb default '{}'::jsonb) returns uuid
language plpgsql as $$
declare v_h uuid := public._t_hid(p_subject); v_pgen integer; v_id uuid; base jsonb; meta jsonb;
begin
  select sanskara_opt_in_generation into v_pgen from public.profiles where id = public._t(p_account);
  base := jsonb_build_object('event_id', v_h::text, 'event_instance', 'Eapproval', 'audience', 'manager',
    'scheduled_for', now(), 'local_date', current_date, 'title', 'Sanskara timeline',
    'body', 'Something on your timeline needs your attention. Open the app.', 'action_url', '/kul/sanskara', 'timezone', 'UTC') || p_patch;
  meta := jsonb_build_object('handover_id', v_h, 'profile_generation', v_pgen, 'local_date', (base ->> 'local_date'), 'timezone', base ->> 'timezone') || p_meta;
  -- A cancelled candidate for the same key would collide with the table's unique key (as in production); the test re-arms, so clear it.
  delete from public.notification_candidates where user_id = public._t(p_account) and event_type = 'sanskar_milestone'
    and event_id = base ->> 'event_id' and event_instance = base ->> 'event_instance' and status = 'cancelled';
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at,
    priority, title, body, action_url, language, timezone, source_status, source_refs, metadata)
  values (public._t(p_account), 'sanskar_milestone', base ->> 'event_id', base ->> 'event_instance', (base ->> 'local_date')::date, base ->> 'audience',
    (base ->> 'scheduled_for')::timestamptz, (base ->> 'scheduled_for')::timestamptz + interval '12 hours', 30, base ->> 'title', base ->> 'body',
    base ->> 'action_url', 'en', base ->> 'timezone', 'user_provided', '{}'::jsonb, meta)
  returning id into v_id;
  return v_id;
end $$;
create function public._t_pending(p_account text) returns integer language sql as $$
  select count(*)::integer from public.notification_candidates where user_id = public._t(p_account) and event_instance = 'Eapproval' and status = 'pending' $$;

-- ── 1. Privileges ───────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['sanskara_early_approval_due(timestamptz, interval)', 'sanskara_early_approval_still_valid(uuid, uuid, integer)'] loop
    perform public._ok(f || ' is server only', has_function_privilege('service_role', 'public.' || f, 'execute')
      and not has_function_privilege('authenticated', 'public.' || f, 'execute') and not has_function_privilege('anon', 'public.' || f, 'execute'));
  end loop;
  foreach f in array array['sanskara_validate_early_approval_candidate()', 'sanskara_cancel_early_approval_notices(uuid, uuid, text)',
    'sanskara_early_approval_handover_moved()', 'sanskara_early_approval_handover_deleted()', 'sanskara_early_approval_given()',
    'sanskara_early_approval_manager_removed()', 'sanskara_early_approval_profile_change()'] loop
    perform public._ok(f || ' is internal', not has_function_privilege('service_role', 'public.' || f, 'execute')
      and not has_function_privilege('authenticated', 'public.' || f, 'execute') and not has_function_privilege('anon', 'public.' || f, 'execute'));
  end loop;
end $$;

-- ── 2. Off, and nothing to notify ───────────────────────────────────────────────────────────────────────────────────
select public._ok('nothing is due before any hand-over', public._t_due() = '');
insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 10);

-- ── 3. Who is notified ──────────────────────────────────────────────────────────────────────────────────────────────
select public._t_start('S2');   -- A starts: A has agreed, B has not
select public._t_start('S3');   -- A starts: B and X have not
select public._t_start('S4');   -- A starts: D has not agreed but has not opted in
select public._t_start('S5');   -- A starts: W has not agreed
select public._ok('the managers who have not agreed and opted in are due, the starter and the opted-out are not',
  public._t_due() = 'B@S2,B@S3,W@S5,X@S3');
update public.profiles set consent_religious_data = false where id = public._t('W');
select public._ok('a manager whose consent is withdrawn is not due', public._t_due() = 'B@S2,B@S3,X@S3');
select public._ok('the wrong audience view: the still-valid check agrees with the selector',
  public.sanskara_early_approval_still_valid(public._t_hid('S2'), public._t('B'), (select sanskara_opt_in_generation from public.profiles where id = public._t('B')))
  and not public.sanskara_early_approval_still_valid(public._t_hid('S2'), public._t('A'), (select sanskara_opt_in_generation from public.profiles where id = public._t('A')))
  and not public.sanskara_early_approval_still_valid(public._t_hid('S2'), public._t('Z'), (select sanskara_opt_in_generation from public.profiles where id = public._t('Z')))
  and not public.sanskara_early_approval_still_valid(public._t_hid('S4'), public._t('D'), (select sanskara_opt_in_generation from public.profiles where id = public._t('D'))));
select public._ok('unknown and null arguments are false',
  not public.sanskara_early_approval_still_valid(gen_random_uuid(), public._t('B'), 0)
  and not public.sanskara_early_approval_still_valid(null, public._t('B'), 0)
  and not public.sanskara_early_approval_still_valid(public._t_hid('S2'), public._t('B'), null));

-- ── 4. Insert-time validation ───────────────────────────────────────────────────────────────────────────────────────
select public._t_ins('S2', 'B');
select public._ok('B has one pending notice', public._t_pending('B') = 1);
select public._ok('once created, it is not offered again', public._t_due() = 'B@S3,X@S3');
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'an extra metadata key', $q$select public._t_ins('S3', 'X', '{}', jsonb_build_object('child', 'Tara'))$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'a different instance', $q$select public._t_ins('S3', 'X', jsonb_build_object('event_instance', 'Eother'))$q$);
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'an event id that is not the hand-over', $q$select public._t_ins('S3', 'X', jsonb_build_object('event_id', gen_random_uuid()::text))$q$);
select public._t_expect('23514', 'sanskara_candidate_wrong_audience', 'the wrong audience', $q$select public._t_ins('S3', 'X', jsonb_build_object('audience', 'former_manager'))$q$);
select public._t_expect('23514', 'sanskara_candidate_not_discreet', 'the child''s name in the text', $q$select public._t_ins('S3', 'X', jsonb_build_object('body', 'Tara needs you. Open the app.'))$q$);
select public._t_expect('23514', 'sanskara_candidate_link_not_generic', 'a link with an id', $q$select public._t_ins('S3', 'X', jsonb_build_object('action_url', '/kul/sanskara/' || gen_random_uuid()::text))$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'the starter', $q$select public._t_ins('S3', 'A')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a manager who has not opted in', $q$select public._t_ins('S4', 'D')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a manager whose consent is withdrawn', $q$select public._t_ins('S5', 'W')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a stranger', $q$select public._t_ins('S3', 'Z')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a stale opt-in generation', $q$select public._t_ins('S3', 'X', '{}', jsonb_build_object('profile_generation', -1))$q$);

-- ── 5. Cancellation ─────────────────────────────────────────────────────────────────────────────────────────────────
select public._t_ins('S3', 'B');
select public._t_ins('S3', 'X');
select public._ok('both are pending', public._t_pending('B') = 2 and public._t_pending('X') = 1);

select public._t_as(public._t('B'));
select public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S3'));
select public._t_admin();
select public._ok('B agreeing cancels only B''s notice for S3, and X''s stays',
  public._t_pending('B') = 1 and public._t_pending('X') = 1);
select public._ok('B''s notice for the other hand-over is untouched', exists (
  select 1 from public.notification_candidates where user_id = public._t('B') and event_id = public._t_hid('S2')::text and status = 'pending'));

update public.profiles set wants_sanskara_reminders = false where id = public._t('X');
select public._ok('opting out cancels the notice', public._t_pending('X') = 0);
update public.profiles set wants_sanskara_reminders = true where id = public._t('X');

select public._t_as(public._t('A'));
select public.sanskara_cancel_early_handover(gen_random_uuid(), public._t('S2'));
select public._t_admin();
select public._ok('cancelling the hand-over cancels its notices', public._t_pending('B') = 0);
select public._ok('and nothing is due for it', public._t_due() not like '%@S2%');

-- A restart is a new hand-over: the old one's notice is gone, the new one notifies once.
select public._t_start('S2');
select public._ok('a restart makes B due again', public._t_due() like '%B@S2%');
select public._t_ins('S2', 'B');
create table public._t_old (id uuid);
insert into public._t_old select public._t_hid('S2');
select public._t_start('S2');
select public._ok('the earlier hand-over is no longer valid for anyone',
  not public.sanskara_early_approval_still_valid((select id from public._t_old), public._t('B'), (select sanskara_opt_in_generation from public.profiles where id = public._t('B'))));
select public._ok('restarting again cancels the earlier notice', public._t_pending('B') = 0);
select public._ok('and B is due for the new hand-over', public._t_due() like '%B@S2%');
select public._t_ins('S2', 'B');

-- A manager removed.
select public._t_ins('S3', 'X');
delete from public.sanskara_subject_managers where subject_id = public._t('S3') and account_id = public._t('X');
select public._ok('removing a manager cancels their notice', public._t_pending('X') = 0);

-- ── 6. Send-time checks ─────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare v_h uuid := public._t_hid('S2'); v_g integer;
begin
  select sanskara_opt_in_generation into v_g from public.profiles where id = public._t('B');
  perform public._ok('valid now', public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  update public.sanskara_early_handovers set created_at = now() - interval '2 hours', expires_at = now() - interval '1 second' where id = v_h;
  perform public._ok('an expired hand-over is not valid', not public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  perform public._ok('and nothing is due for it', public._t_due() not like '%@S2%');
  update public.sanskara_early_handovers set expires_at = now() + interval '1 day' where id = v_h;
  delete from public.sanskara_settings where key = 'early_handover_min_age';
  perform public._ok('switching the feature off makes it invalid', not public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 17);
  perform public._ok('a floor above the child''s age makes it invalid', not public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  update public.sanskara_settings set int_value = 10 where key = 'early_handover_min_age';
  perform public._ok('valid again once the window holds', public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  delete from public.notification_candidates where user_id = public._t('B') and event_id = v_h::text;
  perform public._ok('with no earlier notice B is due', public._t_due() like '%B@S2%');
  update public.sanskara_early_handovers set status = 'ready' where id = v_h;
  perform public._ok('a hand-over that is ready is not valid', not public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  update public.sanskara_early_handovers set status = 'awaiting_approval' where id = v_h;
  update public.sanskara_early_handovers set created_at = now() - interval '25 hours' where id = v_h;
  update public.sanskara_subject_managers set added_at = now() - interval '25 hours' where subject_id = public._t('S2');
  perform public._ok('a hand-over older than 24 hours is not selected for new notices', public._t_due() not like '%@S2%');
  update public.sanskara_subject_managers set added_at = now() where subject_id = public._t('S2') and account_id = public._t('B');
  perform public._ok('but a manager added within 24 hours of now is, even on an old hand-over', public._t_due() like '%B@S2%');
  perform public._ok('and only that manager', (select count(*) from public.sanskara_early_approval_due() d where d.handover_id = v_h) = 1);
end $$;

-- ── 7. The other validators are not disturbed ───────────────────────────────────────────────────────────────────────
select public._t_expect('23514', 'sanskara_candidate_metadata_invalid', 'a milestone-style instance is not taken by this validator',
  $q$insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at, title, body, action_url, timezone, metadata)
     values (public._t('B'), 'sanskar_milestone', public._t_hid('S2')::text, 'L7', current_date, 'x', now(), now() + interval '1 hour', 't', 'b', '/kul/sanskara', 'UTC', '{}'::jsonb)$q$);

-- ── 8. The starter's notice: the child has entered the code ───────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['sanskara_early_confirm_due(timestamptz)', 'sanskara_early_confirm_still_valid(uuid, uuid, integer)'] loop
    perform public._ok(f || ' is server only', has_function_privilege('service_role', 'public.' || f, 'execute')
      and not has_function_privilege('authenticated', 'public.' || f, 'execute') and not has_function_privilege('anon', 'public.' || f, 'execute'));
  end loop;
  foreach f in array array['sanskara_validate_early_confirm_candidate()', 'sanskara_cancel_early_confirm_notices(uuid, uuid, text)',
    'sanskara_early_confirm_handover_moved()'] loop
    perform public._ok(f || ' is internal', not has_function_privilege('service_role', 'public.' || f, 'execute')
      and not has_function_privilege('authenticated', 'public.' || f, 'execute') and not has_function_privilege('anon', 'public.' || f, 'execute'));
  end loop;
end $$;

-- S6 (16) is managed by A and B; C is the child's own account, with the same date of birth and consent.
insert into auth.users (id) values (public._t('C'));
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S6'), 'dependent', 'Isha', (current_date - interval '16 years' - interval '60 days')::date);
insert into public.profiles (id, consent_religious_data, is_deleting, wants_sanskara_reminders, timezone, username, full_name, date_of_birth)
values (public._t('C'), true, false, false, 'UTC', 'u_c', 'Name C', (current_date - interval '16 years' - interval '60 days')::date);
insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S6'), public._t('A')), (public._t('S6'), public._t('B'));

create function public._t_cdue() returns text language sql as $$
  select coalesce(string_agg(public._t_name(d.account_id), ',' order by public._t_name(d.account_id)), '')
  from public.sanskara_early_confirm_due() d where d.handover_id = public._t_hid('S6') $$;
create function public._t_cpending(p_account text) returns integer language sql as $$
  select count(*)::integer from public.notification_candidates where user_id = public._t(p_account) and event_instance = 'Econfirm' and status = 'pending' $$;
create function public._t_cins(p_account text, p_patch jsonb default '{}'::jsonb, p_meta jsonb default '{}'::jsonb) returns uuid
language plpgsql as $$
declare v_h uuid := public._t_hid('S6'); v_pgen integer; v_id uuid; base jsonb; meta jsonb;
begin
  select sanskara_opt_in_generation into v_pgen from public.profiles where id = public._t(p_account);
  base := jsonb_build_object('event_id', v_h::text, 'event_instance', 'Econfirm', 'audience', 'starter',
    'scheduled_for', now(), 'local_date', current_date, 'title', 'Sanskara timeline',
    'body', 'Something on your timeline needs your attention. Open the app.', 'action_url', '/kul/sanskara', 'timezone', 'UTC') || p_patch;
  meta := jsonb_build_object('confirm_handover_id', v_h, 'profile_generation', v_pgen, 'local_date', (base ->> 'local_date'), 'timezone', base ->> 'timezone') || p_meta;
  delete from public.notification_candidates where user_id = public._t(p_account) and event_type = 'sanskar_milestone'
    and event_id = base ->> 'event_id' and event_instance = base ->> 'event_instance' and status = 'cancelled';
  insert into public.notification_candidates (user_id, event_type, event_id, event_instance, local_date, audience_variant, scheduled_for, expires_at,
    priority, title, body, action_url, language, timezone, source_status, source_refs, metadata)
  values (public._t(p_account), 'sanskar_milestone', base ->> 'event_id', base ->> 'event_instance', (base ->> 'local_date')::date, base ->> 'audience',
    (base ->> 'scheduled_for')::timestamptz, (base ->> 'scheduled_for')::timestamptz + interval '12 hours', 30, base ->> 'title', base ->> 'body',
    base ->> 'action_url', 'en', base ->> 'timezone', 'user_provided', '{}'::jsonb, meta)
  returning id into v_id;
  return v_id;
end $$;
-- Starts as A and keeps the one-time code, as the app does.
create function public._t_start_tok(p_subject text) returns text language plpgsql as $$
declare t text;
begin
  perform public._t_as(public._t('A'));
  t := public.sanskara_start_early_handover(gen_random_uuid(), public._t(p_subject)) ->> 'token';
  perform public._t_admin();
  return t;
end $$;
grant execute on function public._t_start_tok(text) to authenticated;
create temp table _tok (v text);
grant all on _tok to authenticated;

insert into _tok select public._t_start_tok('S6');
select public._ok('before the child enters the code, nobody is due for the starter notice', public._t_cdue() = '');
select public._t_as(public._t('B'));
select public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S6'));
select public._t_admin();
select public._ok('every manager agreed (ready) but the child has not entered the code: still nobody', public._t_cdue() = '');

select public._t_as(public._t('C'));
select public.sanskara_accept_early_handover(gen_random_uuid(), (select v from _tok));
select public._t_admin();
select public._ok('once the child enters the code, only the starter is due (B is not)', public._t_cdue() = 'A');

select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'B is not the starter', $q$select public._t_cins('B')$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'the child''s own account', $q$select public._t_cins('C')$q$);
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'an extra metadata key', $q$select public._t_cins('A', '{}', jsonb_build_object('claimant', 'x'))$q$);
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'the approval key is not accepted here', $q$select public._t_cins('A', '{}', jsonb_build_object('handover_id', gen_random_uuid()))$q$);
select public._t_expect('23514', 'sanskara_candidate_wrong_audience', 'the wrong audience', $q$select public._t_cins('A', jsonb_build_object('audience', 'manager'))$q$);
select public._t_expect('23514', 'sanskara_candidate_not_discreet', 'the child''s name in the text', $q$select public._t_cins('A', jsonb_build_object('body', 'Isha is waiting. Open the app.'))$q$);
select public._t_expect('23514', 'sanskara_candidate_link_not_generic', 'a link with an id', $q$select public._t_cins('A', jsonb_build_object('action_url', '/kul/sanskara/' || gen_random_uuid()::text))$q$);
select public._t_expect('23514', 'sanskara_candidate_carries_extra_data', 'an unknown E instance is refused by the approval validator', $q$select public._t_cins('A', jsonb_build_object('event_instance', 'Eother'))$q$);
select public._t_expect('23514', 'sanskara_candidate_requires_current_handover', 'a stale opt-in generation', $q$select public._t_cins('A', '{}', jsonb_build_object('profile_generation', -1))$q$);

select public._t_cins('A');
select public._ok('the starter has one pending notice', public._t_cpending('A') = 1);
select public._ok('once created it is not offered again', public._t_cdue() = '');
select public._ok('and it did not touch the approval notices', (select count(*) from public.notification_candidates where event_instance = 'Eapproval' and event_id = public._t_hid('S6')::text) = 0);

-- Leaving 'awaiting_confirmation' cancels it: a manager change sends it back to approval and clears the child.
insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S6'), public._t('X'));
select public._ok('adding a manager resets the hand-over and cancels the starter notice', public._t_cpending('A') = 0);
select public._ok('and nothing is due', public._t_cdue() = '');

-- A fresh run: cancelling by any manager, the starter opting out, and the confirmed hand-over (which deletes the row).
delete from public.sanskara_subject_managers where subject_id = public._t('S6') and account_id = public._t('X');
update public.sanskara_early_handovers set status = 'cancelled', claimant_id = null where id = public._t_hid('S6');
insert into _tok select public._t_start_tok('S6');
select public._t_as(public._t('B')); select public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S6')); select public._t_admin();
select public._t_as(public._t('C')); select public.sanskara_accept_early_handover(gen_random_uuid(), (select v from _tok order by ctid desc limit 1)); select public._t_admin();
select public._ok('due again for the new hand-over', public._t_cdue() = 'A');
select public._t_cins('A');
select public._t_as(public._t('B')); select public.sanskara_cancel_early_handover(gen_random_uuid(), public._t('S6')); select public._t_admin();
select public._ok('a cancel by any manager cancels the starter notice', public._t_cpending('A') = 0);

insert into _tok select public._t_start_tok('S6');
select public._t_as(public._t('B')); select public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S6')); select public._t_admin();
select public._t_as(public._t('C')); select public.sanskara_accept_early_handover(gen_random_uuid(), (select v from _tok order by ctid desc limit 1)); select public._t_admin();
select public._t_cins('A');
insert into public.notification_schedule (user_id, title, body, send_at, notification_type, metadata)
values (public._t('A'), 't', 'b', now(), 'sanskar_milestone', jsonb_build_object('confirm_handover_id', public._t_hid('S6'))),
       (public._t('A'), 't', 'b', now(), 'sanskar_milestone', jsonb_build_object('subscription_id', gen_random_uuid())),
       (public._t('A'), 't', 'b', now(), 'sanskar_milestone', jsonb_build_object('handover_id', public._t_hid('S6'))),
       (public._t('B'), 't', 'b', now(), 'sanskar_milestone', jsonb_build_object('confirm_handover_id', public._t_hid('S6')));
update public.profiles set wants_sanskara_reminders = false where id = public._t('A');
select public._ok('the starter opting out cancels it', public._t_cpending('A') = 0);
select public._ok('and cancels the starter''s scheduled confirm row', (select status from public.notification_schedule where user_id = public._t('A') and metadata ? 'confirm_handover_id') = 'cancelled');
select public._ok('and not another person''s row', (select status from public.notification_schedule where user_id = public._t('B') and metadata ? 'confirm_handover_id') = 'pending');
select public._ok('but not a reminder row of the same person', (select status from public.notification_schedule where user_id = public._t('A') and metadata ? 'subscription_id') = 'pending');
update public.profiles set wants_sanskara_reminders = true where id = public._t('A');
select public._ok('and it is not re-offered after opting back in (the key is spent)', public._t_cdue() = '');

-- Send-time check.
do $$
declare v_h uuid := public._t_hid('S6'); v_g integer;
begin
  select sanskara_opt_in_generation into v_g from public.profiles where id = public._t('A');
  perform public._ok('valid for the starter now', public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  update public.profiles set consent_religious_data = false where id = public._t('A');
  select sanskara_opt_in_generation into v_g from public.profiles where id = public._t('A');  -- use the CURRENT generation, so only the access check can say no
  perform public._ok('not valid once the starter has withdrawn consent (access check)', not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  update public.profiles set consent_religious_data = true where id = public._t('A');
  select sanskara_opt_in_generation into v_g from public.profiles where id = public._t('A');  -- a consent change moves the generation
  alter table public.sanskara_early_handovers disable trigger user;
  update public.sanskara_early_handovers set claimant_id = null where id = v_h;
  alter table public.sanskara_early_handovers enable trigger user;
  perform public._ok('not valid when no child has entered the code', not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  alter table public.sanskara_early_handovers disable trigger user;
  update public.sanskara_early_handovers set claimant_id = public._t('C') where id = v_h;
  alter table public.sanskara_early_handovers enable trigger user;
  perform public._ok('not valid for B', not public.sanskara_early_confirm_still_valid(v_h, public._t('B'), v_g));
  perform public._ok('not valid for the child', not public.sanskara_early_confirm_still_valid(v_h, public._t('C'), v_g));
  perform public._ok('the approval check is not valid for this state', not public.sanskara_early_approval_still_valid(v_h, public._t('B'), v_g));
  perform public._ok('unknown and null arguments are false', not public.sanskara_early_confirm_still_valid(null, public._t('A'), v_g)
    and not public.sanskara_early_confirm_still_valid(gen_random_uuid(), public._t('A'), v_g)
    and not public.sanskara_early_confirm_still_valid(v_h, null, v_g) and not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), null));
  update public.sanskara_early_handovers set created_at = now() - interval '2 hours', expires_at = now() - interval '1 second' where id = v_h;
  perform public._ok('expired is not valid', not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  update public.sanskara_early_handovers set expires_at = now() + interval '1 day' where id = v_h;
  delete from public.sanskara_settings where key = 'early_handover_min_age';
  perform public._ok('feature switched off is not valid', not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 17);
  perform public._ok('a floor above the child''s age is not valid', not public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
  update public.sanskara_settings set int_value = 10 where key = 'early_handover_min_age';
  perform public._ok('valid again', public.sanskara_early_confirm_still_valid(v_h, public._t('A'), v_g));
end $$;

-- Confirming moves the records and deletes the hand-over: the notice goes with it.
select public._t_cins('A');
select public._t_as(public._t('A')); select public.sanskara_confirm_early_handover(gen_random_uuid(), public._t('S6')); select public._t_admin();
select public._ok('a confirmed hand-over leaves no pending starter notice', public._t_cpending('A') = 0);

do $$ begin raise notice 'ALL EARLY APPROVAL NOTICE ASSERTIONS PASSED'; end $$;
rollback;
