-- Restores remove_kul_member/leave_kul to their pre-linking bodies, drops
-- every object this migration added. Safe to run even if some family
-- members were linked or invitations sent -- those rows simply disappear
-- with the dropped table; no other table is touched by the drops below.

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
END;
$function$;

drop function if exists public.list_family_link_invitations_for_guardian();
drop function if exists public.unlink_family_member(uuid);
drop function if exists public.cancel_family_link_invitation(uuid);
drop function if exists public.respond_to_family_link_invitation(text, boolean);
drop function if exists public.list_my_family_link_invitations();
drop function if exists public.create_family_link_invitation(uuid, text);

alter table public.kul_events drop column if exists calculation_provenance;

drop index if exists public.kul_family_members_linked_user_per_kul;

drop table if exists public.kul_family_link_invitations;
