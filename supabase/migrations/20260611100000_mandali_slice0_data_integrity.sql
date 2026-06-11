-- ══════════════════════════════════════════════════════════════════
--  MANDALI SLICE 0 — Data Integrity Foundation
--
--  Stops Mandali fragmentation before UX scaling:
--  1. mandali_location_aliases table (city + country alias resolution)
--  2. resolve_mandali_location() — single source of truth for
--     canonicalization, shared by find_or_create_mandali and the
--     merge scripts (supabase/mandali-merge-dryrun.sql / -execute.sql)
--  3. find_or_create_mandali rewritten: alias-aware, race-safe,
--     display casing preserved, anon execute revoked
--  4. auto-assign triggers: explicit mandali choice wins — a profile
--     city edit no longer silently moves a user who already belongs
--     to a Mandali
--  5. member_count trigger now covers INSERT / UPDATE / DELETE,
--     plus a one-time recount from profiles
--
--  NOT in this migration (ordered after duplicate cleanup):
--  - UNIQUE index on mandalis(lower(city), lower(country)).
--    Existing duplicates (seed rows use 'UK'/'USA'; app paths write
--    'United Kingdom'/'United States') would block it. The unique
--    index is created at the end of mandali-merge-execute.sql.
--    Until then, find_or_create_mandali serializes creation with an
--    advisory lock, so no NEW duplicates can be created.
-- ══════════════════════════════════════════════════════════════════


-- ─── 1. Casing helper ─────────────────────────────────────────────
-- INITCAP mangles multi-word proper nouns ('Washington DC' → 'Washington Dc',
-- 'Port of Spain' → 'Port Of Spain'). Only apply it when the input carries
-- no casing signal (all-lower or all-upper); otherwise preserve as typed.
CREATE OR REPLACE FUNCTION public.normalize_place_casing(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN TRIM(p_value) = LOWER(TRIM(p_value)) OR TRIM(p_value) = UPPER(TRIM(p_value))
      THEN INITCAP(TRIM(p_value))
    ELSE TRIM(p_value)
  END;
$$;


-- ─── 2. Alias table ───────────────────────────────────────────────
-- Country-only alias rows use alias_city = '*' and canonical_city = '*'.
-- City alias rows must use the CANONICAL country in alias_country
-- (country resolution runs first).
CREATE TABLE IF NOT EXISTS public.mandali_location_aliases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_city        TEXT NOT NULL,
  alias_country     TEXT NOT NULL,
  canonical_city    TEXT NOT NULL,
  canonical_country TEXT NOT NULL,
  note              TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS mandali_location_aliases_alias_key
  ON public.mandali_location_aliases (LOWER(alias_city), LOWER(alias_country));

ALTER TABLE public.mandali_location_aliases ENABLE ROW LEVEL SECURITY;

-- Read for everyone (mappings are not sensitive); no INSERT/UPDATE/DELETE
-- policies, so writes are service-role only. Alias rows redirect where
-- users land — treat them as a moderation surface.
DROP POLICY IF EXISTS "Location aliases viewable by all" ON public.mandali_location_aliases;
CREATE POLICY "Location aliases viewable by all"
  ON public.mandali_location_aliases FOR SELECT USING (true);

-- ── Seed: country aliases ──
-- Nominatim returns full English names ('United Kingdom'); seed rows and
-- manual entry produce short forms ('UK', 'USA'). Canonical = full name.
INSERT INTO public.mandali_location_aliases
  (alias_city, alias_country, canonical_city, canonical_country, note)
VALUES
  ('*', 'UK',                       '*', 'United Kingdom',       'short form'),
  ('*', 'U.K.',                     '*', 'United Kingdom',       'short form'),
  ('*', 'GB',                       '*', 'United Kingdom',       'ISO code'),
  ('*', 'Great Britain',            '*', 'United Kingdom',       'common form'),
  ('*', 'England',                  '*', 'United Kingdom',       'constituent country'),
  ('*', 'Scotland',                 '*', 'United Kingdom',       'constituent country'),
  ('*', 'Wales',                    '*', 'United Kingdom',       'constituent country'),
  ('*', 'USA',                      '*', 'United States',        'short form'),
  ('*', 'US',                       '*', 'United States',        'short form'),
  ('*', 'U.S.',                     '*', 'United States',        'short form'),
  ('*', 'U.S.A.',                   '*', 'United States',        'short form'),
  ('*', 'United States of America', '*', 'United States',        'long form'),
  ('*', 'UAE',                      '*', 'United Arab Emirates', 'short form'),
  ('*', 'U.A.E.',                   '*', 'United Arab Emirates', 'short form')
ON CONFLICT DO NOTHING;

-- ── Seed: city aliases ──
-- Satellite-city merges keep early communities dense. Splitting later is
-- safe: deleting an alias row only affects new joins; existing members
-- keep their mandali_id.
INSERT INTO public.mandali_location_aliases
  (alias_city, alias_country, canonical_city, canonical_country, note)
VALUES
  -- Metro merges (per Slice 0 plan)
  ('Salford',     'United Kingdom', 'Manchester', 'United Kingdom', 'Greater Manchester'),
  ('Wembley',     'United Kingdom', 'London',     'United Kingdom', 'London borough area'),
  ('Navi Mumbai', 'India',          'Mumbai',     'India',          'Mumbai metro — may split later'),
  ('Thane',       'India',          'Mumbai',     'India',          'Mumbai metro — may split later'),
  ('Mississauga', 'Canada',         'Toronto',    'Canada',         'GTA — may split later'),
  ('Brampton',    'Canada',         'Toronto',    'Canada',         'GTA — may split later'),
  -- Renames / historical names (Nominatim and manual entry differ)
  ('Bombay',      'India',          'Mumbai',     'India',          'historical name'),
  ('Calcutta',    'India',          'Kolkata',    'India',          'historical name'),
  ('Bangalore',   'India',          'Bengaluru',  'India',          'historical name'),
  ('Benares',     'India',          'Varanasi',   'India',          'historical name'),
  ('Banaras',     'India',          'Varanasi',   'India',          'historical name'),
  ('Allahabad',   'India',          'Prayagraj',  'India',          'official rename 2018'),
  ('New Delhi',   'India',          'Delhi',      'India',          'Nominatim returns New Delhi for central Delhi')
ON CONFLICT DO NOTHING;


-- ─── 3. Canonical resolution (single source of truth) ─────────────
-- Used by find_or_create_mandali AND by the merge dry-run/execute
-- scripts, so resolution can never diverge between paths.
CREATE OR REPLACE FUNCTION public.resolve_mandali_location(
  p_city    TEXT,
  p_country TEXT
)
RETURNS TABLE (canonical_city TEXT, canonical_country TEXT)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_city    TEXT := TRIM(COALESCE(p_city, ''));
  v_country TEXT := TRIM(COALESCE(p_country, ''));
  v_row     public.mandali_location_aliases%ROWTYPE;
BEGIN
  -- Step 1: country alias ('*' rows), else casing normalization
  SELECT * INTO v_row
  FROM public.mandali_location_aliases a
  WHERE a.alias_city = '*'
    AND LOWER(a.alias_country) = LOWER(v_country)
  LIMIT 1;

  IF FOUND THEN
    v_country := v_row.canonical_country;
  ELSE
    v_country := public.normalize_place_casing(v_country);
  END IF;

  -- Step 2: city alias against the canonical country, else casing
  SELECT * INTO v_row
  FROM public.mandali_location_aliases a
  WHERE a.alias_city <> '*'
    AND LOWER(a.alias_city) = LOWER(v_city)
    AND LOWER(a.alias_country) = LOWER(v_country)
  LIMIT 1;

  IF FOUND THEN
    v_city    := v_row.canonical_city;
    v_country := v_row.canonical_country;
  ELSE
    v_city := public.normalize_place_casing(v_city);
  END IF;

  RETURN QUERY SELECT v_city, v_country;
END;
$$;


-- ─── 4. find_or_create_mandali — alias-aware and race-safe ────────
CREATE OR REPLACE FUNCTION public.find_or_create_mandali(
  p_city    TEXT,
  p_country TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_city       TEXT;
  v_country    TEXT;
  v_mandali_id UUID;
BEGIN
  SELECT r.canonical_city, r.canonical_country
    INTO v_city, v_country
  FROM public.resolve_mandali_location(p_city, p_country) r;

  IF v_city = '' OR v_country = '' THEN
    RAISE EXCEPTION 'find_or_create_mandali: city and country are required';
  END IF;

  -- Serialize concurrent creation for the same canonical pair.
  -- Without this, two first-users in a new city both pass the SELECT
  -- and both INSERT (no unique index exists yet — see header).
  PERFORM pg_advisory_xact_lock(
    hashtext('mandali:' || LOWER(v_city) || '|' || LOWER(v_country))
  );

  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(v_city)
    AND LOWER(country) = LOWER(v_country)
  LIMIT 1;

  IF v_mandali_id IS NULL THEN
    -- ON CONFLICT DO NOTHING is inert until the unique index exists
    -- (added by mandali-merge-execute.sql); the advisory lock covers
    -- races until then, the index covers them after.
    INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km)
    VALUES (v_city || ' Mandali', v_city, v_country, 0, 0, 15)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_mandali_id;

    IF v_mandali_id IS NULL THEN
      SELECT id INTO v_mandali_id
      FROM public.mandalis
      WHERE LOWER(city) = LOWER(v_city)
        AND LOWER(country) = LOWER(v_country)
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_mandali_id;
END;
$$;

-- Signup assignment runs inside SECURITY DEFINER triggers, and the join
-- flow runs authenticated — anon never calls this directly.
REVOKE EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.resolve_mandali_location(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_mandali_location(TEXT, TEXT) TO authenticated, service_role;


-- ─── 5. Auto-assign triggers — explicit choice wins ───────────────
-- Old behavior: any city/country change re-resolved and overwrote
-- mandali_id, silently moving users who had explicitly joined a
-- mandali (e.g. via the "Mandalis near you" join-by-id flow).
-- New behavior: auto-assign only fills an EMPTY mandali_id.
--  - joinMandaliForLocation sets city+country+mandali_id together →
--    NEW.mandali_id is not null → trigger skips (no double resolution).
--  - Profile city edit while belonging to a mandali → trigger skips;
--    moving is the user's explicit "Change my Mandali" action.
--  - City set while mandali_id is null → auto-assign, as before.
CREATE OR REPLACE FUNCTION public.auto_assign_mandali()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.city IS NOT NULL AND NEW.country IS NOT NULL)
    AND (OLD.city IS DISTINCT FROM NEW.city OR OLD.country IS DISTINCT FROM NEW.country)
    AND NEW.mandali_id IS NULL
  THEN
    NEW.mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_mandali_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.city IS NOT NULL AND NEW.country IS NOT NULL AND NEW.mandali_id IS NULL THEN
    NEW.mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger attachments are explicitly dropped and recreated
DROP TRIGGER IF EXISTS on_profile_location_change ON public.profiles;
CREATE TRIGGER on_profile_location_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.auto_assign_mandali();

DROP TRIGGER IF EXISTS on_profile_insert_assign_mandali ON public.profiles;
CREATE TRIGGER on_profile_insert_assign_mandali
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.auto_assign_mandali_on_insert();


-- ─── 6. member_count — count on INSERT, UPDATE, and DELETE ────────
-- Old trigger only handled UPDATE, so members assigned at signup
-- (BEFORE INSERT trigger) were never counted, and deleted profiles
-- never decremented. New mandalis showed "0 members" to real members.
CREATE OR REPLACE FUNCTION public.update_mandali_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.mandali_id IS NOT NULL THEN
      UPDATE public.mandalis
        SET member_count = member_count + 1
        WHERE id = NEW.mandali_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mandali_id IS DISTINCT FROM NEW.mandali_id THEN
      IF OLD.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis
          SET member_count = GREATEST(member_count - 1, 0)
          WHERE id = OLD.mandali_id;
      END IF;
      IF NEW.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis
          SET member_count = member_count + 1
          WHERE id = NEW.mandali_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.mandali_id IS NOT NULL THEN
      UPDATE public.mandalis
        SET member_count = GREATEST(member_count - 1, 0)
        WHERE id = OLD.mandali_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_mandali_change ON public.profiles;
CREATE TRIGGER on_profile_mandali_change
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_mandali_member_count();

-- One-time recount: stored counts have drifted (signup-assigned members
-- were never counted). Profiles are the source of truth.
UPDATE public.mandalis m
SET member_count = (
  SELECT COUNT(*) FROM public.profiles p WHERE p.mandali_id = m.id
);


-- ─── 7. Lookup index (non-unique for now) ─────────────────────────
-- The UNIQUE version is created by mandali-merge-execute.sql after
-- duplicate cleanup; this one just makes resolution lookups cheap.
CREATE INDEX IF NOT EXISTS idx_mandalis_city_country
  ON public.mandalis (LOWER(city), LOWER(country));
