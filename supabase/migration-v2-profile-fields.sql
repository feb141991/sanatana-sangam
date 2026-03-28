-- Migration v2: Add new profile fields for UI redesign
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kul_devata       text,
  ADD COLUMN IF NOT EXISTS home_town        text,
  ADD COLUMN IF NOT EXISTS shloka_streak    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_shloka_date date;

-- Optional: add a comment explaining these fields
COMMENT ON COLUMN profiles.kul_devata       IS 'Family deity (kul devata)';
COMMENT ON COLUMN profiles.home_town        IS 'Hometown / place of origin';
COMMENT ON COLUMN profiles.shloka_streak    IS 'Number of consecutive days the user has read the daily shloka';
COMMENT ON COLUMN profiles.last_shloka_date IS 'Date when the user last read the daily shloka';
