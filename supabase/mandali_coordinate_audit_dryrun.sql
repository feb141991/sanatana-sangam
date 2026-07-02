-- ══════════════════════════════════════════════════════════════════
-- MANDALI COORDINATE BACKFILL AUDIT (DRY RUN)
--
-- Lists mandalis that lack coordinates, showing how many members
-- they have, and proposes coordinates based on the average
-- location of their active members (if those members have lat/lon
-- stored in their profiles or recent event RSVPs).
-- 
-- Run this to review before making any manual backfills.
-- ══════════════════════════════════════════════════════════════════

WITH profile_locations AS (
  SELECT 
    mandali_id,
    COUNT(*) as profiles_with_location,
    AVG(latitude) as avg_lat,
    AVG(longitude) as avg_lon
  FROM public.profiles
  WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL
  GROUP BY mandali_id
)
SELECT 
  m.id as mandali_id,
  m.name as mandali_name,
  m.city,
  m.country,
  m.member_count,
  pl.profiles_with_location,
  pl.avg_lat as proposed_latitude,
  pl.avg_lon as proposed_longitude,
  CASE 
    WHEN pl.profiles_with_location > 0 THEN 
      'UPDATE public.mandalis SET latitude = ' || pl.avg_lat || ', longitude = ' || pl.avg_lon || ' WHERE id = ''' || m.id || ''';'
    ELSE 
      '-- Needs manual Nominatim lookup for: ' || m.city || ', ' || m.country 
  END as suggested_remediation_sql
FROM public.mandalis m
LEFT JOIN profile_locations pl ON m.id = pl.mandali_id
WHERE (m.latitude = 0 AND m.longitude = 0)
   OR (m.latitude IS NULL AND m.longitude IS NULL)
ORDER BY m.member_count DESC;
