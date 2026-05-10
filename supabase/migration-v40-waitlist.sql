-- ─── migration-v40 : public waitlist ──────────────────────────────────────────
-- Stores pre-registration emails from the landing page.
-- Captures tradition preference for segmented launch emails.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL,
  tradition     TEXT        CHECK (tradition IN ('hindu','sikh','buddhist','jain')),
  name          TEXT,
  source        TEXT        DEFAULT 'landing',   -- 'landing' | 'hero' | 'cta'
  country_hint  TEXT,                             -- browser locale hint
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public registration)
CREATE POLICY "public_waitlist_insert"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Only authenticated service role can read the list
CREATE POLICY "service_waitlist_select"
  ON waitlist FOR SELECT
  USING (auth.role() = 'service_role');

-- Index for admin queries
CREATE INDEX IF NOT EXISTS waitlist_tradition_idx ON waitlist (tradition);
CREATE INDEX IF NOT EXISTS waitlist_created_idx   ON waitlist (created_at DESC);
