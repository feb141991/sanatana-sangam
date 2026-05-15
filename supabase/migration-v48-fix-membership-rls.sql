-- ─── Migration v48 — Fix Kul Membership RLS Catch-22 ──────────────────────────
-- WHY THIS IS NEEDED
-- ─────────────────────────────────────────────────────────────────────────────
-- v6b's kul_members_select policy used: USING (kul_id = auth_kul_id())
-- auth_kul_id() reads from profiles.kul_id.
--
-- If profiles.kul_id is NULL (out of sync), the user cannot even SEE their own 
-- membership in kul_members to repair it. This creates a catch-22 for auto-recovery.
--
-- FIX: Update policy to allow users to see their OWN membership regardless of 
-- the profile link state.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "kul_members_select" ON kul_members;

CREATE POLICY "kul_members_select"
  ON kul_members FOR SELECT
  USING (
    kul_id = auth_kul_id()             -- see fellow members
    OR auth.uid() = user_id            -- see YOURSELF (enables recovery)
  );

-- Also relax kuls slightly to ensure the hub can load the basic info 
-- during a recovery pass
DROP POLICY IF EXISTS "kul_select" ON kuls;
CREATE POLICY "kul_select"
  ON kuls FOR SELECT
  USING (
    id = auth_kul_id()
    OR EXISTS (
      SELECT 1 FROM kul_members 
      WHERE kul_id = kuls.id AND user_id = auth.uid()
    )
  );
