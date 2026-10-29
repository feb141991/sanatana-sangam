-- Sanskara tracker, migration M4 of 6: reminders on the existing notification pipeline.
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md section 5; contract section 8 (decision D4).
-- Depends on M1 (opt-in columns), M2 (tables, sanskara_can, the two hooks) and the notification pipeline
-- (notification_candidates, notification_schedule).
--
-- WHAT A REMINDER IS
--   A subscription: one account, one record, one lead time (0, 1, 3, 7, 14 or 30 days). There is no reminder just because a
--   date was entered. The producer (a later, TypeScript step) asks sanskara_reminders_due() for what falls inside a rolling
--   horizon, and inserts one notification_candidates row per reminder with event_type 'sanskar_milestone'. That event type is
--   already in the resolver's "explicit user requested" class, and the class comes from the server-owned event type, so
--   producer metadata cannot widen it. The resolver, quiet hours, budgets, dispatch and receipts are unchanged.
--
-- WHAT THIS MIGRATION GUARANTEES, IN THE DATABASE
--   1. A candidate cannot be inserted unless the subscription, the record version, the recipient's opt-in generation and
--      their access are all current at that instant (sanskara_validate_candidate), it carries only opaque ids, its text does
--      not repeat a name, a title or a rite, and its link carries no id. This closes the producer's read-then-insert gap.
--   2. At most one live (pending or resolving) reminder per (subscription, lead time): a partial unique index.
--   3. Pending reminders are cancelled by TRIGGERS, so no path can forget: a subscription deleted (which every cascade does:
--      record, person, account) or switched off or changed; a record whose date changes, that is completed, or that is
--      handed to someone else; a profile that withdraws consent, turns the reminders off or enters the deletion cool-off;
--      a Kul membership that ends. An explicit end of access (a share revoked, a manager removed, records handed over)
--      also DELETES the affected subscriptions through the access-lost hook; an environmental lapse (consent, Kul
--      membership) only suspends them, so they can resume when it returns but never revive what was cancelled.
--   4. sanskara_reminder_still_valid is the send-time check for the dispatcher.
--
-- NOT DONE HERE, AND REQUIRED BEFORE THE PRODUCER IS SWITCHED ON
--   The dispatcher and delivery policy still gate sanskar_milestone on wants_family_notifications, put ids in the push data
--   and do not call sanskara_reminder_still_valid. Those files have another session's uncommitted edits, so they are not
--   touched. Until they call the check, a reminder cancelled in the instant between the resolver claiming it and the
--   dispatcher sending it could still be sent. The producer must not be scheduled before that change.
--
-- Privilege review: every function is SECURITY DEFINER with an empty search_path. The two client functions are executable by
-- `authenticated` only; the selector and the send-time check by service_role (server code); everything else is internal.
-- subscriptions has forced RLS, no policies and no client grants. Rollback: supabase/rollbacks/20261029160300_sanskara_reminders_rollback.sql.
-- The unique index is created inside this transaction (not CONCURRENTLY); it covers an empty slice of a small table.

begin;

-- ── Subscriptions ───────────────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_subscriptions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.sanskara_records(id) on delete cascade,
  account_id uuid not null references auth.users(id) on delete cascade,
  lead_days integer not null check (lead_days in (0, 1, 3, 7, 14, 30)),
  enabled boolean not null default true,
  generation integer not null default 0 check (generation >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_id, account_id, lead_days)
);
create index sanskara_subscriptions_account on public.sanskara_subscriptions (account_id);

alter table public.sanskara_subscriptions enable row level security;
alter table public.sanskara_subscriptions force row level security;
revoke all on table public.sanskara_subscriptions from public, anon, authenticated;
grant all on table public.sanskara_subscriptions to service_role;
comment on table public.sanskara_subscriptions is 'One account''s reminder for one Sanskara record at one lead time. generation changes whenever it is switched on, off or changed, which makes any reminder prepared earlier stale. Never readable by clients.';

-- At most one live reminder per (subscription, lead time). event_id is the subscription id and event_instance the lead time.
create unique index notification_candidates_one_live_sanskar
  on public.notification_candidates (user_id, event_id, event_instance)
  where event_type = 'sanskar_milestone' and status in ('pending', 'resolving');

-- ── Cancelling what is in flight ────────────────────────────────────────────────────────────────────────────────────

-- Core: cancel the pending and resolving candidates, and the pending and sending schedule rows, of these subscriptions.
-- (Same statuses the family-remembrance cancel uses. A claimed batch that contained a cancelled candidate is rolled back by
-- persist_notification_candidate_resolution and re-claimed after its lease: nothing is sent.)
create function public.sanskara_cancel_reminder_rows(p_ids text[], p_reason text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_candidates integer := 0;
  v_schedule integer := 0;
begin
  if p_ids is null or cardinality(p_ids) = 0 then return 0; end if;
  update public.notification_candidates
  set status = 'cancelled', decision_reason = left(p_reason, 80), resolved_at = now(), updated_at = now()
  where event_type = 'sanskar_milestone' and event_id = any (p_ids) and status in ('pending', 'resolving');
  get diagnostics v_candidates = row_count;
  update public.notification_schedule
  set status = 'cancelled', error = left(p_reason, 80)
  where notification_type = 'sanskar_milestone' and status in ('pending', 'sending') and metadata ->> 'subscription_id' = any (p_ids);
  get diagnostics v_schedule = row_count;
  return v_candidates + v_schedule;
end;
$$;

-- By scope: the subscriptions of an account, of a person's records, of one record (any combination; at least one).
create function public.sanskara_cancel_reminders(p_account uuid, p_subject uuid, p_record uuid, p_reason text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_ids text[];
begin
  if p_account is null and p_subject is null and p_record is null then
    raise exception 'a scope is required' using errcode = '22023';
  end if;
  select coalesce(array_agg(s.id::text), array[]::text[]) into v_ids
  from public.sanskara_subscriptions s
  join public.sanskara_records r on r.id = s.record_id
  where (p_account is null or s.account_id = p_account)
    and (p_subject is null or r.subject_id = p_subject)
    and (p_record is null or s.record_id = p_record);
  return public.sanskara_cancel_reminder_rows(v_ids, p_reason);
end;
$$;

-- Triggers ------------------------------------------------------------------------------------------------------------

-- A subscription is removed (by anything, including every cascade): its pending reminders go first.
create function public.sanskara_subscription_removed() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_reminder_rows(array[old.id::text], 'sanskara_subscription_removed');
  return old;
end;
$$;
create trigger sanskara_subscription_removed before delete on public.sanskara_subscriptions
  for each row execute function public.sanskara_subscription_removed();

-- A subscription is switched off, or changed (its generation moves): whatever was prepared earlier is stale.
create function public.sanskara_subscription_changed() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_reminder_rows(array[new.id::text], 'sanskara_subscription_changed');
  return null;
end;
$$;
create trigger sanskara_subscription_changed after update of enabled, generation on public.sanskara_subscriptions
  for each row when (old.enabled is distinct from new.enabled or old.generation is distinct from new.generation)
  execute function public.sanskara_subscription_changed();

-- A record's planned date changes, it is completed, or it is handed to another timeline.
create function public.sanskara_record_changed() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_cancel_reminders(null, null, new.id, 'sanskara_record_changed');
  return null;
end;
$$;
create trigger sanskara_record_changed after update of planned_date, completed_date, subject_id on public.sanskara_records
  for each row when (
    old.planned_date is distinct from new.planned_date
    or (new.completed_date is not null and old.completed_date is distinct from new.completed_date)
    or old.subject_id is distinct from new.subject_id)
  execute function public.sanskara_record_changed();

-- A person withdraws consent, turns the reminders off, or enters the deletion cool-off (contract E8, E9). Their own pending
-- reminders end; if consent goes or the account is deleting, so do the reminders other people hold for what they own or
-- manage, and their own timeline is marked suspended (the consent purge job reads suspended_at).
create function public.sanskara_profile_reminder_guard() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
  v_leaving boolean := (old.consent_religious_data and not new.consent_religious_data) or (not old.is_deleting and new.is_deleting);
begin
  if (old.wants_sanskara_reminders and not new.wants_sanskara_reminders) or v_leaving then
    perform public.sanskara_cancel_reminders(new.id, null, null, 'sanskara_access_or_consent_changed');
  end if;
  if v_leaving then
    for s in
      select sj.id from public.sanskara_subjects sj
      where (sj.kind = 'account' and sj.account_id = new.id)
         or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = sj.id and m.account_id = new.id)
    loop
      perform public.sanskara_cancel_reminders(null, s.id, null, 'sanskara_access_or_consent_changed');
    end loop;
  end if;
  if old.consent_religious_data and not new.consent_religious_data then
    insert into public.sanskara_audit (actor_id, action, subject_id)
    select new.id, 'consent_suspended', sj.id from public.sanskara_subjects sj
    where sj.kind = 'account' and sj.account_id = new.id and sj.suspended_at is null;
    update public.sanskara_subjects set suspended_at = now(), updated_at = now()
    where kind = 'account' and account_id = new.id and suspended_at is null;
  elsif not old.consent_religious_data and new.consent_religious_data then
    update public.sanskara_subjects set suspended_at = null, updated_at = now()
    where kind = 'account' and account_id = new.id and suspended_at is not null;
  end if;
  return null;
end;
$$;
create trigger sanskara_profile_reminder_guard after update of wants_sanskara_reminders, consent_religious_data, is_deleting on public.profiles
  for each row when (
    old.wants_sanskara_reminders is distinct from new.wants_sanskara_reminders
    or old.consent_religious_data is distinct from new.consent_religious_data
    or old.is_deleting is distinct from new.is_deleting)
  execute function public.sanskara_profile_reminder_guard();

-- A Kul membership ends (leaving, removal, deletion): shares that rested on it are void (sanskara_can re-checks), and the
-- pending reminders that rested on it stop. The subscriptions are kept so they can resume if the membership returns.
create function public.sanskara_kul_membership_end() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
begin
  perform public.sanskara_cancel_reminders(old.user_id, null, null, 'sanskara_access_or_consent_changed');
  for s in
    select sj.id from public.sanskara_subjects sj
    where (sj.kind = 'account' and sj.account_id = old.user_id)
       or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = sj.id and m.account_id = old.user_id)
  loop
    perform public.sanskara_cancel_reminders(null, s.id, null, 'sanskara_access_or_consent_changed');
  end loop;
  return old;
end;
$$;
create trigger sanskara_kul_membership_end after delete on public.kul_members
  for each row execute function public.sanskara_kul_membership_end();

-- Hooks (declared as no-ops in M2) ------------------------------------------------------------------------------------

-- Access was explicitly ended for this person (a share revoked, a manager removed, records handed over): their reminder
-- subscriptions that no longer have the right to receive are deleted, and the delete trigger cancels what was pending.
create or replace function public.sanskara_on_access_lost(p_subject uuid, p_account uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.sanskara_subscriptions s
  using public.sanskara_records r
  where r.id = s.record_id
    and r.subject_id = p_subject
    and (p_account is null or s.account_id = p_account)
    and not public.sanskara_can('receive_reminder', r.subject_id, s.account_id, r.id);
end;
$$;

-- The record was completed: every subscriber's reminder for it is switched off (the update trigger cancels what was pending).
-- Reopening the record does not switch them back on; each person re-enables theirs.
create or replace function public.sanskara_on_record_completed(p_record uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.sanskara_subscriptions
  set enabled = false, generation = generation + 1, updated_at = now()
  where record_id = p_record and enabled;
end;
$$;

-- The send-time check -------------------------------------------------------------------------------------------------

-- True only if everything a reminder was prepared on still holds: the subscription is on and unchanged, the record is
-- unchanged, dated and not complete, the recipient still opted in (same generation) and still has the right to receive it.
-- The dispatcher calls this before sending; any doubt answers false.
create function public.sanskara_reminder_still_valid(p_subscription uuid, p_generation integer, p_record_version integer, p_profile_generation integer)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
begin
  select sub.account_id, sub.record_id, sub.enabled, sub.generation, r.subject_id, r.version, r.planned_date, r.completed_date,
         p.wants_sanskara_reminders, p.sanskara_opt_in_generation, p.is_deleting
  into s
  from public.sanskara_subscriptions sub
  join public.sanskara_records r on r.id = sub.record_id
  join public.profiles p on p.id = sub.account_id
  where sub.id = p_subscription;
  if not found then return false; end if;
  return s.enabled
    and s.generation is not distinct from p_generation
    and s.version is not distinct from p_record_version
    and s.planned_date is not null
    and s.completed_date is null
    and s.wants_sanskara_reminders
    and not s.is_deleting
    and s.sanskara_opt_in_generation is not distinct from p_profile_generation
    and public.sanskara_can('receive_reminder', s.subject_id, s.account_id, s.record_id);
exception when others then
  return false;
end;
$$;

-- Insert-time validation ----------------------------------------------------------------------------------------------

create function public.sanskara_validate_candidate() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  m jsonb := new.metadata;
  k text;
  n text;
  v_sub uuid;
  v_generation integer;
  v_version integer;
  v_profile_generation integer;
  v_account uuid;
  v_lead integer;
  v_subject uuid;
  v_kind text;
  v_owner uuid;
  v_name text;
  v_title text;
  v_rite text;
  v_audience text;
begin
  if jsonb_typeof(m) is distinct from 'object' then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;
  -- The payload carries opaque ids and the versions they were prepared on, nothing else.
  for k in select jsonb_object_keys(m) loop
    if not (k = any (array['subscription_id', 'subscription_generation', 'record_version', 'profile_generation', 'local_date', 'timezone'])) then
      raise exception 'sanskara_candidate_carries_extra_data' using errcode = '23514';
    end if;
  end loop;
  begin
    v_sub := (m ->> 'subscription_id')::uuid;
    v_generation := (m ->> 'subscription_generation')::integer;
    v_version := (m ->> 'record_version')::integer;
    v_profile_generation := (m ->> 'profile_generation')::integer;
  exception when others then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end;
  if v_sub is null or v_generation is null or v_version is null or v_profile_generation is null
     or new.event_id is distinct from v_sub::text
     or (m ? 'local_date' and (m ->> 'local_date') is distinct from new.local_date::text)
     or (m ? 'timezone' and (m ->> 'timezone') is distinct from new.timezone) then
    raise exception 'sanskara_candidate_metadata_invalid' using errcode = '23514';
  end if;

  select s.account_id, s.lead_days, r.subject_id, sj.kind, sj.account_id, sj.display_name, r.custom_title, r.rite_key
  into v_account, v_lead, v_subject, v_kind, v_owner, v_name, v_title, v_rite
  from public.sanskara_subscriptions s
  join public.sanskara_records r on r.id = s.record_id
  join public.sanskara_subjects sj on sj.id = r.subject_id
  where s.id = v_sub;
  if not found or new.user_id is distinct from v_account or new.event_instance is distinct from 'L' || v_lead then
    raise exception 'sanskara_candidate_requires_current_subscription' using errcode = '23514';
  end if;

  v_audience := case
    when v_kind = 'account' and v_owner = v_account then 'self'
    when exists (select 1 from public.sanskara_subject_managers mm where mm.subject_id = v_subject and mm.account_id = v_account) then 'manager'
    else 'viewer' end;
  if new.audience_variant is distinct from v_audience then
    raise exception 'sanskara_candidate_wrong_audience' using errcode = '23514';
  end if;

  if not public.sanskara_reminder_still_valid(v_sub, v_generation, v_version, v_profile_generation) then
    raise exception 'sanskara_candidate_requires_current_subscription' using errcode = '23514';
  end if;

  -- A rolling horizon, so almost nothing is scheduled far ahead and an edit has little to cancel.
  if new.scheduled_for > now() + interval '48 hours' then
    raise exception 'sanskara_candidate_outside_horizon' using errcode = '23514';
  end if;

  -- The link carries no id and no query; the screen re-authorizes on open.
  if new.action_url !~ '^/[a-z0-9/_-]*$' or new.action_url ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-' then
    raise exception 'sanskara_candidate_link_not_generic' using errcode = '23514';
  end if;

  -- Discreet text: it must not repeat a person's name, a milestone's title, or a rite (read either as its key or as words).
  foreach n in array array[v_name, v_title, v_rite, replace(v_rite, '_', ' ')] loop
    if n is not null and length(n) >= 3 and position(lower(n) in lower(new.title || ' ' || new.body)) > 0 then
      raise exception 'sanskara_candidate_not_discreet' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;
create trigger sanskara_validate_candidate before insert on public.notification_candidates
  for each row when (new.event_type = 'sanskar_milestone')
  execute function public.sanskara_validate_candidate();

-- What the producer should create now ---------------------------------------------------------------------------------

-- Reminders whose moment (the planned date minus the lead time, at 09:00 in the recipient's own timezone) falls between
-- p_now - p_late and p_now + p_horizon, that nobody has created a candidate for yet. Everything the producer would need to
-- decide is decided here, by the same sanskara_can used everywhere, so there is no second implementation of access.
-- Quiet hours and budgets stay with the resolver; the recipient's quiet hours and language are returned for the producer.
create function public.sanskara_reminders_due(p_now timestamptz default now(), p_horizon interval default interval '36 hours', p_late interval default interval '3 hours')
returns table (
  subscription_id uuid, subscription_generation integer, record_version integer, profile_generation integer,
  account_id uuid, lead_days integer, audience_variant text, local_date date, scheduled_for timestamptz,
  timezone text, language text, quiet_hours_start smallint, quiet_hours_end smallint)
language sql stable security definer set search_path = ''
as $$
  with timed as materialized (
    select s.id as sid, s.generation as sgen, s.lead_days as lead, s.account_id as acc,
           r.id as rid, r.subject_id as subj, r.version as rver, (r.planned_date - s.lead_days) as remind_date,
           p.sanskara_opt_in_generation as pgen, public.safe_timezone(p.timezone, 'UTC') as tz, p.app_language as lang,
           p.notification_quiet_hours_start as qs, p.notification_quiet_hours_end as qe,
           sj.kind as skind, sj.account_id as sowner,
           (((r.planned_date - s.lead_days) + time '09:00') at time zone public.safe_timezone(p.timezone, 'UTC')) as at_utc
    from public.sanskara_subscriptions s
    join public.sanskara_records r on r.id = s.record_id
    join public.sanskara_subjects sj on sj.id = r.subject_id
    join public.profiles p on p.id = s.account_id
    where s.enabled and r.completed_date is null and r.planned_date is not null
      and p.wants_sanskara_reminders and not p.is_deleting
  )
  select t.sid, t.sgen, t.rver, t.pgen, t.acc, t.lead,
         case when t.skind = 'account' and t.sowner = t.acc then 'self'
              when exists (select 1 from public.sanskara_subject_managers m where m.subject_id = t.subj and m.account_id = t.acc) then 'manager'
              else 'viewer' end,
         t.remind_date, t.at_utc, t.tz, t.lang, t.qs, t.qe
  from timed t
  where t.at_utc >= p_now - p_late and t.at_utc <= p_now + p_horizon
    and public.sanskara_can('receive_reminder', t.subj, t.acc, t.rid)
    and not exists (
      select 1 from public.notification_candidates c
      where c.user_id = t.acc and c.event_type = 'sanskar_milestone' and c.event_id = t.sid::text
        and c.event_instance = 'L' || t.lead and c.local_date = t.remind_date)
  order by t.at_utc, t.sid;
$$;

-- ── Client functions ────────────────────────────────────────────────────────────────────────────────────────────────

-- Switches the caller's reminder for one record at one lead time on or off. Needs the opt-in (wants_sanskara_reminders) to
-- switch on, a dated record that is not complete, and the right to subscribe (a viewer may for a Class B record, never a
-- Class A one). At most 50 subscriptions per account.
create function public.sanskara_set_reminder(p_request_id uuid, p_record uuid, p_lead_days integer, p_enabled boolean) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_subject uuid;
  v_planned date;
  v_completed date;
  v_id uuid;
  v_generation integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'set_reminder');
  if v_replay is not null then return v_replay; end if;

  select r.subject_id into v_subject from public.sanskara_records r where r.id = p_record;
  if v_subject is null or not public.sanskara_can('subscribe', v_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  if p_enabled is null or p_lead_days is null or not (p_lead_days = any (array[0, 1, 3, 7, 14, 30])) then
    raise exception 'sanskara_invalid_reminder' using errcode = 'SK400';
  end if;
  -- Serialise with completion and date edits of the same record.
  select r.planned_date, r.completed_date into v_planned, v_completed from public.sanskara_records r where r.id = p_record for update;

  if p_enabled then
    if not exists (select 1 from public.profiles p where p.id = v_uid and p.wants_sanskara_reminders) then
      raise exception 'sanskara_reminders_off' using errcode = 'SK422';
    end if;
    if v_completed is not null then raise exception 'sanskara_record_completed' using errcode = 'SK422'; end if;
    if v_planned is null then raise exception 'sanskara_no_date' using errcode = 'SK422'; end if;
    if not exists (select 1 from public.sanskara_subscriptions s where s.record_id = p_record and s.account_id = v_uid and s.lead_days = p_lead_days)
       and (select count(*) from public.sanskara_subscriptions s where s.account_id = v_uid) >= 50 then
      raise exception 'sanskara_limit_reached' using errcode = 'SK422';
    end if;
    insert into public.sanskara_subscriptions (record_id, account_id, lead_days)
    values (p_record, v_uid, p_lead_days)
    on conflict (record_id, account_id, lead_days)
    do update set enabled = true, generation = public.sanskara_subscriptions.generation + 1, updated_at = now()
    returning id, generation into v_id, v_generation;
  else
    update public.sanskara_subscriptions
    set enabled = false, generation = generation + 1, updated_at = now()
    where record_id = p_record and account_id = v_uid and lead_days = p_lead_days and enabled
    returning id, generation into v_id, v_generation;
  end if;

  return public.sanskara_finish_request(v_uid, p_request_id,
    jsonb_build_object('id', v_id, 'enabled', p_enabled and v_id is not null, 'generation', v_generation));
end;
$$;

-- The caller's own reminders (those they still have the right to), for the toggles on the screen.
create function public.sanskara_my_reminders() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'record_id', s.record_id, 'lead_days', s.lead_days, 'enabled', s.enabled)
                     order by s.created_at, s.id)
    from public.sanskara_subscriptions s
    join public.sanskara_records r on r.id = s.record_id
    where s.account_id = v_uid and public.sanskara_can('subscribe', r.subject_id, v_uid, r.id)
  ), '[]'::jsonb);
end;
$$;

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array['public.sanskara_set_reminder(uuid, uuid, integer, boolean)', 'public.sanskara_my_reminders()'] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  -- Server code: the producer's selector and the dispatcher's send-time check.
  foreach f in array array[
    'public.sanskara_reminders_due(timestamptz, interval, interval)',
    'public.sanskara_reminder_still_valid(uuid, integer, integer, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
  -- Internal: definer functions and triggers only.
  foreach f in array array[
    'public.sanskara_cancel_reminder_rows(text[], text)',
    'public.sanskara_cancel_reminders(uuid, uuid, uuid, text)',
    'public.sanskara_subscription_removed()',
    'public.sanskara_subscription_changed()',
    'public.sanskara_record_changed()',
    'public.sanskara_profile_reminder_guard()',
    'public.sanskara_kul_membership_end()',
    'public.sanskara_validate_candidate()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
end $$;

commit;
