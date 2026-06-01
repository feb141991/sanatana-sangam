-- ─── Migration v7 — Kul Vamsha (Family Lineage Tracker) ────────────────────
-- Tables: kul_family_members, kul_events
-- Run AFTER migration-v6b-kul-rls-fix.sql

-- ── 1. kul_family_members ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kul_family_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id          uuid NOT NULL REFERENCES kuls(id) ON DELETE CASCADE,

  -- Identity
  name            text NOT NULL,
  role            text,          -- e.g. "Dada Ji", "Nani Ma", "Bua", etc.
  gender          text CHECK (gender IN ('male', 'female', 'other')),

  -- Dates (store year only when full date unknown)
  birth_year      int,
  birth_date      date,          -- overrides birth_year when set
  death_year      int,
  death_date      date,
  marriage_date   date,

  -- Lineage links
  parent_id       uuid REFERENCES kul_family_members(id) ON DELETE SET NULL,
  spouse_id       uuid REFERENCES kul_family_members(id) ON DELETE SET NULL,

  -- Link to app user (optional — for active members)
  linked_user_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Meta
  notes           text,
  photo_url       text,
  is_alive        boolean NOT NULL DEFAULT true,
  generation      int,           -- 1=great-grandparents, 2=grandparents, 3=parents, 4=self/siblings, 5=children
  display_order   int DEFAULT 0, -- ordering within a generation

  created_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_family_member_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_family_member_updated_at ON kul_family_members;
CREATE TRIGGER trg_family_member_updated_at
  BEFORE UPDATE ON kul_family_members
  FOR EACH ROW EXECUTE FUNCTION update_family_member_updated_at();

-- ── 2. kul_events — birthdays, anniversaries, puja dates, custom ─────────────
CREATE TABLE IF NOT EXISTS kul_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kul_id      uuid NOT NULL REFERENCES kuls(id) ON DELETE CASCADE,

  title       text NOT NULL,
  event_type  text NOT NULL DEFAULT 'custom'
              CHECK (event_type IN ('birthday', 'anniversary', 'death_anniversary', 'puja', 'custom')),
  event_date  date NOT NULL,     -- full date; for recurring, only month+day used
  recurring   boolean NOT NULL DEFAULT true,  -- annual recurrence
  description text,

  member_id   uuid REFERENCES kul_family_members(id) ON DELETE SET NULL,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE kul_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kul_events         ENABLE ROW LEVEL SECURITY;

-- kul_family_members — all kul members can view & edit; guardian-only delete
CREATE POLICY "vamsha_select"
  ON kul_family_members FOR SELECT
  USING (kul_id = auth_kul_id());

CREATE POLICY "vamsha_insert"
  ON kul_family_members FOR INSERT
  WITH CHECK (kul_id = auth_kul_id());

CREATE POLICY "vamsha_update"
  ON kul_family_members FOR UPDATE
  USING (kul_id = auth_kul_id());

CREATE POLICY "vamsha_delete"
  ON kul_family_members FOR DELETE
  USING (kul_id = auth_kul_id());  -- any member can delete (guardian enforced in UI)

-- kul_events — same
CREATE POLICY "events_select"
  ON kul_events FOR SELECT
  USING (kul_id = auth_kul_id());

CREATE POLICY "events_insert"
  ON kul_events FOR INSERT
  WITH CHECK (kul_id = auth_kul_id());

CREATE POLICY "events_update"
  ON kul_events FOR UPDATE
  USING (kul_id = auth_kul_id());

CREATE POLICY "events_delete"
  ON kul_events FOR DELETE
  USING (kul_id = auth_kul_id());

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_family_members_kul    ON kul_family_members(kul_id, generation, display_order);
CREATE INDEX IF NOT EXISTS idx_family_members_parent ON kul_family_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_kul_events_kul        ON kul_events(kul_id, event_date);

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Next: run seed queries to auto-create birthday/anniversary events from family members
-- (the app does this automatically when a family member with birth_date/marriage_date is saved)
