-- ══════════════════════════════════════════════════════════════════
--  MANDALI SLICE 0b — Radius Fallback
--
--  1. haversine_distance_km function
--  2. update find_or_create_mandali to accept lat/lon and
--     perform radius fallback when exact city/country isn't found
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. Distance Helper ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.haversine_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  radius DOUBLE PRECISION := 6371; -- Earth's radius in km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  lat1 := radians(lat1);
  lat2 := radians(lat2);

  a := sin(dlat/2) * sin(dlat/2) +
       sin(dlon/2) * sin(dlon/2) * cos(lat1) * cos(lat2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN radius * c;
END;
$$;

-- ─── 2. Updated find_or_create_mandali ────────────────────────────
-- Changes from Slice 0:
-- - Adds p_lat and p_lon defaults
-- - If exact canonical match fails, and p_lat/p_lon provided, searches
--   for a Mandali within radius_km
-- - Fallback ordered by member_count DESC then distance ASC
-- - New mandali creation uses provided lat/lon instead of 0,0

CREATE OR REPLACE FUNCTION public.find_or_create_mandali(
  p_city    TEXT,
  p_country TEXT,
  p_lat     DOUBLE PRECISION DEFAULT NULL,
  p_lon     DOUBLE PRECISION DEFAULT NULL
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
  -- 1. Canonicalize the input city and country
  SELECT r.canonical_city, r.canonical_country
    INTO v_city, v_country
  FROM public.resolve_mandali_location(p_city, p_country) r;

  IF v_city = '' OR v_country = '' THEN
    RAISE EXCEPTION 'find_or_create_mandali: city and country are required';
  END IF;

  -- 2. Try to find EXACT match first
  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(v_city)
    AND LOWER(country) = LOWER(v_country)
  LIMIT 1;

  IF v_mandali_id IS NOT NULL THEN
    RETURN v_mandali_id;
  END IF;

  -- 3. If no exact match, and we have lat/lon, try RADIUS FALLBACK
  IF p_lat IS NOT NULL AND p_lon IS NOT NULL THEN
    SELECT id INTO v_mandali_id
    FROM public.mandalis
    WHERE latitude <> 0 AND longitude <> 0
      AND public.haversine_distance_km(latitude, longitude, p_lat, p_lon) <= radius_km
    ORDER BY member_count DESC, public.haversine_distance_km(latitude, longitude, p_lat, p_lon) ASC
    LIMIT 1;

    IF v_mandali_id IS NOT NULL THEN
      RETURN v_mandali_id;
    END IF;
  END IF;

  -- 4. Serialize concurrent creation for the exact city/country
  PERFORM pg_advisory_xact_lock(
    hashtext('mandali:' || LOWER(v_city) || '|' || LOWER(v_country))
  );

  -- Double-check exact match under lock
  SELECT id INTO v_mandali_id
  FROM public.mandalis
  WHERE LOWER(city) = LOWER(v_city)
    AND LOWER(country) = LOWER(v_country)
  LIMIT 1;

  IF v_mandali_id IS NULL THEN
    INSERT INTO public.mandalis (name, city, country, latitude, longitude, radius_km)
    VALUES (
      v_city || ' Mandali',
      v_city,
      v_country,
      COALESCE(p_lat, 0),
      COALESCE(p_lon, 0),
      15
    )
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

REVOKE EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_or_create_mandali(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, service_role;
