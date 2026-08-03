-- Migration: 20260803020000_separate_home_and_observance_location.sql
-- Description: Add additive nullable columns for Home Origin location and observance location source tracking.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_latitude double precision,
  ADD COLUMN IF NOT EXISTS home_longitude double precision,
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS home_country text,
  ADD COLUMN IF NOT EXISTS home_timezone text,
  ADD COLUMN IF NOT EXISTS observance_location_source text DEFAULT 'unset';

-- Add check constraint for valid observance_location_source values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_observance_location_source'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT chk_observance_location_source
      CHECK (observance_location_source IN ('manual', 'device', 'unset'));
  END IF;
END $$;

COMMENT ON COLUMN profiles.home_latitude IS 'Latitude of user origin/family home. Display and comparison only.';
COMMENT ON COLUMN profiles.home_longitude IS 'Longitude of user origin/family home. Display and comparison only.';
COMMENT ON COLUMN profiles.home_city IS 'City of user origin/family home. Display and comparison only.';
COMMENT ON COLUMN profiles.home_country IS 'Country of user origin/family home. Display and comparison only.';
COMMENT ON COLUMN profiles.home_timezone IS 'Timezone of user origin/family home. Display and comparison only.';
COMMENT ON COLUMN profiles.observance_location_source IS 'Source of primary observance location: manual (user fixed), device (GPS/browser), or unset.';
