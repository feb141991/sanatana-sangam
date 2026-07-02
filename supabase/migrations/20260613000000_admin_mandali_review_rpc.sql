-- ══════════════════════════════════════════════════════════════════
-- MANDALI ADMIN REVIEW RPC
-- 
-- Exposes problematic/new mandalis for weekly admin review.
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_get_mandali_review_data()
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  country TEXT,
  member_count INT,
  true_profile_count BIGINT,
  created_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  canonical_city TEXT,
  canonical_country TEXT,
  is_drifted BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.name,
    m.city,
    m.country,
    m.member_count,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.mandali_id = m.id) as true_profile_count,
    m.created_at,
    m.latitude,
    m.longitude,
    r.canonical_city,
    r.canonical_country,
    (LOWER(TRIM(m.city)) <> LOWER(TRIM(r.canonical_city)) OR LOWER(TRIM(m.country)) <> LOWER(TRIM(r.canonical_country))) as is_drifted
  FROM public.mandalis m,
  LATERAL public.resolve_mandali_location(m.city, m.country) r
  WHERE 
    m.created_at >= NOW() - INTERVAL '30 days'
    OR m.member_count <= 1
    OR (m.latitude = 0 AND m.longitude = 0)
    OR (m.latitude IS NULL AND m.longitude IS NULL)
    OR (LOWER(TRIM(m.city)) <> LOWER(TRIM(r.canonical_city)) OR LOWER(TRIM(m.country)) <> LOWER(TRIM(r.canonical_country)))
  ORDER BY m.created_at DESC;
$$;

-- Secure the RPC
REVOKE EXECUTE ON FUNCTION public.admin_get_mandali_review_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_mandali_review_data() TO service_role;
