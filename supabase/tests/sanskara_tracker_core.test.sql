-- Integration assertions for 20261029160100_sanskara_tracker_core.sql (Sanskara tracker M2).
-- Run against an isolated Supabase branch / scratch database after applying M1 and M2, as the migration owner (the role
-- that owns the functions; it must be able to SET ROLE authenticated). Everything is rolled back at the end.
--
-- Clients are exercised the way production exercises them: `set local role authenticated` plus the JWT subject claim, so
-- table privileges, forced RLS and function privileges are all in play. sanskara_can is called as the owner (clients
-- cannot call it).
begin;

-- ── Helpers (live only in this transaction) ─────────────────────────────────────────────────────────────────────────
-- A stable id for a name: public._t('A') is the same uuid everywhere in this file.
create function public._t(n text) returns uuid language sql immutable as $$ select md5('sanskara-test:' || n)::uuid $$;

-- Become a signed-in client / become the owner again.
create function public._t_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
  execute 'set local role authenticated';
end $$;
create function public._t_admin() returns void language plpgsql as $$
begin
  execute 'reset role';
end $$;

-- The statement must fail with exactly this SQLSTATE. Anything else, or success, fails the test.
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

-- sanskara_can must allow exactly the listed actions and refuse every other one.
create function public._t_matrix(p_label text, p_subject uuid, p_account uuid, p_record uuid, p_allowed text[]) returns void language plpgsql as $$
declare a text; got boolean; want boolean;
begin
  foreach a in array array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record', 'set_completion',
                           'manage_grants', 'manage_managers', 'start_claim', 'subscribe', 'receive_reminder', 'export', 'delete_subject'] loop
    got := public.sanskara_can(a, p_subject, p_account, p_record);
    want := a = any (p_allowed);
    if got is distinct from want then
      raise exception 'FAIL %: action % expected % got %', p_label, a, want, got using errcode = 'P0004';
    end if;
  end loop;
end $$;

grant execute on function public._t(text), public._t_as(uuid), public._t_admin(), public._t_expect(text, text, text) to authenticated, anon;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- Accounts: A, B parents (managers); C a Kul guardian with no relationship; D, H Kul members who may be viewers or new
-- managers; E in a different Kul; F without consent; G in the deletion cool-off.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting)
select public._t(n), public._t(k), c, g
from (values ('A', 'K1', true, false), ('B', 'K1', true, false), ('C', 'K1', true, false), ('D', 'K1', true, false),
             ('E', 'K2', true, false), ('F', 'K1', false, false), ('G', 'K1', true, true), ('H', 'K1', true, false)) v(n, k, c, g);
insert into public.kul_members (kul_id, user_id, role)
select public._t(k), public._t(n), r
from (values ('A', 'K1', 'guardian'), ('B', 'K1', 'sadhak'), ('C', 'K1', 'guardian'), ('D', 'K1', 'sadhak'),
             ('E', 'K2', 'guardian'), ('F', 'K1', 'sadhak'), ('G', 'K1', 'sadhak'), ('H', 'K1', 'sadhak')) v(n, k, r);

-- A small test catalogue (the migration ships only the technical 'custom' row).
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_b', 'B', false), ('rite_b2', 'B', false), ('rite_pre', 'A', true);

-- Subjects. S1 a minor with managers A and B. S2 turned 18 three months ago (A is a former manager). S3 turned 18 over a
-- year ago (the 12 months have passed). SA, SF, SG are account subjects.
insert into public.sanskara_subjects (id, kind, account_id) values
  (public._t('SA'), 'account', public._t('A')), (public._t('SF'), 'account', public._t('F')), (public._t('SG'), 'account', public._t('G'));
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', current_date - interval '5 years'),
  (public._t('S2'), 'dependent', 'Ravi', current_date - interval '18 years' - interval '3 months'),
  (public._t('S3'), 'dependent', 'Mira', current_date - interval '19 years' - interval '1 month');
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('A')), (public._t('S1'), public._t('B')), (public._t('S2'), public._t('A')), (public._t('S3'), public._t('A'));

insert into public.sanskara_records (id, subject_id, rite_key, custom_title, planned_date) values
  (public._t('ra_b'), public._t('SA'), 'rite_b', null, current_date + 30),
  (public._t('ra_pre'), public._t('SA'), 'rite_pre', null, null),
  (public._t('ra_c'), public._t('SA'), 'custom', 'Family gathering', null),
  (public._t('r1_b'), public._t('S1'), 'rite_b', null, current_date + 60),
  (public._t('r1_c'), public._t('S1'), 'custom', 'First haircut', null),
  (public._t('r2_b'), public._t('S2'), 'rite_b', null, null),
  (public._t('r3_b'), public._t('S3'), 'rite_b', null, null),
  (public._t('rf_b'), public._t('SF'), 'rite_b', null, null),
  (public._t('rg_b'), public._t('SG'), 'rite_b', null, null);

-- ── 1. Structure and privileges ─────────────────────────────────────────────────────────────────────────────────────
do $t$
declare t text; f text;
begin
  foreach t in array array['sanskara_rites', 'sanskara_subjects', 'sanskara_subject_managers', 'sanskara_records',
                           'sanskara_record_private', 'sanskara_grants', 'sanskara_audit', 'sanskara_request_log'] loop
    assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = ('public.' || t)::regclass), t || ': RLS must be enabled and forced';
    assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t), t || ': no policy may exist';
    assert not has_table_privilege('anon', 'public.' || t, 'select, insert, update, delete'), t || ': anon must have no rights';
    assert not has_table_privilege('authenticated', 'public.' || t, 'select'), t || ': authenticated must not read';
    assert not has_table_privilege('authenticated', 'public.' || t, 'insert'), t || ': authenticated must not insert';
    assert not has_table_privilege('authenticated', 'public.' || t, 'update'), t || ': authenticated must not update';
    assert not has_table_privilege('authenticated', 'public.' || t, 'delete'), t || ': authenticated must not delete';
    assert has_table_privilege('service_role', 'public.' || t, 'select, insert, update, delete'), t || ': service_role needs access';
  end loop;
  assert not has_sequence_privilege('authenticated', 'public.sanskara_audit_id_seq', 'usage'), 'the audit sequence must not be usable by clients';

  foreach f in array array[
    'public.sanskara_my_timeline()', 'public.sanskara_dependents()', 'public.sanskara_export_mine()',
    'public.sanskara_create_dependent(uuid, text, date)', 'public.sanskara_create_record(uuid, uuid, text, text, date)',
    'public.sanskara_update_record(uuid, uuid, text, date, integer)', 'public.sanskara_save_private(uuid, uuid, text, text, text, date, integer)',
    'public.sanskara_set_completion(uuid, uuid, date, integer)', 'public.sanskara_delete_record(uuid, uuid)',
    'public.sanskara_add_manager(uuid, uuid, uuid)', 'public.sanskara_remove_manager(uuid, uuid, uuid)',
    'public.sanskara_delete_dependent(uuid, uuid)', 'public.sanskara_delete_mine(uuid)'] loop
    assert has_function_privilege('authenticated', f, 'execute'), f || ': signed-in users must be able to call it';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not be able to call it';
  end loop;
  foreach f in array array[
    'public.sanskara_can(text, uuid, uuid, uuid)', 'public.sanskara_actor(boolean)', 'public.sanskara_claim_request(uuid, uuid, text)',
    'public.sanskara_finish_request(uuid, uuid, jsonb)', 'public.sanskara_records_json_unchecked(uuid, boolean)',
    'public.sanskara_managers_dependents_only()', 'public.sanskara_delete_orphan_dependent()',
    'public.sanskara_enforce_record_rules()', 'public.sanskara_enforce_private_rules()'] loop
    assert not has_function_privilege('authenticated', f, 'execute'), f || ': clients must not call internal functions';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not call internal functions';
  end loop;
  assert has_function_privilege('service_role', 'public.sanskara_can(text, uuid, uuid, uuid)', 'execute'), 'server code needs sanskara_can';

  -- Signed out (no subject claim): refused before anything is read. Signed in: the tables themselves are closed.
  perform public._t_as(null);
  perform public._t_expect('SK401', 'signed out', 'select public.sanskara_my_timeline()');
  perform public._t_expect('SK401', 'signed out create', $q$select public.sanskara_create_dependent(public._t('x'), 'Z', current_date - 10)$q$);
  perform public._t_as(public._t('A'));
  perform public._t_expect('42501', 'direct read of records', 'select * from public.sanskara_records');
  perform public._t_expect('42501', 'direct write of records', $q$update public.sanskara_records set version = 99$q$);
  perform public._t_expect('42501', 'direct read of grants', 'select * from public.sanskara_grants');
  perform public._t_expect('42501', 'direct read of private fields', 'select * from public.sanskara_record_private');
  perform public._t_expect('42501', 'internal function', $q$select public.sanskara_can('read_meta', public._t('SA'), public._t('A'))$q$);
  perform public._t_admin();
end
$t$;

-- ── 2. Table constraints ────────────────────────────────────────────────────────────────────────────────────────────
do $t$
begin
  -- subjects
  perform public._t_expect('23505', 'second account subject for one account', $q$insert into public.sanskara_subjects (kind, account_id) values ('account', public._t('A'))$q$);
  perform public._t_expect('23514', 'account subject without account', $q$insert into public.sanskara_subjects (kind) values ('account')$q$);
  perform public._t_expect('23514', 'account subject carrying a name', $q$insert into public.sanskara_subjects (kind, account_id, display_name) values ('account', public._t('B'), 'x')$q$);
  perform public._t_expect('23514', 'dependent without birth date', $q$insert into public.sanskara_subjects (kind, display_name) values ('dependent', 'Asha')$q$);
  perform public._t_expect('23514', 'dependent with an account', $q$insert into public.sanskara_subjects (kind, account_id, display_name, birth_date) values ('dependent', public._t('B'), 'Asha', current_date - 100)$q$);
  perform public._t_expect('23514', 'dependent born before 2000', $q$insert into public.sanskara_subjects (kind, display_name, birth_date) values ('dependent', 'Old', '1990-01-01')$q$);
  perform public._t_expect('23514', 'blank dependent name', $q$insert into public.sanskara_subjects (kind, display_name, birth_date) values ('dependent', '   ', current_date - 100)$q$);
  perform public._t_expect('23514', 'dependent name with a control character', $q$insert into public.sanskara_subjects (kind, display_name, birth_date) values ('dependent', E'a\nb', current_date - 100)$q$);
  perform public._t_expect('23514', 'frozen without a time', $q$insert into public.sanskara_subjects (kind, display_name, birth_date, state) values ('dependent', 'Z', current_date - 100, 'frozen')$q$);
  perform public._t_expect('23514', 'a time without frozen', $q$insert into public.sanskara_subjects (kind, display_name, birth_date, frozen_at) values ('dependent', 'Z', current_date - 100, now())$q$);

  -- managers
  perform public._t_expect('23514', 'a manager on an account subject', $q$insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('SA'), public._t('B'))$q$);
  perform public._t_expect('23505', 'the same manager twice', $q$insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('A'))$q$);

  -- rites
  perform public._t_expect('23514', 'a prenatal rite that is not Class A', $q$insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('bad_pre', 'B', true)$q$);
  perform public._t_expect('23514', 'the custom rite reclassified to B', $q$update public.sanskara_rites set sensitivity = 'B' where rite_key = 'custom'$q$);
  perform public._t_expect('23514', 'a malformed rite key', $q$insert into public.sanskara_rites (rite_key, sensitivity) values ('Bad Key', 'B')$q$);

  -- records
  perform public._t_expect('23505', 'the same rite twice for one person', $q$insert into public.sanskara_records (subject_id, rite_key) values (public._t('SA'), 'rite_b')$q$);
  perform public._t_expect('23514', 'a custom record without a title', $q$insert into public.sanskara_records (subject_id, rite_key) values (public._t('S1'), 'custom')$q$);
  perform public._t_expect('23514', 'a title on a catalogue rite', $q$insert into public.sanskara_records (subject_id, rite_key, custom_title) values (public._t('S1'), 'rite_b2', 'x')$q$);
  perform public._t_expect('23514', 'a title with a control character', $q$insert into public.sanskara_records (subject_id, rite_key, custom_title) values (public._t('S1'), 'custom', E'a\tb')$q$);
  perform public._t_expect('23503', 'a rite that is not in the catalogue', $q$insert into public.sanskara_records (subject_id, rite_key) values (public._t('S1'), 'not_a_rite')$q$);
  perform public._t_expect('23514', 'a planned date out of range', $q$insert into public.sanskara_records (subject_id, rite_key, planned_date) values (public._t('S1'), 'rite_b2', '1850-01-01')$q$);
  perform public._t_expect('23514', 'a prenatal record on a dependent', $q$insert into public.sanskara_records (subject_id, rite_key) values (public._t('S1'), 'rite_pre')$q$);
  perform public._t_expect('23514', 'moving a prenatal record to a dependent', $q$update public.sanskara_records set subject_id = public._t('S1') where id = public._t('ra_pre')$q$);
  perform public._t_expect('23503', 'deleting a rite that records use', $q$delete from public.sanskara_rites where rite_key = 'rite_b'$q$);
  -- The same rite for two different people is allowed (the old schema forbade it), and so are two custom milestones.
  insert into public.sanskara_records (subject_id, rite_key) values (public._t('S1'), 'rite_b2'), (public._t('SA'), 'rite_b2');
  insert into public.sanskara_records (subject_id, rite_key, custom_title) values (public._t('S1'), 'custom', 'Naming feast');
  assert (select count(*) from public.sanskara_records where rite_key = 'rite_b2') = 2, 'the same rite for two people must be allowed';
  assert (select count(*) from public.sanskara_records where subject_id = public._t('S1') and rite_key = 'custom') = 2, 'two custom milestones must be allowed';
  delete from public.sanskara_records where rite_key = 'rite_b2';
  delete from public.sanskara_records where subject_id = public._t('S1') and custom_title = 'Naming feast';

  -- private fields
  perform public._t_expect('23514', 'notes over 2000 characters', format($q$insert into public.sanskara_record_private (record_id, notes) values (public._t('ra_b'), %L)$q$, repeat('x', 2001)));
  perform public._t_expect('23514', 'an empty private block', $q$insert into public.sanskara_record_private (record_id) values (public._t('ra_b'))$q$);
  perform public._t_expect('23514', 'a due date on a record that is not prenatal', $q$insert into public.sanskara_record_private (record_id, expected_due_date) values (public._t('ra_b'), current_date + 90)$q$);
  perform public._t_expect('23514', 'a due date on a custom record', $q$insert into public.sanskara_record_private (record_id, expected_due_date) values (public._t('ra_c'), current_date + 90)$q$);
  insert into public.sanskara_record_private (record_id, expected_due_date) values (public._t('ra_pre'), current_date + 90);
  assert (select count(*) from public.sanskara_record_private) = 1, 'a due date on a prenatal record of an account holder is allowed';
  delete from public.sanskara_record_private;

  -- grants
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('g_probe'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b'));
  perform public._t_expect('23505', 'a second live grant of one record to one person', $q$insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b'))$q$);
  perform public._t_expect('23514', 'record scope without a record', $q$insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope) values (public._t('SA'), public._t('H'), public._t('A'), public._t('K1'), 'record')$q$);
  perform public._t_expect('23514', 'timeline scope with a record', $q$insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id) values (public._t('SA'), public._t('H'), public._t('A'), public._t('K1'), 'timeline', public._t('ra_b'))$q$);
  perform public._t_expect('23514', 'a grant to oneself', $q$insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope) values (public._t('SA'), public._t('A'), public._t('A'), public._t('K1'), 'timeline')$q$);
  perform public._t_expect('23514', 'an edit level', $q$insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, level) values (public._t('SA'), public._t('H'), public._t('A'), public._t('K1'), 'timeline', 'edit')$q$);
  update public.sanskara_grants set revoked_at = now() where id = public._t('g_probe');
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b'));
  assert (select count(*) from public.sanskara_grants where grantee_id = public._t('D') and record_id = public._t('ra_b')) = 2, 'a revoked grant must not block a new one';
  delete from public.sanskara_grants;

  -- audit and request log
  perform public._t_expect('23514', 'an unknown audit action', $q$insert into public.sanskara_audit (action) values ('looked_at_it')$q$);
  perform public._t_expect('23514', 'audit detail that is not an object', $q$insert into public.sanskara_audit (action, detail) values ('purged', '[1]'::jsonb)$q$);
  perform public._t_expect('23514', 'oversized audit detail', format($q$insert into public.sanskara_audit (action, detail) values ('purged', %L::jsonb)$q$, jsonb_build_object('x', repeat('y', 2000))::text));
  insert into public.sanskara_request_log (account_id, request_id, operation) values (public._t('A'), public._t('probe'), 'x');
  perform public._t_expect('23505', 'a request id used twice by one account', $q$insert into public.sanskara_request_log (account_id, request_id, operation) values (public._t('A'), public._t('probe'), 'x')$q$);
  delete from public.sanskara_request_log;
end
$t$;

-- ── 3. sanskara_can: roles and the action matrix ────────────────────────────────────────────────────────────────────
do $t$
declare
  owner_set text[] := array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record', 'set_completion', 'manage_grants',
                            'subscribe', 'receive_reminder', 'export', 'delete_subject'];
  manager_set text[] := owner_set || array['manage_managers'];
  former_set text[] := array['read_meta', 'read_record', 'read_private', 'start_claim', 'export'];
  leave_set text[] := array['export', 'delete_record', 'delete_subject'];
  r text;
begin
  -- The owner of an account subject.
  perform public._t_matrix('owner, subject level', public._t('SA'), public._t('A'), null, owner_set);
  foreach r in array array['ra_b', 'ra_pre', 'ra_c'] loop
    perform public._t_matrix('owner, record ' || r, public._t('SA'), public._t('A'), public._t(r), owner_set);
  end loop;

  -- A manager of a minor; both parents, equally.
  perform public._t_matrix('manager A, subject level', public._t('S1'), public._t('A'), null, manager_set);
  perform public._t_matrix('manager B, subject level', public._t('S1'), public._t('B'), null, manager_set);
  perform public._t_matrix('manager A, record', public._t('S1'), public._t('A'), public._t('r1_b'), manager_set);
  perform public._t_matrix('manager B, custom record', public._t('S1'), public._t('B'), public._t('r1_c'), manager_set);

  -- A former manager (inside the 12 months) can read and export, nothing else; after the 12 months, nothing at all.
  perform public._t_matrix('former manager, subject level', public._t('S2'), public._t('A'), null, former_set);
  perform public._t_matrix('former manager, record', public._t('S2'), public._t('A'), public._t('r2_b'), former_set);
  perform public._t_matrix('manager after the window', public._t('S3'), public._t('A'), null, array[]::text[]);
  perform public._t_matrix('manager after the window, record', public._t('S3'), public._t('A'), public._t('r3_b'), array[]::text[]);

  -- Everyone else gets nothing: not a Kul guardian, not a Kul member, not someone in another Kul.
  foreach r in array array['C', 'D', 'E', 'H', 'B'] loop
    perform public._t_matrix('stranger ' || r || ' on SA', public._t('SA'), public._t(r), null, array[]::text[]);
    perform public._t_matrix('stranger ' || r || ' on SA record', public._t('SA'), public._t(r), public._t('ra_b'), array[]::text[]);
  end loop;
  foreach r in array array['C', 'D', 'E', 'H'] loop
    perform public._t_matrix('stranger ' || r || ' on S1', public._t('S1'), public._t(r), public._t('r1_b'), array[]::text[]);
  end loop;
  perform public._t_matrix('B (a parent of S1) on SA', public._t('SA'), public._t('B'), public._t('ra_pre'), array[]::text[]);

  -- A record named with the wrong subject never matches.
  perform public._t_matrix('record of another subject (owner)', public._t('SA'), public._t('A'), public._t('r1_b'), array[]::text[]);
  perform public._t_matrix('record of another subject (manager)', public._t('S1'), public._t('A'), public._t('ra_b'), array[]::text[]);
  perform public._t_matrix('record that does not exist', public._t('SA'), public._t('A'), public._t('nothing'), array[]::text[]);

  -- Garbage in, false out; never an exception.
  assert public.sanskara_can(null, public._t('SA'), public._t('A')) is false, 'null action';
  assert public.sanskara_can('read_meta', null, public._t('A')) is false, 'null subject';
  assert public.sanskara_can('read_meta', public._t('SA'), null) is false, 'null account';
  assert public.sanskara_can('make_admin', public._t('SA'), public._t('A')) is false, 'unknown action';
  assert public.sanskara_can('read_meta', public._t('nothing'), public._t('A')) is false, 'unknown subject';
  assert public.sanskara_can('read_meta', public._t('SA'), public._t('nobody')) is false, 'unknown account';

  -- An account in its deletion cool-off does nothing, not even export or delete.
  perform public._t_matrix('deleting account', public._t('SG'), public._t('G'), public._t('rg_b'), array[]::text[]);
  -- Without consent to religious data: nothing but taking the data or erasing it.
  perform public._t_matrix('no consent, own subject', public._t('SF'), public._t('F'), null, leave_set);
  perform public._t_matrix('no consent, own record', public._t('SF'), public._t('F'), public._t('rf_b'), leave_set);

  -- Consent withdrawn mid-life (E8) has the same effect, and returns when consent returns.
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_matrix('owner after withdrawing consent', public._t('SA'), public._t('A'), public._t('ra_b'), leave_set);
  perform public._t_matrix('manager after withdrawing consent', public._t('S1'), public._t('A'), null, leave_set);
  perform public._t_matrix('former manager after withdrawing consent', public._t('S2'), public._t('A'), null, array['export']);
  perform public._t_matrix('the other parent still has full access', public._t('S1'), public._t('B'), null, manager_set);
  update public.profiles set consent_religious_data = true where id = public._t('A');
  perform public._t_matrix('owner after consent returns', public._t('SA'), public._t('A'), public._t('ra_b'), owner_set);

  -- A dependent needs one current manager's consent; with none, even a consenting manager of... themselves is the manager.
  update public.profiles set consent_religious_data = false where id = public._t('B');
  perform public._t_matrix('manager A when B withdraws', public._t('S1'), public._t('A'), null, manager_set);
  perform public._t_matrix('manager B without consent', public._t('S1'), public._t('B'), null, leave_set);
  update public.profiles set consent_religious_data = true where id = public._t('B');

  -- The 18th birthday and the 12-month window follow the dates themselves, with no job needed.
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' + interval '1 day' where id = public._t('S1');
  perform public._t_matrix('the day before the 18th birthday', public._t('S1'), public._t('A'), null, manager_set);
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' where id = public._t('S1');
  perform public._t_matrix('on the 18th birthday', public._t('S1'), public._t('A'), null, former_set);
  update public.sanskara_subjects set birth_date = current_date - interval '19 years' + interval '1 day' where id = public._t('S1');
  perform public._t_matrix('the last day of the window', public._t('S1'), public._t('A'), null, former_set);
  update public.sanskara_subjects set birth_date = current_date - interval '19 years' where id = public._t('S1');
  perform public._t_matrix('after the window', public._t('S1'), public._t('A'), null, array[]::text[]);
  update public.sanskara_subjects set birth_date = current_date - interval '5 years' where id = public._t('S1');
  perform public._t_matrix('a minor again', public._t('S1'), public._t('A'), null, manager_set);

  -- Removing a manager removes their access (E6).
  delete from public.sanskara_subject_managers where subject_id = public._t('S1') and account_id = public._t('B');
  perform public._t_matrix('removed manager', public._t('S1'), public._t('B'), public._t('r1_b'), array[]::text[]);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('B'));
end
$t$;

-- ── 4. sanskara_can: viewers ────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare
  viewer_b text[] := array['read_meta', 'read_record', 'subscribe', 'receive_reminder'];
  none text[] := array[]::text[];
begin
  -- A record grant: a Class B record gives dates and status, never private fields, never edits.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('g_b'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b'));
  perform public._t_matrix('viewer on the granted record', public._t('SA'), public._t('D'), public._t('ra_b'), viewer_b);
  perform public._t_matrix('viewer on another record of the same person', public._t('SA'), public._t('D'), public._t('ra_pre'), none);
  perform public._t_matrix('viewer on the custom record', public._t('SA'), public._t('D'), public._t('ra_c'), none);
  perform public._t_matrix('viewer with no record named', public._t('SA'), public._t('D'), null, none);
  perform public._t_matrix('viewer using the grant on another subject', public._t('S1'), public._t('D'), public._t('r1_b'), none);
  perform public._t_matrix('someone else in the Kul', public._t('SA'), public._t('H'), public._t('ra_b'), none);

  -- A Class A record shared by an explicit record grant shows its name and status only.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('g_pre'), public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_pre'));
  perform public._t_matrix('viewer on a Class A record', public._t('SA'), public._t('D'), public._t('ra_pre'), array['read_meta']);

  -- A timeline grant covers Class B records, present and future, and never Class A.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope)
  values (public._t('g_tl'), public._t('SA'), public._t('H'), public._t('A'), public._t('K1'), 'timeline');
  perform public._t_matrix('timeline viewer, Class B record', public._t('SA'), public._t('H'), public._t('ra_b'), viewer_b);
  perform public._t_matrix('timeline viewer, prenatal record', public._t('SA'), public._t('H'), public._t('ra_pre'), none);
  perform public._t_matrix('timeline viewer, custom record', public._t('SA'), public._t('H'), public._t('ra_c'), none);
  perform public._t_matrix('timeline viewer, no record named', public._t('SA'), public._t('H'), null, none);
  insert into public.sanskara_records (id, subject_id, rite_key) values (public._t('ra_new'), public._t('SA'), 'rite_b2');
  perform public._t_matrix('timeline viewer, a record made later', public._t('SA'), public._t('H'), public._t('ra_new'), viewer_b);
  delete from public.sanskara_records where id = public._t('ra_new');

  -- Revocation is immediate.
  update public.sanskara_grants set revoked_at = now() where id = public._t('g_b');
  perform public._t_matrix('revoked grant', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.sanskara_grants set revoked_at = null where id = public._t('g_b');
  perform public._t_matrix('grant restored', public._t('SA'), public._t('D'), public._t('ra_b'), viewer_b);

  -- The audience boundary is re-checked at every read (E2, E3): grantee and granter must both be in the grant's Kul in
  -- kul_members AND in profiles.kul_id. A disagreement denies.
  delete from public.kul_members where user_id = public._t('D');
  perform public._t_matrix('grantee left the Kul (kul_members)', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  insert into public.kul_members (kul_id, user_id) values (public._t('K1'), public._t('D'));
  update public.profiles set kul_id = null where id = public._t('D');
  perform public._t_matrix('grantee left the Kul (profiles)', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set kul_id = public._t('K1') where id = public._t('D');
  delete from public.kul_members where user_id = public._t('A');
  perform public._t_matrix('sharer left the Kul (kul_members)', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K1'), public._t('A'), 'guardian');
  update public.profiles set kul_id = public._t('K2') where id = public._t('A');
  perform public._t_matrix('sharer changed Kul (profiles)', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set kul_id = public._t('K1') where id = public._t('A');
  perform public._t_matrix('everything back in place', public._t('SA'), public._t('D'), public._t('ra_b'), viewer_b);
  -- A grant that names a Kul the grantee is not in.
  update public.sanskara_grants set kul_id = public._t('K2') where id = public._t('g_b');
  perform public._t_matrix('grant for a different Kul than the grantee is in', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.sanskara_grants set kul_id = public._t('K1') where id = public._t('g_b');

  -- The granter must still hold authority: a parent's share ends if they are removed (E6) or the child turns 18.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('g_s1'), public._t('S1'), public._t('D'), public._t('B'), public._t('K1'), 'record', public._t('r1_b'));
  perform public._t_matrix('shared by a manager', public._t('S1'), public._t('D'), public._t('r1_b'), viewer_b);
  delete from public.sanskara_subject_managers where subject_id = public._t('S1') and account_id = public._t('B');
  perform public._t_matrix('sharing manager was removed', public._t('S1'), public._t('D'), public._t('r1_b'), none);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('B'));
  perform public._t_matrix('sharing manager is back', public._t('S1'), public._t('D'), public._t('r1_b'), viewer_b);
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' where id = public._t('S1');
  perform public._t_matrix('the child turned 18', public._t('S1'), public._t('D'), public._t('r1_b'), none);
  update public.sanskara_subjects set birth_date = current_date - interval '5 years' where id = public._t('S1');
  perform public._t_matrix('a minor again', public._t('S1'), public._t('D'), public._t('r1_b'), viewer_b);
  -- A grant row written by someone with no authority over the subject is void.
  insert into public.sanskara_grants (id, subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('g_forged'), public._t('S1'), public._t('H'), public._t('C'), public._t('K1'), 'record', public._t('r1_b'));
  perform public._t_matrix('grant by someone who is not a manager', public._t('S1'), public._t('H'), public._t('r1_b'), none);
  delete from public.sanskara_grants where id = public._t('g_forged');
  delete from public.sanskara_grants where id = public._t('g_s1');

  -- Consent and deletion on either side.
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_matrix('the owner withdrew consent', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set consent_religious_data = true where id = public._t('A');
  update public.profiles set is_deleting = true where id = public._t('A');
  perform public._t_matrix('the owner is deleting their account', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set is_deleting = false where id = public._t('A');
  update public.profiles set consent_religious_data = false where id = public._t('D');
  perform public._t_matrix('the viewer has no consent', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set consent_religious_data = true where id = public._t('D');
  update public.profiles set is_deleting = true where id = public._t('D');
  perform public._t_matrix('the viewer is deleting their account', public._t('SA'), public._t('D'), public._t('ra_b'), none);
  update public.profiles set is_deleting = false where id = public._t('D');
  perform public._t_matrix('all restored', public._t('SA'), public._t('D'), public._t('ra_b'), viewer_b);

  delete from public.sanskara_grants;
end
$t$;

-- ── 5. Functions, as signed-in clients ──────────────────────────────────────────────────────────────────────────────
-- 5a. Reading, consent and the cool-off.
do $t$
declare v jsonb; w jsonb; n int;
begin
  -- A first call creates the person's own timeline; a second returns the same one.
  perform public._t_as(public._t('H'));
  v := public.sanskara_my_timeline();
  w := public.sanskara_my_timeline();
  perform public._t_admin();
  assert v->>'subject_id' = w->>'subject_id', 'the timeline must be created once';
  assert jsonb_array_length(v->'records') = 0, 'a new timeline is empty';
  assert (select count(*) from public.sanskara_subjects where kind = 'account' and account_id = public._t('H')) = 1, 'one account subject per account';

  -- The owner's timeline carries the private fields; nobody else's account sees it.
  insert into public.sanskara_record_private (record_id, notes, location) values (public._t('ra_c'), 'a private note', 'home');
  perform public._t_as(public._t('A'));
  v := public.sanskara_my_timeline();
  perform public._t_admin();
  assert jsonb_array_length(v->'records') = 3, 'the owner sees all three records';
  assert (select count(*) from jsonb_array_elements(v->'records') e where e->'private'->>'notes' = 'a private note') = 1, 'the owner sees their private fields';
  assert (select e->>'sensitivity' from jsonb_array_elements(v->'records') e where e->>'rite_key' = 'rite_pre') = 'A', 'the server reports the class';
  delete from public.sanskara_record_private;

  -- Consent: the tracker is closed until consent is given; the exits stay open.
  perform public._t_as(public._t('F'));
  perform public._t_expect('SK403', 'timeline without consent', 'select public.sanskara_my_timeline()');
  perform public._t_expect('SK403', 'dependents without consent', 'select public.sanskara_dependents()');
  perform public._t_expect('SK403', 'create dependent without consent', $q$select public.sanskara_create_dependent(public._t('f1'), 'Zed', current_date - 100)$q$);
  perform public._t_expect('SK403', 'create record without consent', $q$select public.sanskara_create_record(public._t('f2'), public._t('SF'), 'rite_b2', null, null)$q$);
  v := public.sanskara_export_mine();
  perform public._t_admin();
  assert jsonb_array_length(v->'subjects') = 1, 'export works without consent';
  assert (v->'subjects'->0->'records'->0->>'rite_key') = 'rite_b', 'the export carries the records';

  -- Cool-off: nothing, not even export.
  perform public._t_as(public._t('G'));
  perform public._t_expect('SK404', 'timeline while deleting', 'select public.sanskara_my_timeline()');
  perform public._t_expect('SK404', 'export while deleting', 'select public.sanskara_export_mine()');
  perform public._t_admin();
end
$t$;

-- 5b. Dependents, records, idempotency, validation.
do $t$
declare v jsonb; w jsonb;
begin
  perform public._t_as(public._t('A'));

  -- create_dependent: validation.
  perform public._t_expect('SK400', 'blank name', $q$select public.sanskara_create_dependent(public._t('d1'), '   ', current_date - 100)$q$);
  perform public._t_expect('SK400', 'long name', $q$select public.sanskara_create_dependent(public._t('d2'), repeat('x', 41), current_date - 100)$q$);
  perform public._t_expect('SK400', 'name with a line break', $q$select public.sanskara_create_dependent(public._t('d3'), E'a\nb', current_date - 100)$q$);
  perform public._t_expect('SK400', 'no birth date', $q$select public.sanskara_create_dependent(public._t('d4'), 'Kia', null)$q$);
  perform public._t_expect('SK400', 'a birth date in the future', $q$select public.sanskara_create_dependent(public._t('d5'), 'Kia', current_date + 1)$q$);
  perform public._t_expect('SK400', 'already 18', $q$select public.sanskara_create_dependent(public._t('d6'), 'Kia', (current_date - interval '18 years')::date)$q$);
  perform public._t_expect('SK400', 'born before 2000', $q$select public.sanskara_create_dependent(public._t('d7'), 'Kia', '1999-12-31')$q$);
  perform public._t_expect('SK400', 'no request id', $q$select public.sanskara_create_dependent(null, 'Kia', current_date - 100)$q$);
  perform public._t_admin();
  assert (select count(*) from public.sanskara_request_log) = 0, 'a refused request must leave no request-log row behind';

  -- create_dependent: the day before the 18th birthday is still a minor; a retry returns the first answer.
  perform public._t_as(public._t('A'));
  v := public.sanskara_create_dependent(public._t('d8'), '  Kia  ', (current_date - interval '18 years' + interval '1 day')::date);
  w := public.sanskara_create_dependent(public._t('d8'), '  Kia  ', (current_date - interval '18 years' + interval '1 day')::date);
  perform public._t_expect('SK409', 'the same request id for a different operation', $q$select public.sanskara_delete_record(public._t('d8'), public._t('r1_b'))$q$);
  perform public._t_admin();
  assert v->>'id' = w->>'id', 'a retry must return the same dependent';
  assert (w->>'replayed')::boolean is true, 'a retry must be marked replayed';
  assert (v ? 'replayed') is false, 'the first answer is not marked replayed';
  assert (select count(*) from public.sanskara_subjects where display_name = 'Kia') = 1, 'a retry must not create a second dependent';
  assert (select display_name from public.sanskara_subjects where id = (v->>'id')::uuid) = 'Kia', 'the name is trimmed';
  assert exists (select 1 from public.sanskara_subject_managers where subject_id = (v->>'id')::uuid and account_id = public._t('A')), 'the creator becomes the first manager';
  assert (select count(*) from public.sanskara_audit where action = 'dependent_created' and actor_id = public._t('A')) = 1, 'one audit row, none for the retry';
  assert (select detail from public.sanskara_audit where action = 'dependent_created' limit 1) = '{}'::jsonb, 'the audit row carries no content';
  delete from public.sanskara_subjects where display_name = 'Kia';

  -- create_dependent: a limit of ten per account.
  insert into public.sanskara_subjects (id, kind, display_name, birth_date)
  select public._t('fill' || i), 'dependent', 'Fill ' || i, current_date - 100 from generate_series(1, 6) i;
  insert into public.sanskara_subject_managers (subject_id, account_id) select public._t('fill' || i), public._t('A') from generate_series(1, 6) i;
  perform public._t_as(public._t('A'));   -- A already manages S1, S2, S3 and the six fillers: 9
  v := public.sanskara_create_dependent(public._t('d9'), 'Tenth', current_date - 100);
  perform public._t_expect('SK422', 'the eleventh dependent', $q$select public.sanskara_create_dependent(public._t('d10'), 'Eleventh', current_date - 100)$q$);
  perform public._t_admin();
  delete from public.sanskara_subjects where display_name like 'Fill %' or display_name = 'Tenth';

  -- create_record: who may, what is valid.
  perform public._t_as(public._t('A'));
  v := public.sanskara_create_record(public._t('c1'), public._t('S1'), 'rite_b2', null, current_date + 10);
  w := public.sanskara_create_record(public._t('c1'), public._t('S1'), 'rite_b2', null, current_date + 10);
  assert v->>'id' = w->>'id' and (w->>'replayed')::boolean, 'a retried create returns the first record';
  perform public._t_expect('SK409', 'the same rite again', $q$select public.sanskara_create_record(public._t('c2'), public._t('S1'), 'rite_b2', null, null)$q$);
  perform public._t_expect('SK400', 'unknown rite', $q$select public.sanskara_create_record(public._t('c3'), public._t('S1'), 'no_such_rite', null, null)$q$);
  perform public._t_expect('SK400', 'custom without a title', $q$select public.sanskara_create_record(public._t('c4'), public._t('S1'), 'custom', null, null)$q$);
  perform public._t_expect('SK400', 'custom with a blank title', $q$select public.sanskara_create_record(public._t('c5'), public._t('S1'), 'custom', '   ', null)$q$);
  perform public._t_expect('SK400', 'custom with a long title', $q$select public.sanskara_create_record(public._t('c6'), public._t('S1'), 'custom', repeat('x', 61), null)$q$);
  perform public._t_expect('SK400', 'custom with a control character', $q$select public.sanskara_create_record(public._t('c7'), public._t('S1'), 'custom', E'a\tb', null)$q$);
  perform public._t_expect('SK400', 'a title on a catalogue rite', $q$select public.sanskara_create_record(public._t('c8'), public._t('S1'), 'rite_b2', 'x', null)$q$);
  perform public._t_expect('SK400', 'a date out of range', $q$select public.sanskara_create_record(public._t('c9'), public._t('S1'), 'custom', 'Far off', '2300-01-01')$q$);
  perform public._t_expect('SK422', 'a prenatal record for a dependent', $q$select public.sanskara_create_record(public._t('c10'), public._t('S1'), 'rite_pre', null, null)$q$);
  perform public._t_expect('SK409', 'a prenatal record that already exists', $q$select public.sanskara_create_record(public._t('c11'), public._t('SA'), 'rite_pre', null, null)$q$);
  perform public._t_expect('SK404', 'a former manager writing', $q$select public.sanskara_create_record(public._t('c12'), public._t('S2'), 'rite_b2', null, null)$q$);
  perform public._t_expect('SK404', 'a manager after the window', $q$select public.sanskara_create_record(public._t('c13'), public._t('S3'), 'rite_b2', null, null)$q$);
  perform public._t_expect('SK404', 'a subject that does not exist', $q$select public.sanskara_create_record(public._t('c14'), public._t('nothing'), 'rite_b2', null, null)$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a Kul guardian with no relationship', $q$select public.sanskara_create_record(public._t('c15'), public._t('S1'), 'rite_b2', null, null)$q$);
  perform public._t_expect('SK404', 'a stranger on someone else''s timeline', $q$select public.sanskara_create_record(public._t('c16'), public._t('SA'), 'rite_b2', null, null)$q$);
  perform public._t_as(public._t('B'));
  v := public.sanskara_create_record(public._t('c17'), public._t('S1'), 'custom', 'Naming feast', null);
  perform public._t_admin();
  assert (select created_by from public.sanskara_records where id = (v->>'id')::uuid) = public._t('B'), 'the creator is the signed-in account';
  assert (select count(*) from public.sanskara_audit where action = 'record_created') = 2, 'one audit row per created record, none for the retry';
  assert not exists (select 1 from public.sanskara_audit where detail <> '{}'::jsonb), 'audit rows carry no content';
  delete from public.sanskara_records where subject_id = public._t('S1') and rite_key in ('rite_b2') or custom_title = 'Naming feast';

  -- create_record: a limit of one hundred records per person.
  insert into public.sanskara_records (subject_id, rite_key, custom_title)
  select public._t('S1'), 'custom', 'Filler ' || i from generate_series(1, 98) i;   -- S1 now holds 2 + 98 = 100
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK422', 'the 101st record', $q$select public.sanskara_create_record(public._t('c18'), public._t('S1'), 'rite_b2', null, null)$q$);
  perform public._t_admin();
  delete from public.sanskara_records where custom_title like 'Filler %';
end
$t$;

-- 5c. Updating, versions, private fields, completion, deleting.
do $t$
declare v jsonb; w jsonb; ver int;
begin
  perform public._t_as(public._t('A'));

  -- update_record: optimistic concurrency.
  v := public.sanskara_update_record(public._t('u1'), public._t('ra_b'), null, current_date + 45, 1);
  assert (v->>'version')::int = 2, 'an update raises the version';
  w := public.sanskara_update_record(public._t('u1'), public._t('ra_b'), null, current_date + 45, 1);
  assert (w->>'version')::int = 2 and (w->>'replayed')::boolean, 'a retried update returns the first answer and changes nothing more';
  perform public._t_expect('SK409', 'a stale version', $q$select public.sanskara_update_record(public._t('u2'), public._t('ra_b'), null, current_date + 50, 1)$q$);
  perform public._t_expect('SK400', 'a title on a catalogue rite', $q$select public.sanskara_update_record(public._t('u3'), public._t('ra_b'), 'x', null, 2)$q$);
  perform public._t_expect('SK400', 'a custom record without a title', $q$select public.sanskara_update_record(public._t('u4'), public._t('ra_c'), null, null, 1)$q$);
  perform public._t_expect('SK400', 'a date out of range', $q$select public.sanskara_update_record(public._t('u5'), public._t('ra_b'), null, '1800-01-01', 2)$q$);
  v := public.sanskara_update_record(public._t('u6'), public._t('ra_c'), '  Renamed  ', null, 1);
  perform public._t_admin();
  assert (select custom_title from public.sanskara_records where id = public._t('ra_c')) = 'Renamed', 'a custom title can change, trimmed';
  assert (select planned_date from public.sanskara_records where id = public._t('ra_b')) = current_date + 45, 'the date changed';
  assert (select version from public.sanskara_records where id = public._t('ra_b')) = 2, 'a refused update changes nothing';

  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger updating', $q$select public.sanskara_update_record(public._t('u7'), public._t('ra_b'), null, null, 2)$q$);
  perform public._t_expect('SK404', 'a stranger updating a record that does not exist', $q$select public.sanskara_update_record(public._t('u8'), public._t('nothing'), null, null, 1)$q$);
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager updating', $q$select public.sanskara_update_record(public._t('u9'), public._t('r2_b'), null, null, 1)$q$);
  perform public._t_admin();

  -- A viewer holding a grant cannot write.
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('ra_b'));
  perform public._t_as(public._t('D'));
  perform public._t_expect('SK404', 'a viewer updating', $q$select public.sanskara_update_record(public._t('u10'), public._t('ra_b'), null, null, 2)$q$);
  perform public._t_expect('SK404', 'a viewer saving private fields', $q$select public.sanskara_save_private(public._t('u11'), public._t('ra_b'), 'x', null, null, null, 0)$q$);
  perform public._t_expect('SK404', 'a viewer completing', $q$select public.sanskara_set_completion(public._t('u12'), public._t('ra_b'), current_date, 2)$q$);
  perform public._t_expect('SK404', 'a viewer deleting', $q$select public.sanskara_delete_record(public._t('u13'), public._t('ra_b'))$q$);
  perform public._t_admin();

  -- save_private: create, version, clear.
  perform public._t_as(public._t('A'));
  v := public.sanskara_save_private(public._t('p1'), public._t('ra_c'), '  first note  ', ' home ', null, null, 0);
  assert (v->>'private_version')::int = 1, 'a first save is version 1';
  perform public._t_expect('SK409', 'a stale private version', $q$select public.sanskara_save_private(public._t('p2'), public._t('ra_c'), 'other', null, null, null, 0)$q$);
  v := public.sanskara_save_private(public._t('p3'), public._t('ra_c'), E'line one\nline two', null, 'the priest', null, 1);
  assert (v->>'private_version')::int = 2, 'an edit raises the private version';
  perform public._t_admin();
  assert (select notes from public.sanskara_record_private where record_id = public._t('ra_c')) = E'line one\nline two', 'notes may span lines';
  perform public._t_as(public._t('A'));
  v := public.sanskara_save_private(public._t('p4'), public._t('ra_c'), '   ', '', null, null, 2);
  assert (v->>'private_version')::int = 0, 'saving nothing removes the block';
  perform public._t_admin();
  assert not exists (select 1 from public.sanskara_record_private where record_id = public._t('ra_c')), 'no empty block is kept';

  -- save_private: limits, the due date rule, who may.
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK400', 'notes too long', format($q$select public.sanskara_save_private(public._t('p5'), public._t('ra_c'), %L, null, null, null, 0)$q$, repeat('x', 2001)));
  perform public._t_expect('SK400', 'a control character in the notes', $q$select public.sanskara_save_private(public._t('p6'), public._t('ra_c'), E'a\x01b', null, null, null, 0)$q$);
  perform public._t_expect('SK400', 'a line break in the place', $q$select public.sanskara_save_private(public._t('p7'), public._t('ra_c'), null, E'a\nb', null, null, 0)$q$);
  perform public._t_expect('SK422', 'a due date on a record that is not prenatal', $q$select public.sanskara_save_private(public._t('p8'), public._t('ra_c'), 'x', null, null, current_date + 90, 0)$q$);
  perform public._t_expect('SK400', 'a due date out of range', $q$select public.sanskara_save_private(public._t('p9'), public._t('ra_pre'), null, null, null, '2300-01-01', 0)$q$);
  v := public.sanskara_save_private(public._t('p10'), public._t('ra_pre'), null, null, null, current_date + 120, 0);
  assert (v->>'private_version')::int = 1, 'a due date on a prenatal record of the account holder is allowed';
  v := public.sanskara_save_private(public._t('p11'), public._t('r1_c'), 'for the child', null, null, null, 0);
  perform public._t_as(public._t('B'));
  v := public.sanskara_save_private(public._t('p12'), public._t('r1_c'), 'both parents may edit', null, null, null, 1);
  assert (v->>'private_version')::int = 2, 'the other manager may edit';
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager saving', $q$select public.sanskara_save_private(public._t('p13'), public._t('r2_b'), 'x', null, null, null, 0)$q$);
  perform public._t_admin();
  delete from public.sanskara_record_private;

  -- set_completion.
  perform public._t_as(public._t('A'));
  v := public.sanskara_set_completion(public._t('s1'), public._t('ra_b'), current_date, 2);
  assert (v->>'version')::int = 3, 'completing raises the version';
  perform public._t_expect('SK409', 'completing with a stale version', $q$select public.sanskara_set_completion(public._t('s2'), public._t('ra_b'), current_date, 2)$q$);
  perform public._t_expect('SK400', 'completing in the future', $q$select public.sanskara_set_completion(public._t('s3'), public._t('ra_b'), current_date + 2, 3)$q$);
  perform public._t_expect('SK400', 'completing before 1900', $q$select public.sanskara_set_completion(public._t('s4'), public._t('ra_b'), '1800-01-01', 3)$q$);
  v := public.sanskara_set_completion(public._t('s5'), public._t('ra_b'), current_date + 1, 3);
  v := public.sanskara_set_completion(public._t('s6'), public._t('ra_b'), null, 4);
  perform public._t_admin();
  assert (select completed_date from public.sanskara_records where id = public._t('ra_b')) is null, 'a record can be reopened';
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager completing', $q$select public.sanskara_set_completion(public._t('s7'), public._t('r2_b'), current_date, 1)$q$);
  perform public._t_admin();

  -- delete_record: removes the private block and every grant of the record; never needs consent.
  insert into public.sanskara_record_private (record_id, notes) values (public._t('ra_b'), 'to be erased');
  perform public._t_as(public._t('A'));
  v := public.sanskara_delete_record(public._t('x1'), public._t('ra_b'));
  w := public.sanskara_delete_record(public._t('x1'), public._t('ra_b'));
  assert (w->>'replayed')::boolean and (w->>'deleted')::boolean, 'a retried delete returns the first answer';
  perform public._t_expect('SK404', 'deleting it again as a new request', $q$select public.sanskara_delete_record(public._t('x2'), public._t('ra_b'))$q$);
  perform public._t_admin();
  assert not exists (select 1 from public.sanskara_record_private where record_id = public._t('ra_b')), 'the private block goes with the record';
  assert not exists (select 1 from public.sanskara_grants where record_id = public._t('ra_b')), 'grants of the record go with it';
  assert (select count(*) from public.sanskara_audit where action = 'record_deleted') = 1, 'one audit row';

  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_as(public._t('A'));
  v := public.sanskara_delete_record(public._t('x3'), public._t('ra_c'));
  perform public._t_expect('SK404', 'a former manager deleting', $q$select public.sanskara_delete_record(public._t('x4'), public._t('r2_b'))$q$);
  perform public._t_admin();
  update public.profiles set consent_religious_data = true where id = public._t('A');
  assert not exists (select 1 from public.sanskara_records where id = public._t('ra_c')), 'consent withdrawn: erasing still works';
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger deleting', $q$select public.sanskara_delete_record(public._t('x5'), public._t('r1_b'))$q$);
  perform public._t_admin();
  delete from public.sanskara_grants;
end
$t$;

-- 5d. Managers.
do $t$
declare v jsonb; n int;
begin
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'adding a manager to an account timeline', $q$select public.sanskara_add_manager(public._t('m1'), public._t('SA'), public._t('H'))$q$);
  perform public._t_expect('SK404', 'a former manager adding', $q$select public.sanskara_add_manager(public._t('m2'), public._t('S2'), public._t('H'))$q$);
  perform public._t_expect('SK422', 'adding someone from another Kul', $q$select public.sanskara_add_manager(public._t('m3'), public._t('S1'), public._t('E'))$q$);
  perform public._t_expect('SK422', 'adding an account in its deletion cool-off', $q$select public.sanskara_add_manager(public._t('m4'), public._t('S1'), public._t('G'))$q$);
  perform public._t_expect('SK422', 'adding an account that does not exist', $q$select public.sanskara_add_manager(public._t('m5'), public._t('S1'), public._t('nobody'))$q$);
  perform public._t_expect('SK409', 'adding someone who already manages', $q$select public.sanskara_add_manager(public._t('m6'), public._t('S1'), public._t('B'))$q$);
  perform public._t_admin();
  -- A member whose profile points elsewhere is not in the Kul for this purpose.
  update public.profiles set kul_id = null where id = public._t('H');
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK422', 'adding a member whose profile disagrees', $q$select public.sanskara_add_manager(public._t('m7'), public._t('S1'), public._t('H'))$q$);
  perform public._t_admin();
  update public.profiles set kul_id = public._t('K1') where id = public._t('H');

  perform public._t_as(public._t('A'));
  v := public.sanskara_add_manager(public._t('m8'), public._t('S1'), public._t('H'));
  v := public.sanskara_add_manager(public._t('m8'), public._t('S1'), public._t('H'));
  assert (v->>'replayed')::boolean, 'a retried add is a replay';
  perform public._t_admin();
  assert (select count(*) from public.sanskara_subject_managers where subject_id = public._t('S1')) = 3, 'one added, once';
  assert (select count(*) from public.sanskara_audit where action = 'manager_added' and target_id = public._t('H')) = 1, 'one audit row';
  -- A fourth is allowed, a fifth is not.
  insert into auth.users (id) values (public._t('J')), (public._t('K'));
  insert into public.profiles (id, kul_id, consent_religious_data) values (public._t('J'), public._t('K1'), true), (public._t('K'), public._t('K1'), true);
  insert into public.kul_members (kul_id, user_id) values (public._t('K1'), public._t('J')), (public._t('K1'), public._t('K'));
  perform public._t_as(public._t('A'));
  v := public.sanskara_add_manager(public._t('m9'), public._t('S1'), public._t('J'));
  perform public._t_expect('SK422', 'a fifth manager', $q$select public.sanskara_add_manager(public._t('m10'), public._t('S1'), public._t('K'))$q$);

  -- The new manager has real access; a manager can remove another, or themselves, never the last.
  perform public._t_as(public._t('H'));
  v := public.sanskara_create_record(public._t('m11'), public._t('S1'), 'custom', 'By the new manager', null);
  perform public._t_as(public._t('A'));
  v := public.sanskara_remove_manager(public._t('m12'), public._t('S1'), public._t('J'));
  perform public._t_expect('SK404', 'removing someone who is not a manager', $q$select public.sanskara_remove_manager(public._t('m13'), public._t('S1'), public._t('J'))$q$);
  perform public._t_as(public._t('H'));
  v := public.sanskara_remove_manager(public._t('m14'), public._t('S1'), public._t('H'));
  perform public._t_expect('SK404', 'a removed manager is out', $q$select public.sanskara_create_record(public._t('m15'), public._t('S1'), 'custom', 'Still here?', null)$q$);
  perform public._t_as(public._t('A'));
  v := public.sanskara_remove_manager(public._t('m16'), public._t('S1'), public._t('B'));
  perform public._t_expect('SK422', 'removing the last manager', $q$select public.sanskara_remove_manager(public._t('m17'), public._t('S1'), public._t('A'))$q$);
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'a removed parent is out', $q$select public.sanskara_remove_manager(public._t('m18'), public._t('S1'), public._t('A'))$q$);
  perform public._t_admin();
  assert (select count(*) from public.sanskara_subject_managers where subject_id = public._t('S1')) = 1, 'the last manager stays';
  assert (select count(*) from public.sanskara_audit where action = 'manager_removed') = 3, 'one audit row per removal';
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('B'));
  delete from public.sanskara_records where custom_title in ('By the new manager');
  delete from public.sanskara_grants;
end
$t$;

-- 5e. Listing and export.
do $t$
declare v jsonb; n int;
begin
  perform public._t_as(public._t('A'));
  v := public.sanskara_dependents();
  assert jsonb_array_length(v) = 2, 'A sees S1 and the former dependent S2, not S3 (past the window)';
  assert (select (e->>'can_edit')::boolean from jsonb_array_elements(v) e where e->>'display_name' = 'Asha') is true, 'a manager can edit';
  assert (select (e->>'can_edit')::boolean from jsonb_array_elements(v) e where e->>'display_name' = 'Ravi') is false, 'a former manager cannot';
  assert (select (e->>'can_manage')::boolean from jsonb_array_elements(v) e where e->>'display_name' = 'Asha') is true, 'a manager can manage managers';
  assert (select jsonb_array_length(e->'records') from jsonb_array_elements(v) e where e->>'display_name' = 'Ravi') = 1, 'the former manager can read the records';
  perform public._t_as(public._t('C'));
  assert public.sanskara_dependents() = '[]'::jsonb, 'a stranger has no dependents';
  perform public._t_admin();

  -- Export: what the caller owns or may read, and nothing of other people.
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope) values (public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), 'timeline');
  insert into public.sanskara_record_private (record_id, notes) values (public._t('r1_c'), 'child note');
  perform public._t_as(public._t('A'));
  v := public.sanskara_export_mine();
  perform public._t_admin();
  assert jsonb_array_length(v->'subjects') = 3, 'the export holds SA, S1 and S2';
  assert not exists (select 1 from jsonb_array_elements(v->'subjects') e where e->>'display_name' = 'Mira'), 'a dependent past the window is not exported';
  assert (select e->>'role' from jsonb_array_elements(v->'subjects') e where e->>'display_name' = 'Ravi') = 'former_manager', 'the role is stated';
  assert (select e->>'role' from jsonb_array_elements(v->'subjects') e where e->>'kind' = 'account') = 'owner', 'the owner is the owner';
  assert position(public._t('D')::text in v::text) = 0, 'the export does not name the people a timeline is shared with';
  assert position(public._t('F')::text in v::text) = 0 and position('Fatima' in v::text) = 0, 'the export holds nothing of other people';
  assert (select jsonb_array_length(e->'grants') from jsonb_array_elements(v->'subjects') e where e->>'kind' = 'account') = 1, 'grants are counted by scope';
  assert exists (select 1 from jsonb_array_elements(v->'subjects') s, jsonb_array_elements(s->'records') r where r->'private'->>'notes' = 'child note'), 'the export carries private fields';

  -- Export works with consent withdrawn and is closed for an account in the cool-off.
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_as(public._t('A'));
  v := public.sanskara_export_mine();
  perform public._t_admin();
  assert jsonb_array_length(v->'subjects') = 3, 'export does not need consent';
  update public.profiles set consent_religious_data = true where id = public._t('A');
  delete from public.sanskara_record_private;
  delete from public.sanskara_grants;
end
$t$;

-- 5f. Erasure.
do $t$
declare v jsonb; w jsonb;
begin
  -- A manager erases a dependent; a former manager and a stranger cannot; neither can the account route.
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('S1'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('r1_b'));
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager erasing', $q$select public.sanskara_delete_dependent(public._t('e1'), public._t('S2'))$q$);
  perform public._t_expect('SK404', 'erasing an account timeline as a dependent', $q$select public.sanskara_delete_dependent(public._t('e2'), public._t('SA'))$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger erasing', $q$select public.sanskara_delete_dependent(public._t('e3'), public._t('S1'))$q$);
  perform public._t_as(public._t('B'));
  v := public.sanskara_delete_dependent(public._t('e4'), public._t('S1'));
  w := public.sanskara_delete_dependent(public._t('e4'), public._t('S1'));
  perform public._t_admin();
  assert (w->>'replayed')::boolean, 'a retried erase is a replay';
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S1')), 'the dependent is gone';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('S1')), 'its records are gone';
  assert not exists (select 1 from public.sanskara_subject_managers where subject_id = public._t('S1')), 'its managers are gone';
  assert not exists (select 1 from public.sanskara_grants where subject_id = public._t('S1')), 'its grants are gone';
  assert (select count(*) from public.sanskara_audit where action = 'dependent_deleted') = 1, 'one audit row';

  -- A person erases their own timeline, with consent withdrawn; dependents they manage are untouched.
  update public.profiles set consent_religious_data = false where id = public._t('A');
  perform public._t_as(public._t('A'));
  v := public.sanskara_delete_mine(public._t('e5'));
  w := public.sanskara_delete_mine(public._t('e6'));
  perform public._t_admin();
  update public.profiles set consent_religious_data = true where id = public._t('A');
  assert (v->>'deleted')::boolean is true and (w->>'deleted')::boolean is false, 'the first call erases, the second finds nothing';
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('SA')), 'the timeline is gone';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('SA')), 'its records are gone';
  assert exists (select 1 from public.sanskara_subjects where id = public._t('S2')), 'a dependent is untouched';
  assert (select count(*) from public.sanskara_audit where action = 'subject_deleted') = 1, 'one audit row, none for the empty call';

  perform public._t_as(public._t('G'));
  perform public._t_expect('SK404', 'erasing while in the cool-off', $q$select public.sanskara_delete_mine(public._t('e7'))$q$);
  perform public._t_admin();
end
$t$;

-- ── 6. Account deletion and orphaned dependents ─────────────────────────────────────────────────────────────────────
do $t$
begin
  -- A dependent whose last manager row disappears is deleted, never left exposed.
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values (public._t('S9'), 'dependent', 'Orphan', current_date - 100);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S9'), public._t('H'));
  insert into public.sanskara_records (subject_id, rite_key) values (public._t('S9'), 'rite_b2');
  delete from public.sanskara_subject_managers where subject_id = public._t('S9');
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S9')), 'a dependent with no manager is deleted';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('S9')), 'and so are its records';

  -- Deleting an account: their own timeline, their grants and their audit go; a dependent with another manager stays.
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values (public._t('S8'), 'dependent', 'Shared', current_date - 100);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S8'), public._t('H')), (public._t('S8'), public._t('D'));
  insert into public.sanskara_subjects (id, kind, display_name, birth_date) values (public._t('S7'), 'dependent', 'Only H', current_date - 100);
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S7'), public._t('H'));
  insert into public.sanskara_records (subject_id, rite_key) values (public._t('S8'), 'rite_b2'), (public._t('S7'), 'rite_b2');
  insert into public.sanskara_subjects (kind, account_id) values ('account', public._t('H')) on conflict do nothing;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (public._t('H'), 'record_created', public._t('S8'));
  insert into public.sanskara_request_log (account_id, request_id, operation) values (public._t('H'), public._t('last'), 'x');
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope) values (public._t('S8'), public._t('B'), public._t('H'), public._t('K1'), 'timeline');

  delete from auth.users where id = public._t('H');
  assert not exists (select 1 from public.sanskara_subjects where kind = 'account' and account_id = public._t('H')), 'their own timeline is deleted';
  assert exists (select 1 from public.sanskara_subjects where id = public._t('S8')), 'a dependent with another manager stays';
  assert (select count(*) from public.sanskara_subject_managers where subject_id = public._t('S8')) = 1, 'with that manager only';
  assert exists (select 1 from public.sanskara_records where subject_id = public._t('S8')), 'its records stay';
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S7')), 'a dependent with no one left is deleted';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('S7')), 'with its records';
  assert not exists (select 1 from public.sanskara_audit where actor_id = public._t('H')), 'their audit rows go with them';
  assert not exists (select 1 from public.sanskara_request_log where account_id = public._t('H')), 'their request log goes with them';
  assert not exists (select 1 from public.sanskara_grants where granted_by = public._t('H')), 'shares they made go with them';

  delete from auth.users where id = public._t('D');
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S8')), 'the last manager leaving deletes the dependent';
end
$t$;

rollback;
