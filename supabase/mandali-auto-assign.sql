-- ══════════════════════════════════════════════════════════════════
--  SANATANA SANGAM — Mandali Auto-Assign Logic
--  Run this AFTER schema.sql in Supabase SQL Editor
--
--  Behaviour:
--  1. User sets city + country → find an existing Mandali for that city
--  2. If found → assign them to it
--  3. If NOT found → auto-create a new Mandali for that city, then assign
-- ══════════════════════════════════════════════════════════════════

-- ─── FUNCTION: Find or create a Mandali for a given city ─────────
CREATE OR REPLACE FUNCTION public.find_or_create_mandali(
  p_city    TEXT,
  p_country TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  -- Normalise input
  p_city    := TRIM(INITCAP(p_city));
  p_country := TRIM(UPPER(p_country));

  -- 1. Look for an existing Mandali for this city (case-insensitive)
  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(p_city)
    AND LOWER(country) = LOWER(p_country)
  LIMIT 1;

  -- 2. If not found, create one automatically
  IF v_mandali_id IS NULL THEN
    INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km)
    VALUES (
      p_city || ' Mandali',
      p_city,
      p_country,
      0,   -- lat/lng default to 0; updated later via geocoding or manually
      0,
      15   -- default 15km radius
    )
    RETURNING id INTO v_mandali_id;
  END IF;

  RETURN v_mandali_id;
END;
$$;

-- ─── FUNCTION: Assign user to their Mandali on profile update ────
-- Called automatically when a user sets/changes their city
CREATE OR REPLACE FUNCTION public.auto_assign_mandali()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  -- Only run if city or country changed and both are set
  IF (NEW.city IS NOT NULL AND NEW.country IS NOT NULL)
    AND (OLD.city IS DISTINCT FROM NEW.city OR OLD.country IS DISTINCT FROM NEW.country)
  THEN
    v_mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
    NEW.mandali_id := v_mandali_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles
DROP TRIGGER IF EXISTS on_profile_location_change ON public.profiles;
CREATE TRIGGER on_profile_location_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.auto_assign_mandali();

-- ─── FUNCTION: Also assign on first insert (new signup) ──────────
CREATE OR REPLACE FUNCTION public.auto_assign_mandali_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mandali_id UUID;
BEGIN
  IF NEW.city IS NOT NULL AND NEW.country IS NOT NULL THEN
    v_mandali_id := public.find_or_create_mandali(NEW.city, NEW.country);
    NEW.mandali_id := v_mandali_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_insert_assign_mandali ON public.profiles;
CREATE TRIGGER on_profile_insert_assign_mandali
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.auto_assign_mandali_on_insert();

-- ─── Grant execute permission ─────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT) TO anon;

-- ─── Quick test (optional — remove after verifying) ───────────────
-- SELECT public.find_or_create_mandali('Manchester', 'UK');
-- SELECT public.find_or_create_mandali('Paris', 'France');   -- will auto-create
-- SELECT name, city, country FROM public.mandalis ORDER BY created_at DESC LIMIT 5;
