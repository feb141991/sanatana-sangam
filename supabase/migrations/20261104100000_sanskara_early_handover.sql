-- Sanskara tracker: hand-over of a child's records BEFORE 18, with every manager's permission.
-- Scope: docs/SANSKARA_HANDOVER_SCOPE.md section 3. Depends on M1 to M4a. NOT applied to any database by this commit.
--
-- THIS IS OFF. Nothing here works until the founder inserts the age floor (see "Switching it on"). It is built so that the
-- legal and policy decisions D-B to D-E in the scope document are settings and defaults the founder can change, not code.
--
-- DEFAULTS CHOSEN (the scope document's recommendations; D-B to D-E are still the founder's, and D-C needs a lawyer)
--   D-B  Who may have a timeline of their own: nobody, until sanskara_settings has an 'early_handover_min_age' row (10 to 17).
--   D-D  After the transfer the parents lose access completely, exactly as at 18. No read-only view is kept.
--   D-E  Not reversible. The records move and the dependent is deleted. The parents' screen must say so before they agree.
--
-- THE FLOW (five steps; the token is the same kind of secret as the claim token at 18)
--   1. start    A manager starts it. A one-time token is returned to them ONCE (only its SHA-256 is stored). Their own approval
--               counts. With one manager the hand-over is ready at once; otherwise every other manager must approve.
--   2. approve  Each other current manager approves. One parent cannot override another: ready only when ALL current managers agree.
--   3. accept   The child, signed in to their OWN account, enters the token. Nothing moves yet. The account must (a) not be a manager,
--               (b) have consented to religious data, and (c) carry a profile date of birth EQUAL to the child's birth date. (c) is
--               an automatic sanity check, not proof of identity; it fails closed (a profile without a date of birth cannot accept).
--   4. confirm  The manager who started it sees WHO accepted (username and name) and confirms. Only now do the records move.
--   5. cancel   Any current manager can cancel at any step. The token then stops working.
--
-- WHAT KEEPS IT SAFE
--   * Every step re-checks the feature switch, the age window (floor <= age < 18 by the UTC date, like sanskara_can), and the live
--     manager list. Adding or removing a manager resets the approvals and clears an acceptor (trigger): what people agreed to is
--     what exists now. Removing the initiator cancels it.
--   * Every failure of the token (unknown, wrong state, expired, not eligible) answers the same SK404, so the token space cannot be probed.
--   * One open hand-over per child (partial unique index). 7 days to finish; expiry is read from the clock, not from a job.
--   * The records move with the same rules as the hand-over at 18 (the person's own record for a rite wins; custom milestones all move;
--     100 records at most; all shares end; followers lose access). That logic lives in sanskara_move_records_early below. The hand-over
--     at 18 (sanskara_accept_claim) is NOT changed by this migration; the two bodies are equivalent and a follow-up can make
--     one call the other.
--   * No notification, no analytics event. Audit rows are metadata only (the child id, who acted, a step); no name, no record.
--   * New tables have forced RLS, no policies, and no client grants. Settings can only be written by the project owner.
--
-- Switching it on (founder, after the decisions and the lawyer): insert into public.sanskara_settings (key, int_value)
--   values ('early_handover_min_age', <age>);   Switching it off: delete that row. A hand-over already awaiting confirmation then
--   cannot be accepted or confirmed (it can still be cancelled).
--
-- ROC pre-flight: no existing function is redefined or has its signature changed (no PGRST203); the only existing object altered
-- is the CHECK constraint on sanskara_audit.action (extended by five values, carrying every value production has now; the table was empty on 2026-11-03, and ADD CONSTRAINT
-- scans it under a brief ACCESS EXCLUSIVE lock). No data is updated and no default changes. Rollback:
-- supabase/rollbacks/20261104100000_sanskara_early_handover_rollback.sql (it deletes the five new audit action values first).

begin;

-- ── Audit actions ───────────────────────────────────────────────────────────────────────────────────────────────────
-- The list below is production's CURRENT list (read 2026-11-04: it already holds the two kul_link_* values added by 20261030100000)
-- plus five. Restating a constraint replaces it, so anything added since must be carried: a value left out here would make its
-- writes fail with 23514. sanskara_early_handover.test.sql inserts every value to prove none was lost.
alter table public.sanskara_audit drop constraint sanskara_audit_action_check;
alter table public.sanskara_audit add constraint sanskara_audit_action_check check (action in (
  'dependent_created', 'dependent_deleted', 'subject_deleted', 'record_created', 'record_deleted',
  'grant_created', 'grant_revoked', 'manager_added', 'manager_removed', 'claim_started', 'claim_accepted',
  'consent_suspended', 'purged', 'kul_link_set', 'kul_link_cleared',
  'early_handover_started', 'early_handover_approved', 'early_handover_cancelled', 'early_handover_accepted', 'early_handover_confirmed'));

-- ── Settings ────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_settings (
  key text primary key check (key in ('early_handover_min_age')),
  int_value integer not null,
  updated_at timestamptz not null default now(),
  -- The age floor is a minor's age: 10 to 17. Anything else is a mistake, not a policy.
  constraint sanskara_settings_min_age_range check (key <> 'early_handover_min_age' or int_value between 10 and 17)
);
alter table public.sanskara_settings enable row level security;
alter table public.sanskara_settings force row level security;
revoke all on table public.sanskara_settings from public, anon, authenticated;
grant all on table public.sanskara_settings to service_role;
comment on table public.sanskara_settings is 'Switches for the Sanskara tracker that are policy, not code. No row for early_handover_min_age means the hand-over before 18 is off. Never readable by clients.';

create function public.sanskara_early_min_age() returns integer
language sql stable security definer set search_path = ''
as $$ select s.int_value from public.sanskara_settings s where s.key = 'early_handover_min_age' $$;

-- ── Hand-overs and approvals ────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_early_handovers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'awaiting_approval' check (status in ('awaiting_approval', 'ready', 'awaiting_confirmation', 'cancelled')),
  claimant_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint sanskara_early_window check (expires_at > created_at),
  constraint sanskara_early_claimant_only_when_accepted check (claimant_id is null or status = 'awaiting_confirmation')
);
create unique index sanskara_early_one_open on public.sanskara_early_handovers (subject_id)
  where status in ('awaiting_approval', 'ready', 'awaiting_confirmation');

create table public.sanskara_early_approvals (
  handover_id uuid not null references public.sanskara_early_handovers(id) on delete cascade,
  manager_id uuid not null references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (handover_id, manager_id)
);

alter table public.sanskara_early_handovers enable row level security;
alter table public.sanskara_early_handovers force row level security;
alter table public.sanskara_early_approvals enable row level security;
alter table public.sanskara_early_approvals force row level security;
revoke all on table public.sanskara_early_handovers, public.sanskara_early_approvals from public, anon, authenticated;
grant all on table public.sanskara_early_handovers, public.sanskara_early_approvals to service_role;
comment on table public.sanskara_early_handovers is 'A hand-over of a child''s records before 18, with every manager''s permission. Only the SHA-256 of the token is stored. Never readable by clients.';

-- ── Internal: is this child inside the early window right now? ──────────────────────────────────────────────────────
-- true when the feature is on, the child is under 18 and at or past the age floor (all by the UTC civil date, like sanskara_can).
create function public.sanskara_early_in_window(p_subject uuid) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min integer := public.sanskara_early_min_age();
  v_birth date;
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_min is null then return false; end if;
  select s.birth_date into v_birth from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent';
  if v_birth is null then return false; end if;
  return v_today >= (v_birth + make_interval(years => v_min))::date and v_today < (v_birth + interval '18 years')::date;
end;
$$;

-- ── Internal: move a child's records to an account's own timeline and delete the child ──────────────────────────────
-- The same rules as sanskara_accept_claim: the person's own record for a rite wins and the dependent's is dropped (never merged);
-- custom milestones all move; 100 records at most; every share ends; followers lose access; the dependent goes with its managers.
create function public.sanskara_move_records_early(p_subject uuid, p_account uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_mine uuid;
  v_moved integer;
  v_dropped integer;
begin
  insert into public.sanskara_subjects (kind, account_id) values ('account', p_account)
  on conflict (account_id) where kind = 'account' do nothing;
  select s.id into v_mine from public.sanskara_subjects s where s.kind = 'account' and s.account_id = p_account;
  perform 1 from public.sanskara_subjects s where s.id in (v_mine, p_subject) order by s.id for update;

  if (select count(*) from public.sanskara_records r where r.subject_id = v_mine)
     + (select count(*) from public.sanskara_records r
        where r.subject_id = p_subject
          and (r.rite_key = 'custom' or not exists (select 1 from public.sanskara_records c where c.subject_id = v_mine and c.rite_key = r.rite_key))) > 100 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;
  begin
    update public.sanskara_records r
    set subject_id = v_mine, version = r.version + 1, updated_at = now()
    where r.subject_id = p_subject
      and (r.rite_key = 'custom' or not exists (select 1 from public.sanskara_records c where c.subject_id = v_mine and c.rite_key = r.rite_key));
    get diagnostics v_moved = row_count;
  exception when unique_violation then
    raise exception 'sanskara_conflict' using errcode = 'SK409';
  end;
  select count(*) into v_dropped from public.sanskara_records r where r.subject_id = p_subject;

  -- Every share ends with the dependent (grants cascade from the subject); followers lose access through the hook.
  perform public.sanskara_on_access_lost(v_mine, null);
  delete from public.sanskara_subjects where id = p_subject;
  return jsonb_build_object('moved', v_moved, 'dropped_as_duplicates', v_dropped);
end;
$$;

-- ── 1. Start ────────────────────────────────────────────────────────────────────────────────────────────────────────
create function public.sanskara_start_early_handover(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_token text;
  v_id uuid;
  v_status text;
  v_managers integer;
  v_need integer;
  v_expires timestamptz := now() + interval '7 days';
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'start_early_handover');
  if v_replay is not null then return v_replay; end if;

  if public.sanskara_early_min_age() is null then
    raise exception 'sanskara_early_handover_not_available' using errcode = 'SK422';
  end if;
  if not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  if not public.sanskara_early_in_window(p_subject) then
    raise exception 'sanskara_early_handover_age' using errcode = 'SK422';
  end if;

  -- One open hand-over per child; a new start cancels the old one (as a new claim at 18 does).
  perform pg_advisory_xact_lock(hashtextextended('sanskara-early:' || p_subject::text, 0));
  update public.sanskara_early_handovers set status = 'cancelled', claimant_id = null, responded_at = now()
  where subject_id = p_subject and status in ('awaiting_approval', 'ready', 'awaiting_confirmation');

  select count(*) into v_managers from public.sanskara_subject_managers m where m.subject_id = p_subject;
  v_status := case when v_managers <= 1 then 'ready' else 'awaiting_approval' end;
  v_need := greatest(v_managers - 1, 0);

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.sanskara_early_handovers (subject_id, initiated_by, token_hash, status, expires_at)
  values (p_subject, v_uid, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_status, v_expires)
  returning id into v_id;
  insert into public.sanskara_early_approvals (handover_id, manager_id) values (v_id, v_uid);
  insert into public.sanskara_audit (actor_id, action, subject_id, detail)
  values (v_uid, 'early_handover_started', p_subject, jsonb_build_object('step', 'start'));

  -- The stored response (used for a retry) omits the token: a lost response means starting again, which cancels this one.
  perform public.sanskara_finish_request(v_uid, p_request_id,
    jsonb_build_object('handover_id', v_id, 'status', v_status, 'approvals_needed', v_need, 'expires_at', v_expires));
  return jsonb_build_object('handover_id', v_id, 'status', v_status, 'approvals_needed', v_need, 'expires_at', v_expires, 'token', v_token);
end;
$$;

-- ── 2. Approve ──────────────────────────────────────────────────────────────────────────────────────────────────────
create function public.sanskara_approve_early_handover(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  h public.sanskara_early_handovers%rowtype;
  v_need integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'approve_early_handover');
  if v_replay is not null then return v_replay; end if;

  if public.sanskara_early_min_age() is null or not public.sanskara_can('manage_managers', p_subject, v_uid)
     or not public.sanskara_early_in_window(p_subject) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select * into h from public.sanskara_early_handovers x
  where x.subject_id = p_subject and x.status in ('awaiting_approval', 'ready') and x.expires_at > now() for update;
  if not found then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;

  insert into public.sanskara_early_approvals (handover_id, manager_id) values (h.id, v_uid) on conflict do nothing;
  if found then
    insert into public.sanskara_audit (actor_id, action, subject_id, detail)
    values (v_uid, 'early_handover_approved', p_subject, jsonb_build_object('step', 'approve'));
  end if;

  select count(*) into v_need from public.sanskara_subject_managers m
  where m.subject_id = p_subject and not exists (select 1 from public.sanskara_early_approvals a where a.handover_id = h.id and a.manager_id = m.account_id);
  if v_need = 0 and h.status = 'awaiting_approval' then
    update public.sanskara_early_handovers set status = 'ready' where id = h.id;
    h.status := 'ready';
  end if;
  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('status', h.status, 'approvals_needed', v_need));
end;
$$;

-- ── 5. Cancel (any current manager, at any step, even when the feature has been switched off) ───────────────────────
create function public.sanskara_cancel_early_handover(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_n integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'cancel_early_handover');
  if v_replay is not null then return v_replay; end if;
  if not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  update public.sanskara_early_handovers set status = 'cancelled', claimant_id = null, responded_at = now()
  where subject_id = p_subject and status in ('awaiting_approval', 'ready', 'awaiting_confirmation');
  get diagnostics v_n = row_count;
  if v_n > 0 then
    insert into public.sanskara_audit (actor_id, action, subject_id, detail)
    values (v_uid, 'early_handover_cancelled', p_subject, jsonb_build_object('step', 'cancel'));
  end if;
  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('cancelled', v_n > 0));
end;
$$;

-- ── 3. Accept (the child, from their own account; nothing moves) ────────────────────────────────────────────────────
create function public.sanskara_accept_early_handover(p_request_id uuid, p_token text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  h public.sanskara_early_handovers%rowtype;
  v_birth date;
  v_dob date;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'accept_early_handover');
  if v_replay is not null then return v_replay; end if;

  if p_token is null or p_token !~ '^[0-9a-f]{64}$' or public.sanskara_early_min_age() is null then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select * into h from public.sanskara_early_handovers x
  where x.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and x.status = 'ready' and x.expires_at > now() for update;
  if not found then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;

  select s.birth_date into v_birth from public.sanskara_subjects s where s.id = h.subject_id and s.kind = 'dependent';
  select p.date_of_birth into v_dob from public.profiles p where p.id = v_uid;
  if v_birth is null or not public.sanskara_early_in_window(h.subject_id)
     or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = h.subject_id and m.account_id = v_uid)
     or v_dob is distinct from v_birth
     or exists (  -- every current manager still agrees
       select 1 from public.sanskara_subject_managers m
       where m.subject_id = h.subject_id and not exists (select 1 from public.sanskara_early_approvals a where a.handover_id = h.id and a.manager_id = m.account_id)) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  update public.sanskara_early_handovers set status = 'awaiting_confirmation', claimant_id = v_uid where id = h.id;
  insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
  values (v_uid, 'early_handover_accepted', h.subject_id, h.initiated_by, jsonb_build_object('step', 'accept'));
  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('status', 'awaiting_confirmation'));
end;
$$;

-- ── 4. Confirm (the manager who started it; now the records move) ───────────────────────────────────────────────────
create function public.sanskara_confirm_early_handover(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  h public.sanskara_early_handovers%rowtype;
  v_birth date;
  v_dob date;
  v_result jsonb;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'confirm_early_handover');
  if v_replay is not null then return v_replay; end if;

  if public.sanskara_early_min_age() is null or not public.sanskara_can('manage_managers', p_subject, v_uid)
     or not public.sanskara_early_in_window(p_subject) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select * into h from public.sanskara_early_handovers x
  where x.subject_id = p_subject and x.status = 'awaiting_confirmation' and x.initiated_by = v_uid and x.expires_at > now() for update;
  if not found or h.claimant_id is null then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;

  -- The acceptor must still be eligible: consent, not a manager, and the date of birth still matches.
  select s.birth_date into v_birth from public.sanskara_subjects s where s.id = p_subject;
  select p.date_of_birth into v_dob from public.profiles p
  where p.id = h.claimant_id and p.consent_religious_data is true and not p.is_deleting;
  if v_dob is distinct from v_birth
     or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = h.claimant_id)
     or exists (
       select 1 from public.sanskara_subject_managers m
       where m.subject_id = p_subject and not exists (select 1 from public.sanskara_early_approvals a where a.handover_id = h.id and a.manager_id = m.account_id)) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
  values (v_uid, 'early_handover_confirmed', p_subject, h.claimant_id, jsonb_build_object('step', 'confirm'));
  v_result := public.sanskara_move_records_early(p_subject, h.claimant_id);  -- deletes the dependent and, by cascade, this hand-over
  return public.sanskara_finish_request(v_uid, p_request_id, v_result);
end;
$$;

-- ── Status (managers only) ──────────────────────────────────────────────────────────────────────────────────────────
create function public.sanskara_early_handover_status(p_subject uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  h public.sanskara_early_handovers%rowtype;
  v_min integer := public.sanskara_early_min_age();
  v_available boolean;
  v_have integer;
  v_total integer;
  v_state text := 'none';
  v_acceptor jsonb := null;
  v_open boolean;
begin
  if not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  v_available := public.sanskara_early_in_window(p_subject);
  select * into h from public.sanskara_early_handovers x
  where x.subject_id = p_subject and x.status in ('awaiting_approval', 'ready', 'awaiting_confirmation') order by x.created_at desc limit 1;
  v_open := found;
  if v_open then
    v_state := case when h.expires_at <= now() then 'expired' else h.status end;
    if v_state = 'awaiting_confirmation' and h.initiated_by = v_uid and h.claimant_id is not null then
      select jsonb_build_object('id', p.id, 'username', p.username, 'full_name', p.full_name) into v_acceptor
      from public.profiles p where p.id = h.claimant_id;
    end if;
  end if;
  select count(*) into v_total from public.sanskara_subject_managers m where m.subject_id = p_subject;
  select count(*) into v_have from public.sanskara_early_approvals a
  where v_open and a.handover_id = h.id and exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = a.manager_id);
  return jsonb_build_object(
    'available', coalesce(v_available, false), 'min_age', v_min, 'state', v_state,
    'approvals_have', case when v_state = 'none' then 0 else v_have end, 'approvals_total', v_total,
    'i_approved', v_state <> 'none' and exists (select 1 from public.sanskara_early_approvals a where a.handover_id = h.id and a.manager_id = v_uid),
    'i_started', v_state <> 'none' and h.initiated_by = v_uid,
    'expires_at', case when v_state = 'none' then null else h.expires_at end,
    'acceptor', v_acceptor);
end;
$$;

-- ── Manager list changes: what people agreed to is what exists now ──────────────────────────────────────────────────
create function public.sanskara_early_managers_changed() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_subject uuid := coalesce(new.subject_id, old.subject_id);
  h public.sanskara_early_handovers%rowtype;
  v_total integer;
begin
  select * into h from public.sanskara_early_handovers x
  where x.subject_id = v_subject and x.status in ('awaiting_approval', 'ready', 'awaiting_confirmation') for update;
  if not found then return null; end if;
  delete from public.sanskara_early_approvals where handover_id = h.id;
  if not exists (select 1 from public.sanskara_subject_managers m where m.subject_id = v_subject and m.account_id = h.initiated_by) then
    update public.sanskara_early_handovers set status = 'cancelled', claimant_id = null, responded_at = now() where id = h.id;
  else
    insert into public.sanskara_early_approvals (handover_id, manager_id) values (h.id, h.initiated_by);
    select count(*) into v_total from public.sanskara_subject_managers m where m.subject_id = v_subject;
    update public.sanskara_early_handovers
    set status = case when v_total <= 1 then 'ready' else 'awaiting_approval' end, claimant_id = null
    where id = h.id;
  end if;
  return null;
end;
$$;
create trigger sanskara_early_managers_changed after insert or delete on public.sanskara_subject_managers
  for each row execute function public.sanskara_early_managers_changed();

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────
revoke all on function public.sanskara_early_min_age() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_in_window(uuid) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_move_records_early(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_managers_changed() from public, anon, authenticated, service_role;
do $$
declare f text;
begin
  foreach f in array array[
    'public.sanskara_start_early_handover(uuid, uuid)',
    'public.sanskara_approve_early_handover(uuid, uuid)',
    'public.sanskara_cancel_early_handover(uuid, uuid)',
    'public.sanskara_accept_early_handover(uuid, text)',
    'public.sanskara_confirm_early_handover(uuid, uuid)',
    'public.sanskara_early_handover_status(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

commit;
