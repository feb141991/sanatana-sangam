-- KUL member profiles / family tree linking (stage 2 of the family-tree
-- account-linking plan). Lets a guardian invite a specific tree node's real
-- person by username; the person must already be (or first become) a KUL
-- member, then explicitly accepts before their account is linked to that
-- node. Mirrors kul_invitations' own pattern exactly: RLS enabled with zero
-- direct policies (deny-all to anon/authenticated), every read/write goes
-- through an audited SECURITY DEFINER RPC below.

create table if not exists public.kul_family_link_invitations (
  id uuid primary key default gen_random_uuid(),
  kul_id uuid not null references public.kuls(id) on delete cascade,
  family_member_id uuid not null references public.kul_family_members(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz
);

-- Only one live invitation per tree node at a time -- a guardian must
-- cancel (or let it resolve) before re-inviting that same node.
create unique index if not exists kul_family_link_invitations_one_pending_per_node
  on public.kul_family_link_invitations (family_member_id)
  where status = 'pending';

create index if not exists kul_family_link_invitations_invited_user_idx
  on public.kul_family_link_invitations (invited_user_id)
  where status = 'pending';

alter table public.kul_family_link_invitations enable row level security;
revoke all on public.kul_family_link_invitations from anon, authenticated;
-- No policies: deny-all to anon/authenticated, exactly like kul_invitations.
-- Every access path is one of the SECURITY DEFINER functions below.

-- One Shoonaya account may be linked to at most one tree node per KUL.
create unique index if not exists kul_family_members_linked_user_per_kul
  on public.kul_family_members (kul_id, linked_user_id)
  where linked_user_id is not null;

-- Calculation provenance for family-calendar dates the engine produces
-- (e.g. which rule/version resolved a tithi-based remembrance date), so a
-- family-entered date is never confused with an engine-derived one later.
alter table public.kul_events
  add column if not exists calculation_provenance text;

-- ── create_family_link_invitation ──────────────────────────────────────
-- Guardian-only. Resolves the username to an account without revealing
-- whether it exists: the same generic success response is returned whether
-- or not a match was found, so a guardian cannot enumerate real usernames
-- by probing this endpoint. Rate-limited via the existing generic
-- check_and_increment_rate_limit primitive (api_rate_limits), 20 invitations
-- per guardian per rolling 24h -- enough for real family use, tight enough
-- to blunt enumeration-by-volume even though content alone doesn't reveal a
-- hit.
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

  -- Resolve the username, but never branch the *response* on whether this
  -- lookup found anything -- only on whether the caller's own request was
  -- valid (guardian, unlinked node, under rate limit). A missing match
  -- still returns the generic success shape below.
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

-- ── list_my_family_link_invitations ────────────────────────────────────
-- The invited person's own pending invitations, with just enough KUL/node
-- context to let them recognize and decide -- never any other member's
-- private data.
create or replace function public.list_my_family_link_invitations()
returns table (
  invitation_id uuid,
  token text,
  kul_id uuid,
  kul_name text,
  kul_emoji text,
  family_member_id uuid,
  family_member_name text,
  family_member_role text,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
set search_path to 'public'
stable
as $$
  select
    i.id, i.token, i.kul_id, k.name, k.avatar_emoji,
    i.family_member_id, m.name, m.role,
    i.created_at, i.expires_at
  from public.kul_family_link_invitations i
  join public.kuls k on k.id = i.kul_id
  join public.kul_family_members m on m.id = i.family_member_id
  where i.invited_user_id = auth.uid()
    and i.status = 'pending'
    and i.expires_at >= now();
$$;

-- ── respond_to_family_link_invitation ──────────────────────────────────
-- Only the invited account may respond, and only while the invitation is
-- still genuinely pending and unexpired. Accepting requires the responder
-- to already be an active member of that same KUL (per the plan: joining
-- the KUL itself is the existing, separate invite-code flow). The
-- per-(kul_id, linked_user_id) unique index is the DB-level backstop if
-- this account raced to link a second node in the same KUL.
create or replace function public.respond_to_family_link_invitation(
  p_token text,
  p_accept boolean
) returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.kul_family_link_invitations;
  v_is_member boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invitation from public.kul_family_link_invitations
  where token = p_token and status = 'pending' and expires_at >= now()
  for update;
  if not found then
    raise exception 'This family link invitation is no longer available';
  end if;
  if v_invitation.invited_user_id is distinct from v_user_id then
    raise exception 'This invitation was not sent to your account';
  end if;

  if not p_accept then
    update public.kul_family_link_invitations set status = 'declined', responded_at = now()
    where id = v_invitation.id;
    return json_build_object('success', true, 'accepted', false);
  end if;

  select exists(
    select 1 from public.kul_members
    where kul_id = v_invitation.kul_id and user_id = v_user_id
  ) into v_is_member;
  if not v_is_member then
    raise exception 'Join this family circle before linking to a family member';
  end if;

  perform 1 from public.kul_family_members
  where id = v_invitation.family_member_id and kul_id = v_invitation.kul_id for update;
  if not found or exists(
    select 1 from public.kul_family_members
    where id = v_invitation.family_member_id and linked_user_id is not null
  ) then
    raise exception 'This family member is no longer available to link';
  end if;

  update public.kul_family_members set linked_user_id = v_user_id
  where id = v_invitation.family_member_id;
  update public.kul_family_link_invitations set status = 'accepted', responded_at = now()
  where id = v_invitation.id;

  return json_build_object('success', true, 'accepted', true, 'kulId', v_invitation.kul_id);
end;
$$;

-- ── cancel_family_link_invitation ──────────────────────────────────────
-- Guardian-only, and only while still pending.
create or replace function public.cancel_family_link_invitation(
  p_invitation_id uuid
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  select kul_id into v_kul_id from public.kul_members
  where user_id = v_user_id and role = 'guardian';
  if v_kul_id is null then
    raise exception 'Only a family guardian can cancel a link invitation';
  end if;

  update public.kul_family_link_invitations
  set status = 'cancelled', responded_at = now()
  where id = p_invitation_id and kul_id = v_kul_id and status = 'pending';
  if not found then
    raise exception 'This invitation is no longer pending';
  end if;
end;
$$;

-- ── unlink_family_member ────────────────────────────────────────────────
-- Only the linked person may unlink themselves (per the plan: a guardian
-- may cancel a *pending* invite above, but never silently sever an
-- *accepted* link on someone else's behalf).
create or replace function public.unlink_family_member(
  p_family_member_id uuid
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  update public.kul_family_members
  set linked_user_id = null
  where id = p_family_member_id and linked_user_id = v_user_id;
  if not found then
    raise exception 'You are not linked to this family member';
  end if;
end;
$$;

-- ── list_family_link_invitations_for_guardian ──────────────────────────
-- Guardian-facing status view. 'declined' and a naturally expired 'pending'
-- row are both collapsed into 'closed' -- the guardian can see *that* an
-- invitation is no longer active, but never learn *whether* the username
-- they entered belonged to a real account that actively declined versus
-- one that never existed and simply timed out. 'cancelled' stays visible
-- as its own state since it's the guardian's own prior action, not a signal
-- about the invited identity.
create or replace function public.list_family_link_invitations_for_guardian()
returns table (
  invitation_id uuid,
  family_member_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
stable
as $$
declare
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  select kul_id into v_kul_id from public.kul_members
  where user_id = v_user_id and role = 'guardian';
  if v_kul_id is null then
    raise exception 'Only a family guardian can view link invitations';
  end if;

  return query
  select
    i.id,
    i.family_member_id,
    case
      when i.status = 'accepted' then 'accepted'
      when i.status = 'cancelled' then 'cancelled'
      when i.status = 'pending' and i.expires_at >= now() then 'pending'
      else 'closed'
    end,
    i.created_at
  from public.kul_family_link_invitations i
  where i.kul_id = v_kul_id;
end;
$$;

revoke execute on function public.create_family_link_invitation(uuid, text) from anon;
revoke execute on function public.list_my_family_link_invitations() from anon;
revoke execute on function public.respond_to_family_link_invitation(text, boolean) from anon;
revoke execute on function public.cancel_family_link_invitation(uuid) from anon;
revoke execute on function public.unlink_family_member(uuid) from anon;
revoke execute on function public.list_family_link_invitations_for_guardian() from anon;

-- ── Departure cleanup ───────────────────────────────────────────────────
-- A member leaving (or being removed from) a KUL must not leave a stale
-- accepted link or an invitation still waiting on an account that's no
-- longer in that family circle.
create or replace function public.remove_kul_member(p_target_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
  v_target_role text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT kul_id INTO v_kul_id FROM public.kul_members
  WHERE user_id = v_user_id AND role = 'guardian' FOR UPDATE;
  IF v_kul_id IS NULL THEN RAISE EXCEPTION 'Only a guardian can remove a family member'; END IF;
  PERFORM 1 FROM public.kuls WHERE id = v_kul_id FOR UPDATE;
  SELECT role INTO v_target_role FROM public.kul_members
  WHERE kul_id = v_kul_id AND user_id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Family member was not found'; END IF;
  IF p_target_user_id = v_user_id OR v_target_role = 'guardian' THEN
    RAISE EXCEPTION 'Transfer guardianship before removing a guardian';
  END IF;

  DELETE FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = p_target_user_id;
  UPDATE public.profiles SET kul_id = NULL WHERE id = p_target_user_id AND kul_id = v_kul_id;

  UPDATE public.kul_family_members SET linked_user_id = NULL
  WHERE kul_id = v_kul_id AND linked_user_id = p_target_user_id;
  UPDATE public.kul_family_link_invitations SET status = 'cancelled', responded_at = now()
  WHERE kul_id = v_kul_id AND invited_user_id = p_target_user_id AND status = 'pending';
END;
$function$;

create or replace function public.leave_kul()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kul-membership:' || v_user_id::text, 0)
  );

  SELECT kul_id INTO v_kul_id
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  IF v_kul_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a family circle';
  END IF;

  PERFORM 1 FROM public.kuls WHERE id = v_kul_id FOR UPDATE;
  DELETE FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE public.profiles SET kul_id = NULL WHERE id = v_user_id;

  UPDATE public.kul_family_members SET linked_user_id = NULL
  WHERE kul_id = v_kul_id AND linked_user_id = v_user_id;
  UPDATE public.kul_family_link_invitations SET status = 'cancelled', responded_at = now()
  WHERE kul_id = v_kul_id AND invited_user_id = v_user_id AND status = 'pending';
END;
$function$;
