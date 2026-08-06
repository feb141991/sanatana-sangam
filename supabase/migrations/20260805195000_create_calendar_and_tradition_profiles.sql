-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Tracker 3.3 / Defect D3 Migration:
-- Create calendar_profiles and tradition_profiles tables, enable RLS,
-- seed initial data, and establish foreign keys from observance_occurrences.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CREATE TABLES WITH ADDITIVE STRUCTURES ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.calendar_profiles (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  region text NOT NULL,
  month_system text CHECK (month_system IN ('amanta', 'purnimanta', 'solar')),
  solar_month_rule text CHECK (solar_month_rule IN ('sunset_rule', 'aparahna_rule', 'midnight_rule', 'same_day_rule')),
  era text CHECK (era IN ('vikram_north', 'vikram_gujarat', 'shaka', 'kollam', 'bengali_san', 'bikram_sambat', 'nanakshahi')),
  ayanamsha text NOT NULL DEFAULT 'lahiri',
  sunrise_rule text NOT NULL DEFAULT 'upper_limb_refracted',
  month_name_locale text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  scholarly_status text NOT NULL DEFAULT '[S] ratification pending',
  citation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tradition_profiles (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  ekadashi_method text NOT NULL CHECK (ekadashi_method IN ('smarta', 'vaishnava_suddha')),
  janmashtami_method text NOT NULL CHECK (janmashtami_method IN ('smarta_nishita', 'vaishnava_rohini')),
  shivaratri_method text NOT NULL CHECK (shivaratri_method IN ('nishita')),
  paran_rule text NOT NULL CHECK (paran_rule IN ('standard', 'vaishnava_strict')),
  version text NOT NULL DEFAULT '1.0.0',
  scholarly_status text NOT NULL DEFAULT '[S] ratification pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ── 2. SEED INITIAL DATA ─────────────────────────────────────────────────────

-- Seed calendar profiles
INSERT INTO public.calendar_profiles (
  slug, display_name, region, month_system, solar_month_rule, era, month_name_locale, scholarly_status, citation
) VALUES
  (
    'legacy-ujjain',
    'Legacy Ujjain (Unqualified)',
    'India (Legacy Reference)',
    NULL, -- [S] month_system is undefined for the unqualified legacy engine
    NULL,
    'vikram_north',
    'en',
    '[S] sentinel - ratification pending',
    'unqualified legacy backfill'
  ),
  (
    'north_indian_purnimanta',
    'North Indian',
    'North India',
    'purnimanta',
    NULL,
    'vikram_north',
    'hi',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'gujarati_amanta',
    'Gujarati',
    'Gujarat',
    'amanta',
    NULL,
    'vikram_gujarat',
    'gu',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'marathi_amanta',
    'Marathi',
    'Maharashtra',
    'amanta',
    NULL,
    'shaka',
    'mr',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'kannada_telugu_amanta',
    'Kannada & Telugu',
    'Karnataka / Andhra / Telangana',
    'amanta',
    NULL,
    'shaka',
    'kn',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'kannada_amanta',
    'Kannada',
    'Karnataka',
    'amanta',
    NULL,
    'shaka',
    'kn',
    '[S] ratification pending',
    'calendar-profiles.md §4 (split from kannada_telugu_amanta)'
  ),
  (
    'telugu_amanta',
    'Telugu',
    'Andhra Pradesh / Telangana',
    'amanta',
    NULL,
    'shaka',
    'te',
    '[S] ratification pending',
    'calendar-profiles.md §4 (split from kannada_telugu_amanta)'
  ),
  (
    'tamil_solar',
    'Tamil',
    'Tamil Nadu',
    'solar',
    'sunset_rule',
    NULL, -- [S] era is marked as '—' (undefined) in calendar-profiles.md §4 table
    'ta',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'malayalam_solar',
    'Malayalam',
    'Kerala',
    'solar',
    'aparahna_rule',
    'kollam',
    'ml',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'bengali_solar',
    'Bengali',
    'West Bengal / Assam',
    'solar',
    'midnight_rule',
    'bengali_san',
    'bn',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'odia',
    'Odia',
    'Odisha',
    'amanta',
    'same_day_rule',
    'shaka',
    'or',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'nepali_bikram',
    'Nepali',
    'Nepal',
    'purnimanta',
    NULL,
    'bikram_sambat',
    'ne',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  ),
  (
    'global_sanatan',
    'Global',
    'Global',
    'amanta',
    NULL,
    'vikram_north',
    'en',
    '[S] ratification pending',
    'calendar-profiles.md §4'
  )
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  region = EXCLUDED.region,
  month_system = EXCLUDED.month_system,
  solar_month_rule = EXCLUDED.solar_month_rule,
  era = EXCLUDED.era,
  month_name_locale = EXCLUDED.month_name_locale,
  scholarly_status = EXCLUDED.scholarly_status,
  citation = EXCLUDED.citation;

-- Seed tradition profiles
INSERT INTO public.tradition_profiles (
  slug, display_name, ekadashi_method, janmashtami_method, shivaratri_method, paran_rule, scholarly_status
) VALUES
  (
    'smarta',
    'Smarta',
    'smarta',
    'smarta_nishita',
    'nishita',
    'standard',
    '[S] ratification pending'
  ),
  (
    'gaudiya_iskcon',
    'Gaudiya Vaishnava (ISKCON)',
    'vaishnava_suddha',
    'vaishnava_rohini',
    'nishita',
    'vaishnava_strict',
    '[S] ratification pending'
  ),
  (
    'sri_vaishnava',
    'Sri Vaishnava',
    'vaishnava_suddha',
    'vaishnava_rohini',
    'nishita',
    'vaishnava_strict',
    '[S] ratification pending'
  ),
  (
    'swaminarayan',
    'Swaminarayan',
    'vaishnava_suddha',
    'vaishnava_rohini',
    'nishita',
    'vaishnava_strict',
    '[S] ratification pending'
  ),
  (
    'shaiva',
    'Shaiva',
    'smarta',
    'smarta_nishita',
    'nishita',
    'standard',
    '[S] ratification pending'
  ),
  (
    'shakta',
    'Shakta',
    'smarta',
    'smarta_nishita',
    'nishita',
    'standard',
    '[S] ratification pending'
  ),
  (
    'unspecified',
    'Unspecified',
    'smarta',
    'smarta_nishita',
    'nishita',
    'standard',
    '[S] ratification pending'
  )
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  ekadashi_method = EXCLUDED.ekadashi_method,
  janmashtami_method = EXCLUDED.janmashtami_method,
  shivaratri_method = EXCLUDED.shivaratri_method,
  paran_rule = EXCLUDED.paran_rule,
  scholarly_status = EXCLUDED.scholarly_status;


-- ── 3. ESTABLISH FOREIGN KEYS ────────────────────────────────────────────────

-- Foreign key for calendar_profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_observance_occurrences_calendar_profile'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      ADD CONSTRAINT fk_observance_occurrences_calendar_profile
      FOREIGN KEY (calendar_profile) REFERENCES public.calendar_profiles(slug);
  END IF;
END $$;

-- Foreign key for spiritual_tradition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_observance_occurrences_spiritual_tradition'
      AND conrelid = 'public.observance_occurrences'::regclass
  ) THEN
    ALTER TABLE public.observance_occurrences
      ADD CONSTRAINT fk_observance_occurrences_spiritual_tradition
      FOREIGN KEY (spiritual_tradition) REFERENCES public.tradition_profiles(slug);
  END IF;
END $$;


-- ── 4. RLS & POLICIES ────────────────────────────────────────────────────────

ALTER TABLE public.calendar_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.calendar_profiles'::regclass
      AND polname = 'Allow public read access for calendar_profiles'
  ) THEN
    CREATE POLICY "Allow public read access for calendar_profiles"
      ON public.calendar_profiles FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE public.tradition_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.tradition_profiles'::regclass
      AND polname = 'Allow public read access for tradition_profiles'
  ) THEN
    CREATE POLICY "Allow public read access for tradition_profiles"
      ON public.tradition_profiles FOR SELECT USING (true);
  END IF;
END $$;
