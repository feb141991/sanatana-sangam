-- Integration assertions for 20261030100000_sanskara_kul_pointer.sql (Sanskara tracker M4a).
-- Run against an isolated Supabase branch / scratch database after applying M1 to M4 and M4a, as the migration owner (the
-- role that owns the functions; it must be able to SET ROLE authenticated). Everything is rolled back at the end.
--
-- This file proves the NON-DISCLOSURE properties of the display-only Kul pointer, not just that it works:
--   no authority flows from it; nothing maps a tree person to a subject; every refusal is identical; a manager who leaves
--   the Kul stops seeing it while a co-manager who stays keeps it; and the tree person changing underneath it changes
--   nothing for anyone's access.
begin;
-- The functions decide on the UTC date; the tests build dates with current_date, so both must mean the same day whatever hour this runs.
set local timezone to 'UTC';

-- ── Helpers (live only in this transaction; same as the M2 test) ────────────────────────────────────────────────────
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

-- A tiny helper this file adds: the message and SQLSTATE of a refused statement, so two refusals can be compared for sameness.
create function public._t_refusal(p_stmt text) returns text language plpgsql as $$
declare v_state text; v_msg text;
begin
  begin
    execute p_stmt;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    return v_state || ':' || v_msg;
  end;
  return 'ACCEPTED';
end $$;
grant execute on function public._t_refusal(text) to authenticated, anon;

-- ── Fixtures ──────────────────────────────────────────────────────────────────────────────────────────────────────────
-- Accounts: A and B are parents (A creates, B becomes a co-manager). C is a Kul guardian with no relationship to anyone.
-- D is a Kul member who is given a view of one record (a grantee). E is in another Kul. F has not consented. P is in no Kul.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E', 'F', 'P']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, username, full_name)
select public._t(n), case when k = '-' then null else public._t(k) end, c, false, 'user_' || lower(n), 'Name ' || n
from (values ('A', 'K1', true), ('B', 'K1', true), ('C', 'K1', true), ('D', 'K1', true),
             ('E', 'K2', true), ('F', 'K1', false), ('P', '-', true)) v(n, k, c);
insert into public.kul_members (kul_id, user_id, role)
select public._t(k), public._t(n), r
from (values ('A', 'K1', 'sadhak'), ('B', 'K1', 'sadhak'), ('C', 'K1', 'guardian'), ('D', 'K1', 'sadhak'),
             ('E', 'K2', 'guardian'), ('F', 'K1', 'sadhak')) v(n, k, r);

-- The family tree. T1, T5, T6 are ordinary living people of K1. T2 has their own account. T3 is in another Kul. T4 is deceased.
insert into public.kul_family_members (id, kul_id, name, linked_user_id, is_alive, death_date) values
  (public._t('T1'), public._t('K1'), 'Asha', null, true, null),
  (public._t('T2'), public._t('K1'), 'Has an account', public._t('C'), true, null),
  (public._t('T3'), public._t('K2'), 'Other Kul', null, true, null),
  (public._t('T4'), public._t('K1'), 'Deceased', null, false, current_date - 400),
  (public._t('T5'), public._t('K1'), 'Second child', null, true, null),
  (public._t('T6'), public._t('K1'), 'Third child', null, true, null);

insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_b', 'B', false);
insert into public.sanskara_subjects (id, kind, account_id) values (public._t('SA'), 'account', public._t('A'));
-- S0: an existing, unlinked dependent managed by A, with one shareable record.
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S0'), 'dependent', 'Existing child', (current_date - interval '4 years')::date),
  -- SX: turned 18 three months ago, so A is a FORMER manager (read-only window).
  (public._t('SX'), 'dependent', 'Grown child', current_date - interval '18 years' - interval '3 months');
insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S0'), public._t('A')), (public._t('SX'), public._t('A'));
insert into public.sanskara_records (id, subject_id, rite_key, planned_date) values (public._t('r0'), public._t('S0'), 'rite_b', current_date + 30);

-- ── 1. Structure and privileges ───────────────────────────────────────────────────────────────────────────────────────
do $t$
declare f text; names text[];
begin
  assert exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sanskara_subjects'
                 and column_name = 'kul_family_member_id' and is_nullable = 'YES'), 'the pointer column must exist and be nullable';
  assert (select confdeltype from pg_constraint where conrelid = 'public.sanskara_subjects'::regclass and confrelid = 'public.kul_family_members'::regclass) = 'n',
    'deleting a tree person must SET NULL, never block or cascade';
  assert not exists (
    select 1 from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
    where i.indrelid = 'public.sanskara_subjects'::regclass and a.attname = 'kul_family_member_id' and i.indisunique),
    'no unique index on the pointer: a uniqueness error would tell a second manager that someone already tracks this person';
  assert not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kul_family_members' and column_name ilike '%sanskar%'),
    'the family tree must carry no Sanskara column';

  -- The old three-argument form is gone; the new ones exist.
  assert to_regprocedure('public.sanskara_create_dependent(uuid, text, date)') is null, 'the three-argument create_dependent must be gone';
  foreach f in array array['public.sanskara_create_dependent(uuid, text, date, uuid)', 'public.sanskara_set_kul_link(uuid, uuid, uuid)'] loop
    assert has_function_privilege('authenticated', f, 'execute'), f || ': authenticated must be able to call it';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not';
    assert not has_function_privilege('service_role', f, 'execute'), f || ': service_role must not';
    assert not has_function_privilege('public', f, 'execute'), f || ': PUBLIC must not';
  end loop;
  foreach f in array array['public.sanskara_viewer_kul(uuid)', 'public.sanskara_resolve_tree_person(uuid, uuid)'] loop
    assert not has_function_privilege('authenticated', f, 'execute'), f || ': a client must not call a helper';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not call a helper';
    assert not has_function_privilege('service_role', f, 'execute'), f || ': service_role must not call a helper';
  end loop;

  -- Rule 1 (no authority): the stored column is read or written by exactly these three functions and no other, so
  -- sanskara_can, the grant functions, the claim functions and every list function are provably independent of it.
  -- The scan needs BOTH the table and the column name: the bare text 'kul_family_member' also appears in unrelated Kul
  -- functions (leave_kul and others) that legitimately use the family-tree table, which a real Supabase schema has and a
  -- bare Postgres does not. (sanskara_resolve_tree_person reads the tree table, never this column, so it is not listed.)
  select array_agg(p.proname order by p.proname) into names
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosrc ilike '%sanskara_subjects%' and p.prosrc ilike '%kul_family_member_id%';
  assert names = array['sanskara_create_dependent', 'sanskara_dependents', 'sanskara_set_kul_link'],
    'only create_dependent, dependents and set_kul_link may touch the stored pointer; found ' || coalesce(names::text, 'none');
  assert position('kul_family_member' in pg_get_functiondef('public.sanskara_can(text, uuid, uuid, uuid)'::regprocedure)) = 0,
    'sanskara_can must not read the pointer';

  -- Rule 2 (nothing maps a tree person to a subject): the only client functions that accept a tree person are these two,
  -- and both also require a subject the caller manages (set) or create one (create). None returns subject data for a tree id.
  select array_agg(p.proname order by p.proname) into names
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname like 'sanskara\_%' and 'p_kul_family_member' = any (p.proargnames);
  assert names = array['sanskara_create_dependent', 'sanskara_set_kul_link'], 'only create_dependent and set_kul_link may take a tree person; found ' || coalesce(names::text, 'none');
end
$t$;

do $t$
begin
  perform public._t_as(public._t('A'));
  perform public._t_expect('42501', 'a client cannot read subjects', 'select kul_family_member_id from public.sanskara_subjects');
  perform public._t_expect('42501', 'a client cannot write the pointer', format('update public.sanskara_subjects set kul_family_member_id = %L', public._t('T1')));
  perform public._t_expect('42501', 'a client cannot call a helper', format('select public.sanskara_resolve_tree_person(%L, %L)', public._t('A'), public._t('T1')));
  perform public._t_admin();
  -- An account subject can never carry a pointer.
  perform public._t_expect('23514', 'account subject with a pointer',
    format('update public.sanskara_subjects set kul_family_member_id = %L where id = %L', public._t('T1'), public._t('SA')));
end
$t$;

-- ── 2. Creating with a pointer ────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare
  r jsonb; r2 jsonb; v_subject uuid; v_n int; elem jsonb;
begin
  perform public._t_as(public._t('A'));
  r := public.sanskara_create_dependent(public._t('c1'), 'Asha', (current_date - interval '3 years')::date, public._t('T1'));
  v_subject := (r->>'id')::uuid;
  assert v_subject is not null, 'creating with a valid tree person returns the new id';

  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_subject;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T1'), 'the manager sees the pointer on the dependent they created';

  -- A retry returns the first response and creates nothing new.
  r2 := public.sanskara_create_dependent(public._t('c1'), 'Asha', (current_date - interval '3 years')::date, public._t('T1'));
  assert (r2->>'replayed')::boolean and (r2->>'id')::uuid = v_subject, 'a retry returns the stored response';
  perform public._t_admin();
  select count(*) into v_n from public.sanskara_subjects where display_name = 'Asha';
  assert v_n = 1, 'a retry must not create a second dependent';

  -- The existing call shapes still work and carry no pointer.
  perform public._t_as(public._t('A'));
  r := public.sanskara_create_dependent(public._t('c2'), 'No link', (current_date - interval '2 years')::date);
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = (r->>'id')::uuid;
  assert elem ? 'kul_family_member_id' and elem->'kul_family_member_id' = 'null'::jsonb, 'an unlinked dependent reports a null pointer';
  r := public.sanskara_create_dependent(public._t('c3'), 'Explicit null', (current_date - interval '2 years')::date, null);
  assert (r->>'id') is not null, 'an explicit null pointer is the same as none';
  perform public._t_admin();
end
$t$;

-- Rule 4: every refusal is the same, whatever the reason.
do $t$
declare
  v_bad text[]; v_one text; v_n int; v_before int; v_after int;
begin
  select count(*) into v_before from public.sanskara_subjects where kind = 'dependent';
  perform public._t_as(public._t('A'));
  v_bad := array[
    public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x1'), 'Nope', gen_random_uuid())),   -- does not exist
    public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x2'), 'Nope', public._t('T3'))),      -- another Kul
    public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x3'), 'Nope', public._t('T2'))),      -- has an account
    public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x4'), 'Nope', public._t('T4')))       -- deceased
  ];
  select count(distinct x) into v_n from unnest(v_bad) x;
  assert v_n = 1, 'a missing, foreign-Kul, accounted and deceased tree person must be refused identically; got ' || v_bad::text;
  assert v_bad[1] = 'SK404:sanskara_not_found', 'the refusal is SK404 sanskara_not_found; got ' || v_bad[1];

  -- A caller who is in no Kul cannot link even a real, valid tree person of someone else's Kul: the same refusal again.
  perform public._t_as(public._t('P'));
  v_one := public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x5'), 'Nope', public._t('T1')));
  assert v_one = v_bad[1], 'a caller in no Kul gets the same refusal; got ' || v_one;

  -- The pointer is checked AFTER the name and date, so which error comes first reveals nothing about the tree person.
  perform public._t_as(public._t('A'));
  v_one := public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900, %L)', public._t('x6'), '', gen_random_uuid()));
  assert v_one = 'SK400:sanskara_invalid_name', 'a bad name is reported before a bad pointer; got ' || v_one;
  perform public._t_admin();

  select count(*) into v_after from public.sanskara_subjects where kind = 'dependent';
  assert v_after = v_before, 'a refused create must leave no subject behind';
  assert not exists (select 1 from public.sanskara_request_log where request_id in (public._t('x1'), public._t('x2'), public._t('x3'), public._t('x4'))),
    'a refused create must not leave a request-log row';
end
$t$;

-- ── 3. Who sees the pointer ───────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare
  v_s uuid; r jsonb; txt text; elem jsonb;
begin
  -- A links S0 to T1 (a second dependent now also points at T1: no uniqueness, by design).
  perform public._t_as(public._t('A'));
  r := public.sanskara_set_kul_link(public._t('l1'), public._t('S0'), public._t('T1'));
  assert (r->>'linked')::boolean, 'linking returns linked = true';
  -- A co-manager is added; D is given a view of the one record.
  perform public.sanskara_add_manager(public._t('m1'), public._t('S0'), public._t('B'));
  perform public.sanskara_grant_view(public._t('g1'), public._t('S0'), public._t('r0'), public._t('D'));

  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = public._t('S0');
  assert (elem->>'kul_family_member_id')::uuid = public._t('T1'), 'the creating manager sees the pointer';
  txt := public.sanskara_export_mine()::text;
  assert position(public._t('T1')::text in txt) = 0, 'the export must not carry the pointer';

  perform public._t_as(public._t('B'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = public._t('S0');
  assert (elem->>'kul_family_member_id')::uuid = public._t('T1'), 'a co-manager in the same Kul sees the pointer';

  -- D can see the shared record but nothing about the tree link, and has no function that returns it.
  perform public._t_as(public._t('D'));
  txt := public.sanskara_shared_with_me()::text;
  assert position('r0' in txt) >= 0 and position(public._t('T1')::text in txt) = 0 and position('kul_family_member' in txt) = 0,
    'a grantee must not see the pointer in what is shared with them';
  assert public.sanskara_dependents() = '[]'::jsonb, 'a grantee manages nothing, so dependents() is empty for them';

  -- C (a Kul guardian, no relationship), E (another Kul) and F (no consent) get nothing and can change nothing.
  perform public._t_as(public._t('C'));
  assert public.sanskara_dependents() = '[]'::jsonb, 'a Kul guardian sees no dependents by role';
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('l2'), public._t('S0'), public._t('T5'))) = 'SK404:sanskara_not_found',
    'an unrelated Kul member cannot link someone else''s dependent, and is told only "not found"';
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, null)', public._t('l3'), public._t('S0'))) = 'SK404:sanskara_not_found',
    'an unrelated Kul member cannot unlink either';
  perform public._t_as(public._t('E'));
  assert public.sanskara_dependents() = '[]'::jsonb, 'a member of another Kul sees nothing';
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('l4'), public._t('S0'), public._t('T3'))) = 'SK404:sanskara_not_found',
    'a member of another Kul cannot link, even to their own Kul''s tree person';
  perform public._t_as(public._t('F'));
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, null)', public._t('l5'), public._t('S0'))) like 'SK403:%', 'an account without consent is refused with the consent error';
  perform public._t_admin();
end
$t$;

-- ── 4. set_kul_link: link, re-link, unlink, retries, who may ───────────────────────────────────────────────────────────
do $t$
declare r jsonb; r2 jsonb; v_n int; elem jsonb; v_audit jsonb;
begin
  perform public._t_as(public._t('A'));
  r := public.sanskara_set_kul_link(public._t('l6'), public._t('S0'), public._t('T5'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = public._t('S0');
  assert (elem->>'kul_family_member_id')::uuid = public._t('T5'), 're-linking replaces the pointer';

  r2 := public.sanskara_set_kul_link(public._t('l6'), public._t('S0'), public._t('T5'));
  assert (r2->>'replayed')::boolean, 'a retried link returns the stored response';

  r := public.sanskara_set_kul_link(public._t('l7'), public._t('S0'), null);
  assert not (r->>'linked')::boolean, 'unlinking returns linked = false';
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = public._t('S0');
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'after unlinking the pointer reads null';

  -- The request log keys on (account, request id) and the operation name: the same operation replays, a different one conflicts.
  assert public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 900)', public._t('l6'), 'Reused id')) like 'SK409:%',
    'a request id already used for a different operation is a conflict';

  -- Account subjects and unknown subjects are refused exactly like "not yours".
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('l8'), public._t('SA'), public._t('T1'))) = 'SK404:sanskara_not_found',
    'a person''s own account subject cannot be linked';
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('l9'), gen_random_uuid(), public._t('T1'))) = 'SK404:sanskara_not_found',
    'an unknown subject is refused the same way';
  -- A FORMER manager (the child turned 18) may not change it.
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('l10'), public._t('SX'), public._t('T1'))) = 'SK404:sanskara_not_found',
    'a former manager is read-only';
  perform public._t_admin();

  -- Audit: one row per change, recording nothing about the tree person.
  select count(*) into v_n from public.sanskara_audit where action = 'kul_link_set';
  assert v_n = 2, 'two links were set (the first, then the re-link); the retry added none; got ' || v_n;
  select count(*) into v_n from public.sanskara_audit where action = 'kul_link_cleared';
  assert v_n = 1, 'one unlink recorded';
  assert not exists (select 1 from public.sanskara_audit where action like 'kul_link%' and detail <> '{}'::jsonb and detail::text ilike '%' || public._t('T1')::text || '%'),
    'the audit trail must not name the tree person';

  -- No uniqueness: a second manager links their own new dependent to the same tree person without any signal.
  perform public._t_as(public._t('B'));
  r := public.sanskara_create_dependent(public._t('b1'), 'B''s child', (current_date - interval '1 year')::date, public._t('T1'));
  assert (r->>'id') is not null, 'a second manager may point a different dependent at the same tree person, with no error';
  perform public._t_admin();
end
$t$;

-- ── 5. The viewer leaves the Kul (the regression the review asked for) ──────────────────────────────────────────────────
do $t$
declare
  r jsonb; v_s uuid; elem jsonb;
begin
  -- Fresh dependent managed by A and co-managed by B, linked to T6.
  perform public._t_as(public._t('A'));
  r := public.sanskara_create_dependent(public._t('k1'), 'Kul test child', (current_date - interval '6 years')::date, public._t('T6'));
  v_s := (r->>'id')::uuid;
  perform public.sanskara_add_manager(public._t('k2'), v_s, public._t('B'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T6'), 'precondition: A sees the pointer';
  perform public._t_admin();

  -- A leaves K1 (what leave_kul does: the membership row goes and profiles.kul_id is cleared).
  delete from public.kul_members where kul_id = public._t('K1') and user_id = public._t('A');
  update public.profiles set kul_id = null where id = public._t('A');

  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem is not null, 'A is still a manager of their child after leaving the Kul';
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'A no longer sees the pointer once outside the Kul';
  assert public._t_refusal(format('select public.sanskara_set_kul_link(%L, %L, %L)', public._t('k3'), v_s, public._t('T1'))) = 'SK404:sanskara_not_found',
    'A cannot link while outside the Kul';
  assert public._t_refusal(format('select public.sanskara_create_dependent(%L, %L, current_date - 500, %L)', public._t('k4'), 'x', public._t('T1'))) = 'SK404:sanskara_not_found',
    'A cannot create a linked dependent while outside the Kul';

  -- B, still in K1, keeps the pointer and can still change it.
  perform public._t_as(public._t('B'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T6'), 'the co-manager who stayed still sees the pointer';
  r := public.sanskara_set_kul_link(public._t('k5'), v_s, public._t('T5'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T5'), 'the co-manager who stayed can re-link';
  perform public._t_admin();

  -- A joins a DIFFERENT Kul: the pointer stays hidden (T5 belongs to K1).
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K2'), public._t('A'), 'sadhak');
  update public.profiles set kul_id = public._t('K2') where id = public._t('A');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'a manager in a different Kul does not see a pointer into the first Kul''s tree';
  perform public._t_admin();

  -- A returns to K1: the pointer is visible again (it was only ever hidden, never lost). This is the documented behaviour.
  delete from public.kul_members where kul_id = public._t('K2') and user_id = public._t('A');
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K1'), public._t('A'), 'sadhak');
  update public.profiles set kul_id = public._t('K1') where id = public._t('A');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T5'), 'back in the Kul, the manager sees the pointer again';
  perform public._t_admin();

  -- membership of record: profiles says K1 but kul_members has no row, and the reverse. Either disagreement hides it.
  delete from public.kul_members where kul_id = public._t('K1') and user_id = public._t('A');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'profiles.kul_id without a kul_members row is no membership';
  perform public._t_admin();
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K1'), public._t('A'), 'sadhak');
  update public.profiles set kul_id = null where id = public._t('A');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'a kul_members row without profiles.kul_id is no membership';
  perform public._t_admin();
  update public.profiles set kul_id = public._t('K1') where id = public._t('A');
end
$t$;

-- ── 6. The tree person changes underneath the pointer ─────────────────────────────────────────────────────────────────
do $t$
declare
  v_s uuid; r jsonb; elem jsonb;
begin
  perform public._t_as(public._t('A'));
  r := public.sanskara_create_dependent(public._t('t1'), 'Tree test child', (current_date - interval '7 years')::date, public._t('T1'));
  v_s := (r->>'id')::uuid;
  perform public._t_admin();

  -- Gains an account: the person is now their own subject, so the pointer is hidden, then shown again when the link ends.
  update public.kul_family_members set linked_user_id = public._t('D') where id = public._t('T1');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'a tree person who gains an account is hidden';
  perform public._t_admin();
  update public.kul_family_members set linked_user_id = null where id = public._t('T1');

  -- Marked deceased.
  update public.kul_family_members set is_alive = false, death_date = current_date where id = public._t('T1');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'a deceased tree person is hidden';
  perform public._t_admin();
  update public.kul_family_members set is_alive = true, death_date = null where id = public._t('T1');

  -- Moved to another Kul.
  update public.kul_family_members set kul_id = public._t('K2') where id = public._t('T1');
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem->'kul_family_member_id' = 'null'::jsonb, 'a tree person who is no longer in the viewer''s Kul is hidden';
  perform public._t_admin();
  update public.kul_family_members set kul_id = public._t('K1') where id = public._t('T1');

  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert (elem->>'kul_family_member_id')::uuid = public._t('T1'), 'restored, it shows again';
  perform public._t_admin();

  -- Deleted outright: the subject, its managers and their access are untouched, and no error reaches the tree.
  delete from public.kul_family_members where id = public._t('T1');
  assert (select kul_family_member_id from public.sanskara_subjects where id = v_s) is null, 'deleting the tree person clears the stored pointer';
  perform public._t_as(public._t('A'));
  select e into elem from jsonb_array_elements(public.sanskara_dependents()) e where (e->>'id')::uuid = v_s;
  assert elem is not null and (elem->>'can_edit')::boolean, 'the manager keeps full access to their dependent';
  perform public._t_admin();
end
$t$;

rollback;
