-- Migration: 20260826200000_mandali_auto_coordinates_and_count_sync.sql
-- Purpose: 
-- 1. Upgrade find_or_create_mandali to accept user GPS coordinates (p_lat, p_lng) on new city creation.
-- 2. Update auto-assign triggers to pass user coordinates so future mandalis are never created with (0,0).
-- 3. Ensure member_count accurately counts upon INSERT/UPDATE/DELETE.

CREATE OR REPLACE FUNCTION public.find_or_create_mandali(
  p_city    TEXT,
  p_country TEXT,
  p_lat     FLOAT8 DEFAULT NULL,
  p_lng     FLOAT8 DEFAULT NULL
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
  v_lat        FLOAT8;
  v_lng        FLOAT8;
BEGIN
  SELECT r.canonical_city, r.canonical_country
    INTO v_city, v_country
  FROM public.resolve_mandali_location(p_city, p_country) r;

  IF v_city = '' OR v_country = '' THEN
    RAISE EXCEPTION 'find_or_create_mandali: city and country are required';
  END IF;

  -- Default coordinates if passed
  v_lat := COALESCE(p_lat, 0);
  v_lng := COALESCE(p_lng, 0);

  -- Serialize concurrent creation for the same canonical pair.
  PERFORM pg_advisory_xact_lock(
    hashtext('mandali:' || LOWER(v_city) || '|' || LOWER(v_country))
  );

  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(v_city)
    AND LOWER(country) = LOWER(v_country)
  LIMIT 1;

  IF v_mandali_id IS NULL THEN
    INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km, member_count)
    VALUES (v_city || ' Mandali', v_city, v_country, v_lat, v_lng, 15, 0)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_mandali_id;

    IF v_mandali_id IS NULL THEN
      SELECT id INTO v_mandali_id
      FROM public.mandalis
      WHERE LOWER(city) = LOWER(v_city)
        AND LOWER(country) = LOWER(v_country)
      LIMIT 1;
    END IF;
  ELSE
    -- If existing mandali has (0,0) coordinates and valid coordinates are provided now, backfill them
    IF (v_lat <> 0 OR v_lng <> 0) THEN
      UPDATE public.mandalis
        SET latitude = v_lat, longitude = v_lng
        WHERE id = v_mandali_id AND latitude = 0 AND longitude = 0;
    END IF;
  END IF;

  RETURN v_mandali_id;
END;
$$;

-- Auto-assign on profile city change
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
    NEW.mandali_id := public.find_or_create_mandali(
      NEW.city, 
      NEW.country, 
      COALESCE(NEW.home_latitude, NEW.latitude), 
      COALESCE(NEW.home_longitude, NEW.longitude)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Auto-assign on profile insert
CREATE OR REPLACE FUNCTION public.auto_assign_mandali_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.city IS NOT NULL AND NEW.country IS NOT NULL AND NEW.mandali_id IS NULL THEN
    NEW.mandali_id := public.find_or_create_mandali(
      NEW.city, 
      NEW.country, 
      COALESCE(NEW.home_latitude, NEW.latitude), 
      COALESCE(NEW.home_longitude, NEW.longitude)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Member count trigger maintenance
CREATE OR REPLACE FUNCTION public.update_mandali_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.mandali_id IS NOT NULL THEN
      UPDATE public.mandalis
        SET member_count = (SELECT count(*) FROM public.profiles WHERE mandali_id = NEW.mandali_id)
        WHERE id = NEW.mandali_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mandali_id IS DISTINCT FROM NEW.mandali_id THEN
      IF OLD.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis
          SET member_count = (SELECT count(*) FROM public.profiles WHERE mandali_id = OLD.mandali_id)
          WHERE id = OLD.mandali_id;
      END IF;
      IF NEW.mandali_id IS NOT NULL THEN
        UPDATE public.mandalis
          SET member_count = (SELECT count(*) FROM public.profiles WHERE mandali_id = NEW.mandali_id)
          WHERE id = NEW.mandali_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.mandali_id IS NOT NULL THEN
      UPDATE public.mandalis
        SET member_count = (SELECT count(*) FROM public.profiles WHERE mandali_id = OLD.mandali_id)
        WHERE id = OLD.mandali_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
