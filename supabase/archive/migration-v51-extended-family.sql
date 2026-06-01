-- ─── Migration v51 — Extended Family Metadata ──────────────
ALTER TABLE kul_family_members 
  ADD COLUMN IF NOT EXISTS birth_place text;

COMMENT ON COLUMN kul_family_members.birth_place IS 'Place of birth for informative lineage tracking.';
