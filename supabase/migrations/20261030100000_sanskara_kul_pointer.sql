-- Sanskara tracker, migration M4a: the optional, display-only pointer from a dependent to a Kul family-tree person.
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md (addendum); contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md
-- section 4 rule 2 ("may point to a Kul tree person for display only. No authority is ever derived from that pointer").
-- Depends on M1 to M4. NOT applied to any database by this commit.
--
-- WHAT THIS ADDS
--   sanskara_subjects.kul_family_member_id   nullable; dependents only; ON DELETE SET NULL (so deleting a tree person changes
--                                            no access and raises no error that could be read as a signal).
--   sanskara_create_dependent(..., uuid)     gains an optional fourth argument, so a dependent can be created already linked.
--   sanskara_set_kul_link(request, subject, tree person or NULL)
--                                            links, re-links or unlinks. The only other way to change the pointer.
--   sanskara_dependents()                    returns kul_family_member_id for a manager, re-validated at read time.
--
-- WHAT THIS DELIBERATELY DOES NOT DO (the non-disclosure rules)
--   1. Authority never flows from the pointer. sanskara_can is not touched; nothing reads the column to decide access.
--   2. Nothing maps a tree person to a subject. No function takes a tree person and returns subject data, and no table
--      grant, view or embedding lets a client read sanskara_subjects. A Kul member looking at the tree cannot tell whether
--      anyone has linked a person, let alone whether records exist.
--   3. No uniqueness on the pointer. A unique index would make a second manager's link attempt fail differently from an
--      ordinary one, which tells them "someone already tracks this person". Two dependents may point at one tree person;
--      each is private to its own managers. (A duplicate is a product nuisance; an existence oracle is a privacy fault.)
--   4. Every refusal to link is the same SK404 'sanskara_not_found' whether the tree person does not exist, belongs to
--      another Kul, is deceased, or has their own account, and whether or not the caller may manage the subject.
--   5. The pointer is shown only to a manager of the subject, and only while it is currently valid FOR THAT VIEWER: the
--      tree person must belong to the Kul the viewer is in right now (kul_members and profiles.kul_id agreeing, the same
--      rule sanskara_can applies to grants). A manager who leaves the Kul stops seeing it; a co-manager still in the Kul
--      keeps seeing it. A tree person who later gains an account, or is marked deceased, is hidden the same way.
--
-- NOT IN THIS MIGRATION: sanskara_export_mine does not export the pointer (it is a display convenience, not the person's data).

begin;

-- ── The column ─────────────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.sanskara_subjects
  add column kul_family_member_id uuid references public.kul_family_members(id) on delete set null,
  add constraint sanskara_subjects_kul_link_dependent_only check (kul_family_member_id is null or kind = 'dependent');
-- Only so the ON DELETE SET NULL of a tree person's removal does not scan the table.
create index sanskara_subjects_kul_family_member on public.sanskara_subjects (kul_family_member_id) where kul_family_member_id is not null;
comment on column public.sanskara_subjects.kul_family_member_id is
  'Optional DISPLAY-ONLY pointer to a Kul family-tree person. Never an authority: sanskara_can does not read it. Returned only to a manager, only while sanskara_resolve_tree_person says it is valid for that manager.';

-- Two more things the audit trail can record.
alter table public.sanskara_audit drop constraint sanskara_audit_action_check;
alter table public.sanskara_audit add constraint sanskara_audit_action_check check (action in (
  'dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
  'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted',
  'consent_suspended', 'purged', 'kul_link_set', 'kul_link_cleared'));

-- ── Internal helpers (never callable by a client) ────────────────────────────────────────────────────────────────────
-- The Kul an account is in RIGHT NOW: profiles.kul_id, only if kul_members agrees. Either missing or disagreeing is "no Kul".
create function public.sanskara_viewer_kul(p_account uuid) returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.kul_id
  from public.profiles p
  where p.id = p_account
    and p.kul_id is not null
    and exists (select 1 from public.kul_members km where km.kul_id = p.kul_id and km.user_id = p_account)
$$;

-- The one definition of "this tree person may be shown to / linked by this account": same Kul as the account is in now,
-- alive, and not already someone's own account (a person with an account is their own subject, not a dependent). Returns
-- the tree person's id when valid and NULL otherwise, for NULL input too. It reveals nothing a Kul member cannot already
-- see, and is used both to validate a link and to decide, on every read, whether to show it.
create function public.sanskara_resolve_tree_person(p_account uuid, p_tree uuid) returns uuid
language sql stable security definer set search_path = ''
as $$
  select f.id
  from public.kul_family_members f
  where f.id = p_tree
    and f.kul_id = public.sanskara_viewer_kul(p_account)
    and f.linked_user_id is null
    and f.is_alive
    and f.death_date is null
$$;

-- ── Create: the same function, one optional argument more ────────────────────────────────────────────────────────────
-- A different argument list is a different function, so the three-argument form is dropped (nothing calls it: no route or
-- screen exists yet) and re-created with the extra parameter defaulting to NULL, which keeps every existing call working.
drop function public.sanskara_create_dependent(uuid, text, date);

create function public.sanskara_create_dependent(p_request_id uuid, p_name text, p_birth_date date, p_kul_family_member uuid default null)
returns jsonb
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
  -- After the other checks, so a bad pointer is never distinguishable from a bad name by which error comes first.
  if p_kul_family_member is not null and public.sanskara_resolve_tree_person(v_uid, p_kul_family_member) is null then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sanskara-dependents:' || v_uid::text, 0));
  if (select count(*) from public.sanskara_subject_managers m where m.account_id = v_uid) >= 10 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;

  insert into public.sanskara_subjects (kind, display_name, birth_date, kul_family_member_id)
  values ('dependent', v_name, p_birth_date, p_kul_family_member) returning id into v_subject;
  insert into public.sanskara_subject_managers (subject_id, account_id, added_by) values (v_subject, v_uid, v_uid);
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'dependent_created', v_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', v_subject));
end;
$$;

-- ── Link, re-link or unlink an existing dependent ────────────────────────────────────────────────────────────────────
-- p_kul_family_member NULL unlinks. Any manager who may edit the subject may change the pointer. Every refusal is the same
-- SK404, so the answer never says which of "no such subject", "not yours", "no such person", "wrong Kul" it was.
create function public.sanskara_set_kul_link(p_request_id uuid, p_subject uuid, p_kul_family_member uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'set_kul_link');
  if v_replay is not null then return v_replay; end if;

  if not public.sanskara_can('write_record', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  perform 1 from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent' for update;
  if not found then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;
  if p_kul_family_member is not null and public.sanskara_resolve_tree_person(v_uid, p_kul_family_member) is null then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  update public.sanskara_subjects set kul_family_member_id = p_kul_family_member, updated_at = now() where id = p_subject;
  insert into public.sanskara_audit (actor_id, action, subject_id)
  values (v_uid, case when p_kul_family_member is null then 'kul_link_cleared' else 'kul_link_set' end, p_subject);

  return public.sanskara_finish_request(v_uid, p_request_id,
    jsonb_build_object('id', p_subject, 'linked', p_kul_family_member is not null));
end;
$$;

-- ── Read: managers see the pointer, only while it is valid for them ──────────────────────────────────────────────────
create or replace function public.sanskara_dependents() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  s record;
  v_result jsonb := '[]'::jsonb;
begin
  for s in
    select d.id, d.display_name, d.birth_date, d.kul_family_member_id
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
        'kul_family_member_id', public.sanskara_resolve_tree_person(v_uid, s.kul_family_member_id),
        'can_edit', public.sanskara_can('write_record', s.id, v_uid),
        'can_manage', public.sanskara_can('manage_managers', s.id, v_uid),
        'records', public.sanskara_records_json_unchecked(s.id, true)));
    end if;
  end loop;
  return v_result;
end;
$$;

-- ── Privileges ───────────────────────────────────────────────────────────────────────────────────────────────────────
-- Same pattern as M2: clients get exactly the functions listed; everything internal is closed to every client role.
revoke all on function public.sanskara_create_dependent(uuid, text, date, uuid) from public, anon, service_role;
grant execute on function public.sanskara_create_dependent(uuid, text, date, uuid) to authenticated;
revoke all on function public.sanskara_set_kul_link(uuid, uuid, uuid) from public, anon, service_role;
grant execute on function public.sanskara_set_kul_link(uuid, uuid, uuid) to authenticated;
revoke all on function public.sanskara_viewer_kul(uuid) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_resolve_tree_person(uuid, uuid) from public, anon, authenticated, service_role;

commit;
