-- Forward-only repair; no city/member/content cleanup. Roll back by restoring
-- function definitions from 20260906002021, never by deleting city rows.
-- Same-name cities require an explicit target when identity is ambiguous.
create or replace function public.find_or_create_mandali(
  p_city text, p_country text,
  p_lat double precision default null, p_lon double precision default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_city text;
  v_country text;
  v_ids uuid[];
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if exists(select 1 from public.profiles where id = auth.uid() and is_banned) then
    raise exception 'Account is suspended' using errcode = '28000';
  end if;
  if (p_lat is null) <> (p_lon is null)
     or (p_lat is not null and not (p_lat between -90 and 90))
     or (p_lon is not null and not (p_lon between -180 and 180)) then
    raise exception 'Invalid coordinates' using errcode = '22023';
  end if;
  select r.canonical_city, r.canonical_country into v_city, v_country
    from public.resolve_mandali_location(p_city, p_country) r;
  if nullif(btrim(v_city), '') is null or nullif(btrim(v_country), '') is null then
    raise exception 'City and country are required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('mandali:' || lower(v_city) || '|' || lower(v_country)));
  select array_agg(id order by id) into v_ids from public.mandalis
    where lower(btrim(city)) = lower(btrim(v_city)) and lower(btrim(country)) = lower(btrim(v_country));
  if cardinality(v_ids) > 1 then
    raise exception 'Multiple Mandalis match this city. Select a specific Mandali.' using errcode = '22023';
  elsif cardinality(v_ids) = 1 then
    if p_lat is not null and exists (
      select 1 from public.mandalis where id = v_ids[1]
        and latitude <> 0 and longitude <> 0
        and public.haversine_distance_km(latitude, longitude, p_lat, p_lon) > radius_km
    ) then
      raise exception 'City name matches a different location. Select a specific Mandali.' using errcode = '22023';
    end if;
    return v_ids[1];
  end if;

  -- Preserve nearby matching, but never cross a country border implicitly.
  if p_lat is not null then
    select id into v_id from public.mandalis
      where lower(btrim(country)) = lower(btrim(v_country))
        and latitude <> 0 and longitude <> 0
        and public.haversine_distance_km(latitude, longitude, p_lat, p_lon) <= radius_km
      order by member_count desc, public.haversine_distance_km(latitude, longitude, p_lat, p_lon), id limit 1;
    if v_id is not null then return v_id; end if;
  end if;
  insert into public.mandalis(name, city, country, latitude, longitude, radius_km)
    values(v_city || ' Mandali', v_city, v_country, coalesce(p_lat, 0), coalesce(p_lon, 0), 15)
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.find_or_create_mandali(text,text,double precision,double precision) from public, anon;
grant execute on function public.find_or_create_mandali(text,text,double precision,double precision) to authenticated, service_role;

-- Validate by-ID callers too, and verify AFTER triggers did not redirect
-- membership while the function reports the originally requested target.
create or replace function public.join_mandali(
  p_mandali_id uuid default null, p_city text default null, p_country text default null,
  p_lat double precision default null, p_lon double precision default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_previous uuid;
  v_target uuid;
  v_actual uuid;
  v_banned boolean;
  v_count integer;
  v_rows integer;
begin
  if v_user is null then raise exception 'Not authenticated' using errcode = '28000'; end if;
  if (p_lat is null) <> (p_lon is null)
     or (p_lat is not null and not (p_lat between -90 and 90))
     or (p_lon is not null and not (p_lon between -180 and 180)) then
    raise exception 'Invalid coordinates' using errcode = '22023';
  end if;
  select mandali_id, coalesce(is_banned, false) into v_previous, v_banned
    from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  if v_banned then raise exception 'Account is suspended' using errcode = '28000'; end if;
  if p_mandali_id is not null then
    select id into v_target from public.mandalis where id = p_mandali_id;
  else
    v_target := public.find_or_create_mandali(p_city, p_country, p_lat, p_lon);
  end if;
  if v_target is null then raise exception 'Mandali not found' using errcode = 'P0002'; end if;
  if v_previous is distinct from v_target then
    -- Stable order also prevents opposite-direction joins deadlocking counters.
    perform id from public.mandalis where id in (v_previous, v_target) order by id for update;
    update public.profiles set mandali_id = v_target,
      city = coalesce(nullif(btrim(p_city), ''), city),
      country = coalesce(nullif(btrim(p_country), ''), country),
      latitude = coalesce(p_lat, latitude), longitude = coalesce(p_lon, longitude)
      where id = v_user;
    get diagnostics v_rows = row_count;
    select mandali_id into v_actual from public.profiles where id = v_user;
    if v_rows <> 1 or v_actual is distinct from v_target then
      raise exception 'Membership was not confirmed' using errcode = 'P0001';
    end if;
  end if;
  select member_count into v_count from public.mandalis where id = v_target;
  return jsonb_build_object('mandaliId', v_target, 'memberCount', coalesce(v_count, 0), 'changed', v_previous is distinct from v_target);
end;
$$;
revoke all on function public.join_mandali(uuid,text,text,double precision,double precision) from public, anon;
grant execute on function public.join_mandali(uuid,text,text,double precision,double precision) to authenticated;

-- Optional auto-assignment must not break server-side profile provisioning,
-- or a profile city edit that needs explicit duplicate-city selection.
create or replace function public.auto_assign_mandali_on_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() = NEW.id and not coalesce(NEW.is_banned, false)
     and NEW.mandali_id is null and NEW.city is not null and NEW.country is not null then
    begin
      NEW.mandali_id := public.find_or_create_mandali(NEW.city, NEW.country,
        coalesce(NEW.home_latitude, NEW.latitude), coalesce(NEW.home_longitude, NEW.longitude));
    exception when sqlstate '22023' or sqlstate '28000' then
      NEW.mandali_id := null;
    end;
  end if;
  return NEW;
end;
$$;
create or replace function public.auto_assign_mandali()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() = NEW.id and not coalesce(NEW.is_banned, false)
     and NEW.mandali_id is null and NEW.city is not null and NEW.country is not null
     and (OLD.city is distinct from NEW.city or OLD.country is distinct from NEW.country) then
    begin
      NEW.mandali_id := public.find_or_create_mandali(NEW.city, NEW.country,
        coalesce(NEW.home_latitude, NEW.latitude), coalesce(NEW.home_longitude, NEW.longitude));
    exception when sqlstate '22023' or sqlstate '28000' then
      NEW.mandali_id := null;
    end;
  end if;
  return NEW;
end;
$$;
revoke all on function public.auto_assign_mandali_on_insert() from public, anon, authenticated;
revoke all on function public.auto_assign_mandali() from public, anon, authenticated;

-- Old binaries can still update their profile directly after resolving a
-- city. Enforce suspension on that path too; leaving remains permitted.
create or replace function public.guard_mandali_membership_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() = OLD.id and coalesce(OLD.is_banned, false)
     and NEW.mandali_id is not null and OLD.mandali_id is distinct from NEW.mandali_id then
    raise exception 'Account is suspended' using errcode = '28000';
  end if;
  return NEW;
end;
$$;
revoke all on function public.guard_mandali_membership_write() from public, anon, authenticated;
drop trigger if exists guard_mandali_membership_write on public.profiles;
create trigger guard_mandali_membership_write before update of mandali_id on public.profiles
  for each row execute function public.guard_mandali_membership_write();
