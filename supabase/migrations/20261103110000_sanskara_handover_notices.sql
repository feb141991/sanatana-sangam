-- Sanskara tracker, Phase 1 of the hand-over scope: notices that tell a child's managers the hand-over at 18 is near or closing.
-- Scope: docs/SANSKARA_HANDOVER_SCOPE.md (gaps G1 and G2). Contract: AUTHORIZATION_CONTRACT section 9 (E7). Depends on M1 to M4.
-- NOT applied to any database by this commit.
--
-- WHAT THIS ADDS
--   sanskara_handover_due(now, horizon, late)  The notices that should exist now, chosen by the one sanskara_can. Server only.
--   sanskara_handover_still_valid(...)         The dispatcher's send-time check for one notice. Server only. Any doubt is false.
--   sanskara_validate_handover_candidate       BEFORE INSERT trigger on notification_candidates for the handover key space.
--   sanskara_cancel_handover(...) and triggers Pending notices are cancelled when a manager is removed (which every dependent
--                                              deletion cascades through), a claim starts or the recipient's consent, opt-in
--                                              or deletion state changes. The send-time check covers anything missed.
--
-- THE NOTICES (six, each once per manager)
--   open_90, open_30, open_7, open_0     90, 30, 7 and 0 days before the 18th birthday (civil date from the birth date).
--   closing_30, closing_7                30 and 7 days before the end of the 12-month former-manager window.
--   Sent at 09:00 in the recipient's own timezone, like the milestone reminders. The text is generic and identical for every
--   notice: it names no child, no age, no date and no stage. The detail is shown inside the app, where access is re-checked.
--
-- WHY THE SAME EVENT TYPE (sanskar_milestone) AND NOT A NEW ONE
--   The behaviour wanted is the milestone reminders': explicit-user-requested priority class, the same opt-in
--   (wants_sanskara_reminders, decision D-A), the same neutral push payload and the same tap route. A new type would mean
--   redefining the global budget-exemption function and every type list for no behavioural difference. The key space is
--   disjoint instead: event_id is the CHILD's subject id (a milestone reminder's is a subscription id; two uuids from
--   different tables never collide) and event_instance starts with 'H' (a milestone reminder's starts with 'L'). The existing
--   milestone trigger is narrowed to 'L' instances and the new trigger takes 'H' instances, so neither validates the other's rows.
--
-- WHAT KEEPS THEM SAFE
--   * Access is sanskara_can('read_meta'): a current manager before 18, a former manager inside the window, consent given, not
--     deleting. A viewer is never a recipient, and nobody is told anything about a child they do not manage.
--   * Opt-in: wants_sanskara_reminders, and the notice is prepared on the recipient's opt-in generation; any change to the
--     opt-in, consent, timezone, language, quiet hours or deletion state raises the generation (M1 trigger), which makes a
--     prepared notice stale.
--   * The notice is recomputed from the CURRENT birth date at insert and at send. If the date it was prepared for is no longer the
--     date the rule gives, it is not sent.
--   * An open_* notice is suppressed while a claim is pending (the family is already handing over); a closing_* notice is not.
--   * No new table, no new column. Nothing here is readable by a client.
--
-- KNOWN SMALL LOSS: a notice already created for a local date, even a cancelled one, is not offered again for that date (as for
-- milestone reminders). A claim started and cancelled the same morning therefore loses that morning's open_* notice.
--
-- Privilege review: SECURITY DEFINER, empty search_path, fully qualified names. due and still_valid are executable by
-- service_role only; everything else is internal (EXECUTE revoked from every role). Rollback:
-- supabase/rollbacks/20261103110000_sanskara_handover_notices_rollback.sql.
-- ROC pre-flight: no existing function is redefined or has its signature changed (no PGRST203 risk); the only existing object
-- altered is the trigger sanskara_validate_candidate, dropped and recreated with a narrower WHEN. No data is updated and no
-- column default changes. CREATE TRIGGER on profiles takes a short SHARE ROW EXCLUSIVE lock (18 rows on 2026-10-30).

begin;

-- ── Dates ───────────────────────────────────────────────────────────────────────────────────────────────────────────

create function public.sanskara_handover_notice_date(p_birth date, p_notice text) returns date
language sql immutable set search_path = ''
as $$
  select case p_notice
    when 'open_90' then ((p_birth + interval '18 years')::date) - 90
    when 'open_30' then ((p_birth + interval '18 years')::date) - 30
    when 'open_7' then ((p_birth + interval '18 years')::date) - 7
    when 'open_0' then (p_birth + interval '18 years')::date
    when 'closing_30' then (((p_birth + interval '18 years')::date + interval '12 months')::date) - 30
    when 'closing_7' then (((p_birth + interval '18 years')::date + interval '12 months')::date) - 7
  end
$$;

-- ── Send-time and insert-time validity ──────────────────────────────────────────────────────────────────────────────

create function public.sanskara_handover_still_valid(
  p_subject uuid, p_account uuid, p_notice text, p_profile_generation integer, p_local_date date
) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_birth date;
  p record;
begin
  if p_subject is null or p_account is null or p_notice is null or p_profile_generation is null or p_local_date is null then
    return false;
  end if;
  if not (p_notice = any (array['open_90', 'open_30', 'open_7', 'open_0', 'closing_30', 'closing_7'])) then return false; end if;

  select s.birth_date into v_birth from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent';
  if v_birth is null then return false; end if;

  -- The date it was prepared for is still the date the rule gives. (Past the window sanskara_can denies access, so the end of the
  -- window needs no check of its own here.)
  if public.sanskara_handover_notice_date(v_birth, p_notice) is distinct from p_local_date then return false; end if;

  select pr.wants_sanskara_reminders, pr.sanskara_opt_in_generation, pr.is_deleting into p
  from public.profiles pr where pr.id = p_account;
  if not found or p.wants_sanskara_reminders is not true or p.is_deleting
     or p.sanskara_opt_in_generation is distinct from p_profile_generation then
    return false;
  end if;

  -- A manager before 18 or a former manager inside the window, with consent.
  if not public.sanskara_can('read_meta', p_subject, p_account) then return false; end if;

  -- The family is already handing over: the prompts to start are not needed.
  if p_notice like 'open\_%' and exists (
    select 1 from public.sanskara_claims c where c.subject_id = p_subject and c.status = 'pending' and c.expires_at > now()
  ) then
    return false;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

-- ── What the producer should create now ─────────────────────────────────────────────────────────────────────────────

create function public.sanskara_handover_due(
  p_now timestamptz default now(), p_horizon interval default interval '36 hours', p_late interval default interval '3 hours'
) returns table (
  subject_id uuid, account_id uuid, notice text, audience_variant text, profile_generation integer, local_date date,
  scheduled_for timestamptz, timezone text, language text, quiet_hours_start smallint, quiet_hours_end smallint)
language sql stable security definer set search_path = ''
as $$
  with candidates as materialized (
    select sj.id as sid, sj.birth_date as birth, m.account_id as acc, n.notice,
           p.sanskara_opt_in_generation as pgen, public.safe_timezone(p.timezone, 'UTC') as tz, p.app_language as lang,
           p.notification_quiet_hours_start as qs, p.notification_quiet_hours_end as qe
    from public.sanskara_subjects sj
    join public.sanskara_subject_managers m on m.subject_id = sj.id
    join public.profiles p on p.id = m.account_id
    cross join (values ('open_90'), ('open_30'), ('open_7'), ('open_0'), ('closing_30'), ('closing_7')) as n(notice)
    -- The opt-in filter only prunes early; sanskara_handover_still_valid below re-checks it, so it is not what protects anyone.
    where sj.kind = 'dependent' and sj.birth_date is not null and p.wants_sanskara_reminders and not p.is_deleting
  ), timed as (
    select c.*, public.sanskara_handover_notice_date(c.birth, c.notice) as remind_date from candidates c
  ), placed as (
    select t.*, ((t.remind_date + time '09:00') at time zone t.tz) as at_utc from timed t
  )
  select t.sid, t.acc, t.notice, case when t.notice like 'open\_%' then 'manager' else 'former_manager' end,
         t.pgen, t.remind_date, t.at_utc, t.tz, t.lang, t.qs, t.qe
  from placed t
  where t.at_utc >= p_now - p_late and t.at_utc <= p_now + p_horizon
    and public.sanskara_handover_still_valid(t.sid, t.acc, t.notice, t.pgen, t.remind_date)
    and not exists (
      select 1 from public.notification_candidates c
      where c.user_id = t.acc and c.event_type = 'sanskar_milestone' and c.event_id = t.sid::text
        and c.event_instance = 'H' || t.notice and c.local_date = t.remind_date)
  order by t.at_utc, t.sid, t.acc;
$$;

-- ── Insert-time validation ──────────────────────────────────────────────────────────────────────────────────────────

create function public.sanskara_validate_handover_candidate() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := new.metadata;
  k text;
  v_subject uuid;
  v_notice text;
  v_pgen integer;
  v_name text;
begin
  if jsonb_typeof(m) is distinct from 'object' then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;
  for k in select jsonb_object_keys(m) loop
    if not (k = any (array['subject_id', 'notice', 'profile_generation', 'local_date', 'timezone'])) then
      raise exception 'sanskara_candidate_carries_extra_data' using errcode = '23514';
    end if;
  end loop;
  begin
    v_subject := (m ->> 'subject_id')::uuid;
    v_notice := m ->> 'notice';
    v_pgen := (m ->> 'profile_generation')::integer;
  exception when others then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end;
  if v_subject is null or v_notice is null or v_pgen is null
     or not (v_notice = any (array['open_90', 'open_30', 'open_7', 'open_0', 'closing_30', 'closing_7']))
     or new.event_id is distinct from v_subject::text
     or new.event_instance is distinct from 'H' || v_notice
     or (m ->> 'local_date') is distinct from new.local_date::text
     or (m ->> 'timezone') is distinct from new.timezone then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;

  if not public.sanskara_handover_still_valid(v_subject, new.user_id, v_notice, v_pgen, new.local_date) then
    raise exception 'sanskara_candidate_requires_current_handover' using errcode = '23514';
  end if;
  if new.audience_variant is distinct from (case when v_notice like 'open\_%' then 'manager' else 'former_manager' end) then
    raise exception 'sanskara_candidate_wrong_audience' using errcode = '23514';
  end if;
  if new.scheduled_for > now() + interval '48 hours' then
    raise exception 'sanskara_candidate_outside_horizon' using errcode = '23514';
  end if;
  if new.action_url !~ '^/[a-z0-9/_-]*$' or new.action_url ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-' then
    raise exception 'sanskara_candidate_link_not_generic' using errcode = '23514';
  end if;

  -- Discreet text: it must not repeat the child's name.
  select s.display_name into v_name from public.sanskara_subjects s where s.id = v_subject;
  if v_name is not null and length(v_name) >= 3 and position(lower(v_name) in lower(new.title || ' ' || new.body)) > 0 then
    raise exception 'sanskara_candidate_not_discreet' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- The milestone trigger keeps the 'L' instances; the handover trigger takes the 'H' ones. An instance of any other shape is
-- refused by neither's WHEN and so reaches no validator: the milestone key format is 'L<lead>' or 'H<notice>' only.
drop trigger sanskara_validate_candidate on public.notification_candidates;
create trigger sanskara_validate_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance !~ '^H')
  execute function public.sanskara_validate_candidate();
create trigger sanskara_validate_handover_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone' and new.event_instance ~ '^H')
  execute function public.sanskara_validate_handover_candidate();

-- ── Cancellation ────────────────────────────────────────────────────────────────────────────────────────────────────

-- Cancels pending and resolving handover candidates and pending and sending schedule rows. A NULL scope means "all".
-- p_only_open limits it to the open_* notices (a claim being pending cancels the prompts to start one, not the closing ones).
create function public.sanskara_cancel_handover(p_subject uuid, p_account uuid, p_only_open boolean, p_reason text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_candidates integer := 0;
  v_schedule integer := 0;
begin
  if p_subject is null and p_account is null then
    raise exception 'a scope is required' using errcode = '22023';
  end if;
  update public.notification_candidates
  set status = 'cancelled', decision_reason = left(p_reason, 80), resolved_at = now(), updated_at = now()
  where event_type = 'sanskar_milestone' and event_instance ~ '^H' and status in ('pending', 'resolving')
    and (p_subject is null or event_id = p_subject::text)
    and (p_account is null or user_id = p_account)
    and (not p_only_open or starts_with(event_instance, 'Hopen'));
  get diagnostics v_candidates = row_count;
  update public.notification_schedule
  set status = 'cancelled', error = left(p_reason, 80)
  where notification_type = 'sanskar_milestone' and status in ('pending', 'sending')
    and metadata ->> 'notice' is not null
    and (p_subject is null or metadata ->> 'subject_id' = p_subject::text)
    and (p_account is null or user_id = p_account)
    and (not p_only_open or starts_with(metadata ->> 'notice', 'open'));
  get diagnostics v_schedule = row_count;
  return v_candidates + v_schedule;
end;
$$;

create function public.sanskara_handover_manager_removed() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_handover(old.subject_id, old.account_id, false, 'sanskara_manager_removed');
  return old;
end;
$$;
create trigger sanskara_handover_manager_removed after delete on public.sanskara_subject_managers
  for each row execute function public.sanskara_handover_manager_removed();

create function public.sanskara_handover_claim_started() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_handover(new.subject_id, null, true, 'sanskara_claim_started');
  return null;
end;
$$;
create trigger sanskara_handover_claim_started after insert on public.sanskara_claims
  for each row when (new.status = 'pending') execute function public.sanskara_handover_claim_started();

-- The recipient's own state: opt-in off, consent withdrawn or the account entering the deletion cool-off.
create function public.sanskara_handover_profile_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.wants_sanskara_reminders is not true or new.consent_religious_data is not true or new.is_deleting then
    perform public.sanskara_cancel_handover(null, new.id, false, 'sanskara_access_or_consent_changed');
  end if;
  return null;
end;
$$;
create trigger sanskara_handover_profile_change after update of wants_sanskara_reminders, consent_religious_data, is_deleting on public.profiles
  for each row when (old.wants_sanskara_reminders is distinct from new.wants_sanskara_reminders
                     or old.consent_religious_data is distinct from new.consent_religious_data
                     or old.is_deleting is distinct from new.is_deleting)
  execute function public.sanskara_handover_profile_change();

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────

revoke all on function public.sanskara_handover_notice_date(date, text) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_handover_still_valid(uuid, uuid, text, integer, date) from public, anon, authenticated;
revoke all on function public.sanskara_handover_due(timestamptz, interval, interval) from public, anon, authenticated;
grant execute on function public.sanskara_handover_still_valid(uuid, uuid, text, integer, date) to service_role;
grant execute on function public.sanskara_handover_due(timestamptz, interval, interval) to service_role;
revoke all on function public.sanskara_validate_handover_candidate() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_cancel_handover(uuid, uuid, boolean, text) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_handover_manager_removed() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_handover_claim_started() from public, anon, authenticated, service_role;
revoke all on function public.sanskara_handover_profile_change() from public, anon, authenticated, service_role;

commit;
