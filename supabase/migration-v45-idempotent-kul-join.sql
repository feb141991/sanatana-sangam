-- ─── Migration v45 — Idempotent Kul Join ─────────────────────────────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- If a user is already a member of a Kul and tries to join it again (e.g. by 
-- re-entering the invite code), the previous RPC would throw an error.
--
-- This migration updates join_kul to:
--   1. Return the Kul successfully if the user is ALREADY a member of THAT Kul.
--   2. Only error if the user is in a DIFFERENT Kul.
--
-- This ensures a smoother "load in it already" experience for users.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION join_kul(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul     kuls;
  v_existing_kul_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Find the target kul by invite code
  SELECT * INTO v_kul FROM kuls WHERE invite_code = upper(trim(p_invite_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kul not found. Check the invite code and try again.';
  END IF;

  -- 2. Check current profile state
  SELECT kul_id INTO v_existing_kul_id FROM profiles WHERE id = v_user_id;

  -- 3. If they are already linked to THIS Kul, just return it (Idempotent success)
  IF v_existing_kul_id = v_kul.id THEN
    RETURN row_to_json(v_kul);
  END IF;

  -- 4. If they are already in a DIFFERENT Kul, they must leave it first
  IF v_existing_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;

  -- 5. Extra check: maybe they are in kul_members but profiles.kul_id was out of sync
  IF EXISTS (SELECT 1 FROM kul_members WHERE kul_id = v_kul.id AND user_id = v_user_id) THEN
    -- Repair profile link and return success
    UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;

  -- 6. Final guard: if they are in ANOTHER Kul according to members table 
  -- (even if profiles.kul_id is null)
  IF EXISTS (SELECT 1 FROM kul_members WHERE user_id = v_user_id) THEN
     RAISE EXCEPTION 'You are already a member of another Kul. Leave it first.';
  END IF;

  -- Step 1: join as sadhak
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'sadhak');

  -- Step 2: link profile → kul
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;
