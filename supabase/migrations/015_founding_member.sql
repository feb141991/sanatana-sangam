-- ─── Migration 015: Founding Member System ────────────────────────────────────
-- Adds founding_number sequence to waitlist + founding member columns to profiles
-- Run in Supabase SQL editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Founding number sequence for the waitlist
CREATE SEQUENCE IF NOT EXISTS waitlist_founding_seq START 1 INCREMENT 1;

-- 2. Add new columns to waitlist
ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS founding_number INTEGER DEFAULT nextval('waitlist_founding_seq'),
  ADD COLUMN IF NOT EXISTS timezone        TEXT    NULL,
  ADD COLUMN IF NOT EXISTS email_sent      BOOLEAN NOT NULL DEFAULT FALSE;

-- Make founding_number owned by the column so it's dropped together
ALTER SEQUENCE waitlist_founding_seq OWNED BY waitlist.founding_number;

-- Keep one row per email before adding a case-insensitive uniqueness guard.
-- The earliest row keeps the founding spot.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(email)
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM waitlist
)
DELETE FROM waitlist
USING ranked
WHERE waitlist.id = ranked.id
  AND ranked.rn > 1;

-- Backfill existing rows with sequential numbers.
DO $$
DECLARE r RECORD; n INT := 1;
BEGIN
  FOR r IN SELECT id FROM waitlist WHERE founding_number IS NULL ORDER BY created_at ASC NULLS LAST, id ASC LOOP
    UPDATE waitlist SET founding_number = n WHERE id = r.id;
    n := n + 1;
  END LOOP;
END $$;

-- Move the sequence beyond the largest existing founding number.
DO $$
DECLARE max_num INT;
BEGIN
  SELECT COALESCE(MAX(founding_number), 0) INTO max_num FROM waitlist;
  PERFORM setval('waitlist_founding_seq', GREATEST(max_num, 1), max_num > 0);
END $$;

-- 3. Add founding member columns to profiles (populated on first app login after launch)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS founding_number    INTEGER NULL;

-- 4. Indexes and uniqueness guards for fast, duplicate-safe look-up
CREATE INDEX IF NOT EXISTS idx_waitlist_founding_number ON waitlist (founding_number);
CREATE INDEX IF NOT EXISTS idx_profiles_founding_number ON profiles (founding_number) WHERE founding_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_unique_idx ON waitlist (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_founding_number_unique_idx ON waitlist (founding_number) WHERE founding_number IS NOT NULL;
