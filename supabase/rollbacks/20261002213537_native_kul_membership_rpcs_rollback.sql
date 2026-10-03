-- Restore the pre-20261002213537 KUL membership functions.
CREATE OR REPLACE FUNCTION public.create_kul(p_name text, p_emoji text, p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul public.kuls;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND kul_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.kuls WHERE invite_code = p_invite_code) THEN
    RAISE EXCEPTION 'Invite code already taken — please try again.';
  END IF;
  INSERT INTO public.kuls (name, avatar_emoji, invite_code, created_by)
  VALUES (p_name, p_emoji, p_invite_code, v_user_id)
  RETURNING * INTO v_kul;
  INSERT INTO public.kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'guardian');
  UPDATE public.profiles SET kul_id = v_kul.id WHERE id = v_user_id;
  RETURN row_to_json(v_kul);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_kul(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul public.kuls;
  v_existing_kul_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO v_kul FROM public.kuls WHERE invite_code = upper(trim(p_invite_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kul not found. Check the invite code and try again.';
  END IF;
  SELECT kul_id INTO v_existing_kul_id FROM public.profiles WHERE id = v_user_id;
  IF v_existing_kul_id = v_kul.id THEN
    RETURN row_to_json(v_kul);
  END IF;
  IF v_existing_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.kul_members WHERE kul_id = v_kul.id AND user_id = v_user_id) THEN
    UPDATE public.profiles SET kul_id = v_kul.id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;
  IF EXISTS (SELECT 1 FROM public.kul_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already a member of another Kul. Leave it first.';
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
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
BEGIN
  SELECT kul_id INTO v_kul_id FROM public.profiles WHERE id = v_user_id;
  IF v_kul_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a Kul.';
  END IF;
  DELETE FROM public.kul_members WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE public.profiles SET kul_id = NULL WHERE id = v_user_id;
END;
$$;
