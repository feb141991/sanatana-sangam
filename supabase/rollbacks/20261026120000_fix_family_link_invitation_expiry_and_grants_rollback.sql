-- Reverts to the pre-fix status check and function body, and restores the
-- original (defective) grant shape. Only run this to deliberately
-- reintroduce the expiry bug and the PUBLIC-inherited grant; there is no
-- reason to do that outside of testing this rollback itself.

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

alter table public.kul_family_link_invitations
  drop constraint if exists kul_family_link_invitations_status_check;
alter table public.kul_family_link_invitations
  add constraint kul_family_link_invitations_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled'));

grant execute on function public.create_family_link_invitation(uuid, text) to anon;
grant execute on function public.list_my_family_link_invitations() to anon;
grant execute on function public.respond_to_family_link_invitation(text, boolean) to anon;
grant execute on function public.cancel_family_link_invitation(uuid) to anon;
grant execute on function public.unlink_family_member(uuid) to anon;
grant execute on function public.list_family_link_invitations_for_guardian() to anon;
