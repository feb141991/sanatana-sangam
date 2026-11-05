-- Sanskara tracker: tell the OTHER managers of a child that an early hand-over is waiting for their agreement.
-- Scope: docs/SANSKARA_HANDOVER_SCOPE.md section 3 (the known gap "a manager learns of a pending approval only by opening the child's
-- screen"). Depends on 20261103110000 (hand-over notices) and 20261104100000 (early hand-over). NOT applied to any database by this commit.
--
-- WHAT THIS ADDS
--   sanskara_early_approval_due(now, late)       The notices that should exist now. Server only.
--   sanskara_early_approval_still_valid(...)     The dispatcher's send-time check for one notice. Server only. Any doubt is false.
--   sanskara_validate_early_approval_candidate   BEFORE INSERT trigger on notification_candidates for the 'E' key space.
--   sanskara_cancel_early_approval_notices(...)  and triggers: pending notices are cancelled when the hand-over leaves
--                                                'awaiting_approval' or is deleted, when that manager approves or is removed, or when the
--                                                recipient's opt-in, consent or deletion state changes.
--
-- THE NOTICE (one kind, once per manager per hand-over)
--   Sent to each current manager who has NOT yet agreed, while the hand-over is 'awaiting_approval', within 24 hours of it starting.
--   Event type sanskar_milestone (same opt-in wants_sanskara_reminders per decision D-A, same neutral payload, same tap route
--   /kul/sanskara). Key space: event_id = the hand-over id, event_instance = 'Eapproval'. A milestone reminder's instance starts with 'L',
--   a hand-over notice's with 'H', so no key overlaps (AGENTS 6). The text is the SAME generic wording as the other hand-over notices
--   (reviewed Hindi and Punjabi included): it names no child, no relationship, no stage and no date. The detail, and the "I agree"
--   button, are shown inside the app after access is checked again. Push needs wants_sanskara_reminders; a manager who has not opted in
--   is not notified and learns of it by opening the child's screen, as before.
--
-- WHAT KEEPS IT SAFE
--   * Recipient = a current manager (sanskara_can 'manage_managers': before 18, consent given, not deleting) who has not approved.
--   * The notice is prepared on the recipient's opt-in generation and re-checked at insert and at send time, against the CURRENT
--     hand-over: still awaiting approval, not expired, feature still on, child still inside the age window.
--   * Restarting a hand-over cancels the old one (status change) and so its notices; the new one notifies again, once.
--   * No new table, no new column. Nothing here is readable by a client.
--
-- A SECOND NOTICE, to the STARTER (event_instance 'Econfirm', metadata key confirm_handover_id): when the child has entered the code and the
-- hand-over is 'awaiting_confirmation', the manager who started it is told once that it is waiting for their confirmation. Same opt-in, same
-- generic wording, same tap route. It is checked at insert and at send time (sanskara_early_confirm_still_valid) and cancelled when the
-- hand-over leaves 'awaiting_confirmation', is deleted (which is also what a confirmed hand-over does), or the starter is removed or changes
-- consent. It never names the child or the account that entered the code.
--
-- The 24-hour limit on the approval notice runs from the later of the hand-over start and the day THAT MANAGER was added, so a manager added
-- on day 3 is told. A notice already created for a hand-over, even a cancelled one, is not offered again for that hand-over.
--
-- Privilege review: SECURITY DEFINER, empty search_path, fully qualified names. due and still_valid are executable by service_role only;
-- everything else is internal (EXECUTE revoked from every role). Rollback: supabase/rollbacks/20261104110000_sanskara_early_approval_notice_rollback.sql.
-- ROC pre-flight: no existing function is redefined or has its signature changed (no PGRST203 risk). The only existing object altered is the
-- trigger sanskara_validate_candidate on notification_candidates, dropped and recreated with a WHEN that also leaves the 'E' instances to the
-- new trigger. No data is updated and no default changes. DROP TRIGGER on notification_candidates takes ACCESS EXCLUSIVE until commit and that
-- table is written by the every-10-minute resolver, dispatch and quiz crons; CREATE TRIGGER on profiles, sanskara_subject_managers,
-- sanskara_early_handovers and sanskara_early_approvals take short SHARE ROW EXCLUSIVE locks. lock_timeout = 5s: it fails with nothing applied
-- instead of queueing; apply it between cron runs and run it again if it times out.

begin;
set local lock_timeout = '5s';

-- ── Send-time and insert-time validity ──────────────────────────────────────────────────────────────────────────────

create function public.sanskara_early_approval_still_valid(p_handover uuid, p_account uuid, p_profile_generation integer)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_subject uuid;
  p record;
begin
  if p_handover is null or p_account is null or p_profile_generation is null then return false; end if;

  select h.subject_id into v_subject from public.sanskara_early_handovers h
  where h.id = p_handover and h.status = 'awaiting_approval' and h.expires_at > now();
  if v_subject is null then return false; end if;

  -- Feature on, and the child still inside the age window (checked as at every step of the hand-over itself).
  if public.sanskara_early_min_age() is null or not public.sanskara_early_in_window(v_subject) then return false; end if;

  -- Only a manager who has not agreed yet has anything to do.
  if exists (select 1 from public.sanskara_early_approvals a where a.handover_id = p_handover and a.manager_id = p_account) then
    return false;
  end if;

  select pr.wants_sanskara_reminders, pr.sanskara_opt_in_generation, pr.is_deleting into p
  from public.profiles pr where pr.id = p_account;
  if not found or p.wants_sanskara_reminders is not true or p.is_deleting
     or p.sanskara_opt_in_generation is distinct from p_profile_generation then
    return false;
  end if;

  return public.sanskara_can('manage_managers', v_subject, p_account);
exception when others then
  return false;
end;
$$;

-- ── What the producer should create now ─────────────────────────────────────────────────────────────────────────────

create function public.sanskara_early_approval_due(p_now timestamptz default now(), p_late interval default interval '24 hours')
returns table (
  handover_id uuid, account_id uuid, profile_generation integer, local_date date, scheduled_for timestamptz,
  timezone text, language text, quiet_hours_start smallint, quiet_hours_end smallint)
language sql stable security definer set search_path = ''
as $$
  select h.id, m.account_id, p.sanskara_opt_in_generation, ((p_now at time zone public.safe_timezone(p.timezone, 'UTC'))::date),
         p_now, public.safe_timezone(p.timezone, 'UTC'), p.app_language,
         p.notification_quiet_hours_start, p.notification_quiet_hours_end
  from public.sanskara_early_handovers h
  join public.sanskara_subject_managers m on m.subject_id = h.subject_id
  join public.profiles p on p.id = m.account_id
  where h.status = 'awaiting_approval' and h.expires_at > p_now
    -- The window runs from the later of the hand-over start and the day this manager was added, so a manager added on day 3
    -- is told, while an old hand-over is never announced to people who have long been managers (e.g. after an outage).
    and greatest(h.created_at, m.added_at) > p_now - p_late
    -- The opt-in filter only prunes early; sanskara_early_approval_still_valid re-checks it, so it is not what protects anyone.
    and p.wants_sanskara_reminders and not p.is_deleting
    and public.sanskara_early_approval_still_valid(h.id, m.account_id, p.sanskara_opt_in_generation)
    and not exists (
      select 1 from public.notification_candidates c
      where c.user_id = m.account_id and c.event_type = 'sanskar_milestone'
        and c.event_id = h.id::text and c.event_instance = 'Eapproval')
  order by h.created_at, h.id, m.account_id;
$$;

-- ── The starter's notice: the child has entered the code ─────────────────────────────────────────────────────────────

create function public.sanskara_early_confirm_still_valid(p_handover uuid, p_account uuid, p_profile_generation integer)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_subject uuid;
  p record;
begin
  if p_handover is null or p_account is null or p_profile_generation is null then return false; end if;

  -- Only the manager who started it, only while it waits for their confirmation and a child has entered the code.
  select h.subject_id into v_subject from public.sanskara_early_handovers h
  where h.id = p_handover and h.status = 'awaiting_confirmation' and h.claimant_id is not null
    and h.initiated_by = p_account and h.expires_at > now();
  if v_subject is null then return false; end if;

  if public.sanskara_early_min_age() is null or not public.sanskara_early_in_window(v_subject) then return false; end if;

  select pr.wants_sanskara_reminders, pr.sanskara_opt_in_generation, pr.is_deleting into p
  from public.profiles pr where pr.id = p_account;
  if not found or p.wants_sanskara_reminders is not true or p.is_deleting
     or p.sanskara_opt_in_generation is distinct from p_profile_generation then
    return false;
  end if;

  return public.sanskara_can('manage_managers', v_subject, p_account);
exception when others then
  return false;
end;
$$;

create function public.sanskara_early_confirm_due(p_now timestamptz default now())
returns table (
  handover_id uuid, account_id uuid, profile_generation integer, local_date date, scheduled_for timestamptz,
  timezone text, language text, quiet_hours_start smallint, quiet_hours_end smallint)
language sql stable security definer set search_path = ''
as $$
  select h.id, h.initiated_by, p.sanskara_opt_in_generation, ((p_now at time zone public.safe_timezone(p.timezone, 'UTC'))::date),
         p_now, public.safe_timezone(p.timezone, 'UTC'), p.app_language,
         p.notification_quiet_hours_start, p.notification_quiet_hours_end
  from public.sanskara_early_handovers h
  join public.profiles p on p.id = h.initiated_by
  -- No age limit here: this is awaited action on a hand-over that expires on its own (7 days), so a late notice is still useful.
  where h.status = 'awaiting_confirmation' and h.claimant_id is not null and h.expires_at > p_now
    and p.wants_sanskara_reminders and not p.is_deleting
    and public.sanskara_early_confirm_still_valid(h.id, h.initiated_by, p.sanskara_opt_in_generation)
    and not exists (
      select 1 from public.notification_candidates c
      where c.user_id = h.initiated_by and c.event_type = 'sanskar_milestone'
        and c.event_id = h.id::text and c.event_instance = 'Econfirm')
  order by h.created_at, h.id;
$$;

create function public.sanskara_validate_early_confirm_candidate() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := new.metadata;
  k text;
  v_handover uuid;
  v_pgen integer;
  v_name text;
begin
  if jsonb_typeof(m) is distinct from 'object' then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;
  for k in select jsonb_object_keys(m) loop
    if not (k = any (array['confirm_handover_id', 'profile_generation', 'local_date', 'timezone'])) then
      raise exception 'sanskara_candidate_carries_extra_data' using errcode = '23514';
    end if;
  end loop;
  begin
    v_handover := (m ->> 'confirm_handover_id')::uuid;
    v_pgen := (m ->> 'profile_generation')::integer;
  exception when others then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end;
  if v_handover is null or v_pgen is null
     or new.event_id is distinct from v_handover::text
     or new.event_instance is distinct from 'Econfirm'
     or (m ->> 'local_date') is distinct from new.local_date::text
     or (m ->> 'timezone') is distinct from new.timezone then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;

  if not public.sanskara_early_confirm_still_valid(v_handover, new.user_id, v_pgen) then
    raise exception 'sanskara_candidate_requires_current_handover' using errcode = '23514';
  end if;
  if new.audience_variant is distinct from 'starter' then
    raise exception 'sanskara_candidate_wrong_audience' using errcode = '23514';
  end if;
  if new.scheduled_for > now() + interval '48 hours' then
    raise exception 'sanskara_candidate_outside_horizon' using errcode = '23514';
  end if;
  if new.action_url !~ '^/[a-z0-9/_-]*$' or new.action_url ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-' then
    raise exception 'sanskara_candidate_link_not_generic' using errcode = '23514';
  end if;

  select s.display_name into v_name from public.sanskara_early_handovers h
  join public.sanskara_subjects s on s.id = h.subject_id where h.id = v_handover;
  if v_name is not null and length(v_name) >= 3 and position(lower(v_name) in lower(new.title || ' ' || new.body)) > 0 then
    raise exception 'sanskara_candidate_not_discreet' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- ── Insert-time validation ──────────────────────────────────────────────────────────────────────────────────────────

create function public.sanskara_validate_early_approval_candidate() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := new.metadata;
  k text;
  v_handover uuid;
  v_pgen integer;
  v_name text;
begin
  if jsonb_typeof(m) is distinct from 'object' then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;
  for k in select jsonb_object_keys(m) loop
    if not (k = any (array['handover_id', 'profile_generation', 'local_date', 'timezone'])) then
      raise exception 'sanskara_candidate_carries_extra_data' using errcode = '23514';
    end if;
  end loop;
  begin
    v_handover := (m ->> 'handover_id')::uuid;
    v_pgen := (m ->> 'profile_generation')::integer;
  exception when others then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end;
  if v_handover is null or v_pgen is null
     or new.event_id is distinct from v_handover::text
     or new.event_instance is distinct from 'Eapproval'
     or (m ->> 'local_date') is distinct from new.local_date::text
     or (m ->> 'timezone') is distinct from new.timezone then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;

  if not public.sanskara_early_approval_still_valid(v_handover, new.user_id, v_pgen) then
    raise exception 'sanskara_candidate_requires_current_handover' using errcode = '23514';
  end if;
  if new.audience_variant is distinct from 'manager' then
    raise exception 'sanskara_candidate_wrong_audience' using errcode = '23514';
  end if;
  if new.scheduled_for > now() + interval '48 hours' then
    raise exception 'sanskara_candidate_outside_horizon' using errcode = '23514';
  end if;
  if new.action_url !~ '^/[a-z0-9/_-]*$' or new.action_url ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-' then
    raise exception 'sanskara_candidate_link_not_generic' using errcode = '23514';
  end if;

  -- Discreet text: it must not repeat the child's name.
  select s.display_name into v_name from public.sanskara_early_handovers h
  join public.sanskara_subjects s on s.id = h.subject_id where h.id = v_handover;
  if v_name is not null and length(v_name) >= 3 and position(lower(v_name) in lower(new.title || ' ' || new.body)) > 0 then
    raise exception 'sanskara_candidate_not_discreet' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- The milestone validator keeps the 'L' instances, the hand-over validator the 'H' ones, this one the 'E' ones. Each WHEN excludes the others'.
drop trigger sanskara_validate_candidate on public.notification_candidates;
create trigger sanskara_validate_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance !~ '^[HE]')
  execute function public.sanskara_validate_candidate();
-- Every 'E' instance is validated by one of the two; the approval validator refuses anything but 'Eapproval', so an unknown 'E…' key is rejected.
create trigger sanskara_validate_early_approval_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance ~ '^E' and new.event_instance <> 'Econfirm')
  execute function public.sanskara_validate_early_approval_candidate();
create trigger sanskara_validate_early_confirm_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance = 'Econfirm')
  execute function public.sanskara_validate_early_confirm_candidate();

-- ── Cancellation ────────────────────────────────────────────────────────────────────────────────────────────────────

-- Cancels pending and resolving 'E' candidates and pending and sending schedule rows. A NULL scope means "all" of that dimension.
create function public.sanskara_cancel_early_approval_notices(p_handover uuid, p_account uuid, p_reason text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_candidates integer := 0;
  v_schedule integer := 0;
begin
  if p_handover is null and p_account is null then
    raise exception 'a scope is required' using errcode = '22023';
  end if;
  update public.notification_candidates
  set status = 'cancelled', decision_reason = left(p_reason, 80), resolved_at = now(), updated_at = now()
  where event_type = 'sanskar_milestone' and event_instance = 'Eapproval' and status in ('pending', 'resolving')
    and (p_handover is null or event_id = p_handover::text)
    and (p_account is null or user_id = p_account);
  get diagnostics v_candidates = row_count;
  update public.notification_schedule
  set status = 'cancelled', error = left(p_reason, 80)
  where notification_type = 'sanskar_milestone' and status in ('pending', 'sending')
    and metadata ->> 'handover_id' is not null
    and (p_handover is null or metadata ->> 'handover_id' = p_handover::text)
    and (p_account is null or user_id = p_account);
  get diagnostics v_schedule = row_count;
  return v_candidates + v_schedule;
end;
$$;

-- Same, for the starter's 'Econfirm' notice (its schedule rows carry confirm_handover_id).
create function public.sanskara_cancel_early_confirm_notices(p_handover uuid, p_account uuid, p_reason text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_candidates integer := 0;
  v_schedule integer := 0;
begin
  if p_handover is null and p_account is null then
    raise exception 'a scope is required' using errcode = '22023';
  end if;
  update public.notification_candidates
  set status = 'cancelled', decision_reason = left(p_reason, 80), resolved_at = now(), updated_at = now()
  where event_type = 'sanskar_milestone' and event_instance = 'Econfirm' and status in ('pending', 'resolving')
    and (p_handover is null or event_id = p_handover::text)
    and (p_account is null or user_id = p_account);
  get diagnostics v_candidates = row_count;
  update public.notification_schedule
  set status = 'cancelled', error = left(p_reason, 80)
  where notification_type = 'sanskar_milestone' and status in ('pending', 'sending')
    and metadata ->> 'confirm_handover_id' is not null
    and (p_handover is null or metadata ->> 'confirm_handover_id' = p_handover::text)
    and (p_account is null or user_id = p_account);
  get diagnostics v_schedule = row_count;
  return v_candidates + v_schedule;
end;
$$;

-- The hand-over is no longer waiting for the starter (back to approval or ready after a manager change, or cancelled).
create function public.sanskara_early_confirm_handover_moved() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_early_confirm_notices(new.id, null, 'sanskara_early_no_longer_awaiting_confirmation');
  return null;
end;
$$;
create trigger sanskara_early_confirm_handover_moved after update of status, claimant_id on public.sanskara_early_handovers
  for each row when (old.status = 'awaiting_confirmation'
                     and (new.status <> 'awaiting_confirmation' or new.claimant_id is distinct from old.claimant_id))
  execute function public.sanskara_early_confirm_handover_moved();

-- The hand-over is no longer waiting for approval (ready, accepted, cancelled by anyone, restarted).
create function public.sanskara_early_approval_handover_moved() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_early_approval_notices(new.id, null, 'sanskara_early_no_longer_awaiting');
  return null;
end;
$$;
create trigger sanskara_early_approval_handover_moved after update of status on public.sanskara_early_handovers
  for each row when (new.status <> 'awaiting_approval') execute function public.sanskara_early_approval_handover_moved();

-- The hand-over row is deleted (the child's records were deleted with their subject).
create function public.sanskara_early_approval_handover_deleted() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_early_approval_notices(old.id, null, 'sanskara_early_deleted');
  perform public.sanskara_cancel_early_confirm_notices(old.id, null, 'sanskara_early_deleted');
  return null;
end;
$$;
create trigger sanskara_early_approval_handover_deleted after delete on public.sanskara_early_handovers
  for each row execute function public.sanskara_early_approval_handover_deleted();

-- That manager has agreed: they have nothing left to do.
create function public.sanskara_early_approval_given() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_early_approval_notices(new.handover_id, new.manager_id, 'sanskara_early_approved');
  return null;
end;
$$;
create trigger sanskara_early_approval_given after insert on public.sanskara_early_approvals
  for each row execute function public.sanskara_early_approval_given();

-- A manager is removed (every dependent deletion cascades through here).
create function public.sanskara_early_approval_manager_removed() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  h uuid;
begin
  for h in select x.id from public.sanskara_early_handovers x where x.subject_id = old.subject_id loop
    perform public.sanskara_cancel_early_approval_notices(h, old.account_id, 'sanskara_manager_removed');
    perform public.sanskara_cancel_early_confirm_notices(h, old.account_id, 'sanskara_manager_removed');
  end loop;
  return null;
end;
$$;
create trigger sanskara_early_approval_manager_removed after delete on public.sanskara_subject_managers
  for each row execute function public.sanskara_early_approval_manager_removed();

-- The recipient's own state: opt-in off, consent withdrawn or the account entering the deletion cool-off.
create function public.sanskara_early_approval_profile_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.wants_sanskara_reminders is not true or new.consent_religious_data is not true or new.is_deleting then
    perform public.sanskara_cancel_early_approval_notices(null, new.id, 'sanskara_access_or_consent_changed');
    perform public.sanskara_cancel_early_confirm_notices(null, new.id, 'sanskara_access_or_consent_changed');
  end if;
  return null;
end;
$$;
create trigger sanskara_early_approval_profile_change after update of wants_sanskara_reminders, consent_religious_data, is_deleting on public.profiles
  for each row when (old.wants_sanskara_reminders is distinct from new.wants_sanskara_reminders
                     or old.consent_religious_data is distinct from new.consent_religious_data
                     or old.is_deleting is distinct from new.is_deleting)
  execute function public.sanskara_early_approval_profile_change();

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────

revoke all on function public.sanskara_early_approval_still_valid(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.sanskara_early_approval_due(timestamptz, interval) from public, anon, authenticated;
grant execute on function public.sanskara_early_approval_still_valid(uuid, uuid, integer) to service_role;
grant execute on function public.sanskara_early_approval_due(timestamptz, interval) to service_role;
revoke all on function public.sanskara_early_confirm_still_valid(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.sanskara_early_confirm_due(timestamptz) from public, anon, authenticated;
grant execute on function public.sanskara_early_confirm_still_valid(uuid, uuid, integer) to service_role;
grant execute on function public.sanskara_early_confirm_due(timestamptz) to service_role;
revoke all on function public.sanskara_validate_early_confirm_candidate() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_cancel_early_confirm_notices(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_confirm_handover_moved() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_validate_early_approval_candidate() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_cancel_early_approval_notices(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_approval_handover_moved() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_approval_handover_deleted() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_approval_given() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_approval_manager_removed() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_early_approval_profile_change() from public, anon, authenticated, service_role;

commit;
