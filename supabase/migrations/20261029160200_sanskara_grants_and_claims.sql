-- Sanskara tracker, migration M3 of 6: sharing (grant / revoke / list / shared-with-me) and the hand-over at 18 (claims).
-- Design: docs/SANSKARA_TRACKER_BACKEND_DESIGN.md; contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md (v0.3).
-- Depends on M2 (20261029160100): the grants table, sanskara_can and the helper functions already exist there.
--
-- SHARING
--   A grant gives one Kul member VIEW access to one record or to a person's whole timeline of Class B records. It is made
--   by the person it is about, or by a manager of a minor. Whether a grant works is decided on every read by sanskara_can
--   (audience and granter authority re-checked); this migration only creates, ends and lists grants.
--   * sanskara_grant_view / sanskara_revoke_grant: the write side. Anyone who may manage grants for the subject may revoke any
--     grant on it (a revoke by any manager stands), and the grantee may also drop a share made to them.
--   * sanskara_list_access: who can see what, for the owner or a manager. A grant whose audience condition has lapsed (a
--     member left the Kul) is still listed until it is revoked; it grants nothing in the meantime.
--   * sanskara_shared_with_me: the projection for a viewer. A Class B record gives its name, dates and status; a Class A
--     record shared by an explicit grant gives its name or title and whether it is complete, never its dates; private
--     fields are never joined in.
--
-- THE HAND-OVER AT 18 (claims)
--   When a dependent turns 18 their managers become former managers (read-only for 12 months). A former manager can start a
--   claim: the response contains a one-time token, shown once and stored only as a SHA-256 hash. The new adult, signed in to
--   their own account, accepts it with the token; their records MOVE to the adult's own timeline (a record the adult already
--   has wins every conflict and the other is dropped, never merged), every share on the dependent ends, and the dependent
--   record, its managers and the claim are deleted. Safeguards: the token is 64 random hex characters, single use, valid for
--   7 days or until the 12-month window ends, whichever is sooner; starting a new claim cancels the old one; the claimant must
--   not be one of the dependent's managers; it works only from the 18th birthday. The token is a bearer secret handed over out
--   of band (that is the one place identity cannot be proved by the system): the exposure is limited by the above and every
--   start and accept is audited.
--
-- LATER (M4): sanskara_revoke_grant and sanskara_accept_claim also cancel reminders of the people who lose access; there is
-- no subscription table yet, so there is nothing to cancel in this migration.
--
-- Privilege review: all functions are SECURITY DEFINER with an empty search_path; EXECUTE is revoked from PUBLIC, anon and
-- service_role and granted to `authenticated` only. The claims table has forced RLS, no policies and no client grants.
-- Rollback guidance: supabase/rollbacks/20261029160200_sanskara_grants_and_claims_rollback.sql drops the functions and the
-- claims table; it removes pending claims (their tokens stop working) and leaves existing grants in place.

begin;

-- ── Claims ──────────────────────────────────────────────────────────────────────────────────────────────────────────
create table public.sanskara_claims (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.sanskara_subjects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint sanskara_claims_window check (expires_at > created_at)
);
create unique index sanskara_claims_one_pending on public.sanskara_claims (subject_id) where status = 'pending';

alter table public.sanskara_claims enable row level security;
alter table public.sanskara_claims force row level security;
revoke all on table public.sanskara_claims from public, anon, authenticated;
grant all on table public.sanskara_claims to service_role;
comment on table public.sanskara_claims is 'Pending and past hand-overs of a dependent''s records at 18. Only the SHA-256 of the token is stored. Never readable by clients.';

-- ── Grants ──────────────────────────────────────────────────────────────────────────────────────────────────────────

-- Shares a record (p_record) or the whole timeline (p_record null) of a subject, view only, with a member of the caller's Kul.
create function public.sanskara_grant_view(p_request_id uuid, p_subject uuid, p_record uuid, p_grantee uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_kul uuid;
  v_grant uuid;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'grant_view');
  if v_replay is not null then return v_replay; end if;

  -- The record, when named, must belong to the subject; sanskara_can checks that as part of the question.
  if p_grantee is null or not public.sanskara_can('manage_grants', p_subject, v_uid, p_record) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  perform 1 from public.sanskara_subjects s where s.id = p_subject for update;

  if p_grantee = v_uid then
    raise exception 'sanskara_cannot_share_with_self' using errcode = 'SK422';
  end if;
  -- The audience is the caller's own Kul, by the membership of record (kul_members) and the profile, both.
  select km.kul_id into v_kul
  from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
  where km.user_id = v_uid;
  if v_kul is null or not exists (
    select 1 from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
    where km.user_id = p_grantee and km.kul_id = v_kul and not p.is_deleting
  ) then
    raise exception 'sanskara_not_in_your_kul' using errcode = 'SK422';
  end if;
  -- Someone who already has full access (the person themself, or a manager) gains nothing from a view share.
  if exists (select 1 from public.sanskara_subjects s where s.id = p_subject and s.kind = 'account' and s.account_id = p_grantee)
     or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = p_grantee) then
    raise exception 'sanskara_already_has_access' using errcode = 'SK422';
  end if;
  if (select count(*) from public.sanskara_grants g where g.subject_id = p_subject and g.revoked_at is null) >= 50 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;

  begin
    insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
    values (p_subject, p_grantee, v_uid, v_kul, case when p_record is null then 'timeline' else 'record' end, p_record)
    returning id into v_grant;
  exception when unique_violation then
    raise exception 'sanskara_already_shared' using errcode = 'SK409';
  end;
  insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
  values (v_uid, 'grant_created', p_subject, p_grantee, jsonb_build_object('scope', case when p_record is null then 'timeline' else 'record' end));

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', v_grant));
end;
$$;

-- Ends a share. Allowed to anyone who may manage grants for the subject, and to the grantee (leaving a share).
-- M4 adds: cancel the grantee's reminders for the records in the same transaction.
create function public.sanskara_revoke_grant(p_request_id uuid, p_grant uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
  v_replay jsonb;
  v_grant public.sanskara_grants%rowtype;
  v_ended integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'revoke_grant');
  if v_replay is not null then return v_replay; end if;

  select * into v_grant from public.sanskara_grants g where g.id = p_grant;
  if not found or not (v_grant.grantee_id = v_uid or public.sanskara_can('manage_grants', v_grant.subject_id, v_uid)) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  update public.sanskara_grants set revoked_at = now(), revoked_by = v_uid where id = p_grant and revoked_at is null;
  get diagnostics v_ended = row_count;
  if v_ended > 0 then
    insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
    values (v_uid, 'grant_revoked', v_grant.subject_id, v_grant.grantee_id, jsonb_build_object('scope', v_grant.scope));
  end if;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('id', p_grant, 'revoked', true, 'already_revoked', v_ended = 0));
end;
$$;

-- Who can see what, for the owner or a manager. Live (not revoked) grants only.
create function public.sanskara_list_access(p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
begin
  if not public.sanskara_can('manage_grants', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', g.id,
      'scope', g.scope,
      'record_id', g.record_id,
      'created_at', g.created_at,
      'shared_by_me', g.granted_by = v_uid,
      'grantee', jsonb_build_object('id', g.grantee_id, 'username', gp.username, 'full_name', gp.full_name)
    ) order by g.created_at, g.id)
    from public.sanskara_grants g
    left join public.profiles gp on gp.id = g.grantee_id
    where g.subject_id = p_subject and g.revoked_at is null
  ), '[]'::jsonb);
end;
$$;

-- What other people have shared with the caller. Every row is checked by sanskara_can, so a lapsed share shows nothing.
create function public.sanskara_shared_with_me() returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  r record;
  v_out jsonb := '[]'::jsonb;
  v_item jsonb;
begin
  for r in
    select distinct on (rec.id)
      rec.id as record_id, rec.subject_id, rec.rite_key, rec.custom_title, rec.planned_date, rec.completed_date, rt.sensitivity,
      s.kind as subject_kind, s.display_name,
      g.granted_by, sp.username as sharer_username, sp.full_name as sharer_full_name
    from public.sanskara_grants g
    join public.sanskara_subjects s on s.id = g.subject_id
    join public.sanskara_records rec on rec.subject_id = g.subject_id
    join public.sanskara_rites rt on rt.rite_key = rec.rite_key
    left join public.profiles sp on sp.id = g.granted_by
    where g.grantee_id = v_uid and g.revoked_at is null
      and ((g.scope = 'record' and g.record_id = rec.id) or (g.scope = 'timeline' and rt.sensitivity = 'B'))
    order by rec.id
    limit 500
  loop
    if public.sanskara_can('read_meta', r.subject_id, v_uid, r.record_id) then
      v_item := jsonb_build_object(
        'record_id', r.record_id,
        'subject', jsonb_build_object('id', r.subject_id, 'kind', r.subject_kind, 'label', r.display_name),
        'shared_by', jsonb_build_object('id', r.granted_by, 'username', r.sharer_username, 'full_name', r.sharer_full_name),
        'rite_key', r.rite_key,
        'custom_title', r.custom_title,
        'sensitivity', r.sensitivity,
        'completed', r.completed_date is not null);
      if public.sanskara_can('read_record', r.subject_id, v_uid, r.record_id) then
        v_item := v_item || jsonb_build_object('planned_date', r.planned_date, 'completed_date', r.completed_date);
      end if;
      v_out := v_out || jsonb_build_array(v_item);
    end if;
  end loop;
  return v_out;
end;
$$;

-- ── Claims: the hand-over at 18 ─────────────────────────────────────────────────────────────────────────────────────

-- A former manager starts a claim. The token is returned ONCE, in this response only; the stored response (used for a retry)
-- omits it, so a lost response means starting again, which cancels the first.
create function public.sanskara_start_claim(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_adult_on date;
  v_window_end timestamptz;
  v_token text;
  v_claim uuid;
  v_expires timestamptz;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'start_claim');
  if v_replay is not null then return v_replay; end if;

  if not exists (select 1 from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent')
     or not public.sanskara_can('start_claim', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  perform 1 from public.sanskara_subjects s where s.id = p_subject for update;

  select (s.birth_date + interval '18 years')::date into v_adult_on from public.sanskara_subjects s where s.id = p_subject;
  v_window_end := ((v_adult_on + interval '12 months')::date)::timestamp at time zone 'utc';
  v_expires := least(now() + interval '7 days', v_window_end);

  update public.sanskara_claims set status = 'cancelled', responded_at = now() where subject_id = p_subject and status = 'pending';

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.sanskara_claims (subject_id, created_by, token_hash, expires_at)
  values (p_subject, v_uid, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_expires)
  returning id into v_claim;
  insert into public.sanskara_audit (actor_id, action, subject_id) values (v_uid, 'claim_started', p_subject);

  perform public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('claim_id', v_claim, 'expires_at', v_expires));
  return jsonb_build_object('claim_id', v_claim, 'expires_at', v_expires, 'token', v_token);
end;
$$;

-- Withdraws the pending claim, if any; its token stops working at once.
create function public.sanskara_cancel_claim(p_request_id uuid, p_subject uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_cancelled integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'cancel_claim');
  if v_replay is not null then return v_replay; end if;

  if not exists (select 1 from public.sanskara_subjects s where s.id = p_subject and s.kind = 'dependent')
     or not public.sanskara_can('start_claim', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  update public.sanskara_claims set status = 'cancelled', responded_at = now() where subject_id = p_subject and status = 'pending';
  get diagnostics v_cancelled = row_count;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('cancelled', v_cancelled));
end;
$$;

-- The new adult accepts. Every failure of the token (unknown, malformed, used, cancelled, expired, outside the window, or
-- the caller manages the dependent) answers the same SK404, so the token space cannot be probed.
create function public.sanskara_accept_claim(p_request_id uuid, p_token text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_replay jsonb;
  v_claim public.sanskara_claims%rowtype;
  v_adult_on date;
  v_today date := (now() at time zone 'utc')::date;
  v_mine uuid;
  v_moved integer;
  v_dropped integer;
begin
  v_replay := public.sanskara_claim_request(v_uid, p_request_id, 'accept_claim');
  if v_replay is not null then return v_replay; end if;

  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;
  select * into v_claim from public.sanskara_claims c
  where c.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and c.status = 'pending' and c.expires_at > now()
  for update;
  if not found then raise exception 'sanskara_not_found' using errcode = 'SK404'; end if;

  select (s.birth_date + interval '18 years')::date into v_adult_on
  from public.sanskara_subjects s where s.id = v_claim.subject_id and s.kind = 'dependent';
  if v_adult_on is null or v_today < v_adult_on or v_today >= (v_adult_on + interval '12 months')::date
     or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = v_claim.subject_id and m.account_id = v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  -- The claimant's own timeline (created if they have none), then both subjects locked in a fixed order.
  insert into public.sanskara_subjects (kind, account_id) values ('account', v_uid)
  on conflict (account_id) where kind = 'account' do nothing;
  select s.id into v_mine from public.sanskara_subjects s where s.kind = 'account' and s.account_id = v_uid;
  perform 1 from public.sanskara_subjects s where s.id in (v_mine, v_claim.subject_id) order by s.id for update;

  -- A record the claimant already has for a rite wins; the dependent's is dropped, never merged. Custom milestones all move.
  if (select count(*) from public.sanskara_records r where r.subject_id = v_mine)
     + (select count(*) from public.sanskara_records r
        where r.subject_id = v_claim.subject_id
          and (r.rite_key = 'custom' or not exists (select 1 from public.sanskara_records c where c.subject_id = v_mine and c.rite_key = r.rite_key))) > 100 then
    raise exception 'sanskara_limit_reached' using errcode = 'SK422';
  end if;
  begin
    update public.sanskara_records r
    set subject_id = v_mine, version = r.version + 1, updated_at = now()
    where r.subject_id = v_claim.subject_id
      and (r.rite_key = 'custom' or not exists (select 1 from public.sanskara_records c where c.subject_id = v_mine and c.rite_key = r.rite_key));
    get diagnostics v_moved = row_count;
  exception when unique_violation then
    raise exception 'sanskara_conflict' using errcode = 'SK409';
  end;
  select count(*) into v_dropped from public.sanskara_records r where r.subject_id = v_claim.subject_id;

  -- Everything the managers shared ends with their authority; nothing carries over to the new owner.
  delete from public.sanskara_grants where subject_id = v_claim.subject_id;
  insert into public.sanskara_audit (actor_id, action, subject_id, target_id)
  values (v_uid, 'claim_accepted', v_claim.subject_id, v_claim.created_by);
  -- The dependent, its managers, its remaining records and the claim row go together.
  delete from public.sanskara_subjects where id = v_claim.subject_id;

  return public.sanskara_finish_request(v_uid, p_request_id, jsonb_build_object('moved', v_moved, 'dropped_as_duplicates', v_dropped));
end;
$$;

-- ── Privileges ──────────────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.sanskara_grant_view(uuid, uuid, uuid, uuid)',
    'public.sanskara_revoke_grant(uuid, uuid)',
    'public.sanskara_list_access(uuid)',
    'public.sanskara_shared_with_me()',
    'public.sanskara_start_claim(uuid, uuid)',
    'public.sanskara_cancel_claim(uuid, uuid)',
    'public.sanskara_accept_claim(uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, service_role', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

commit;
