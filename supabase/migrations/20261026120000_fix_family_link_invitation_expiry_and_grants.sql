-- Fixes two defects in 20261026010000_kul_family_member_account_linking,
-- found by external review and independently reproduced before this fix:
--
-- 1. The one-pending-per-node unique index treats every status='pending'
--    row as live, even past expires_at. create_family_link_invitation's
--    `on conflict ... do nothing` then silently no-ops against a stale
--    expired row while still returning {success: true} -- a node with one
--    unanswered, expired invitation could never be re-invited again, with
--    no visible error. Fix: close out any expired pending row for that
--    node, in the same statement, immediately before inserting the
--    replacement. 'expired' is a real terminal status now (not just a
--    read-time label), so it needs a place in the status check.
-- 2. `revoke execute ... from anon` left the implicit PUBLIC grant (every
--    newly created function grants EXECUTE to PUBLIC by default) intact,
--    which anon inherits from regardless of the per-role revoke --
--    confirmed live: `has_function_privilege('anon', ...)` returned true
--    for all three sensitive functions. Not exploitable on its own (every
--    function still rejects a null auth.uid()), but the grant itself
--    should say what's intended: authenticated only, nothing inherited
--    from PUBLIC.

alter table public.kul_family_link_invitations
  drop constraint if exists kul_family_link_invitations_status_check;
alter table public.kul_family_link_invitations
  add constraint kul_family_link_invitations_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired'));

create or replace function public.create_family_link_invitation(
  p_family_member_id uuid,
  p_username text
) returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
  v_target_user_id uuid;
  v_token text;
  v_rate json;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select kul_id into v_kul_id from public.kul_members
  where user_id = v_user_id and role = 'guardian';
  if v_kul_id is null then
    raise exception 'Only a family guardian can send a link invitation';
  end if;

  v_rate := public.check_and_increment_rate_limit(
    'kul_family_link_invite:' || v_user_id::text, 20, 86400
  );
  if not (v_rate->>'allowed')::boolean then
    raise exception 'Too many invitations sent recently. Try again later.' using errcode = '42901';
  end if;

  perform 1 from public.kul_family_members
  where id = p_family_member_id and kul_id = v_kul_id for update;
  if not found then
    raise exception 'Family member was not found';
  end if;

  perform 1 from public.kul_family_members
  where id = p_family_member_id and linked_user_id is not null;
  if found then
    raise exception 'This family member is already linked to an account';
  end if;

  -- Close out a stale, unanswered invitation before the uniqueness check
  -- below ever sees it -- this is what the old code was missing.
  update public.kul_family_link_invitations
  set status = 'expired', responded_at = now()
  where family_member_id = p_family_member_id and status = 'pending' and expires_at < now();

  select id into v_target_user_id from public.profiles
  where username = btrim(p_username);

  if v_target_user_id is not null then
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    insert into public.kul_family_link_invitations
      (kul_id, family_member_id, invited_user_id, token, created_by)
    values (v_kul_id, p_family_member_id, v_target_user_id, v_token, v_user_id)
    on conflict (family_member_id) where status = 'pending' do nothing;
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.create_family_link_invitation(uuid, text) from public, anon;
revoke all on function public.list_my_family_link_invitations() from public, anon;
revoke all on function public.respond_to_family_link_invitation(text, boolean) from public, anon;
revoke all on function public.cancel_family_link_invitation(uuid) from public, anon;
revoke all on function public.unlink_family_member(uuid) from public, anon;
revoke all on function public.list_family_link_invitations_for_guardian() from public, anon;

grant execute on function public.create_family_link_invitation(uuid, text) to authenticated;
grant execute on function public.list_my_family_link_invitations() to authenticated;
grant execute on function public.respond_to_family_link_invitation(text, boolean) to authenticated;
grant execute on function public.cancel_family_link_invitation(uuid) to authenticated;
grant execute on function public.unlink_family_member(uuid) to authenticated;
grant execute on function public.list_family_link_invitations_for_guardian() to authenticated;
