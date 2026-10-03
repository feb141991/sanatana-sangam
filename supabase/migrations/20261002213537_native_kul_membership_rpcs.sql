-- Serialize each user's KUL lifecycle and each KUL's membership-capacity
-- check. The existing create/join RPCs checked state before writing, which
-- allowed double taps or parallel devices to create/join more than one KUL
-- and allowed the configured 3/6 member limit to be exceeded under races.
-- This changes shared database behavior only; it adds no PWA UI surface.

CREATE OR REPLACE FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_name text := btrim(p_name);
  v_invite_code text := upper(btrim(p_invite_code));
  v_kul public.kuls;
  v_profile_kul_id uuid;
  v_existing_kul_id uuid;
  v_member_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kul-membership:' || v_user_id::text, 0)
  );

  IF v_name IS NULL OR v_name = '' OR length(v_name) > 120 THEN
    RAISE EXCEPTION 'Family circle name must not be blank or exceed 120 characters';
  END IF;
  IF p_emoji IS NULL OR btrim(p_emoji) = '' OR length(p_emoji) > 16 THEN
    RAISE EXCEPTION 'Family emblem must be a short non-empty value';
  END IF;
  IF v_invite_code IS NULL OR v_invite_code !~ '^[A-Z0-9]{6,16}$' THEN
    RAISE EXCEPTION 'Invite code must be 6 to 16 letters or numbers';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Profile is not ready';
  END IF;

  SELECT kul_id INTO v_profile_kul_id
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  SELECT count(*), min(kul_id::text)::uuid
  INTO v_member_count, v_existing_kul_id
  FROM public.kul_members
  WHERE user_id = v_user_id;

  IF v_member_count > 1 THEN
    RAISE EXCEPTION 'Your family membership needs support before creating another circle';
  END IF;
  IF v_member_count = 1 THEN
    IF v_profile_kul_id IS NOT NULL AND v_profile_kul_id <> v_existing_kul_id THEN
      RAISE EXCEPTION 'Your family membership link is inconsistent';
    END IF;
    SELECT * INTO v_kul FROM public.kuls WHERE id = v_existing_kul_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Your family circle could not be found';
    END IF;
    -- Preserve the existing RPC contract: retrying create returns the
    -- caller's current KUL and repairs a stale profile link instead of
    -- creating a second circle or failing after an ambiguous network result.
    UPDATE public.profiles SET kul_id = v_existing_kul_id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;
  IF v_profile_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'Your family membership link is inconsistent';
  END IF;

  IF EXISTS (SELECT 1 FROM public.kuls WHERE invite_code = v_invite_code) THEN
    RAISE EXCEPTION 'Invite code already taken — please try again.';
  END IF;

  INSERT INTO public.kuls (name, avatar_emoji, invite_code, created_by)
  VALUES (v_name, p_emoji, v_invite_code, v_user_id)
  RETURNING * INTO v_kul;

  INSERT INTO public.kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'guardian');

  UPDATE public.profiles SET kul_id = v_kul.id WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile is not ready';
  END IF;

  RETURN row_to_json(v_kul);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_kul(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite_code text := upper(btrim(p_invite_code));
  v_kul public.kuls;
  v_profile_kul_id uuid;
  v_member_kul_id uuid;
  v_member_count integer;
  v_current_count integer;
  v_member_limit integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('kul-membership:' || v_user_id::text, 0)
  );

  IF v_invite_code IS NULL OR v_invite_code !~ '^[A-Z0-9]{6,16}$' THEN
    RAISE EXCEPTION 'Enter a valid family invite code';
  END IF;

  -- Serialize joins to this KUL so two final open slots cannot both be taken.
  SELECT * INTO v_kul
  FROM public.kuls
  WHERE invite_code = v_invite_code
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Family circle not found. Check the invite code and try again.';
  END IF;

  SELECT kul_id INTO v_profile_kul_id
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile is not ready';
  END IF;

  IF v_profile_kul_id = v_kul.id THEN
    -- Idempotent repair for a profile already linked to this same KUL.
    INSERT INTO public.kul_members (kul_id, user_id, role)
    VALUES (v_kul.id, v_user_id, 'sadhak')
    ON CONFLICT (kul_id, user_id) DO NOTHING;
    RETURN row_to_json(v_kul);
  END IF;
  IF v_profile_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a family circle. Leave it first.';
  END IF;

  SELECT count(*), min(kul_id::text)::uuid
  INTO v_member_count, v_member_kul_id
  FROM public.kul_members
  WHERE user_id = v_user_id;
  IF v_member_count > 1 THEN
    RAISE EXCEPTION 'Your family membership needs support before you can join another circle';
  END IF;
  IF v_member_count = 1 THEN
    IF v_member_kul_id = v_kul.id THEN
      UPDATE public.profiles SET kul_id = v_kul.id WHERE id = v_user_id;
      RETURN row_to_json(v_kul);
    END IF;
    RAISE EXCEPTION 'You are already a member of another family circle. Leave it first.';
  END IF;

  v_member_limit := public.kul_member_limit(v_kul.id);
  SELECT count(*) INTO v_current_count
  FROM public.kul_members
  WHERE kul_id = v_kul.id;
  IF v_current_count >= v_member_limit THEN
    RAISE EXCEPTION 'This family circle has reached its member limit';
  END IF;

  INSERT INTO public.kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'sadhak');
  UPDATE public.profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_kul()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Serialize a leave against an invite consuming the last available slot.
  PERFORM 1 FROM public.kuls WHERE id = v_kul_id FOR UPDATE;
  DELETE FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE public.profiles SET kul_id = NULL WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_kul(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_kul(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_kul() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_kul(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_kul(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_kul() TO authenticated;
