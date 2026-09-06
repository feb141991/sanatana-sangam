-- Repair Mandali join/create privilege and member-count integrity, without
-- broadening any table-level RLS grant.
--
-- INCIDENT (all confirmed against live data before writing this migration)
-- ---------------------------------------------------------------------------
-- find_or_create_mandali() and update_mandali_member_count() are both
-- SECURITY INVOKER (native's own code comment claiming DEFINER was simply
-- wrong -- not a past truth that regressed; no migration ever made either
-- function DEFINER). public.mandalis RLS has exactly two policies: SELECT
-- for everyone, INSERT for service_role only -- there is no UPDATE policy
-- for ANY role, not even service_role.
--
-- Consequence, PROVEN with live data, not just inferred: profile
-- 421da789-6c41-4c29-9f8f-0b37c317ca3a has mandali_id correctly set to
-- Tirana's mandali (3ae30209-d728-451b-8fd4-8ae810d70ae8) -- their own
-- profile self-update succeeded, since users may update their own row --
-- but that mandali's member_count is still 0. The trigger's
-- `UPDATE mandalis SET member_count = ...` silently matched zero rows
-- under RLS (UPDATE's USING clause just filters to nothing; it is not an
-- exception), because it ran as `authenticated` (SECURITY INVOKER,
-- following whoever performed the triggering profiles UPDATE) with no
-- UPDATE policy to authorize it. This is the confirmed cause of the
-- Tirana-specific symptom -- distinct from, and does not require, any
-- new-city creation privilege defect, since Tirana already existed. Native
-- lib/mandali.ts:265's joinMandaliForLocation performs exactly this raw
-- client-side profiles update (not the admin-client-backed
-- /api/mandali/join route, which incidentally bypasses RLS today only
-- because service_role has rolbypassrls=true).
--
-- A SEPARATE, also-real defect affects any city that does not already
-- exist: find_or_create_mandali's own INSERT into mandalis, run as
-- SECURITY INVOKER by an authenticated caller, is rejected outright by
-- RLS (no INSERT policy for authenticated) rather than silently
-- swallowed. Fixed here by giving find_or_create_mandali the same
-- postgres-owned SECURITY DEFINER treatment (postgres has
-- rolbypassrls=true, confirmed via pg_roles) -- restoring old installed
-- binaries' new-city path without requiring an app update, since they
-- call this RPC directly.
--
-- SAFEGUARDS APPLIED (per explicit review before this was written)
-- ---------------------------------------------------------------------------
-- 1. find_or_create_mandali itself now rejects unauthenticated and banned
--    callers -- it becomes MORE privileged (DEFINER) here, so it must not
--    become a path for a banned user to create Mandalis merely because it
--    predates the new join_mandali() wrapper and old clients call it
--    directly.
-- 2. Both functions use a fixed `search_path = public, pg_temp`, every
--    object reference is schema-qualified, and EXECUTE is revoked from
--    PUBLIC/anon on both, granted only to `authenticated` (join_mandali)
--    or `authenticated`/`service_role` (find_or_create_mandali, matching
--    its existing live grants exactly -- not broadened).
-- 3. join_mandali() takes `SELECT ... FOR UPDATE` on the caller's OWN
--    profile row before comparing/changing membership -- serializes
--    concurrent calls from the same user (e.g. a rapid double-tap) and
--    lets the function safely read current membership before writing.
--    Re-joining the SAME mandali the caller is already in is an explicit
--    idempotent no-op (returns changed:false) BEFORE any UPDATE is
--    issued, so it can never double-count. find_or_create_mandali's
--    existing pg_advisory_xact_lock on the city/country key (unchanged)
--    already serializes concurrent creation of the same new city across
--    different users.
-- 4. update_mandali_member_count is also made SECURITY DEFINER (was the
--    single remaining path where member_count could still go stale: an
--    old client's raw direct `profiles` update, run as `authenticated`
--    with no admin client and not going through join_mandali at all --
--    e.g. lib/mandali.ts's existing leaveMandali). Making the COUNT
--    TRIGGER itself definer-safe fixes member_count correctness for every
--    caller of a profiles.mandali_id change, not only calls that happen
--    to go through the new RPC -- verified both ways below, not assumed.
-- 5. No change to profiles' own RLS policies -- self-row update
--    restrictions are exactly as strict as before this migration. Old
--    clients performing find_or_create_mandali + a separate raw profiles
--    update are still two separate statements, not one transaction (that
--    property is genuinely improved only for callers of the new
--    join_mandali RPC); this migration does not claim otherwise.
-- 6. The Tirana screenshot's likely-observed symptom (a join that
--    "worked" -- profile.mandali_id set correctly -- but the community
--    reads as having 0 members) is explained by the member_count
--    suppression above, independent of the new-city creation defect,
--    which Tirana's pre-existing row was never exposed to.
--
-- Every scenario below was exercised live against production after this
-- migration, using auth.uid()-spoofed transactions against real test
-- accounts with zero pre-existing Mandali membership, then fully cleaned
-- up (profiles.mandali_id restored, mandalis test rows removed, no
-- membership residue): existing-city join, new-city creation, sequential
-- new-city creation by two different users resolving to the SAME row (a
-- proxy for concurrent creation -- true concurrency was not exercised,
-- since this tooling cannot issue two truly simultaneous sessions),
-- repeated join (idempotent, no double count), missing profile
-- (rejected), invalid coordinates (rejected, rolled back with zero
-- partial rows), member_count correctness through join_mandali AND
-- through a raw direct profiles update (the exact old-client sequence:
-- find_or_create_mandali direct call + a separate raw UPDATE), and a bad
-- mandali_id for join-by-id (friendly "Mandali not found", not a raw FK
-- violation).
--
-- NOT live-tested: the banned-caller rejection. No currently-banned
-- account exists on this project, and flipping a real account's
-- is_banned flag to manufacture one for a test was correctly treated as
-- a moderation action requiring separate authorization -- not done here.
-- The check itself (`coalesce(is_banned, false)` read from the same
-- locked profile row, checked before any city resolution or write) is a
-- direct code-level match to the existing, already-relied-upon
-- assertNotBanned() pattern (src/lib/api-guards.ts) and was reviewed, not
-- assumed, but is disclosed here as unverified by an actual live call.
--
-- ONE-TIME DATA REPAIR (separate from the schema change above, run once
-- immediately after applying it): member_count had already drifted for
-- rows affected by the bug before this fix landed. Recomputed every
-- mandalis.member_count from an actual `count(profiles) WHERE mandali_id
-- = mandalis.id` and applied only where they disagreed -- exactly 2 rows
-- needed correction (Tirana 0->1, Madrid 0->1), both matching real,
-- already-known members. This is not part of the forward migration
-- itself (a fresh environment replaying only the DDL/function bodies
-- above would not need it, having never accumulated the drift), so it is
-- documented here rather than encoded as SQL in this file.
--
-- ROLLBACK
-- --------
-- Re-apply the previous function bodies (SECURITY INVOKER, no auth/ban
-- checks) captured in this incident's audit trail, and
-- `drop function public.join_mandali(uuid, text, text, double precision, double precision);`.
-- Rolling back does not require any RLS policy change, since none was
-- made.

create or replace function public.find_or_create_mandali(
  p_city text,
  p_country text,
  p_lat double precision default null,
  p_lon double precision default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_banned boolean;
  v_city       text;
  v_country    text;
  v_mandali_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select coalesce(is_banned, false) into v_is_banned
  from public.profiles
  where id = v_user_id;

  if v_is_banned then
    raise exception 'Account is suspended' using errcode = '28000';
  end if;

  if p_lat is not null and (p_lat < -90 or p_lat > 90) then
    raise exception 'Invalid latitude' using errcode = '22023';
  end if;
  if p_lon is not null and (p_lon < -180 or p_lon > 180) then
    raise exception 'Invalid longitude' using errcode = '22023';
  end if;

  -- 1. Canonicalize the input city and country
  select r.canonical_city, r.canonical_country
    into v_city, v_country
  from public.resolve_mandali_location(p_city, p_country) r;

  if v_city = '' or v_country = '' then
    raise exception 'find_or_create_mandali: city and country are required';
  end if;

  -- 2. Try to find EXACT match first
  select id into v_mandali_id
  from public.mandalis
  where lower(city) = lower(v_city)
    and lower(country) = lower(v_country)
  limit 1;

  if v_mandali_id is not null then
    return v_mandali_id;
  end if;

  -- 3. If no exact match, and we have lat/lon, try RADIUS FALLBACK
  if p_lat is not null and p_lon is not null then
    select id into v_mandali_id
    from public.mandalis
    where latitude <> 0 and longitude <> 0
      and public.haversine_distance_km(latitude, longitude, p_lat, p_lon) <= radius_km
    order by member_count desc, public.haversine_distance_km(latitude, longitude, p_lat, p_lon) asc
    limit 1;

    if v_mandali_id is not null then
      return v_mandali_id;
    end if;
  end if;

  -- 4. Serialize concurrent creation for the exact city/country
  perform pg_advisory_xact_lock(
    hashtext('mandali:' || lower(v_city) || '|' || lower(v_country))
  );

  -- Double-check exact match under lock
  select id into v_mandali_id
  from public.mandalis
  where lower(city) = lower(v_city)
    and lower(country) = lower(v_country)
  limit 1;

  if v_mandali_id is null then
    insert into public.mandalis (name, city, country, latitude, longitude, radius_km)
    values (
      v_city || ' Mandali',
      v_city,
      v_country,
      coalesce(p_lat, 0),
      coalesce(p_lon, 0),
      15
    )
    on conflict do nothing
    returning id into v_mandali_id;

    if v_mandali_id is null then
      select id into v_mandali_id
      from public.mandalis
      where lower(city) = lower(v_city)
        and lower(country) = lower(v_country)
      limit 1;
    end if;
  end if;

  return v_mandali_id;
end;
$$;

revoke all on function public.find_or_create_mandali(text, text, double precision, double precision) from public, anon;
grant execute on function public.find_or_create_mandali(text, text, double precision, double precision) to authenticated, service_role;

create or replace function public.update_mandali_member_count()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.mandali_id is not null then
      update public.mandalis
        set member_count = member_count + 1
        where id = NEW.mandali_id;
    end if;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if OLD.mandali_id is distinct from NEW.mandali_id then
      if OLD.mandali_id is not null then
        update public.mandalis
          set member_count = greatest(member_count - 1, 0)
          where id = OLD.mandali_id;
      end if;
      if NEW.mandali_id is not null then
        update public.mandalis
          set member_count = member_count + 1
          where id = NEW.mandali_id;
      end if;
    end if;
    return NEW;
  elsif TG_OP = 'DELETE' then
    if OLD.mandali_id is not null then
      update public.mandalis
        set member_count = greatest(member_count - 1, 0)
        where id = OLD.mandali_id;
    end if;
    return OLD;
  end if;
  return null;
end;
$$;

revoke all on function public.update_mandali_member_count() from public, anon, authenticated;

-- One atomic, server-identity-derived join for both new-city/location and
-- by-id joins. Old installed clients are unaffected -- they keep calling
-- find_or_create_mandali directly (now safe) plus their own separate
-- profiles update; this is the path new native/PWA calls use.
create or replace function public.join_mandali(
  p_mandali_id uuid default null,
  p_city text default null,
  p_country text default null,
  p_lat double precision default null,
  p_lon double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_banned boolean;
  v_current_mandali_id uuid;
  v_target_mandali_id uuid;
  v_updated_rows int;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Lock the caller's OWN profile row before reading/comparing membership
  -- -- serializes concurrent calls from the same user and makes the
  -- subsequent idempotency check and update race-free.
  select mandali_id, coalesce(is_banned, false)
    into v_current_mandali_id, v_is_banned
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_is_banned then
    raise exception 'Account is suspended' using errcode = '28000';
  end if;

  if p_mandali_id is not null then
    select id into v_target_mandali_id from public.mandalis where id = p_mandali_id;
    if v_target_mandali_id is null then
      raise exception 'Mandali not found' using errcode = 'P0002';
    end if;
  else
    if p_city is null or btrim(p_city) = '' or p_country is null or btrim(p_country) = '' then
      raise exception 'city and country are required when mandali_id is not provided' using errcode = '22023';
    end if;
    if p_lat is not null and (p_lat < -90 or p_lat > 90) then
      raise exception 'Invalid latitude' using errcode = '22023';
    end if;
    if p_lon is not null and (p_lon < -180 or p_lon > 180) then
      raise exception 'Invalid longitude' using errcode = '22023';
    end if;
    v_target_mandali_id := public.find_or_create_mandali(p_city, p_country, p_lat, p_lon);
  end if;

  -- Idempotent: already a member of exactly this mandali -- no-op, no
  -- profiles write, no trigger fire, no possibility of double-counting a
  -- repeated join.
  if v_current_mandali_id is not distinct from v_target_mandali_id then
    select member_count into v_member_count from public.mandalis where id = v_target_mandali_id;
    return jsonb_build_object('mandaliId', v_target_mandali_id, 'memberCount', coalesce(v_member_count, 0), 'changed', false);
  end if;

  update public.profiles
  set mandali_id = v_target_mandali_id,
      city = coalesce(nullif(btrim(p_city), ''), city),
      country = coalesce(nullif(btrim(p_country), ''), country),
      latitude = coalesce(p_lat, latitude),
      longitude = coalesce(p_lon, longitude)
  where id = v_user_id;

  get diagnostics v_updated_rows = row_count;
  if v_updated_rows <> 1 then
    raise exception 'Membership update affected % rows, expected 1', v_updated_rows using errcode = 'P0001';
  end if;

  select member_count into v_member_count from public.mandalis where id = v_target_mandali_id;

  return jsonb_build_object('mandaliId', v_target_mandali_id, 'memberCount', coalesce(v_member_count, 0), 'changed', true);
end;
$$;

revoke all on function public.join_mandali(uuid, text, text, double precision, double precision) from public, anon;
grant execute on function public.join_mandali(uuid, text, text, double precision, double precision) to authenticated;
