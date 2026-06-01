-- ─── Migration v46 — Repair Kul Membership RPC ───────────────────────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- The REVOKE in v44 prevents the 'authenticated' role from updating kul_id.
-- This breaks the "auto-repair" logic in fetchKulData that tries to fix
-- out-of-sync profiles.
--
-- This SECURITY DEFINER function allows a user to safely sync their profile
-- kul_id with their actual record in kul_members.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION repair_kul_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_kul_id  uuid;
BEGIN
  -- Find their membership
  SELECT kul_id INTO v_kul_id FROM kul_members WHERE user_id = v_user_id LIMIT 1;
  
  -- Sync profile if a membership exists
  IF v_kul_id IS NOT NULL THEN
    UPDATE profiles SET kul_id = v_kul_id WHERE id = v_user_id;
  END IF;
END;
$$;
