-- Integration assertions for 20261105100000_sanskara_manager_picker.sql (G4: hand a child's timeline to another Kul member).
-- Run on a scratch database after M1 to M4a and the migration under test, as the migration owner. Everything is rolled back at the end.
begin;
set local timezone to 'UTC';
create function public._t(n text) returns uuid language sql immutable as $$ select md5('picker-test:' || n)::uuid $$;
create function public._ok(p_label text, p_cond boolean) returns void language plpgsql as $$
begin if p_cond is not true then raise exception 'FAIL %', p_label using errcode = 'P0004'; end if; end $$;
create function public._t_as(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true); execute 'set local role authenticated'; end $$;
create function public._t_admin() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
create function public._t_expect(p_sqlstate text, p_label text, p_stmt text) returns void language plpgsql as $$
declare v_state text;
begin
  begin execute p_stmt; exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    if v_state <> p_sqlstate then raise exception 'FAIL %: expected %, got % (%)', p_label, p_sqlstate, v_state, sqlerrm using errcode = 'P0004'; end if;
    return;
  end;
  raise exception 'FAIL %: accepted', p_label using errcode = 'P0004';
end $$;
grant execute on function public._t(text), public._ok(text, boolean), public._t_as(uuid), public._t_admin(), public._t_expect(text, text, text) to authenticated, anon;

-- A is the only manager of S1 (and of S3); A and B manage S2. K1: A, B, C, D (no consent), E (deleting), F (a manager already of S2). K2: X.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, username, full_name)
select public._t(n), public._t(k), c, d, 'u_' || lower(n), 'Name ' || n
from (values ('A','K1',true,false), ('B','K1',true,false), ('C','K1',true,false), ('D','K1',false,false), ('E','K1',true,true), ('F','K1',true,false),
             ('X','K2',true,false), ('Y',null,true,false), ('Z',null,true,false)) v(n,k,c,d);
insert into public.kul_members (kul_id, user_id, role)
select public._t(k), public._t(n), 'sadhak' from (values ('A','K1'), ('B','K1'), ('C','K1'), ('D','K1'), ('E','K1'), ('F','K1'), ('X','K2'), ('Y','K1')) v(n,k);  -- Y is in kul_members but its profile says no Kul: the two disagree
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', current_date - interval '5 years'),
  (public._t('S2'), 'dependent', 'Ravi', current_date - interval '6 years'),
  (public._t('S3'), 'dependent', 'Mira', current_date - interval '7 years');
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('A')), (public._t('S2'), public._t('A')), (public._t('S2'), public._t('F')), (public._t('S3'), public._t('A'));

-- 1. Privileges: signed-in only.
select public._ok('picker: authenticated only', has_function_privilege('authenticated', 'public.sanskara_manager_picker(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.sanskara_manager_picker(uuid)', 'execute'));
select public._ok('sole-manager list: authenticated only', has_function_privilege('authenticated', 'public.sanskara_sole_manager_dependents()', 'execute')
  and not has_function_privilege('anon', 'public.sanskara_sole_manager_dependents()', 'execute'));

-- 2. The picker: managers, and who can be added.
select public._t_as(public._t('A'));
create temp table _p on commit drop as select public.sanskara_manager_picker(public._t('S1')) j;
grant all on _p to authenticated;
select public._t_admin();
select public._ok('managers: only A, and A is me', (select jsonb_array_length(j -> 'managers') = 1 and (j -> 'managers' -> 0 ->> 'is_me')::boolean and (j -> 'managers' -> 0 ->> 'id') = public._t('A')::text from _p));
select public._ok('candidates: B, C and F only (not D without consent, E deleting, X in another Kul, Y whose profile and membership disagree, Z with no Kul, A is me)',
  (select array(select e ->> 'id' from jsonb_array_elements(j -> 'candidates') e order by 1) = array(select x from unnest(array[public._t('B')::text, public._t('C')::text, public._t('F')::text]) x order by 1) from _p));
select public._ok('the limit is 4', (select (j ->> 'limit')::int = 4 from _p));
select public._ok('a candidate carries only id, username and full name', (select not exists (select 1 from jsonb_array_elements(j -> 'candidates') e where (select array_agg(k order by k) from jsonb_object_keys(e) k) <> array['full_name','id','username']) from _p));
select public._ok('and nothing about consent or the Kul', (select j::text not like '%consent%' and j::text not like '%kul%' from _p));

select public._t_as(public._t('A'));
create temp table _p2 on commit drop as select public.sanskara_manager_picker(public._t('S2')) j;
select public._t_admin();
select public._ok('for S2 the existing manager F is not offered again, and is listed as a manager',
  (select not exists (select 1 from jsonb_array_elements(j -> 'candidates') e where e ->> 'id' = public._t('F')::text)
          and exists (select 1 from jsonb_array_elements(j -> 'managers') e where e ->> 'id' = public._t('F')::text and not (e ->> 'is_me')::boolean) from _p2));

-- 3. Who may ask.
select public._t_as(public._t('B'));
select public._t_expect('SK404', 'a Kul member who is not a manager', $q$select public.sanskara_manager_picker(public._t('S1'))$q$);
select public._t_expect('SK404', 'an unknown subject', $q$select public.sanskara_manager_picker(gen_random_uuid())$q$);
select public._t_expect('SK404', 'a null subject', $q$select public.sanskara_manager_picker(null)$q$);
select public._t_admin();
select public._t_as(null);
select public._t_expect('SK401', 'not signed in', $q$select public.sanskara_manager_picker(public._t('S1'))$q$);
select public._t_admin();
update public.profiles set consent_religious_data = false where id = public._t('A');
select public._t_as(public._t('A'));
select public._t_expect('SK403', 'a manager who has withdrawn consent', $q$select public.sanskara_manager_picker(public._t('S1'))$q$);
select public._t_admin();
update public.profiles set consent_religious_data = true where id = public._t('A');

-- 4. The hand-over works end to end with the existing functions: add C, then A leaves, and the timeline stays with C.
select public._t_as(public._t('A'));
select public.sanskara_add_manager(gen_random_uuid(), public._t('S1'), public._t('C'));
select public.sanskara_remove_manager(gen_random_uuid(), public._t('S1'), public._t('A'));
select public._t_admin();
select public._ok('C manages S1 and A does not', exists (select 1 from public.sanskara_subject_managers where subject_id = public._t('S1') and account_id = public._t('C'))
  and not exists (select 1 from public.sanskara_subject_managers where subject_id = public._t('S1') and account_id = public._t('A')));
select public._t_as(public._t('C'));
select public._ok('C now sees S1 as a dependent', (select count(*) from jsonb_array_elements(public.sanskara_dependents()) e where e ->> 'id' = public._t('S1')::text) = 1);
select public._t_admin();

-- 5. Sole-manager list.
select public._t_as(public._t('A'));
create temp table _s on commit drop as select public.sanskara_sole_manager_dependents() j;
select public._t_admin();
select public._ok('A is the sole manager of S3 only (S1 moved to C, S2 has F)',
  (select jsonb_array_length(j) = 1 and j -> 0 ->> 'id' = public._t('S3')::text and j -> 0 ->> 'display_name' = 'Mira' from _s));
select public._ok('and only id and display name', (select (select array_agg(k order by k) from jsonb_object_keys(j -> 0) k) = array['display_name','id'] from _s));
select public._t_as(public._t('F'));
select public._ok('F is sole manager of nothing (S2 has two)', public.sanskara_sole_manager_dependents() = '[]'::jsonb);
select public._t_admin();
select public._t_as(public._t('B'));
select public._ok('B, a manager of nothing, gets an empty list', public.sanskara_sole_manager_dependents() = '[]'::jsonb);
select public._t_admin();
update public.profiles set consent_religious_data = false where id = public._t('A');
select public._t_as(public._t('A'));
select public._ok('a manager who has withdrawn consent still sees which children would be deleted with their account', jsonb_array_length(public.sanskara_sole_manager_dependents()) = 1);
select public._t_admin();
update public.profiles set is_deleting = true where id = public._t('A');
select public._t_as(public._t('A'));
select public._t_expect('SK404', 'an account already deleting', $q$select public.sanskara_sole_manager_dependents()$q$);
select public._t_admin();

do $$ begin raise notice 'ALL MANAGER PICKER ASSERTIONS PASSED'; end $$;
rollback;
