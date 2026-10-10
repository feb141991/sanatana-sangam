-- Universal KUL invitations. Token joining delegates membership invariants to
-- the existing hardened public.join_kul contract.

CREATE TABLE public.kul_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id uuid NOT NULL REFERENCES public.kuls(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE CHECK (token ~ '^[0-9a-f]{32,64}$'),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  max_uses integer CHECK (max_uses IS NULL OR max_uses BETWEEN 1 AND 1000),
  uses_count integer NOT NULL DEFAULT 0 CHECK (
    uses_count >= 0 AND (max_uses IS NULL OR uses_count <= max_uses)
  ),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX kul_invitations_one_current_per_kul
  ON public.kul_invitations(kul_id) WHERE revoked_at IS NULL;
CREATE INDEX kul_invitations_token_lookup ON public.kul_invitations(token);

ALTER TABLE public.kul_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.kul_invitations FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.kul_invitations IS
  'Bearer tokens for explicit KUL join confirmation. Access is through audited RPC/API contracts.';

CREATE OR REPLACE FUNCTION public.preview_kul_invitation(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.kul_invitations;
  v_kul public.kuls;
  v_guardian_name text;
  v_member_count integer;
BEGIN
  IF p_token IS NULL OR btrim(p_token) !~ '^[0-9a-f]{32,64}$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invitation token.');
  END IF;

  SELECT * INTO v_invitation FROM public.kul_invitations
  WHERE token = btrim(p_token) AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses);
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'This family invitation is no longer available.');
  END IF;

  SELECT * INTO v_kul FROM public.kuls WHERE id = v_invitation.kul_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Family circle no longer exists.');
  END IF;

  SELECT coalesce(p.full_name, p.username, 'Family guardian') INTO v_guardian_name
  FROM public.kul_members m JOIN public.profiles p ON p.id = m.user_id
  WHERE m.kul_id = v_kul.id AND m.role = 'guardian'
  ORDER BY m.joined_at LIMIT 1;
  SELECT count(*)::integer INTO v_member_count FROM public.kul_members WHERE kul_id = v_kul.id;

  RETURN json_build_object('success', true, 'invitation', json_build_object(
    'kulName', v_kul.name, 'avatarEmoji', v_kul.avatar_emoji,
    'guardianName', coalesce(v_guardian_name, 'Family guardian'),
    'memberCount', v_member_count, 'expiresAt', v_invitation.expires_at));
END;
$$;
ALTER FUNCTION public.preview_kul_invitation(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.preview_kul_invitation(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_kul_invitation(text) TO service_role;

CREATE OR REPLACE FUNCTION public.join_kul_invitation(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invitation public.kul_invitations;
  v_invite_code text;
  v_existing_kul_id uuid;
  v_joined json;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_token IS NULL OR btrim(p_token) !~ '^[0-9a-f]{32,64}$' THEN
    RAISE EXCEPTION 'Invalid family invitation';
  END IF;

  SELECT * INTO v_invitation FROM public.kul_invitations
  WHERE token = btrim(p_token) AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This family invitation is no longer available'; END IF;

  SELECT kul_id INTO v_existing_kul_id FROM public.profiles
  WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile is not ready'; END IF;

  SELECT invite_code INTO v_invite_code FROM public.kuls WHERE id = v_invitation.kul_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Family circle no longer exists'; END IF;

  IF v_existing_kul_id = v_invitation.kul_id THEN
    RETURN json_build_object('success', true, 'alreadyMember', true);
  END IF;

  v_joined := public.join_kul(v_invite_code);
  UPDATE public.kul_invitations SET uses_count = uses_count + 1 WHERE id = v_invitation.id;
  RETURN json_build_object('success', true, 'alreadyMember', false, 'kul', v_joined);
END;
$$;
ALTER FUNCTION public.join_kul_invitation(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.join_kul_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_kul_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.manage_kul_invitation(
  p_action text, p_max_uses integer DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL, p_token text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id uuid;
  v_invitation public.kul_invitations;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT kul_id INTO v_kul_id FROM public.kul_members
  WHERE user_id = v_user_id AND role = 'guardian';
  IF NOT FOUND THEN RAISE EXCEPTION 'Only family guardians can manage invitation links'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('kul-invitation:' || v_kul_id::text, 0));

  IF p_action = 'get_or_create' THEN
    SELECT * INTO v_invitation FROM public.kul_invitations
    WHERE kul_id = v_kul_id AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR uses_count < max_uses) FOR UPDATE;
    IF FOUND THEN
      RETURN json_build_object('success', true, 'invitation', json_build_object(
        'token', v_invitation.token, 'maxUses', v_invitation.max_uses,
        'usesCount', v_invitation.uses_count, 'expiresAt', v_invitation.expires_at,
        'createdAt', v_invitation.created_at));
    END IF;
  ELSIF p_action NOT IN ('regenerate', 'revoke') THEN
    RAISE EXCEPTION 'Invalid invitation management action';
  END IF;

  UPDATE public.kul_invitations SET revoked_at = now()
  WHERE kul_id = v_kul_id AND revoked_at IS NULL;
  IF p_action = 'revoke' THEN RETURN json_build_object('success', true); END IF;

  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{32,64}$' THEN
    RAISE EXCEPTION 'A valid generated invitation token is required';
  END IF;
  IF p_max_uses IS NOT NULL AND p_max_uses NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invitation use limit must be between 1 and 1000';
  END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation expiry must be in the future';
  END IF;

  INSERT INTO public.kul_invitations (kul_id, token, created_by, max_uses, expires_at)
  VALUES (v_kul_id, p_token, v_user_id, p_max_uses, p_expires_at)
  RETURNING * INTO v_invitation;
  RETURN json_build_object('success', true, 'invitation', json_build_object(
    'token', v_invitation.token, 'maxUses', v_invitation.max_uses,
    'usesCount', v_invitation.uses_count, 'expiresAt', v_invitation.expires_at,
    'createdAt', v_invitation.created_at));
END;
$$;
ALTER FUNCTION public.manage_kul_invitation(text, integer, timestamptz, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.manage_kul_invitation(text, integer, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_kul_invitation(text, integer, timestamptz, text) TO authenticated;

-- Rollback (after exporting audit rows if retention is required):
-- DROP FUNCTION IF EXISTS public.manage_kul_invitation(text, integer, timestamptz, text);
-- DROP FUNCTION IF EXISTS public.join_kul_invitation(text);
-- DROP FUNCTION IF EXISTS public.preview_kul_invitation(text);
-- DROP TABLE IF EXISTS public.kul_invitations;
