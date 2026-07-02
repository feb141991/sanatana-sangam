-- ─── Migration v12 — Tighten Vansh / Kul events mutation permissions ───────
-- Goal: lineage and family-event records should be guardian-managed.
-- This closes the gap where the UI implied restricted actions but RLS still
-- allowed non-guardians to mutate or delete records.

DROP POLICY IF EXISTS "vamsha_insert" ON kul_family_members;
DROP POLICY IF EXISTS "vamsha_update" ON kul_family_members;
DROP POLICY IF EXISTS "vamsha_delete" ON kul_family_members;

CREATE POLICY "vamsha_insert"
  ON kul_family_members FOR INSERT
  WITH CHECK (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

CREATE POLICY "vamsha_update"
  ON kul_family_members FOR UPDATE
  USING (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian')
  WITH CHECK (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

CREATE POLICY "vamsha_delete"
  ON kul_family_members FOR DELETE
  USING (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

DROP POLICY IF EXISTS "events_insert" ON kul_events;
DROP POLICY IF EXISTS "events_update" ON kul_events;
DROP POLICY IF EXISTS "events_delete" ON kul_events;

CREATE POLICY "events_insert"
  ON kul_events FOR INSERT
  WITH CHECK (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

CREATE POLICY "events_update"
  ON kul_events FOR UPDATE
  USING (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian')
  WITH CHECK (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');

CREATE POLICY "events_delete"
  ON kul_events FOR DELETE
  USING (kul_id = auth_kul_id() AND auth_kul_role() = 'guardian');
