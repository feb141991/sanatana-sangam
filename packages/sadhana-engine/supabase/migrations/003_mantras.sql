-- ============================================================
-- Phase 2 Migration: Mantras Table
-- Run in Supabase SQL Editor after 002_phase2_ai.sql
-- SAFE TO RE-RUN — all statements are idempotent.
-- ============================================================

-- ── 1. Mantras table ──
-- Public read-only reference data. Users' personal japa sessions
-- are tracked in sadhana_events, not here.

CREATE TABLE IF NOT EXISTS mantras (
  id                  TEXT PRIMARY KEY,         -- snake_case e.g. 'gayatri_mantra'
  name                TEXT NOT NULL,
  sanskrit            TEXT NOT NULL DEFAULT '',
  transliteration     TEXT NOT NULL,
  meaning             TEXT NOT NULL,
  deity               TEXT NOT NULL,
  tradition           TEXT NOT NULL,            -- vaishnav | shaiv | shakta | smarta | general
  beads_per_round     INT NOT NULL DEFAULT 108,
  description         TEXT NOT NULL,
  japa_instructions   TEXT NOT NULL,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  recommended_rounds  INT NOT NULL DEFAULT 4,
  level               TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  audio_url           TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Indexes (fully idempotent with IF NOT EXISTS) ──

CREATE INDEX IF NOT EXISTS idx_mantras_tradition ON mantras(tradition);
CREATE INDEX IF NOT EXISTS idx_mantras_deity     ON mantras(deity);
CREATE INDEX IF NOT EXISTS idx_mantras_level     ON mantras(level);
CREATE INDEX IF NOT EXISTS idx_mantras_tags      ON mantras USING gin(tags);

-- No RLS on mantras — it is public reference data (like a dictionary).
-- Write access is controlled via service_role key only (used by seed script).
-- If you want explicit RLS for defence-in-depth, uncomment below:
--
-- ALTER TABLE mantras ENABLE ROW LEVEL SECURITY;
-- DO $$ BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE schemaname = 'public' AND tablename = 'mantras'
--     AND policyname = 'Mantras are publicly readable'
--   ) THEN
--     CREATE POLICY "Mantras are publicly readable"
--       ON mantras FOR SELECT USING (true);
--   END IF;
-- END $$;

-- ── 3. Seed reminder ──
-- After running this migration, seed the mantras table:
--   node scripts/seed-mantras.js --key YOUR_SERVICE_ROLE_KEY
--
-- The seed script uses upsert (onConflict: 'id') so it's safe to re-run.
