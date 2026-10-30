-- Rollback for 20261030100000_sanskara_kul_pointer.sql (M4a).
-- Restores the M2 three-argument sanskara_create_dependent and the M2 sanskara_dependents, drops the pointer function, the
-- two helpers, the column, its constraint and index, and puts the audit-action list back.
--
-- Any link is lost with the column (it was display-only, so no access changes). Audit rows already written with the two
-- new actions are KEPT: the old action check is restored NOT VALID, which enforces it for new rows without rejecting or
-- deleting history.
begin;

drop function if exists public.sanskara_set_kul_link(uuid, uuid, uuid);
drop function if exists public.sanskara_create_dependent(uuid, text, date, uuid);
drop function if exists public.sanskara_resolve_tree_person(uuid, uuid);
drop function if exists public.sanskara_viewer_kul(uuid);

-- The M2 definitions, verbatim.
create function public.sanskara_create_dependent(p_request_id uuid, p_name text, p_birth_date date) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_name text := nullif(btrim(p_name), '');
  v_today date := (now() at time zone 'utc')::date;
  v_subject uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'create_dependent');
  if v_replay is not null then return v_replay; end if;

  if v_name is null or length(v_name) > 40 or v_name ~ '[[:cntrl:]]' then
    raise exception 'sanskara_invalid_name' using errcode = 'SK400';
  end if;
  -- A minor today, by the same arithmetic sanskara_can uses for the 18th birthday.
  if p_birth_date is null or p_birth_date < date '2000-01-01' or p_birth_date > v_today
     or (p_birth_date + interval '18 years')::date <= v_today then
    raise exception 'sanskara_invalid_birth_date' using errcode = 'SK400';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sanskara-dependents:' || v_uid::text, 0));
  if (select count(*) from public.sanskara_subject_managers m where m.account_id = v_uid) >= 10 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;

  insert into public.sanskara_subjects (kind, display_name, birth_date) values ('dependent', v_name, p_birth_date) returning id into v_subject;
  insert into public.sanskara_subject_managers (subject_id, account_id, added_by) values (v_subject, v_uid, v_uid);
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'dependent_created', v_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', v_subject));
end;
$$;

revoke all on function public.sanskara_create_dependent(uuid, text, date) from public, anon, service_role;
grant execute on function public.sanskara_create_dependent(uuid, text, date) to authenticated;

create or replace function public.sanskara_dependents() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  s record;
  v_result jsonb := '[]'::jsonb;
begin
  for s in
    select d.id, d.display_name, d.birth_date
    from public.sanskara_subjects d
    join public.sanskara_subject_managers m on m.subject_id = d.id and m.account_id = v_uid
    where d.kind = 'dependent'
    order by d.created_at, d.id
  loop
    if public.sanskara_can('read_private', s.id, v_uid) then
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'id', s.id,
        'display_name', s.display_name,
        'birth_date', s.birth_date,
        'can_edit', public.sanskara_can('write_record', s.id, v_uid),
        'can_manage', public.sanskara_can('manage_managers', s.id, v_uid),
        'records', public.sanskara_records_json_unchecked(s.id, true)));
    end if;
  end loop;
  return v_result;
end;
$$;

drop index if exists public.sanskara_subjects_kul_family_member;
alter table public.sanskara_subjects drop constraint if exists sanskara_subjects_kul_link_dependent_only;
alter table public.sanskara_subjects drop column if exists kul_family_member_id;

alter table public.sanskara_audit drop constraint sanskara_audit_action_check;
alter table public.sanskara_audit add constraint sanskara_audit_action_check check (action in (
  'dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
  'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted',
  'consent_suspended', 'purged')) not valid;

commit;
