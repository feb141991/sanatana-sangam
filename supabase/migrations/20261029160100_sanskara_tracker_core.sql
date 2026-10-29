-- Sanskara tracker, migration M2 of 6: subjects, managers, records, private fields, grants (table only), request log,
-- audit, the single authorization function `sanskara_can`, and the read / write functions for the owner and managers.
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md; contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md (v0.2).
--
-- WHAT THIS MIGRATION DOES NOT DO (later migrations)
--   * M3: grant / revoke / list-access functions, the shared-with-me projection, claims (the hand-over at 18).
--   * M4: reminder subscriptions, the pending-candidate index, cancellation, the send-time check, the account-delete
--     additions. Until M4 no subscription exists, so there is no reminder to cancel when a record is edited,
--     completed or deleted; M4 adds the cancellation call to those functions (create or replace) in the same change that
--     creates the thing to cancel.
--   * M5: scheduled jobs (majority sweep, consent purge, retention). The authorization function derives the 18th
--     birthday and the 12-month window from the dates themselves, so correctness never depends on a job having run.
--   * M6: retirement of the old user_sanskaras / user_sanskars / sanskars tables.
--   * The rite catalogue (step 2). sanskara_rites is created with ONE technical row ('custom', a person-chosen
--     milestone). Until a reviewed catalogue adds rows, only custom milestones can be created. Nothing here asserts a
--     ritual rule, a timing or a tradition (backend AGENTS.md section 3).
--
-- HOW ACCESS WORKS
--   Every table has row level security enabled and FORCED, no policies, and no grants to anon / authenticated /
--   PUBLIC (the pattern of kul_family_link_invitations). Clients reach data only through the functions below, which
--   take the account from auth.uid(), never from an argument, and call sanskara_can first. `postgres` (the owner)
--   has BYPASSRLS on Supabase and 20+ tables here already force RLS; checked 2026-10-29.
--
-- ERRORS: functions raise short fixed messages with custom SQLSTATEs and never include record content:
--   SK401 not authenticated; SK403 consent to religious data required; SK404 not found OR not allowed (deliberately
--   the same, so existence is never revealed); SK400 invalid input; SK409 conflict (version, duplicate, request reuse);
--   SK422 a rule refuses it (limit, last manager, prenatal on a dependent, ...).
--
-- PRIVILEGE REVIEW: all functions are SECURITY DEFINER with an empty search_path and fully qualified names. EXECUTE is
-- revoked from PUBLIC and anon on all; `authenticated` keeps it only on the client functions listed at the end;
-- sanskara_can is for service_role and other definer functions; the internal helpers are for definer functions only.
--
-- Rollback guidance: supabase/rollbacks/20261029160100_sanskara_tracker_core_rollback.sql drops everything this
-- migration creates and DISCARDS ALL SANSKARA DATA. Safe to run before launch; after launch export first.

begin;

-- ── Rite reference (Class C, catalogue) ─────────────────────────────────────────────────────────────────────────────
-- Holds the data class of each rite so the server, never the client, decides how sensitive a record is.
create table public.sanskara_rites (
  rite_key text primary key check (rite_key ~ '^[a-z][a-z0-9_]{1,47}$'),
  sensitivity text not null check (sensitivity in ('A', 'B')),
  prenatal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint sanskara_rites_prenatal_is_class_a check (not prenatal or sensitivity = 'A'),
  constraint sanskara_rites_custom_is_class_a check (rite_key <> 'custom' or sensitivity = 'A')
);
-- A person-chosen milestone has a free-text title, and a field not yet classified is Class A (contract section 5), so
-- a custom milestone is Class A: never reached by a timeline grant, shareable only by an explicit per-record grant.
insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('custom', 'A', false);

-- ── Subjects ────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_subjects (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('account', 'dependent')),
  account_id uuid references auth.users(id) on delete cascade,
  display_name text check (display_name is null or (length(btrim(display_name)) between 1 and 40 and display_name !~ '[[:cntrl:]]')),
  birth_date date check (birth_date is null or birth_date >= date '2000-01-01'),
  state text not null default 'active' check (state in ('active', 'frozen')),
  frozen_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sanskara_subjects_kind_shape check (
    (kind = 'account' and account_id is not null and display_name is null and birth_date is null)
    or (kind = 'dependent' and account_id is null and display_name is not null and birth_date is not null)
  ),
  constraint sanskara_subjects_frozen_shape check ((state = 'frozen') = (frozen_at is not null))
);
create unique index sanskara_subjects_one_per_account on public.sanskara_subjects (account_id) where kind = 'account';

-- ── Managers of a dependent ─────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_subject_managers (
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  account_id uuid not null references auth.users(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (subject_id, account_id)
);
create index sanskara_subject_managers_account on public.sanskara_subject_managers (account_id);

create function public.sanskara_managers_dependents_only() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.sanskara_subjects s where s.id = new.subject_id and s.kind = 'dependent') then
    raise exception 'only a dependent has managers' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger sanskara_managers_dependents_only before insert or update of subject_id on public.sanskara_subject_managers
  for each row execute function public.sanskara_managers_dependents_only();

-- A dependent with no manager left is deleted, never exposed (deletion over disclosure; contract E9, E10). The functions
-- refuse to remove the last manager; this catches the cascade from a deleted manager account.
create function public.sanskara_delete_orphan_dependent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.sanskara_subject_managers m where m.subject_id = old.subject_id) then
    delete from public.sanskara_subjects s where s.id = old.subject_id and s.kind = 'dependent';
  end if;
  return old;
end $$;
create trigger sanskara_orphan_dependent after delete on public.sanskara_subject_managers
  for each row execute function public.sanskara_delete_orphan_dependent();

-- ── Records ─────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_records (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  rite_key text not null references public.sanskara_rites(rite_key),
  custom_title text check (custom_title is null or (length(btrim(custom_title)) between 1 and 60 and custom_title !~ '[[:cntrl:]]')),
  planned_date date check (planned_date is null or planned_date between date '1900-01-01' and date '2200-01-01'),
  completed_date date check (completed_date is null or completed_date between date '1900-01-01' and date '2200-01-01'),
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sanskara_records_custom_shape check ((rite_key = 'custom') = (custom_title is not null))
);
-- One record per rite per person; any number of custom milestones. (The old UNIQUE (user_id, sanskara_id) forbade the
-- same rite for two children of one parent.)
create unique index sanskara_records_one_per_rite on public.sanskara_records (subject_id, rite_key) where rite_key <> 'custom';
create index sanskara_records_subject on public.sanskara_records (subject_id);

-- A prenatal record belongs to the pregnant person's own timeline, never to a dependent (contract section 4, rule 4).
create function public.sanskara_enforce_record_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.sanskara_rites rt where rt.rite_key = new.rite_key and rt.prenatal)
     and not exists (select 1 from public.sanskara_subjects s where s.id = new.subject_id and s.kind = 'account') then
    raise exception 'a prenatal record belongs to the account holder''s own timeline' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger sanskara_enforce_record_rules before insert or update of subject_id, rite_key on public.sanskara_records
  for each row execute function public.sanskara_enforce_record_rules();

-- Class A fields live in their own table so no projection built for a viewer can join them by accident.
create table public.sanskara_record_private (
  record_id uuid primary key references public.sanskara_records(id) on delete cascade,
  notes text check (notes is null or length(notes) <= 2000),
  location text check (location is null or length(location) <= 120),
  performed_by text check (performed_by is null or length(performed_by) <= 120),
  expected_due_date date check (expected_due_date is null or expected_due_date between date '1900-01-01' and date '2200-01-01'),
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  constraint sanskara_record_private_not_empty check (
    notes is not null or location is not null or performed_by is not null or expected_due_date is not null)
);

-- The expected due date is stored on a prenatal record of an account holder and nowhere else (contract section 4).
create function public.sanskara_enforce_private_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.expected_due_date is not null and not exists (
    select 1
    from public.sanskara_records r
    join public.sanskara_rites rt on rt.rite_key = r.rite_key
    join public.sanskara_subjects s on s.id = r.subject_id
    where r.id = new.record_id and rt.prenatal and s.kind = 'account'
  ) then
    raise exception 'an expected due date belongs to a prenatal record on the account holder''s own timeline' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger sanskara_enforce_private_rules before insert or update of expected_due_date, record_id on public.sanskara_record_private
  for each row execute function public.sanskara_enforce_private_rules();

-- ── Grants (table only; the functions arrive in M3) ─────────────────────────────────────────────────────────────────
-- Created here so sanskara_can is written once, in full, and tested in full. `view` is the only level. kul_id is stored
-- so the audience boundary can be re-checked at every read.
create table public.sanskara_grants (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  grantee_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete cascade,
  kul_id uuid not null references public.kuls(id) on delete cascade,
  scope text not null check (scope in ('record', 'timeline')),
  record_id uuid references public.sanskara_records(id) on delete cascade,
  level text not null default 'view' check (level = 'view'),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  constraint sanskara_grants_scope_shape check ((scope = 'record') = (record_id is not null)),
  constraint sanskara_grants_not_self check (grantee_id <> granted_by)
);
create unique index sanskara_grants_live_record on public.sanskara_grants (grantee_id, record_id) where revoked_at is null and scope = 'record';
create unique index sanskara_grants_live_timeline on public.sanskara_grants (subject_id, grantee_id) where revoked_at is null and scope = 'timeline';
create index sanskara_grants_grantee on public.sanskara_grants (grantee_id) where revoked_at is null;
create index sanskara_grants_subject on public.sanskara_grants (subject_id);

-- ── Audit and idempotency ───────────────────────────────────────────────────────────────────────────────────────────
-- Metadata only (contract section 7): who, what, when. Never record content.
create table public.sanskara_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete cascade,
  action text not null check (action in (
    'dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
    'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted',
    'consent_suspended', 'purged')),
  subject_id uuid,
  target_id uuid references auth.users(id) on delete cascade,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object' and pg_column_size(detail) < 1024)
);
create index sanskara_audit_at on public.sanskara_audit (at);

-- One row per write request: a retry with the same request id returns the first response instead of repeating the work.
create table public.sanskara_request_log (
  account_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  operation text not null check (length(operation) between 1 and 40),
  result jsonb check (result is null or (jsonb_typeof(result) = 'object' and pg_column_size(result) < 1024)),
  created_at timestamptz not null default now(),
  primary key (account_id, request_id)
);
create index sanskara_request_log_created on public.sanskara_request_log (created_at);

-- ── Lock the tables ─────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['sanskara_rites', 'sanskara_subjects', 'sanskara_subject_managers', 'sanskara_records',
                           'sanskara_record_private', 'sanskara_grants', 'sanskara_audit', 'sanskara_request_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
revoke all on sequence public.sanskara_audit_id_seq from public, anon, authenticated;

comment on table public.sanskara_rites is 'Sanskara rite reference (data class per rite). One technical row until the reviewed catalogue (step 2) adds rites. Service role / definer functions only.';
comment on table public.sanskara_subjects is 'The person a Sanskara timeline is about: an account holder or a minor dependent. Never readable directly by clients.';
comment on table public.sanskara_records is 'One record per rite per subject. Dates and status only; free text lives in sanskara_record_private.';
comment on table public.sanskara_record_private is 'Class A fields (notes, place, performer, expected due date). Never joined into a projection for a viewer.';
comment on table public.sanskara_grants is 'View-only access between members of one Kul. Authority is re-checked at every read by sanskara_can; a grant outlives neither the membership nor the granter''s authority.';
comment on table public.sanskara_audit is 'Metadata-only audit trail for Sanskara sharing, management and deletion. Retained 12 months (contract section 7).';
comment on table public.sanskara_request_log is 'Idempotency log for Sanskara write functions; pruned after 7 days.';

-- ── The authorization function ──────────────────────────────────────────────────────────────────────────────────────
-- ONE implementation (contract R1). Every read and write function, the reminder producer and the send-time check call
-- this and nothing else decides access. Any error, missing row or disagreement answers false (contract P7).
--
-- Order: the acting account is active; the subject exists; a given record belongs to that subject; the role is derived
-- from verified relationships (never from a Kul role or the family tree); a viewer needs a live grant whose audience is
-- re-checked now; consent; then the action matrix. A record-less question from a viewer is always false.
--
-- Actions: read_meta (a record exists, its name or title, and whether it is complete), read_record (its dates),
-- read_private (Class A fields), write_record, delete_record, set_completion, manage_grants, manage_managers,
-- start_claim, subscribe, receive_reminder, export, delete_subject.
-- export, delete_record and delete_subject ignore consent, so a person who withdrew consent can still take their data or
-- erase it.
create function public.sanskara_can(p_action text, p_subject uuid, p_account uuid, p_record uuid default null)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_actor record;
  v_subject public.sanskara_subjects%rowtype;
  v_sensitivity text;
  v_adult_on date;
  v_role text := 'none';
  v_consent boolean;
begin
  if p_action is null or p_subject is null or p_account is null then return false; end if;
  if not (p_action = any (array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record', 'set_completion',
                                'manage_grants', 'manage_managers', 'start_claim', 'subscribe', 'receive_reminder',
                                'export', 'delete_subject'])) then
    return false;
  end if;

  -- 1. The acting account is active.
  select p.is_deleting, p.consent_religious_data into v_actor from public.profiles p where p.id = p_account;
  if not found or v_actor.is_deleting then return false; end if;

  -- 2. The subject exists, and a record named with it belongs to it.
  select * into v_subject from public.sanskara_subjects s where s.id = p_subject;
  if not found then return false; end if;
  if p_record is not null then
    select rt.sensitivity into v_sensitivity
    from public.sanskara_records r
    join public.sanskara_rites rt on rt.rite_key = r.rite_key
    where r.id = p_record and r.subject_id = p_subject;
    if not found then return false; end if;
  end if;

  -- 3. Role, from relationships the system verifies.
  if v_subject.kind = 'account' then
    if v_subject.account_id = p_account then v_role := 'owner'; end if;
  else
    v_adult_on := (v_subject.birth_date + interval '18 years')::date;
    if exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = p_account) then
      if v_today < v_adult_on then
        v_role := 'manager';
      elsif v_today < (v_adult_on + interval '12 months')::date then
        v_role := 'former_manager';
      end if;
    end if;
  end if;

  -- 4. A viewer: a live grant, with the audience re-checked now. Both the grantee and the person who granted must be in
  -- the grant's Kul in kul_members (the membership of record) AND profiles.kul_id must agree; any disagreement denies.
  -- The granter must still hold authority over the subject, so shares made by a parent stop when the child turns 18 and
  -- shares made by a removed manager stop with the removal.
  if v_role = 'none' then
    if p_record is null then return false; end if;
    if not exists (
      select 1
      from public.sanskara_grants g
      where g.subject_id = p_subject
        and g.grantee_id = p_account
        and g.revoked_at is null
        and g.level = 'view'
        and ((g.scope = 'record' and g.record_id = p_record) or (g.scope = 'timeline' and v_sensitivity = 'B'))
        and exists (select 1 from public.kul_members km where km.kul_id = g.kul_id and km.user_id = g.grantee_id)
        and exists (select 1 from public.profiles gp where gp.id = g.grantee_id and gp.kul_id = g.kul_id)
        and exists (select 1 from public.kul_members km where km.kul_id = g.kul_id and km.user_id = g.granted_by)
        and exists (select 1 from public.profiles gp where gp.id = g.granted_by and gp.kul_id = g.kul_id)
        and (
          (v_subject.kind = 'account' and v_subject.account_id = g.granted_by)
          or (v_subject.kind = 'dependent' and v_today < v_adult_on
              and exists (select 1 from public.sanskara_subject_managers mm where mm.subject_id = p_subject and mm.account_id = g.granted_by))
        )
    ) then
      return false;
    end if;
    v_role := case when v_sensitivity = 'B' then 'viewer' else 'viewer_minimal' end;
  end if;

  -- 5. Consent: the acting account's, and the subject's side (the account holder's; for a dependent, a current
  -- manager's; for a former manager, their own). Not asked for the actions that let a person leave or take their data.
  if not (p_action = any (array['export', 'delete_record', 'delete_subject'])) then
    if v_actor.consent_religious_data is not true then return false; end if;
    if v_subject.kind = 'account' then
      select (p.consent_religious_data and not p.is_deleting) into v_consent
      from public.profiles p where p.id = v_subject.account_id;
    elsif v_role = 'former_manager' then
      v_consent := true;  -- the former manager's own consent was checked above
    else
      select exists (
        select 1 from public.sanskara_subject_managers m
        join public.profiles p on p.id = m.account_id
        where m.subject_id = p_subject and p.consent_religious_data and not p.is_deleting
      ) into v_consent;
    end if;
    if v_consent is not true then return false; end if;
  end if;

  -- 6. The action matrix (contract section 6).
  return case v_role
    when 'owner' then p_action = any (array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record',
                                            'set_completion', 'manage_grants', 'subscribe', 'receive_reminder', 'export', 'delete_subject'])
    when 'manager' then p_action = any (array['read_meta', 'read_record', 'read_private', 'write_record', 'delete_record',
                                              'set_completion', 'manage_grants', 'manage_managers', 'start_claim', 'subscribe',
                                              'receive_reminder', 'export', 'delete_subject'])
    when 'former_manager' then p_action = any (array['read_meta', 'read_record', 'read_private', 'export'])
    when 'viewer' then p_action = any (array['read_meta', 'read_record', 'subscribe', 'receive_reminder'])
    when 'viewer_minimal' then p_action = 'read_meta'
    else false
  end;
exception when others then
  return false;
end;
$$;

-- ── Internal helpers (definer functions only) ───────────────────────────────────────────────────────────────────────

-- The acting account, from the session. Raises SK401 when signed out, SK404 when the profile is missing or in its
-- deletion cool-off, and SK403 when consent to religious data is required and not given.
create function public.sanskara_actor(p_need_consent boolean default true) returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_consent boolean;
  v_deleting boolean;
begin
  if v_uid is null then raise exception 'sanskara_not_authenticated' using errcode = 'SK401'; end if;
  select p.consent_religious_data, p.is_deleting into v_consent, v_deleting from public.profiles p where p.id = v_uid;
  if not found or v_deleting then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;
  if p_need_consent and not v_consent then raise exception 'sanskara_consent_required' using errcode = 'SK403'; end if;
  return v_uid;
end;
$$;

-- Claims a request id. Returns NULL for a first request (the id is now recorded, in the caller's transaction, so a
-- failure rolls the claim back and a retry is fresh). Returns the stored response, marked replayed, for a retry. A
-- concurrent identical request waits for the first to finish, then gets its response.
create function public.sanskara_claim_request(p_account uuid, p_request uuid, p_operation text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_operation text;
  v_result jsonb;
begin
  if p_request is null then raise exception 'sanskara_invalid_request' using errcode = 'SK400'; end if;
  insert into public.sanskara_request_log (account_id, request_id, operation)
  values (p_account, p_request, p_operation)
  on conflict (account_id, request_id) do nothing;
  if found then return null; end if;
  select l.operation, l.result into v_operation, v_result
  from public.sanskara_request_log l where l.account_id = p_account and l.request_id = p_request;
  if v_operation is distinct from p_operation or v_result is null then
    raise exception 'sanskara_request_conflict' using errcode = 'SK409';
  end if;
  return v_result || jsonb_build_object('replayed', true);
end;
$$;

create function public.sanskara_finish_request(p_account uuid, p_request uuid, p_result jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  update public.sanskara_request_log set result = p_result where account_id = p_account and request_id = p_request;
  return p_result;
end;
$$;

-- A subject's records as JSON. UNCHECKED: the caller must already have called sanskara_can for the subject.
create function public.sanskara_records_json_unchecked(p_subject uuid, p_include_private boolean) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'rite_key', r.rite_key,
    'custom_title', r.custom_title,
    'sensitivity', rt.sensitivity,
    'planned_date', r.planned_date,
    'completed_date', r.completed_date,
    'version', r.version,
    'private', case when p_include_private and pr.record_id is not null then jsonb_build_object(
        'notes', pr.notes, 'location', pr.location, 'performed_by', pr.performed_by,
        'expected_due_date', pr.expected_due_date, 'version', pr.version) end
  ) order by r.created_at, r.id), '[]'::jsonb)
  from public.sanskara_records r
  join public.sanskara_rites rt on rt.rite_key = r.rite_key
  left join public.sanskara_record_private pr on pr.record_id = r.id
  where r.subject_id = p_subject;
$$;

-- ── Client functions: reads ─────────────────────────────────────────────────────────────────────────────────────────

-- The caller's own timeline. Creates their account subject on first use.
create function public.sanskara_my_timeline() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_subject uuid;
begin
  insert into public.sanskara_subjects (kind, account_id) values ('account', v_uid)
  on conflict (account_id) where kind = 'account' do nothing;
  select s.id into v_subject from public.sanskara_subjects s where s.kind = 'account' and s.account_id = v_uid;
  if v_subject is null or not public.sanskara_can('read_private', v_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  return jsonb_build_object('subject_id', v_subject, 'records', public.sanskara_records_json_unchecked(v_subject, true));
end;
$$;

-- Dependents the caller manages (and former dependents they may still read for 12 months), with their records.
create function public.sanskara_dependents() returns jsonb
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

-- Everything the caller owns or may read as a manager (a former manager included, inside the 12 months), for download.
-- Allowed whatever the state of consent. Other people's accounts are not listed: grants are counted by scope, not by name.
create function public.sanskara_export_mine() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  s record;
  v_subjects jsonb := '[]'::jsonb;
begin
  for s in
    select d.id, d.kind, d.display_name, d.birth_date
    from public.sanskara_subjects d
    where (d.kind = 'account' and d.account_id = v_uid)
       or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = d.id and m.account_id = v_uid)
    order by d.created_at, d.id
  loop
    if public.sanskara_can('export', s.id, v_uid) then
      v_subjects := v_subjects || jsonb_build_array(jsonb_build_object(
        'id', s.id,
        'kind', s.kind,
        'display_name', s.display_name,
        'birth_date', s.birth_date,
        'role', case when s.kind = 'account' then 'owner'
                     when public.sanskara_can('write_record', s.id, v_uid) then 'manager'
                     else 'former_manager' end,
        'records', public.sanskara_records_json_unchecked(s.id, true),
        'grants', coalesce((select jsonb_agg(jsonb_build_object(
                      'scope', g.scope, 'record_id', g.record_id, 'created_at', g.created_at, 'revoked_at', g.revoked_at)
                      order by g.created_at, g.id)
                    from public.sanskara_grants g where g.subject_id = s.id), '[]'::jsonb)));
    end if;
  end loop;
  return jsonb_build_object('generated_at', now(), 'subjects', v_subjects);
end;
$$;

-- ── Client functions: writes ────────────────────────────────────────────────────────────────────────────────────────
-- Each takes a request id (a retry returns the first response) and calls sanskara_can before touching anything.
-- Responses are small objects; the screen reloads the timeline.

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

create function public.sanskara_create_record(p_request_id uuid, p_subject uuid, p_rite_key text, p_custom_title text, p_planned_date date)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_rite public.sanskara_rites%rowtype;
  v_kind text;
  v_title text := nullif(btrim(p_custom_title), '');
  v_record uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'create_record');
  if v_replay is not null then return v_replay; end if;

  if not public.sanskara_can('write_record', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  perform 1 from public.sanskara_subjects s where s.id = p_subject for update;

  select * into v_rite from public.sanskara_rites r where r.rite_key = p_rite_key;
  if not found then raise exception 'sanskara_unknown_rite' using errcode = 'SK400'; end if;
  if v_rite.rite_key = 'custom' then
    if v_title is null or length(v_title) > 60 or v_title ~ '[[:cntrl:]]' then
      raise exception 'sanskara_invalid_title' using errcode = 'SK400';
    end if;
  elsif v_title is not null then
    raise exception 'sanskara_invalid_title' using errcode = 'SK400';
  end if;
  if p_planned_date is not null and p_planned_date not between date '1900-01-01' and date '2200-01-01' then
    raise exception 'sanskara_invalid_date' using errcode = 'SK400';
  end if;
  select s.kind into v_kind from public.sanskara_subjects s where s.id = p_subject;
  if v_rite.prenatal and v_kind <> 'account' then
    raise exception 'sanskara_prenatal_own_timeline_only' using errcode = 'SK422';
  end if;
  if (select count(*) from public.sanskara_records r where r.subject_id = p_subject) >= 100 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;

  begin
    insert into public.sanskara_records (subject_id, rite_key, custom_title, planned_date, created_by)
    values (p_subject, p_rite_key, v_title, p_planned_date, v_uid)
    returning id into v_record;
  exception when unique_violation then
    raise exception 'sanskara_already_exists' using errcode = 'SK409';
  end;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'record_created', p_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', v_record, 'version', 1));
end;
$$;

-- Changes a record's title (custom milestones only) and planned date. The client sends the version it last saw.
-- M4 adds: supersede the pending reminders when the date changes.
create function public.sanskara_update_record(p_request_id uuid, p_record uuid, p_custom_title text, p_planned_date date, p_expected_version integer)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_subject uuid;
  v_rite_key text;
  v_version integer;
  v_title text := nullif(btrim(p_custom_title), '');
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'update_record');
  if v_replay is not null then return v_replay; end if;

  select r.subject_id into v_subject from public.sanskara_records r where r.id = p_record;
  if v_subject is null or not public.sanskara_can('write_record', v_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select r.rite_key, r.version into v_rite_key, v_version from public.sanskara_records r where r.id = p_record for update;
  if v_version is distinct from p_expected_version then
    raise exception 'sanskara_version_conflict' using errcode = 'SK409';
  end if;

  if v_rite_key = 'custom' then
    if v_title is null or length(v_title) > 60 or v_title ~ '[[:cntrl:]]' then
      raise exception 'sanskara_invalid_title' using errcode = 'SK400';
    end if;
  elsif v_title is not null then
    raise exception 'sanskara_invalid_title' using errcode = 'SK400';
  end if;
  if p_planned_date is not null and p_planned_date not between date '1900-01-01' and date '2200-01-01' then
    raise exception 'sanskara_invalid_date' using errcode = 'SK400';
  end if;

  update public.sanskara_records
  set custom_title = v_title, planned_date = p_planned_date, version = version + 1, updated_at = now()
  where id = p_record
  returning version into v_version;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_record, 'version', v_version));
end;
$$;

-- Class A fields. p_expected_version is the private block's version as last seen (0 when there is none yet). Every
-- field empty removes the block.
create function public.sanskara_save_private(
  p_request_id uuid, p_record uuid, p_notes text, p_location text, p_performed_by text, p_expected_due_date date, p_expected_version integer)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_subject uuid;
  v_current integer;
  v_notes text := nullif(btrim(p_notes), '');
  v_location text := nullif(btrim(p_location), '');
  v_performed_by text := nullif(btrim(p_performed_by), '');
  v_version integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'save_private');
  if v_replay is not null then return v_replay; end if;

  select r.subject_id into v_subject from public.sanskara_records r where r.id = p_record;
  if v_subject is null or not public.sanskara_can('write_record', v_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  if v_notes is not null and (length(v_notes) > 2000 or v_notes ~ E'[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]') then
    raise exception 'sanskara_invalid_text' using errcode = 'SK400';
  end if;
  if v_location is not null and (length(v_location) > 120 or v_location ~ '[[:cntrl:]]') then
    raise exception 'sanskara_invalid_text' using errcode = 'SK400';
  end if;
  if v_performed_by is not null and (length(v_performed_by) > 120 or v_performed_by ~ '[[:cntrl:]]') then
    raise exception 'sanskara_invalid_text' using errcode = 'SK400';
  end if;
  if p_expected_due_date is not null then
    if p_expected_due_date not between date '1900-01-01' and date '2200-01-01' then
      raise exception 'sanskara_invalid_date' using errcode = 'SK400';
    end if;
    if not exists (
      select 1 from public.sanskara_records r
      join public.sanskara_rites rt on rt.rite_key = r.rite_key
      join public.sanskara_subjects s on s.id = r.subject_id
      where r.id = p_record and rt.prenatal and s.kind = 'account'
    ) then
      raise exception 'sanskara_due_date_not_allowed' using errcode = 'SK422';
    end if;
  end if;

  perform 1 from public.sanskara_records r where r.id = p_record for update;
  select pr.version into v_current from public.sanskara_record_private pr where pr.record_id = p_record;
  v_current := coalesce(v_current, 0);
  if v_current is distinct from p_expected_version then
    raise exception 'sanskara_version_conflict' using errcode = 'SK409';
  end if;

  if v_notes is null and v_location is null and v_performed_by is null and p_expected_due_date is null then
    delete from public.sanskara_record_private where record_id = p_record;
    v_version := 0;
  elsif v_current = 0 then
    insert into public.sanskara_record_private (record_id, notes, location, performed_by, expected_due_date)
    values (p_record, v_notes, v_location, v_performed_by, p_expected_due_date);
    v_version := 1;
  else
    update public.sanskara_record_private
    set notes = v_notes, location = v_location, performed_by = v_performed_by, expected_due_date = p_expected_due_date,
        version = version + 1, updated_at = now()
    where record_id = p_record
    returning version into v_version;
  end if;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_record, 'private_version', v_version));
end;
$$;

-- Marks a record complete on a date, or reopens it (null). M4 adds: completion cancels every subscriber's pending reminders.
create function public.sanskara_set_completion(p_request_id uuid, p_record uuid, p_completed_date date, p_expected_version integer)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_subject uuid;
  v_version integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'set_completion');
  if v_replay is not null then return v_replay; end if;

  select r.subject_id into v_subject from public.sanskara_records r where r.id = p_record;
  if v_subject is null or not public.sanskara_can('set_completion', v_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select r.version into v_version from public.sanskara_records r where r.id = p_record for update;
  if v_version is distinct from p_expected_version then
    raise exception 'sanskara_version_conflict' using errcode = 'SK409';
  end if;
  -- A day of slack for a timezone ahead of UTC; a date further out is not a completion.
  if p_completed_date is not null and (p_completed_date < date '1900-01-01'
     or p_completed_date > (now() at time zone 'utc')::date + 1) then
    raise exception 'sanskara_invalid_date' using errcode = 'SK400';
  end if;

  update public.sanskara_records
  set completed_date = p_completed_date, version = version + 1, updated_at = now()
  where id = p_record
  returning version into v_version;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_record, 'version', v_version));
end;
$$;

-- Deleting never needs consent (a person who withdrew it can still erase). M4 adds: cancel the record's reminders.
create function public.sanskara_delete_record(p_request_id uuid, p_record uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  v_replay jsonb;
  v_subject uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'delete_record');
  if v_replay is not null then return v_replay; end if;

  select r.subject_id into v_subject from public.sanskara_records r where r.id = p_record;
  if v_subject is null or not public.sanskara_can('delete_record', v_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  delete from public.sanskara_records where id = p_record;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'record_deleted', v_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_record, 'deleted', true));
end;
$$;

-- Adds another manager to a dependent. The new manager must be a current member of the caller's Kul.
create function public.sanskara_add_manager(p_request_id uuid, p_subject uuid, p_account uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_kul uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'add_manager');
  if v_replay is not null then return v_replay; end if;

  if p_account is null or not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  perform 1 from public.sanskara_subjects s where s.id = p_subject for update;

  select km.kul_id into v_kul
  from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
  where km.user_id = v_uid;
  if v_kul is null or not exists (
    select 1 from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
    where km.user_id = p_account and km.kul_id = v_kul and not p.is_deleting
  ) then
    raise exception 'sanskara_not_in_your_kul' using errcode = 'SK422';
  end if;
  if exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = p_account) then
    raise exception 'sanskara_already_manager' using errcode = 'SK409';
  end if;
  if (select count(*) from public.sanskara_subject_managers m where m.subject_id = p_subject) >= 4 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;

  insert into public.sanskara_subject_managers (subject_id, account_id, added_by) values (p_subject, p_account, v_uid);
  insert into public.sanskara_audit (actor_id, action, subject_id, target_id) values (v_uid, 'manager_added', p_subject, p_account);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_subject));
end;
$$;

-- Removes a manager (possibly the caller). The last manager cannot be removed. M4 adds: cancel the removed manager's reminders.
create function public.sanskara_remove_manager(p_request_id uuid, p_subject uuid, p_account uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'remove_manager');
  if v_replay is not null then return v_replay; end if;

  if p_account is null or not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  -- The subject row is the lock that serialises concurrent add / remove, so two managers cannot remove each other.
  perform 1 from public.sanskara_subjects s where s.id = p_subject for update;
  if not exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = p_account) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  if (select count(*) from public.sanskara_subject_managers m where m.subject_id = p_subject) <= 1 then
    raise exception 'sanskara_last_manager' using errcode = 'SK422';
  end if;

  delete from public.sanskara_subject_managers where subject_id = p_subject and account_id = p_account;
  insert into public.sanskara_audit (actor_id, action, subject_id, target_id) values (v_uid, 'manager_removed', p_subject, p_account);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_subject));
end;
$$;

-- Erases a dependent and everything about them. Any current manager may (deletion over disclosure); a former manager may not.
create function public.sanskara_delete_dependent(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  v_replay jsonb;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'delete_dependent');
  if v_replay is not null then return v_replay; end if;

  if not exists (select 1 from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent')
     or not public.sanskara_can('delete_subject', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  delete from public.sanskara_subjects where id = p_subject;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'dependent_deleted', p_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_subject, 'deleted', true));
end;
$$;

-- Erases the caller's own timeline (their account subject and its records). Dependents they manage are not touched.
create function public.sanskara_delete_mine(p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  v_replay jsonb;
  v_subject uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'delete_mine');
  if v_replay is not null then return v_replay; end if;

  select s.id into v_subject from public.sanskara_subjects s where s.kind = 'account' and s.account_id = v_uid;
  if v_subject is null then
    return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('deleted', false));
  end if;
  if not public.sanskara_can('delete_subject', v_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  delete from public.sanskara_subjects where id = v_subject;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'subject_deleted', v_subject);

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('deleted', true));
end;
$$;

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  -- Client functions: signed-in users only.
  foreach f in array array[
    'public.sanskara_my_timeline()',
    'public.sanskara_dependents()',
    'public.sanskara_export_mine()',
    'public.sanskara_create_dependent(uuid, text, date)',
    'public.sanskara_create_record(uuid, uuid, text, text, date)',
    'public.sanskara_update_record(uuid, uuid, text, date, integer)',
    'public.sanskara_save_private(uuid, uuid, text, text, text, date, integer)',
    'public.sanskara_set_completion(uuid, uuid, date, integer)',
    'public.sanskara_delete_record(uuid, uuid)',
    'public.sanskara_add_manager(uuid, uuid, uuid)',
    'public.sanskara_remove_manager(uuid, uuid, uuid)',
    'public.sanskara_delete_dependent(uuid, uuid)',
    'public.sanskara_delete_mine(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;

  -- Internal: definer functions (and, for sanskara_can, the service role's server code) only.
  foreach f in array array[
    'public.sanskara_can(text, uuid, uuid, uuid)',
    'public.sanskara_actor(boolean)',
    'public.sanskara_claim_request(uuid, uuid, text)',
    'public.sanskara_finish_request(uuid, uuid, jsonb)',
    'public.sanskara_records_json_unchecked(uuid, boolean)',
    'public.sanskara_managers_dependents_only()',
    'public.sanskara_delete_orphan_dependent()',
    'public.sanskara_enforce_record_rules()',
    'public.sanskara_enforce_private_rules()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
  grant execute on function public.sanskara_can(text, uuid, uuid, uuid) to service_role;
end $$;

commit;
