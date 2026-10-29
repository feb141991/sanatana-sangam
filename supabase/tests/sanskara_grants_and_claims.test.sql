-- Integration assertions for 20261029160200_sanskara_grants_and_claims.sql (Sanskara tracker M3).
-- Run against an isolated Supabase branch / scratch database after applying M1, M2 and M3, as the migration owner (the role
-- that owns the functions; it must be able to SET ROLE authenticated). Everything is rolled back at the end.
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

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- A and B are parents of the minor S1; A is also the former manager of S2 (turned 18 three months ago) and S3 (past the
-- window). C is a Kul guardian with no relationship; D and H may be viewers; E is in another Kul; F has no consent; G is in
-- the deletion cool-off; N is the new adult (in no Kul); P is another account.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'N', 'P']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, username, full_name)
select public._t(n), case when k = '-' then null else public._t(k) end, c, g, 'user_' || lower(n), 'Name ' || n
from (values ('A', 'K1', true, false), ('B', 'K1', true, false), ('C', 'K1', true, false), ('D', 'K1', true, false),
             ('E', 'K2', true, false), ('F', 'K1', false, false), ('G', 'K1', true, true), ('H', 'K1', true, false),
             ('N', '-', true, false), ('P', '-', true, false)) v(n, k, c, g);
insert into public.kul_members (kul_id, user_id, role)
select public._t(k), public._t(n), r
from (values ('A', 'K1', 'guardian'), ('B', 'K1', 'sadhak'), ('C', 'K1', 'guardian'), ('D', 'K1', 'sadhak'),
             ('E', 'K2', 'guardian'), ('F', 'K1', 'sadhak'), ('G', 'K1', 'sadhak'), ('H', 'K1', 'sadhak')) v(n, k, r);

insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_b', 'B', false), ('rite_b2', 'B', false), ('rite_b3', 'B', false), ('rite_pre', 'A', true);

insert into public.sanskara_subjects (id, kind, account_id) values
  (public._t('SA'), 'account', public._t('A')), (public._t('SN'), 'account', public._t('N')), (public._t('SP'), 'account', public._t('P'));
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', current_date - interval '5 years'),
  (public._t('S2'), 'dependent', 'Ravi', current_date - interval '18 years' - interval '3 months'),
  (public._t('S3'), 'dependent', 'Mira', current_date - interval '19 years' - interval '1 month');
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('A')), (public._t('S1'), public._t('B')), (public._t('S2'), public._t('A')), (public._t('S3'), public._t('A'));

insert into public.sanskara_records (id, subject_id, rite_key, custom_title, planned_date, completed_date) values
  (public._t('ra_b'), public._t('SA'), 'rite_b', null, current_date + 30, null),
  (public._t('ra_done'), public._t('SA'), 'rite_b3', null, current_date - 100, current_date - 90),
  (public._t('ra_pre'), public._t('SA'), 'rite_pre', null, current_date + 200, null),
  (public._t('ra_c'), public._t('SA'), 'custom', 'Family gathering', current_date + 10, null),
  (public._t('r1_b'), public._t('S1'), 'rite_b', null, current_date + 60, null),
  (public._t('r1_c'), public._t('S1'), 'custom', 'First haircut', null, null),
  (public._t('r2_b'), public._t('S2'), 'rite_b', null, null, null),
  (public._t('r2_b2'), public._t('S2'), 'rite_b2', null, current_date + 5, null),
  (public._t('r2_c'), public._t('S2'), 'custom', 'Graduation', null, null),
  (public._t('r3_b'), public._t('S3'), 'rite_b', null, null, null),
  (public._t('rn_b'), public._t('SN'), 'rite_b', null, current_date + 1, null);
insert into public.sanskara_record_private (record_id, notes) values (public._t('r2_c'), 'a private note about the graduation'), (public._t('ra_c'), 'private');

-- ── 1. Structure and privileges ─────────────────────────────────────────────────────────────────────────────────────
do $t$
declare f text;
begin
  assert (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.sanskara_claims'::regclass), 'claims: RLS must be enabled and forced';
  assert not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sanskara_claims'), 'claims: no policy may exist';
  assert not has_table_privilege('anon', 'public.sanskara_claims', 'select, insert, update, delete'), 'claims: anon must have no rights';
  assert not has_table_privilege('authenticated', 'public.sanskara_claims', 'select, insert, update, delete'), 'claims: authenticated must have no rights';
  assert has_table_privilege('service_role', 'public.sanskara_claims', 'select, insert, update, delete'), 'claims: service_role needs access';
  foreach f in array array[
    'public.sanskara_grant_view(uuid, uuid, uuid, uuid)', 'public.sanskara_revoke_grant(uuid, uuid)', 'public.sanskara_list_access(uuid)',
    'public.sanskara_shared_with_me()', 'public.sanskara_start_claim(uuid, uuid)', 'public.sanskara_cancel_claim(uuid, uuid)',
    'public.sanskara_accept_claim(uuid, text)'] loop
    assert has_function_privilege('authenticated', f, 'execute'), f || ': signed-in users must be able to call it';
    assert not has_function_privilege('anon', f, 'execute'), f || ': anon must not be able to call it';
  end loop;
  perform public._t_as(public._t('A'));
  perform public._t_expect('42501', 'direct read of claims', 'select * from public.sanskara_claims');
  perform public._t_as(null);
  perform public._t_expect('SK401', 'signed out', 'select public.sanskara_shared_with_me()');
  perform public._t_admin();
end
$t$;

-- ── 2. Granting and what a viewer sees ──────────────────────────────────────────────────────────────────────────────
do $t$
declare v jsonb; w jsonb; e jsonb;
begin
  -- Nothing is shared yet.
  perform public._t_as(public._t('D'));
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'before any share a person sees nothing';
  perform public._t_as(public._t('A'));

  -- Validation, exact codes.
  perform public._t_expect('SK422', 'sharing with oneself', $q$select public.sanskara_grant_view(public._t('g1'), public._t('SA'), public._t('ra_b'), public._t('A'))$q$);
  perform public._t_expect('SK422', 'sharing outside the Kul', $q$select public.sanskara_grant_view(public._t('g2'), public._t('SA'), public._t('ra_b'), public._t('E'))$q$);
  perform public._t_expect('SK422', 'sharing with someone in no Kul', $q$select public.sanskara_grant_view(public._t('g3'), public._t('SA'), public._t('ra_b'), public._t('N'))$q$);
  perform public._t_expect('SK422', 'sharing with an account in its deletion cool-off', $q$select public.sanskara_grant_view(public._t('g4'), public._t('SA'), public._t('ra_b'), public._t('G'))$q$);
  perform public._t_expect('SK422', 'sharing with an account that does not exist', $q$select public.sanskara_grant_view(public._t('g5'), public._t('SA'), public._t('ra_b'), public._t('nobody'))$q$);
  perform public._t_expect('SK404', 'no grantee', $q$select public.sanskara_grant_view(public._t('g6'), public._t('SA'), public._t('ra_b'), null)$q$);
  perform public._t_expect('SK404', 'a record of another person', $q$select public.sanskara_grant_view(public._t('g7'), public._t('SA'), public._t('r1_b'), public._t('D'))$q$);
  perform public._t_expect('SK404', 'a record that does not exist', $q$select public.sanskara_grant_view(public._t('g8'), public._t('SA'), public._t('nothing'), public._t('D'))$q$);
  perform public._t_expect('SK404', 'a subject that does not exist', $q$select public.sanskara_grant_view(public._t('g9'), public._t('nothing'), null, public._t('D'))$q$);
  perform public._t_expect('SK422', 'sharing a minor''s timeline with the other parent', $q$select public.sanskara_grant_view(public._t('g10'), public._t('S1'), null, public._t('B'))$q$);
  perform public._t_expect('SK404', 'a former manager sharing', $q$select public.sanskara_grant_view(public._t('g11'), public._t('S2'), public._t('r2_b'), public._t('D'))$q$);
  perform public._t_expect('SK400', 'no request id', $q$select public.sanskara_grant_view(null, public._t('SA'), public._t('ra_b'), public._t('D'))$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger sharing someone else''s record', $q$select public.sanskara_grant_view(public._t('g12'), public._t('SA'), public._t('ra_b'), public._t('D'))$q$);
  perform public._t_as(public._t('F'));
  perform public._t_expect('SK403', 'sharing without consent', $q$select public.sanskara_grant_view(public._t('g13'), public._t('SA'), public._t('ra_b'), public._t('D'))$q$);
  perform public._t_admin();
  assert (select count(*) from public.sanskara_grants) = 0, 'a refused share must leave nothing behind';
  assert (select count(*) from public.sanskara_request_log) = 0, 'a refused share must leave no request-log row behind';

  -- A record grant: a Class B record gives name, dates and status; nothing private.
  perform public._t_as(public._t('A'));
  v := public.sanskara_grant_view(public._t('g20'), public._t('SA'), public._t('ra_b'), public._t('D'));
  w := public.sanskara_grant_view(public._t('g20'), public._t('SA'), public._t('ra_b'), public._t('D'));
  assert v->>'id' = w->>'id' and (w->>'replayed')::boolean, 'a retried share returns the first answer';
  perform public._t_expect('SK409', 'the same record shared twice', $q$select public.sanskara_grant_view(public._t('g21'), public._t('SA'), public._t('ra_b'), public._t('D'))$q$);
  perform public._t_as(public._t('D'));
  e := public.sanskara_shared_with_me();
  perform public._t_admin();
  assert jsonb_array_length(e) = 1, 'the grantee sees exactly the shared record';
  assert e->0->>'record_id' = public._t('ra_b')::text, 'and it is the right one';
  assert (e->0->'shared_by'->>'username') = 'user_a' and (e->0->'shared_by'->>'id') = public._t('A')::text, 'the grantee sees who shared it';
  assert (e->0->'subject'->>'kind') = 'account' and (e->0->'subject'->>'label') is null, 'an account timeline has no label';
  assert (e->0->>'rite_key') = 'rite_b' and (e->0->>'sensitivity') = 'B' and (e->0->>'completed')::boolean is false, 'name, class and status';
  assert (e->0->>'planned_date')::date = current_date + 30, 'a Class B record shows its date';
  assert not (e->0 ? 'private') and position('private' in e::text) = 0 and position('notes' in e::text) = 0, 'private fields are never in a shared projection';
  assert (select count(*) from public.sanskara_audit where action = 'grant_created') = 1, 'one audit row, none for the retry';
  assert (select detail from public.sanskara_audit where action = 'grant_created') = '{"scope": "record"}'::jsonb, 'the audit row names the scope and no content';
  assert (select kul_id from public.sanskara_grants where id = (v->>'id')::uuid) = public._t('K1'), 'the grant records the Kul it was made in';

  -- A viewer cannot share onwards, edit, or read the rest of the timeline.
  perform public._t_as(public._t('D'));
  perform public._t_expect('SK404', 'a viewer re-sharing', $q$select public.sanskara_grant_view(public._t('g22'), public._t('SA'), public._t('ra_b'), public._t('H'))$q$);
  perform public._t_expect('SK404', 'a viewer listing access', $q$select public.sanskara_list_access(public._t('SA'))$q$);
  perform public._t_admin();

  -- A Class A record shared by an explicit grant shows its name and status, never its dates. A custom title is Class A too.
  perform public._t_as(public._t('A'));
  v := public.sanskara_grant_view(public._t('g23'), public._t('SA'), public._t('ra_pre'), public._t('D'));
  v := public.sanskara_grant_view(public._t('g24'), public._t('SA'), public._t('ra_c'), public._t('D'));
  perform public._t_as(public._t('D'));
  e := public.sanskara_shared_with_me();
  perform public._t_admin();
  assert jsonb_array_length(e) = 3, 'three records are shared with D';
  assert (select count(*) from jsonb_array_elements(e) x where x ? 'planned_date') = 1, 'only the Class B record shows dates';
  assert (select count(*) from jsonb_array_elements(e) x where x ? 'completed_date') = 1, 'no Class A record shows a completion date';
  assert exists (select 1 from jsonb_array_elements(e) x where x->>'rite_key' = 'rite_pre' and x->>'sensitivity' = 'A' and not (x ? 'planned_date')), 'the prenatal record: name and status only';
  assert exists (select 1 from jsonb_array_elements(e) x where x->>'custom_title' = 'Family gathering' and not (x ? 'planned_date')), 'the custom milestone: title and status only';
  assert position('private' in e::text) = 0, 'no private field leaks through a Class A share';

  -- A timeline grant covers Class B records, present and future, and never Class A. Both grants on one record show it once.
  perform public._t_as(public._t('A'));
  v := public.sanskara_grant_view(public._t('g25'), public._t('SA'), null, public._t('H'));
  v := public.sanskara_grant_view(public._t('g26'), public._t('SA'), null, public._t('D'));
  perform public._t_admin();
  insert into public.sanskara_records (id, subject_id, rite_key) values (public._t('ra_later'), public._t('SA'), 'rite_b2');
  insert into public.sanskara_records (id, subject_id, rite_key, custom_title) values (public._t('ra_later_c'), public._t('SA'), 'custom', 'Added later');
  perform public._t_as(public._t('H'));
  e := public.sanskara_shared_with_me();
  perform public._t_admin();
  assert jsonb_array_length(e) = 3 and not exists (select 1 from jsonb_array_elements(e) x where x->>'sensitivity' = 'A'), 'a timeline viewer sees the Class B records (including one made later) and no Class A record';
  perform public._t_as(public._t('D'));
  e := public.sanskara_shared_with_me();
  perform public._t_admin();
  assert (select count(distinct x->>'record_id') from jsonb_array_elements(e) x) = jsonb_array_length(e), 'a record covered by two grants appears once';
  assert jsonb_array_length(e) = 5, 'D: three record grants plus the later and the completed Class B records via the timeline grant';
  delete from public.sanskara_records where id in (public._t('ra_later'), public._t('ra_later_c'));
  delete from public.sanskara_grants;
end
$t$;

-- ── 3. Revoking, lapsing and listing ────────────────────────────────────────────────────────────────────────────────
do $t$
declare v jsonb; w jsonb; e jsonb; g1 uuid; g2 uuid;
begin
  perform public._t_as(public._t('A'));
  g1 := (public.sanskara_grant_view(public._t('r1'), public._t('SA'), public._t('ra_b'), public._t('D'))->>'id')::uuid;
  perform public._t_as(public._t('B'));
  g2 := (public.sanskara_grant_view(public._t('r2'), public._t('S1'), null, public._t('H'))->>'id')::uuid;

  -- Who can see what: the owner and a manager, with names; nobody else.
  perform public._t_as(public._t('A'));
  e := public.sanskara_list_access(public._t('SA'));
  assert jsonb_array_length(e) = 1 and e->0->'grantee'->>'username' = 'user_d' and e->0->>'scope' = 'record' and (e->0->>'shared_by_me')::boolean, 'the owner sees the share, the person and the scope';
  e := public.sanskara_list_access(public._t('S1'));
  assert jsonb_array_length(e) = 1 and e->0->>'scope' = 'timeline' and (e->0->>'shared_by_me')::boolean is false, 'a manager sees a share the other parent made';
  perform public._t_expect('SK404', 'a former manager listing', $q$select public.sanskara_list_access(public._t('S2'))$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger listing', $q$select public.sanskara_list_access(public._t('SA'))$q$);
  perform public._t_as(public._t('H'));
  perform public._t_expect('SK404', 'a viewer listing', $q$select public.sanskara_list_access(public._t('S1'))$q$);
  perform public._t_as(public._t('F'));
  perform public._t_expect('SK403', 'listing without consent', $q$select public.sanskara_list_access(public._t('SA'))$q$);
  perform public._t_admin();

  -- A parent's share on the child's timeline works for the grantee while the audience and the granter hold.
  perform public._t_as(public._t('H'));
  assert jsonb_array_length(public.sanskara_shared_with_me()) = 1, 'H sees the minor''s Class B record, not the custom milestone (Class A)';
  assert (select count(*) from jsonb_array_elements(public.sanskara_shared_with_me()) x where x->'subject'->>'label' = 'Asha') = 1, 'a dependent''s records carry the child''s label';

  -- The audience lapses: the share stays listed but grants nothing, and returns with the membership.
  perform public._t_admin();
  delete from public.kul_members where user_id = public._t('H');
  perform public._t_as(public._t('H'));
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'a member who left the Kul sees nothing';
  perform public._t_as(public._t('A'));
  assert jsonb_array_length(public.sanskara_list_access(public._t('S1'))) = 1, 'the lapsed share is still listed so it can be revoked';
  perform public._t_admin();
  insert into public.kul_members (kul_id, user_id) values (public._t('K1'), public._t('H'));
  perform public._t_as(public._t('H'));
  assert jsonb_array_length(public.sanskara_shared_with_me()) = 1, 'the share works again when the membership does';
  perform public._t_admin();
  delete from public.sanskara_subject_managers where subject_id = public._t('S1') and account_id = public._t('B');
  perform public._t_as(public._t('H'));
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'when the sharing manager is removed their share stops';
  perform public._t_admin();
  insert into public.sanskara_subject_managers (subject_id, account_id) values (public._t('S1'), public._t('B'));

  -- Revoking: the other parent can end a share the first made; the grantee can leave; strangers and other viewers cannot.
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger revoking', format($q$select public.sanskara_revoke_grant(public._t('v1'), %L)$q$, g1));
  perform public._t_as(public._t('H'));
  perform public._t_expect('SK404', 'another viewer revoking someone else''s share', format($q$select public.sanskara_revoke_grant(public._t('v2'), %L)$q$, g1));
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a grant that does not exist', $q$select public.sanskara_revoke_grant(public._t('v3'), public._t('nothing'))$q$);
  v := public.sanskara_revoke_grant(public._t('v4'), g2);
  w := public.sanskara_revoke_grant(public._t('v4'), g2);
  assert (v->>'revoked')::boolean and (v->>'already_revoked')::boolean is false, 'the first revoke ends the share';
  assert (w->>'replayed')::boolean, 'a retried revoke is a replay';
  v := public.sanskara_revoke_grant(public._t('v5'), g2);
  assert (v->>'already_revoked')::boolean, 'revoking again says it was already ended';
  perform public._t_as(public._t('H'));
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'revocation is immediate';
  perform public._t_as(public._t('D'));
  assert jsonb_array_length(public.sanskara_shared_with_me()) = 1, 'D still sees the share on SA';
  v := public.sanskara_revoke_grant(public._t('v6'), g1);
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'a grantee can leave a share';
  perform public._t_admin();
  assert (select revoked_by from public.sanskara_grants where id = g1) = public._t('D'), 'who ended it is recorded';
  assert (select count(*) from public.sanskara_audit where action = 'grant_revoked') = 2, 'one audit row per ended share, none for the repeat';
  perform public._t_as(public._t('A'));
  assert public.sanskara_list_access(public._t('SA')) = '[]'::jsonb, 'ended shares are no longer listed';
  perform public._t_admin();

  -- The limit of 50 live shares per person.
  insert into auth.users (id) select public._t('fill' || i) from generate_series(1, 50) i;
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope)
  select public._t('SA'), public._t('fill' || i), public._t('A'), public._t('K1'), 'timeline' from generate_series(1, 50) i;
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK422', 'the 51st share', $q$select public.sanskara_grant_view(public._t('v7'), public._t('SA'), public._t('ra_b'), public._t('D'))$q$);
  perform public._t_admin();
  delete from auth.users where id in (select public._t('fill' || i) from generate_series(1, 50) i);
  delete from public.sanskara_grants;
end
$t$;

-- ── 4. The hand-over at 18 ──────────────────────────────────────────────────────────────────────────────────────────
do $t$
declare v jsonb; w jsonb; tok text; tok2 text; n int; old_version int; claim_id uuid;
begin
  -- Who may start a claim: a former manager, inside the window, with consent. Nobody else.
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a manager of a minor starting a claim', $q$select public.sanskara_start_claim(public._t('c0'), public._t('S1'))$q$);
  perform public._t_expect('SK404', 'a manager after the window', $q$select public.sanskara_start_claim(public._t('c0b'), public._t('S3'))$q$);
  perform public._t_expect('SK404', 'an account timeline', $q$select public.sanskara_start_claim(public._t('c0c'), public._t('SA'))$q$);
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'the other parent of a minor', $q$select public.sanskara_start_claim(public._t('c0d'), public._t('S1'))$q$);
  perform public._t_as(public._t('C'));
  perform public._t_expect('SK404', 'a stranger', $q$select public.sanskara_start_claim(public._t('c0e'), public._t('S2'))$q$);
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'the new adult before any claim exists', $q$select public.sanskara_start_claim(public._t('c0f'), public._t('S2'))$q$);
  perform public._t_admin();
  assert (select count(*) from public.sanskara_claims) = 0, 'refused claims leave nothing behind';

  -- Starting one: a one-time token, stored only as a hash.
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c1'), public._t('S2'));
  tok := v->>'token';
  w := public.sanskara_start_claim(public._t('c1'), public._t('S2'));
  perform public._t_admin();
  assert tok ~ '^[0-9a-f]{64}$', 'the token is 64 hex characters';
  assert not (w ? 'token') and (w->>'replayed')::boolean, 'a retried start does not return the token again';
  assert (select count(*) from public.sanskara_claims) = 1, 'a retry does not start a second claim';
  assert (select token_hash from public.sanskara_claims) = encode(sha256(convert_to(tok, 'UTF8')), 'hex'), 'only the SHA-256 of the token is stored';
  assert (select count(*) from public.sanskara_claims where position(tok in token_hash) > 0) = 0, 'the token itself is not stored';
  assert position(tok in coalesce((select string_agg(result::text, '') from public.sanskara_request_log), '')) = 0, 'the token is not in the request log';
  assert position(tok in coalesce((select string_agg(detail::text, '') from public.sanskara_audit), '')) = 0, 'the token is not in the audit trail';
  assert (select expires_at from public.sanskara_claims) <= now() + interval '7 days' + interval '1 minute', 'it lasts at most 7 days';
  assert (select count(*) from public.sanskara_audit where action = 'claim_started') = 1, 'the start is audited';

  -- Starting another cancels the first: the old token stops working at once.
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c2'), public._t('S2'));
  tok2 := v->>'token';
  perform public._t_admin();
  assert tok2 <> tok, 'a new claim has a new token';
  assert (select count(*) from public.sanskara_claims where status = 'pending') = 1 and (select count(*) from public.sanskara_claims where status = 'cancelled') = 1, 'one pending, one cancelled';
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'the cancelled token', format($q$select public.sanskara_accept_claim(public._t('x1'), %L)$q$, tok));
  perform public._t_admin();

  -- The token cannot outlive the window.
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' - interval '12 months' + interval '2 days' where id = public._t('S2');
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c3'), public._t('S2'));
  perform public._t_admin();
  assert (select expires_at from public.sanskara_claims where status = 'pending') <= now() + interval '2 days' + interval '1 minute', 'a claim expires when the window ends';
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' - interval '3 months' where id = public._t('S2');

  -- Cancel.
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c4'), public._t('S2'));
  tok := v->>'token';
  perform public._t_as(public._t('B'));
  perform public._t_expect('SK404', 'the other parent cancelling a claim on a minor', $q$select public.sanskara_cancel_claim(public._t('c5'), public._t('S1'))$q$);
  perform public._t_as(public._t('A'));
  w := public.sanskara_cancel_claim(public._t('c6'), public._t('S2'));
  v := public.sanskara_cancel_claim(public._t('c7'), public._t('S2'));
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'a cancelled token', format($q$select public.sanskara_accept_claim(public._t('x2'), %L)$q$, tok));
  perform public._t_admin();
  assert (w->>'cancelled')::int = 1 and (v->>'cancelled')::int = 0, 'cancelling counts what it ended';

  -- Accepting: refusals first. Every failure of the token is the same SK404; a missing consent is SK403.
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c8'), public._t('S2'));
  tok := v->>'token';
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'not hex', $q$select public.sanskara_accept_claim(public._t('x3'), 'not a token')$q$);
  perform public._t_expect('SK404', 'null token', $q$select public.sanskara_accept_claim(public._t('x4'), null)$q$);
  perform public._t_expect('SK404', 'a well-formed token nobody issued', $q$select public.sanskara_accept_claim(public._t('x5'), repeat('ab', 32))$q$);
  perform public._t_expect('SK404', 'the token in upper case', format($q$select public.sanskara_accept_claim(public._t('x6'), %L)$q$, upper(tok)));
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'a former manager accepting their own claim', format($q$select public.sanskara_accept_claim(public._t('x7'), %L)$q$, tok));
  perform public._t_as(public._t('F'));
  perform public._t_expect('SK403', 'accepting without consent', format($q$select public.sanskara_accept_claim(public._t('x8'), %L)$q$, tok));
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK400', 'no request id', format($q$select public.sanskara_accept_claim(null, %L)$q$, tok));
  perform public._t_admin();
  assert (select status from public.sanskara_claims where token_hash = encode(sha256(convert_to(tok, 'UTF8')), 'hex')) = 'pending', 'refusals leave the claim pending';
  assert not exists (select 1 from public.sanskara_subjects where kind = 'account' and account_id = public._t('F')), 'a refused accept creates nothing for the caller';

  -- Outside the window, expired, or before the 18th birthday: the same SK404.
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at, created_at)
  values (public._t('S1'), public._t('A'), encode(sha256(convert_to(repeat('11', 32), 'UTF8')), 'hex'), now() + interval '5 days', now());
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at, created_at)
  values (public._t('S3'), public._t('A'), encode(sha256(convert_to(repeat('22', 32), 'UTF8')), 'hex'), now() + interval '5 days', now());
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at, created_at, status)
  values (public._t('S2'), public._t('A'), encode(sha256(convert_to(repeat('33', 32), 'UTF8')), 'hex'), now() - interval '1 day', now() - interval '3 days', 'cancelled');
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'a claim on a child who is still a minor', $q$select public.sanskara_accept_claim(public._t('x9'), repeat('11', 32))$q$);
  perform public._t_expect('SK404', 'a claim after the window closed', $q$select public.sanskara_accept_claim(public._t('x10'), repeat('22', 32))$q$);
  perform public._t_expect('SK404', 'a claim that is not pending', $q$select public.sanskara_accept_claim(public._t('x11'), repeat('33', 32))$q$);
  perform public._t_admin();
  delete from public.sanskara_claims where subject_id in (public._t('S1'), public._t('S3'));
  -- An expired but still 'pending' claim.
  update public.sanskara_claims set expires_at = now() - interval '1 hour', created_at = now() - interval '8 days' where token_hash = encode(sha256(convert_to(tok, 'UTF8')), 'hex');
  perform public._t_as(public._t('N'));
  perform public._t_expect('SK404', 'an expired token', format($q$select public.sanskara_accept_claim(public._t('x12'), %L)$q$, tok));
  perform public._t_admin();
  update public.sanskara_claims set expires_at = now() + interval '3 days', created_at = now() where token_hash = encode(sha256(convert_to(tok, 'UTF8')), 'hex');
end
$t$;

-- 4b. Accepting for real: the move, the conflict rule, atomicity.
do $t$
declare v jsonb; w jsonb; tok text; before_n int;
begin
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c9'), public._t('S2'));
  tok := v->>'token';
  perform public._t_admin();
  -- A grant the managers made on the dependent, and a subscription-free state to compare.
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (public._t('S2'), public._t('D'), public._t('A'), public._t('K1'), 'record', public._t('r2_b2'));

  -- Atomicity: a claimant who would exceed 100 records gets nothing, and the claim stays pending.
  insert into public.sanskara_records (subject_id, rite_key, custom_title) select public._t('SP'), 'custom', 'Filler ' || i from generate_series(1, 99) i;
  perform public._t_as(public._t('P'));
  perform public._t_expect('SK422', 'a claimant who would exceed the record limit', format($q$select public.sanskara_accept_claim(public._t('y1'), %L)$q$, tok));
  perform public._t_admin();
  assert exists (select 1 from public.sanskara_subjects where id = public._t('S2')), 'a failed accept leaves the dependent in place';
  assert (select count(*) from public.sanskara_records where subject_id = public._t('S2')) = 3, 'and all its records';
  assert (select count(*) from public.sanskara_records where subject_id = public._t('SP')) = 99, 'and the claimant''s records unchanged';
  assert (select status from public.sanskara_claims where subject_id = public._t('S2') and status = 'pending') = 'pending', 'and the claim pending';
  delete from public.sanskara_records where subject_id = public._t('SP');

  -- The real accept. N already has the rite that S2 also has (rite_b): N's wins, S2's is dropped; the rest move.
  select version into before_n from public.sanskara_records where id = public._t('r2_b2');
  perform public._t_as(public._t('N'));
  v := public.sanskara_accept_claim(public._t('y2'), tok);
  w := public.sanskara_accept_claim(public._t('y2'), tok);
  perform public._t_expect('SK404', 'using the token a second time', format($q$select public.sanskara_accept_claim(public._t('y3'), %L)$q$, tok));
  perform public._t_admin();
  assert (v->>'moved')::int = 2 and (v->>'dropped_as_duplicates')::int = 1, 'two records moved, one duplicate dropped';
  assert (w->>'replayed')::boolean and (w->>'moved')::int = 2, 'a retried accept returns the first answer';
  assert (select subject_id from public.sanskara_records where id = public._t('r2_b2')) = public._t('SN'), 'a record moves to the new adult''s own timeline';
  assert (select subject_id from public.sanskara_records where id = public._t('r2_c')) = public._t('SN'), 'a custom milestone moves too';
  assert (select version from public.sanskara_records where id = public._t('r2_b2')) = before_n + 1, 'a moved record''s version moves on';
  assert (select notes from public.sanskara_record_private where record_id = public._t('r2_c')) = 'a private note about the graduation', 'its private fields move with it';
  assert (select planned_date from public.sanskara_records where id = public._t('rn_b')) = current_date + 1 and (select subject_id from public.sanskara_records where id = public._t('rn_b')) = public._t('SN'), 'the claimant''s own record is untouched';
  assert not exists (select 1 from public.sanskara_records where id = public._t('r2_b')), 'the duplicate was dropped, not merged';
  assert (select count(*) from public.sanskara_records where subject_id = public._t('SN') and rite_key = 'rite_b') = 1, 'one record per rite stays true';
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S2')), 'the dependent is gone';
  assert not exists (select 1 from public.sanskara_subject_managers where subject_id = public._t('S2')), 'its managers are gone';
  assert not exists (select 1 from public.sanskara_claims where subject_id = public._t('S2')), 'its claims are gone';
  assert not exists (select 1 from public.sanskara_grants where subject_id = public._t('S2') or record_id in (public._t('r2_b2'), public._t('r2_c'))), 'every share on it ended';
  assert (select count(*) from public.sanskara_audit where action = 'claim_accepted' and actor_id = public._t('N') and target_id = public._t('A')) = 1, 'the accept is audited once';
  assert (select account_id from public.sanskara_subjects where id = public._t('SN')) = public._t('N'), 'the records now belong to the new adult''s own timeline';

  -- Afterwards the ex-manager and the former viewer have no access; the new adult is the owner.
  perform public._t_matrix('the ex-manager on the moved record', public._t('SN'), public._t('A'), public._t('r2_b2'), array[]::text[]);
  perform public._t_matrix('the former viewer on the moved record', public._t('SN'), public._t('D'), public._t('r2_b2'), array[]::text[]);
  perform public._t_matrix('the new owner on the moved record', public._t('SN'), public._t('N'), public._t('r2_b2'),
    array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record', 'set_completion', 'manage_grants', 'subscribe', 'receive_reminder', 'export', 'delete_subject']);
  perform public._t_as(public._t('D'));
  assert public.sanskara_shared_with_me() = '[]'::jsonb, 'the former viewer sees nothing';
  perform public._t_admin();

  -- A claimant with no timeline of their own gets one.
  perform public._t_as(public._t('A'));
  perform public._t_expect('SK404', 'the former manager of a dependent who is gone', $q$select public.sanskara_start_claim(public._t('c10'), public._t('S2'))$q$);
  perform public._t_admin();
  delete from public.sanskara_subjects where id = public._t('SP');
  update public.sanskara_subjects set birth_date = current_date - interval '18 years' - interval '2 months' where id = public._t('S3');
  insert into public.sanskara_records (subject_id, rite_key) values (public._t('S3'), 'rite_b2') on conflict do nothing;
  perform public._t_as(public._t('A'));
  v := public.sanskara_start_claim(public._t('c11'), public._t('S3'));
  perform public._t_as(public._t('P'));
  w := public.sanskara_accept_claim(public._t('y4'), v->>'token');
  perform public._t_admin();
  assert (w->>'moved')::int = 2, 'both records moved';
  assert (select count(*) from public.sanskara_subjects where kind = 'account' and account_id = public._t('P')) = 1, 'the claimant got their own timeline';
  assert (select count(*) from public.sanskara_records r join public.sanskara_subjects s on s.id = r.subject_id where s.account_id = public._t('P')) = 2, 'holding the moved records';
end
$t$;

rollback;
