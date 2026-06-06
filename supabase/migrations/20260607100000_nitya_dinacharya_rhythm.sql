ALTER TABLE profiles
  -- Controls which mode the user is in
  ADD COLUMN IF NOT EXISTS nitya_rhythm_mode text
    DEFAULT 'morning'
    CHECK (nitya_rhythm_mode IN ('morning', 'full_day', 'advanced')),

  -- Per-section opt-in (stored as JSONB so adding Night later
  -- needs no schema change)
  ADD COLUMN IF NOT EXISTS nitya_sections_enabled jsonb
    DEFAULT '{"morning": true, "midday": false, "evening": false, "night": false}'::jsonb,

  -- Midday reminder
  ADD COLUMN IF NOT EXISTS wants_madhyahn_reminder boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS madhyahn_reminder_time  text DEFAULT '12:00',

  -- Evening reminder
  ADD COLUMN IF NOT EXISTS wants_evening_reminder  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS evening_reminder_time   text DEFAULT '18:30';

-- Index for the cron queries that will filter by mode + reminder pref
CREATE INDEX IF NOT EXISTS idx_profiles_nitya_rhythm
  ON profiles (nitya_rhythm_mode)
  WHERE nitya_rhythm_mode != 'morning';

COMMENT ON COLUMN profiles.nitya_rhythm_mode IS
  'morning = default 7-step morning only.
   full_day = user opted into midday + evening sections.
   advanced = Pro, full tradition-specific Dinacharya including night.';

COMMENT ON COLUMN profiles.nitya_sections_enabled IS
  'Granular per-section toggles. morning is always true.
   Other sections only active when user explicitly enables them.';
