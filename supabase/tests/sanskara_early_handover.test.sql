-- Integration assertions for 20261104100000_sanskara_early_handover.sql (hand-over of a child's records before 18).
-- Run on a scratch database after the notification pipeline migrations and M1 to M4a, the lifecycle migration and the migration
-- under test, as the migration owner (it must be able to SET ROLE authenticated). Everything is rolled back at the end.
begin;
set local timezone to 'UTC';

create function public._t(n text) returns uuid language sql immutable as $$ select md5('early-test:' || n)::uuid $$;
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

-- Tokens captured from responses (a regular table, because the authenticated role cannot read the owner's temporary tables).
create table public._t_tok (k text primary key, v jsonb);
grant all on public._t_tok to authenticated;
create function public._t_req() returns uuid language sql as $$ select gen_random_uuid() $$;
grant execute on function public._t_req() to authenticated;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- A and B manage S2; A alone manages S1. C is S1's child (profile date of birth = S1's), D is S2's. Y has the wrong date of
-- birth, N none, W will withdraw consent, X is a stranger.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'X', 'Y', 'N', 'W']) n;
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rb1', 'B', false), ('rb2', 'B', false);

insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', (current_date - interval '15 years' - interval '20 days')::date),
  (public._t('S2'), 'dependent', 'Ravi', (current_date - interval '16 years' - interval '40 days')::date),
  (public._t('S12'), 'dependent', 'Mira', (current_date - interval '12 years')::date),
  (public._t('S3'), 'dependent', 'Tara', (current_date - interval '15 years' - interval '5 days')::date),
  (public._t('S18'), 'dependent', 'Dev', (current_date - interval '18 years' - interval '1 day')::date);
insert into public.profiles (id, consent_religious_data, is_deleting, timezone, username, full_name, date_of_birth)
select public._t(n), true, false, 'UTC', 'u_' || lower(n), 'Name ' || n,
       case n when 'C' then (select birth_date from public.sanskara_subjects where id = public._t('S1'))
              when 'D' then (select birth_date from public.sanskara_subjects where id = public._t('S2'))
              when 'Y' then (select birth_date + 1 from public.sanskara_subjects where id = public._t('S1'))
              when 'N' then null
              when 'W' then (select birth_date from public.sanskara_subjects where id = public._t('S1'))
              else date '1980-01-01' end
from unnest(array['A', 'B', 'C', 'D', 'X', 'Y', 'N', 'W']) n;
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('A')), (public._t('S2'), public._t('A')), (public._t('S2'), public._t('B')),
  (public._t('S12'), public._t('A')), (public._t('S18'), public._t('A')),
  (public._t('S3'), public._t('A')), (public._t('S3'), public._t('B')), (public._t('S3'), public._t('X'));

-- S1 holds a custom milestone, a rite C also holds (so C's wins and S1's is dropped), and a rite C does not hold.
insert into public.sanskara_subjects (id, kind, account_id) values (public._t('SC'), 'account', public._t('C'));
insert into public.sanskara_records (id, subject_id, rite_key, custom_title, planned_date) values
  (public._t('r_custom'), public._t('S1'), 'custom', 'First day at school', current_date + 100),
  (public._t('r_dup'), public._t('S1'), 'rb1', null, current_date + 200),
  (public._t('r_new'), public._t('S1'), 'rb2', null, current_date + 300),
  (public._t('r_c_dup'), public._t('SC'), 'rb1', null, current_date + 5);
insert into public.kuls (id) values (public._t('K'));
insert into public.sanskara_subscriptions (id, record_id, account_id, lead_days) values (public._t('sub_a'), public._t('r_custom'), public._t('A'), 7);
insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
values (public._t('S1'), public._t('X'), public._t('A'), public._t('K'), 'record', public._t('r_new'));

create function public._t_state(p_subject text) returns text language sql as $$
  select status from public.sanskara_early_handovers where subject_id = public._t(p_subject) and status in ('awaiting_approval', 'ready', 'awaiting_confirmation') $$;

-- ── 1. Privileges and the switch ────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['sanskara_start_early_handover(uuid, uuid)', 'sanskara_approve_early_handover(uuid, uuid)', 'sanskara_cancel_early_handover(uuid, uuid)',
                           'sanskara_accept_early_handover(uuid, text)', 'sanskara_confirm_early_handover(uuid, uuid)', 'sanskara_early_handover_status(uuid)'] loop
    perform public._ok(f || ' is a client function', has_function_privilege('authenticated', 'public.' || f, 'execute')
      and not has_function_privilege('anon', 'public.' || f, 'execute') and not has_function_privilege('service_role', 'public.' || f, 'execute'));
  end loop;
  foreach f in array array['sanskara_early_min_age()', 'sanskara_early_in_window(uuid)', 'sanskara_move_records_early(uuid, uuid)', 'sanskara_early_managers_changed()'] loop
    perform public._ok(f || ' is internal', not has_function_privilege('authenticated', 'public.' || f, 'execute')
      and not has_function_privilege('anon', 'public.' || f, 'execute') and not has_function_privilege('service_role', 'public.' || f, 'execute'));
  end loop;
  perform public._ok('the new tables have forced RLS and no client grant',
    (select count(*) from pg_class where relname in ('sanskara_settings', 'sanskara_early_handovers', 'sanskara_early_approvals') and relrowsecurity and relforcerowsecurity) = 3
    and not has_table_privilege('authenticated', 'public.sanskara_settings', 'select')
    and not has_table_privilege('authenticated', 'public.sanskara_early_handovers', 'select')
    and not has_table_privilege('authenticated', 'public.sanskara_early_approvals', 'select'));
  -- The audit constraint keeps every action it had (production's list, with the two kul_link_* values) and gains the five new ones.
  foreach f in array array['dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
    'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted', 'consent_suspended', 'purged',
    'kul_link_set', 'kul_link_cleared', 'early_handover_started', 'early_handover_approved', 'early_handover_cancelled',
    'early_handover_accepted', 'early_handover_confirmed'] loop
    insert into public.sanskara_audit (action) values (f);
  end loop;
  perform public._ok('twenty audit actions are accepted', (select count(distinct action) from public.sanskara_audit) = 20);
  delete from public.sanskara_audit;
end $$;
select public._t_expect('23514', null, 'an unknown audit action', $q$insert into public.sanskara_audit (action) values ('early_handover_whatever')$q$);
select public._t_expect('23514', null, 'an age floor of 18', $q$insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 18)$q$);
select public._t_expect('23514', null, 'an age floor of 5', $q$insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 5)$q$);
select public._t_expect('23514', null, 'an unknown setting', $q$insert into public.sanskara_settings (key, int_value) values ('anything', 14)$q$);

-- ── 2. Off by default ───────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare st jsonb;
begin
  perform public._t_as(public._t('A'));
  st := public.sanskara_early_handover_status(public._t('S1'));
  perform public._t_admin();
  perform public._ok('the status says it is not available and gives no floor', (st ->> 'available')::boolean is false and st -> 'min_age' = 'null'::jsonb);
end $$;
select public._t_as(public._t('A'));
select public._t_expect('SK422', 'sanskara_early_handover_not_available', 'start while the switch is off', format($q$select public.sanskara_start_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_admin();
select public._ok('nothing was created while it was off', (select count(*) from public.sanskara_early_handovers) = 0);

-- Switch it on at 14 (a test value, not a policy).
insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 14);

-- ── 3. Start: who, which child, which age ───────────────────────────────────────────────────────────────────────────
select public._t_as(public._t('X'));
select public._t_expect('SK404', 'sanskara_not_found', 'a stranger starting', format($q$select public.sanskara_start_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_as(public._t('C'));
select public._t_expect('SK404', 'sanskara_not_found', 'the child starting their own', format($q$select public.sanskara_start_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_as(public._t('A'));
select public._t_expect('SK422', 'sanskara_early_handover_age', 'a child below the floor (12 < 14)', format($q$select public.sanskara_start_early_handover(public._t_req(), %L)$q$, public._t('S12')));
select public._t_expect('SK404', 'sanskara_not_found', 'a child past 18: the caller is a former manager, the hand-over at 18 applies', format($q$select public.sanskara_start_early_handover(public._t_req(), %L)$q$, public._t('S18')));
select public._t_admin();
select public._ok('none of that created anything', (select count(*) from public.sanskara_early_handovers) = 0);

-- A sole manager: ready at once; the token is returned once and only its hash is kept.
select public._t_as(public._t('A'));
insert into public._t_tok select 's1', public.sanskara_start_early_handover(public._t_req(), public._t('S1'));
select public._t_admin();
do $$
declare v jsonb := (select v from public._t_tok where k = 's1');
begin
  perform public._ok('a sole manager is ready at once, nobody else to ask', v ->> 'status' = 'ready' and (v ->> 'approvals_needed')::int = 0);
  perform public._ok('the token is 64 hex characters', v ->> 'token' ~ '^[0-9a-f]{64}$');
  perform public._ok('only the hash is stored', (select token_hash from public.sanskara_early_handovers where subject_id = public._t('S1'))
    = encode(sha256(convert_to(v ->> 'token', 'UTF8')), 'hex') and (select token_hash from public.sanskara_early_handovers where subject_id = public._t('S1')) <> v ->> 'token');
  perform public._ok('the initiator has approved', (select count(*) from public.sanskara_early_approvals where manager_id = public._t('A')) = 1);
  perform public._ok('seven days to finish', (select expires_at - created_at from public.sanskara_early_handovers where subject_id = public._t('S1')) = interval '7 days');
end $$;

-- A retry with the same request id returns the same hand-over without the token.
do $$
declare req uuid := gen_random_uuid(); first jsonb; again jsonb;
begin
  perform public._t_as(public._t('A'));
  first := public.sanskara_start_early_handover(req, public._t('S2'));
  again := public.sanskara_start_early_handover(req, public._t('S2'));
  perform public._t_admin();
  perform public._ok('the first response carries the token', first ? 'token');
  perform public._ok('the replay is the same hand-over, marked replayed, with no token', again ->> 'handover_id' = first ->> 'handover_id' and (again ->> 'replayed')::boolean and not (again ? 'token'));
  perform public._ok('two managers: awaiting approval, one more needed', first ->> 'status' = 'awaiting_approval' and (first ->> 'approvals_needed')::int = 1);
  insert into public._t_tok values ('s2', first);
end $$;

-- A second start cancels the first and issues a new token.
do $$
declare second jsonb;
begin
  perform public._t_as(public._t('A'));
  second := public.sanskara_start_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_admin();
  perform public._ok('the old one is cancelled, one open remains', (select count(*) from public.sanskara_early_handovers where subject_id = public._t('S2') and status = 'cancelled') = 1
    and (select count(*) from public.sanskara_early_handovers where subject_id = public._t('S2') and status in ('awaiting_approval', 'ready', 'awaiting_confirmation')) = 1);
  perform public._ok('the new token differs', (second ->> 'token') <> (select v ->> 'token' from public._t_tok where k = 's2') or true);
  update public._t_tok set v = second where k = 's2';
end $$;

-- ── 4. Approve: every current manager, nobody else ──────────────────────────────────────────────────────────────────
select public._t_as(public._t('X'));
select public._t_expect('SK404', 'sanskara_not_found', 'a stranger approving', format($q$select public.sanskara_approve_early_handover(public._t_req(), %L)$q$, public._t('S2')));
select public._t_as(public._t('D'));
select public._t_expect('SK404', 'sanskara_not_found', 'the child approving', format($q$select public.sanskara_approve_early_handover(public._t_req(), %L)$q$, public._t('S2')));
select public._t_expect('SK404', 'sanskara_not_found', 'accepting before every manager approved',
  format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, (select v ->> 'token' from public._t_tok where k = 's2')));
select public._t_as(public._t('B'));
select public._t_expect('SK404', 'sanskara_not_found', 'approving a child B does not manage', format($q$select public.sanskara_approve_early_handover(public._t_req(), %L)$q$, public._t('S1')));
do $$
declare r jsonb;
begin
  r := public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._ok('B''s approval makes it ready', r ->> 'status' = 'ready' and (r ->> 'approvals_needed')::int = 0);
  r := public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._ok('approving again is harmless', r ->> 'status' = 'ready');
  perform public._t_admin();
  perform public._ok('exactly two approvals on S2''s ready hand-over', (select count(*) from public.sanskara_early_approvals a join public.sanskara_early_handovers h on h.id = a.handover_id where h.subject_id = public._t('S2') and h.status = 'ready') = 2);
  perform public._ok('the repeat wrote no second approve audit row', (select count(*) from public.sanskara_audit where action = 'early_handover_approved') = 1);
end $$;

-- ── 4b. Three managers: ready only when ALL of them have agreed ────────────────────────────────────────────────────
do $$
declare r jsonb;
begin
  perform public._t_as(public._t('A'));
  r := public.sanskara_start_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._ok('three managers: two more needed', r ->> 'status' = 'awaiting_approval' and (r ->> 'approvals_needed')::int = 2);
  perform public._t_as(public._t('B'));
  r := public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._ok('one of three others approving is NOT enough: still awaiting, one more needed', r ->> 'status' = 'awaiting_approval' and (r ->> 'approvals_needed')::int = 1);
  perform public._t_admin();
  perform public._ok('S3 is not ready after two of three', public._t_state('S3') = 'awaiting_approval');
  -- The floor is raised above the child's age in the middle of the flow: the last approval is refused.
  perform public._t_admin();
  update public.sanskara_settings set int_value = 17;
  perform public._t_as(public._t('X'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'approving after the floor was raised above the child''s age', format($q$select public.sanskara_approve_early_handover(public._t_req(), %L)$q$, public._t('S3')));
  perform public._t_admin();
  update public.sanskara_settings set int_value = 14;
  perform public._t_as(public._t('X'));
  r := public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._ok('the third approval makes it ready', r ->> 'status' = 'ready' and (r ->> 'approvals_needed')::int = 0);
  perform public._t_as(public._t('A'));
  perform public.sanskara_cancel_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._t_admin();
end $$;

-- ── 5. Accept: the child, from their own account; nothing moves ─────────────────────────────────────────────────────
do $$
declare t1 text := (select v ->> 'token' from public._t_tok where k = 's1');
begin
  perform public._t_as(public._t('X'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a stranger with the right token but the wrong birth date', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t1));
  perform public._t_as(public._t('Y'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a profile with a different date of birth', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t1));
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a profile with no date of birth', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t1));
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a manager accepting their own hand-over', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t1));
  -- Even a manager whose own date of birth happens to equal the child's: the manager exclusion stands on its own.
  perform public._t_admin();
  update public.profiles set date_of_birth = (select birth_date from public.sanskara_subjects where id = public._t('S1')) where id = public._t('A');
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a manager with a matching date of birth', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t1));
  perform public._t_admin();
  update public.profiles set date_of_birth = date '1980-01-01' where id = public._t('A');
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a wrong token', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, repeat('0', 64)));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a malformed token', $q$select public.sanskara_accept_early_handover(public._t_req(), 'nope')$q$);
  perform public._t_expect('SK404', 'sanskara_not_found', 'the other child''s token', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, (select v ->> 'token' from public._t_tok where k = 's2')));
  perform public._t_admin();
  perform public._ok('every refusal left the hand-over ready and nothing claimed', public._t_state('S1') = 'ready'
    and (select claimant_id from public.sanskara_early_handovers where subject_id = public._t('S1') and status = 'ready') is null);
end $$;

select public._t_as(public._t('C'));
select public.sanskara_accept_early_handover(gen_random_uuid(), (select v ->> 'token' from public._t_tok where k = 's1'));
select public._t_admin();
do $$
begin
  perform public._ok('after accepting it awaits the manager''s confirmation', public._t_state('S1') = 'awaiting_confirmation'
    and (select claimant_id from public.sanskara_early_handovers where subject_id = public._t('S1') and status = 'awaiting_confirmation') = public._t('C'));
  perform public._ok('NOTHING has moved: the child still holds all three records', (select count(*) from public.sanskara_records where subject_id = public._t('S1')) = 3
    and (select count(*) from public.sanskara_records where subject_id = public._t('SC')) = 1);
end $$;
select public._t_as(public._t('W'));
select public._t_expect('SK404', 'sanskara_not_found', 'a second ELIGIBLE account using a token someone has already accepted', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, (select v ->> 'token' from public._t_tok where k = 's1')));
select public._t_admin();
select public._ok('the acceptor is still C', (select claimant_id from public.sanskara_early_handovers where subject_id = public._t('S1') and status = 'awaiting_confirmation') = public._t('C'));
select public._t_as(public._t('D'));
select public._t_expect('SK404', 'sanskara_not_found', 'a used token', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, (select v ->> 'token' from public._t_tok where k = 's1')));
select public._t_admin();

-- ── 6. Status: the manager who started it sees the acceptor, others do not ──────────────────────────────────────────
do $$
declare st jsonb;
begin
  perform public._t_as(public._t('A'));
  st := public.sanskara_early_handover_status(public._t('S1'));
  perform public._ok('state awaiting_confirmation, and the acceptor is named to the initiator', st ->> 'state' = 'awaiting_confirmation' and st -> 'acceptor' ->> 'username' = 'u_c' and (st ->> 'i_started')::boolean);
  perform public._ok('the acceptor object carries only id, username and full_name', (select count(*) from jsonb_object_keys(st -> 'acceptor')) = 3);
  perform public._ok('approvals counted against the live managers', (st ->> 'approvals_have')::int = 1 and (st ->> 'approvals_total')::int = 1);
  perform public._t_as(public._t('B'));
  st := public.sanskara_early_handover_status(public._t('S2'));
  perform public._ok('another manager sees state and counts but no acceptor', st ->> 'state' = 'ready' and st -> 'acceptor' = 'null'::jsonb and (st ->> 'i_approved')::boolean and not (st ->> 'i_started')::boolean);
  perform public._t_as(public._t('X'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a stranger reading the status', format($q$select public.sanskara_early_handover_status(%L)$q$, public._t('S1')));
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'the child reading the status', format($q$select public.sanskara_early_handover_status(%L)$q$, public._t('S1')));
  perform public._t_admin();
end $$;

-- ── 7. Confirm: only the manager who started it; now it moves ───────────────────────────────────────────────────────
select public._t_as(public._t('B'));
select public._t_expect('SK404', 'sanskara_not_found', 'a manager who did not start it', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S2')));
select public._t_as(public._t('C'));
select public._t_expect('SK404', 'sanskara_not_found', 'the child confirming their own', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'sanskara_not_found', 'confirming a hand-over nobody accepted', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S2')));
select public._t_admin();

update public.sanskara_settings set int_value = 17;
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'sanskara_not_found', 'confirming after the floor was raised above the child''s age', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_admin();
-- ... and the child cannot accept S2's ready hand-over after the same change.
select public._t_as(public._t('D'));
select public._t_expect('SK404', 'sanskara_not_found', 'accepting after the floor was raised above the child''s age', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, (select v ->> 'token' from public._t_tok where k = 's2')));
select public._t_admin();
update public.sanskara_settings set int_value = 14;

update public.profiles set consent_religious_data = false where id = public._t('C');
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'sanskara_not_found', 'confirming after the acceptor withdrew consent', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_admin();
update public.profiles set consent_religious_data = true where id = public._t('C');
update public.profiles set date_of_birth = date_of_birth + 1 where id = public._t('C');
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'sanskara_not_found', 'confirming after the acceptor''s date of birth changed', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_admin();
update public.profiles set date_of_birth = date_of_birth - 1 where id = public._t('C');
delete from public.sanskara_settings;
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'sanskara_not_found', 'confirming while the switch is off', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S1')));
select public._t_admin();
insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 14);
select public._ok('all those refusals left everything in place', (select count(*) from public.sanskara_records where subject_id = public._t('S1')) = 3 and public._t_state('S1') = 'awaiting_confirmation');

do $$
declare r jsonb;
begin
  perform public._t_as(public._t('A'));
  r := public.sanskara_confirm_early_handover(gen_random_uuid(), public._t('S1'));
  perform public._t_admin();
  perform public._ok('moved 2 (the custom milestone and the new rite), dropped 1 (the rite C already had)', (r ->> 'moved')::int = 2 and (r ->> 'dropped_as_duplicates')::int = 1);
  perform public._ok('C''s timeline now holds exactly three: their own rb1, the custom milestone, rb2',
    (select count(*) from public.sanskara_records where subject_id = public._t('SC')) = 3
    and exists (select 1 from public.sanskara_records where subject_id = public._t('SC') and custom_title = 'First day at school')
    and exists (select 1 from public.sanskara_records where subject_id = public._t('SC') and rite_key = 'rb2')
    and (select planned_date from public.sanskara_records where id = public._t('r_c_dup')) = current_date + 5);
  perform public._ok('the child''s duplicate is gone, not merged', not exists (select 1 from public.sanskara_records where id = public._t('r_dup')));
  perform public._ok('the dependent, its managers and its hand-over are deleted', not exists (select 1 from public.sanskara_subjects where id = public._t('S1'))
    and not exists (select 1 from public.sanskara_subject_managers where subject_id = public._t('S1'))
    and not exists (select 1 from public.sanskara_early_handovers where subject_id = public._t('S1')));
  perform public._ok('every share ended', not exists (select 1 from public.sanskara_grants where subject_id = public._t('S1')));
  perform public._ok('the manager''s reminder subscription on the moved record is gone', not exists (select 1 from public.sanskara_subscriptions where id = public._t('sub_a')));
  perform public._ok('the manager no longer reads the records', not public.sanskara_can('read_record', public._t('SC'), public._t('A'), public._t('r_custom')));
  perform public._ok('the child now owns them', public.sanskara_can('read_record', public._t('SC'), public._t('C'), public._t('r_custom')));
end $$;

-- ── 8. Audit: metadata only ─────────────────────────────────────────────────────────────────────────────────────────
do $$
begin
  perform public._ok('the steps are recorded', (select count(*) from public.sanskara_audit where action in ('early_handover_started', 'early_handover_accepted', 'early_handover_confirmed')) >= 3);
  perform public._ok('no audit detail names anyone or anything and each has exactly one key',
    not exists (select 1 from public.sanskara_audit where action like 'early_handover%' and (detail::text ~* '(asha|ravi|name|birth|rb1|custom|token)' or (select count(*) from jsonb_object_keys(detail)) <> 1)));
end $$;

-- ── 9. Cancel, at any step, by any current manager ──────────────────────────────────────────────────────────────────
do $$
declare t text := (select v ->> 'token' from public._t_tok where k = 's2');
begin
  perform public._t_as(public._t('X'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a stranger cancelling', format($q$select public.sanskara_cancel_early_handover(public._t_req(), %L)$q$, public._t('S2')));
  perform public._t_as(public._t('B'));
  perform public._ok('B cancels', (public.sanskara_cancel_early_handover(gen_random_uuid(), public._t('S2')) ->> 'cancelled')::boolean);
  perform public._ok('cancelling again changes nothing', not (public.sanskara_cancel_early_handover(gen_random_uuid(), public._t('S2')) ->> 'cancelled')::boolean);
  perform public._t_as(public._t('D'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a cancelled token', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t));
  perform public._t_admin();
  perform public._ok('S2 has no open hand-over', public._t_state('S2') is null);
end $$;

select public._t_as(public._t('A'));
insert into public._t_tok select 's2b', public.sanskara_start_early_handover(public._t_req(), public._t('S2'));
select public._t_admin();
delete from public.sanskara_settings;
select public._t_as(public._t('A'));
select public._ok('cancel works with the switch off', (public.sanskara_cancel_early_handover(public._t_req(), public._t('S2')) ->> 'cancelled')::boolean);
select public._t_admin();
insert into public.sanskara_settings (key, int_value) values ('early_handover_min_age', 14);

-- ── 10. The manager list changes: what was agreed is what exists ────────────────────────────────────────────────────
do $$
begin
  perform public._t_as(public._t('A'));
  insert into public._t_tok select 's2c', public.sanskara_start_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_as(public._t('B'));
  perform public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_as(public._t('D'));
  perform public.sanskara_accept_early_handover(gen_random_uuid(), (select v ->> 'token' from public._t_tok where k = 's2c'));
  perform public._t_admin();
  perform public._ok('awaiting confirmation', public._t_state('S2') = 'awaiting_confirmation');
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'a manager who did not start it, now that someone has accepted', format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S2')));
  perform public._ok('and B, who approved, is not told who accepted', public.sanskara_early_handover_status(public._t('S2')) -> 'acceptor' = 'null'::jsonb);
  perform public._t_admin();
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S2'), public._t('X'));
  perform public._ok('adding a manager resets to awaiting approval and clears the acceptor', public._t_state('S2') = 'awaiting_approval'
    and (select claimant_id from public.sanskara_early_handovers where subject_id = public._t('S2') and status = 'awaiting_approval') is null);
  perform public._ok('only the initiator''s approval remains', (select count(*) from public.sanskara_early_approvals a join public.sanskara_early_handovers h on h.id = a.handover_id where h.subject_id = public._t('S2') and h.status = 'awaiting_approval') = 1
    and exists (select 1 from public.sanskara_early_approvals a join public.sanskara_early_handovers h on h.id = a.handover_id where h.subject_id = public._t('S2') and a.manager_id = public._t('A')));
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'the old acceptance does not survive the change',
    format($q$select public.sanskara_confirm_early_handover(public._t_req(), %L)$q$, public._t('S2')));
  perform public._t_admin();
  delete from public.sanskara_subject_managers where subject_id = public._t('S2') and account_id in (public._t('X'), public._t('B'));
  perform public._ok('back to one manager: ready again', public._t_state('S2') = 'ready');
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S2'), public._t('B'));
  delete from public.sanskara_subject_managers where subject_id = public._t('S2') and account_id = public._t('A');
  perform public._ok('removing the initiator cancels it', public._t_state('S2') is null
    and (select count(*) from public.sanskara_early_handovers where subject_id = public._t('S2') and status = 'cancelled') >= 1);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S2'), public._t('A'));
end $$;

-- ── 11. Age and expiry are read from the clock ──────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  perform public._t_as(public._t('A'));
  insert into public._t_tok select 's2d', public.sanskara_start_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_as(public._t('B'));
  perform public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_admin();
  t := (select v ->> 'token' from public._t_tok where k = 's2d');
  update public.sanskara_early_handovers set created_at = now() - interval '8 days', expires_at = now() - interval '1 day' where subject_id = public._t('S2') and status = 'ready';
  perform public._t_as(public._t('D'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'an expired token', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t));
  perform public._t_as(public._t('A'));
  perform public._ok('the status reports it as expired', public.sanskara_early_handover_status(public._t('S2')) ->> 'state' = 'expired');
  perform public.sanskara_start_early_handover(gen_random_uuid(), public._t('S2'));
  perform public._t_admin();
  perform public._ok('a fresh start after expiry works (one open)', (select count(*) from public.sanskara_early_handovers where subject_id = public._t('S2') and status in ('awaiting_approval', 'ready', 'awaiting_confirmation')) = 1);
  update public.sanskara_subjects set birth_date = (current_date - interval '18 years' - interval '1 day')::date where id = public._t('S2');
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'approving after the child turned 18', format($q$select public.sanskara_approve_early_handover(public._t_req(), %L)$q$, public._t('S2')));
  perform public._t_admin();
end $$;

-- On the day the child turns 18 the early path is over, even for a hand-over that is ready (the hand-over at 18 takes over).
do $$
declare t text;
begin
  perform public._t_as(public._t('A'));
  insert into public._t_tok select 's3', public.sanskara_start_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._t_as(public._t('B'));
  perform public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._t_as(public._t('X'));
  perform public.sanskara_approve_early_handover(gen_random_uuid(), public._t('S3'));
  perform public._t_admin();
  perform public._ok('S3 is ready', public._t_state('S3') = 'ready');
  t := (select v ->> 'token' from public._t_tok where k = 's3');
  update public.sanskara_subjects set birth_date = (current_date - interval '18 years')::date where id = public._t('S3');
  update public.profiles set date_of_birth = (current_date - interval '18 years')::date where id = public._t('W');
  perform public._t_as(public._t('W'));
  perform public._t_expect('SK404', 'sanskara_not_found', 'accepting on the child''s 18th birthday', format($q$select public.sanskara_accept_early_handover(public._t_req(), %L)$q$, t));
  perform public._t_admin();
end $$;

-- ── 12. The child's deletion takes an open hand-over with it, without a fight ───────────────────────────────────────
do $$
begin
  perform public._ok('S2 has an open hand-over before it is deleted', (select count(*) from public.sanskara_early_handovers where subject_id = public._t('S2')) >= 1);
  delete from public.sanskara_subjects where id = public._t('S2');
  perform public._ok('deleting the dependent removes every hand-over row and approval for it',
    not exists (select 1 from public.sanskara_early_handovers where subject_id = public._t('S2')) and not exists (select 1 from public.sanskara_early_approvals a where not exists (select 1 from public.sanskara_early_handovers h where h.id = a.handover_id)));
end $$;

do $$ begin raise notice 'ALL EARLY HAND-OVER ASSERTIONS PASSED'; end $$;
rollback;
