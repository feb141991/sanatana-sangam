-- ─── Migration v49 — Robust & Idempotent Kul RPCs ────────────────────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- Users are reporting "already exists in another kul" errors. 
-- This usually happens when:
--   1. profiles.kul_id is NULL (stale) but kul_members record exists.
--   2. A user clicks "Create" or "Join" multiple times (race condition).
--   3. Residual memberships from previous Kuls weren't cleaned up.
--
-- This migration hardens the RPCs to be fully idempotent:
--   • create_kul: If you're already in a Kul, return it (don't create another).
--   • join_kul: If you're already in the target Kul, return it (no-op success).
--   • repair_kul_membership: Clean up any DUPLICATE memberships (keep only latest).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. create_kul — hardened ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_kul(
  p_name         text,
  p_emoji        text,
  p_invite_code  text
)
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

  -- 1. Check if they already have an active membership in kul_members
  SELECT kul_id INTO v_existing_kul_id 
  FROM kul_members 
  WHERE user_id = v_user_id 
  ORDER BY joined_at DESC 
  LIMIT 1;

  -- 2. IDEMPOTENT: If they are already in a Kul, just return it
  -- This prevents double-creation and handles out-of-sync profiles.
  IF v_existing_kul_id IS NOT NULL THEN
    SELECT * INTO v_kul FROM kuls WHERE id = v_existing_kul_id;
    -- Repair profile link while we're here
    UPDATE profiles SET kul_id = v_existing_kul_id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;

  -- 3. Guard: invite code must be unique
  IF EXISTS (SELECT 1 FROM kuls WHERE invite_code = p_invite_code) THEN
    RAISE EXCEPTION 'Invite code already taken — please try again.';
  END IF;

  -- 4. Step 1: create the kul
  INSERT INTO kuls (name, avatar_emoji, invite_code, created_by)
  VALUES (p_name, p_emoji, p_invite_code, v_user_id)
  RETURNING * INTO v_kul;

  -- 5. Step 2: creator becomes guardian
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'guardian');

  -- 6. Step 3: link profile → kul
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;

-- ── 2. join_kul — hardened (building on v45) ─────────────────────────────────
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

  -- 2. Check current membership
  SELECT kul_id INTO v_existing_kul_id FROM kul_members WHERE user_id = v_user_id ORDER BY joined_at DESC LIMIT 1;

  -- 3. If they are already in THIS Kul, just return it (Idempotent success)
  IF v_existing_kul_id = v_kul.id THEN
    -- Ensure profile is linked
    UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;
    RETURN row_to_json(v_kul);
  END IF;

  -- 4. If they are in a DIFFERENT Kul, they must leave it first
  IF v_existing_kul_id IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in another Kul. Leave it first.';
  END IF;

  -- 5. Final check of profiles.kul_id (just in case)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND kul_id IS NOT NULL AND kul_id != v_kul.id) THEN
     RAISE EXCEPTION 'You are already linked to another Kul. Leave it first.';
  END IF;

  -- 6. Join the Kul
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'sadhak');

  -- 7. Link profile
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;

-- ── 3. repair_kul_membership — thorough cleanup ──────────────────────────────
CREATE OR REPLACE FUNCTION repair_kul_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_correct_kul_id uuid;
BEGIN
  -- 1. Identify the most recent membership
  SELECT kul_id INTO v_correct_kul_id 
  FROM kul_members 
  WHERE user_id = v_user_id 
  ORDER BY joined_at DESC 
  LIMIT 1;
  
  -- 2. If membership exists, clean up any duplicates/orphans and sync profile
  IF v_correct_kul_id IS NOT NULL THEN
    -- Remove any other memberships (Shoonaya supports only one)
    DELETE FROM kul_members 
    WHERE user_id = v_user_id 
    AND kul_id != v_correct_kul_id;
    
    -- Sync profile
    UPDATE profiles SET kul_id = v_correct_kul_id WHERE id = v_user_id;
  END IF;
END;
$$;
