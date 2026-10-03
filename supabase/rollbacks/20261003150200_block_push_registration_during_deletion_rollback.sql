-- Rollback for 20261003150200_block_push_registration_during_deletion.sql.
-- Restores the 20260930100110 body (no deletion check). Grants are kept by
-- create or replace. Ship the route change's revert alongside, or the route
-- simply never sees SQLSTATE SHDEL again (harmless).

begin;

create or replace function public.register_native_push_token(p_user_id uuid, p_token text, p_platform text default 'unknown')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_version uuid;
begin
  if p_token is null or length(p_token) > 250 or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid Expo token';
  end if;
  insert into public.push_tokens (user_id, token, platform, last_seen_at, updated_at)
  values (p_user_id, p_token, p_platform, now(), now())
  on conflict (token) do update set
    user_id = excluded.user_id, platform = excluded.platform, last_seen_at = now(), updated_at = now()
  returning binding_version into v_version;
  return v_version;
end;
$$;

commit;
