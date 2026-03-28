-- ─── Migration v8 — Atomic Kul RPC Functions (fixes RLS create/join bugs) ────
--
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- v6b's kuls SELECT policy:  USING (id = auth_kul_id())
--   auth_kul_id() reads profiles.kul_id.
--
-- Bug A (create): INSERT ... RETURNING * triggers SELECT RLS on the returned
--   row.  At that moment profiles.kul_id is still NULL, so auth_kul_id()=NULL,
--   so the created kul is filtered out → kul=null → early return → profile never
--   updated → next page load still shows NoKulPrompt.
--
-- Bug B (join): Users with no kul can't SELECT any kul row to look up an invite
--   code → joinKul always errors "Kul not found".
--
-- Bug C (messages): If profiles.kul_id was never set (because of Bug A), the
--   kul_messages_insert WITH CHECK kul_id = auth_kul_id() evaluates to
--   kul_id = NULL → "new row violates row-level security".
--
-- FIX: Two SECURITY DEFINER plpgsql functions that run all three steps
-- (insert kul / insert kul_member / update profile) atomically inside Postgres
-- — completely bypassing client-side RLS ordering issues.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. create_kul — guardian creates a new Kul ───────────────────────────────
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guard: don't let someone in an existing kul create another
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND kul_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;

  -- Guard: invite code must be unique
  IF EXISTS (SELECT 1 FROM kuls WHERE invite_code = p_invite_code) THEN
    RAISE EXCEPTION 'Invite code already taken — please try again.';
  END IF;

  -- Step 1: create the kul
  INSERT INTO kuls (name, avatar_emoji, invite_code, created_by)
  VALUES (p_name, p_emoji, p_invite_code, v_user_id)
  RETURNING * INTO v_kul;

  -- Step 2: creator becomes guardian
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'guardian');

  -- Step 3: link profile → kul (this is what auth_kul_id() reads)
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;

-- ── 2. join_kul — sadhak joins an existing Kul by invite code ────────────────
CREATE OR REPLACE FUNCTION join_kul(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul     kuls;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Guard: already in a kul?
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND kul_id IS NOT NULL) THEN
    RAISE EXCEPTION 'You are already in a Kul. Leave it first.';
  END IF;

  -- Find kul by invite code (case-insensitive)
  SELECT * INTO v_kul FROM kuls WHERE invite_code = upper(trim(p_invite_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kul not found. Check the invite code and try again.';
  END IF;

  -- Guard: already a member of this specific kul?
  IF EXISTS (SELECT 1 FROM kul_members WHERE kul_id = v_kul.id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'You are already a member of this Kul!';
  END IF;

  -- Step 1: join as sadhak
  INSERT INTO kul_members (kul_id, user_id, role)
  VALUES (v_kul.id, v_user_id, 'sadhak');

  -- Step 2: link profile → kul
  UPDATE profiles SET kul_id = v_kul.id WHERE id = v_user_id;

  RETURN row_to_json(v_kul);
END;
$$;

-- ── 3. leave_kul — remove yourself from a Kul ────────────────────────────────
CREATE OR REPLACE FUNCTION leave_kul()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id  uuid;
BEGIN
  SELECT kul_id INTO v_kul_id FROM profiles WHERE id = v_user_id;
  IF v_kul_id IS NULL THEN
    RAISE EXCEPTION 'You are not in a Kul.';
  END IF;

  DELETE FROM kul_members WHERE kul_id = v_kul_id AND user_id = v_user_id;
  UPDATE profiles SET kul_id = NULL WHERE id = v_user_id;
END;
$$;

-- ── 4. Relax kuls SELECT so authenticated users can look up invite codes ──────
-- (Belt-and-suspenders on top of the RPC — also enables the page.tsx fetch
--  which runs as the authenticated user after the profile is updated.)
DROP POLICY IF EXISTS "kul_select" ON kuls;
CREATE POLICY "kul_select"
  ON kuls FOR SELECT
  USING (
    id = auth_kul_id()           -- existing member sees their kul
    OR created_by = auth.uid()   -- creator can always see their kul
    OR auth.role() = 'authenticated'  -- any logged-in user for invite lookup
  );

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Client changes required (see KulClient.tsx NoKulPrompt):
--   createKul()  →  supabase.rpc('create_kul', { p_name, p_emoji, p_invite_code })
--   joinKul()    →  supabase.rpc('join_kul',   { p_invite_code })
