-- Refuse push-token registration for an account in its 30-day deletion
-- cool-off.
--
-- POST /api/user/delete/request deletes the caller's push_tokens, but Native
-- re-registers the device on every launch, foreground return and Settings
-- visit, so the tokens came straight back. sendViaExpo still skipped deleting
-- recipients, but "tokens revoked" was not true for more than a few seconds.
--
-- The check lives in the registration RPC, not only in the route, so it is
-- atomic with the insert: FOR SHARE on the caller's profile row makes a
-- registration that started before a concurrent deletion request either commit
-- first (and then be removed by the request's token delete, which runs after
-- the is_deleting update) or wait and see is_deleting = true. A missing profile
-- row is not treated as deleting.
--
-- The route maps SQLSTATE SHDEL to HTTP 409 { code: 'ACCOUNT_DELETION_PENDING' },
-- which Native treats as a terminal, non-retryable state. Cancelling deletion
-- clears is_deleting, after which Native's next registration succeeds.
--
-- Privilege review: unchanged from 20260930100110 -- SECURITY DEFINER, EXECUTE
-- revoked from public/anon/authenticated and granted to service_role only;
-- create or replace keeps the existing grants. Reads profiles.is_deleting only.
--
-- Rollback guidance: supabase/rollbacks/20261003150200_block_push_registration_during_deletion_rollback.sql
-- restores the 20260930100110 body. No data is changed by either direction.

begin;

create or replace function public.register_native_push_token(p_user_id uuid, p_token text, p_platform text default 'unknown')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_version uuid;
  v_is_deleting boolean;
begin
  if p_token is null or length(p_token) > 250 or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then
    raise exception 'Invalid Expo token';
  end if;
  select is_deleting into v_is_deleting from public.profiles where id = p_user_id for share;
  if v_is_deleting is true then
    raise exception 'account_deletion_pending' using errcode = 'SHDEL';
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
