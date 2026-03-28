-- ─── Migration v9 — Neighbourhood-level Mandali & Satsang Radar ──────────────
-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
--
-- Adds to profiles:
--   neighbourhood      TEXT    — auto-filled via Nominatim at signup
--   looking_for_satsang BOOL  — user toggle: "I'm open to local satsang"
--   location_visible   BOOL   — radar opt-in: show my fuzzy dot to nearby users

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS neighbourhood       TEXT,
  ADD COLUMN IF NOT EXISTS looking_for_satsang BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_visible    BOOLEAN NOT NULL DEFAULT false;

-- Index for proximity queries (lat/lng already exist — just add neighbourhood index)
CREATE INDEX IF NOT EXISTS idx_profiles_neighbourhood
  ON profiles(neighbourhood)
  WHERE neighbourhood IS NOT NULL;

-- Index for radar queries — only index users who opted in
CREATE INDEX IF NOT EXISTS idx_profiles_satsang_radar
  ON profiles(latitude, longitude)
  WHERE location_visible = true AND looking_for_satsang = true;

-- ─── RLS: allow users to update their own neighbourhood / radar fields ─────────
-- (existing RLS policy on profiles already allows self-update, no change needed)

-- ─── Helper function: find users within radius (km) ──────────────────────────
-- Uses Haversine formula — no PostGIS extension required
CREATE OR REPLACE FUNCTION find_nearby_satsang_seekers(
  p_lat   FLOAT,
  p_lon   FLOAT,
  p_km    FLOAT DEFAULT 10.0,
  p_limit INT   DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  full_name     TEXT,
  username      TEXT,
  avatar_url    TEXT,
  tradition     TEXT,
  sampradaya    TEXT,
  neighbourhood TEXT,
  city          TEXT,
  distance_km   FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.tradition,
    p.sampradaya,
    p.neighbourhood,
    p.city,
    -- Haversine distance in km
    ROUND(CAST(
      6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS((p.latitude  - p_lat) / 2)), 2) +
        COS(RADIANS(p_lat)) * COS(RADIANS(p.latitude)) *
        POWER(SIN(RADIANS((p.longitude - p_lon) / 2)), 2)
      ))
    AS NUMERIC), 1)::FLOAT AS distance_km
  FROM profiles p
  WHERE
    p.location_visible    = true
    AND p.looking_for_satsang = true
    AND p.latitude  IS NOT NULL
    AND p.longitude IS NOT NULL
    AND p.id != auth.uid()
    -- Bounding box pre-filter (fast, avoids full table scan)
    AND p.latitude  BETWEEN p_lat - (p_km / 111.0) AND p_lat + (p_km / 111.0)
    AND p.longitude BETWEEN p_lon - (p_km / (111.0 * COS(RADIANS(p_lat))))
                        AND p_lon + (p_km / (111.0 * COS(RADIANS(p_lat))))
  ORDER BY distance_km ASC
  LIMIT p_limit;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION find_nearby_satsang_seekers TO authenticated;
