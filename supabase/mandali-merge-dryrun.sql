-- ══════════════════════════════════════════════════════════════════
--  MANDALI MERGE — DRY RUN (read-only, safe to run any time)
--
--  Prerequisite: migration 20260611100000_mandali_slice0_data_integrity
--  (needs resolve_mandali_location + mandali_location_aliases).
--
--  Reports which mandalis resolve to the same canonical (city, country)
--  pair and would be merged by mandali-merge-execute.sql:
--   - SURVIVOR  = kept row (most true members; tiebreak oldest)
--   - DUPLICATE = row whose profiles/posts move to the survivor,
--                 then gets deleted
--
--  member_count is NOT trusted anywhere here — true counts are
--  recounted from profiles.
--
--  This script performs NO writes.
-- ══════════════════════════════════════════════════════════════════

-- ─── Report 1: duplicate groups, row by row ───────────────────────
WITH resolved AS (
  SELECT
    m.id,
    m.name,
    m.city            AS stored_city,
    m.country         AS stored_country,
    m.created_at,
    m.latitude,
    m.longitude,
    m.member_count    AS stored_member_count,
    r.canonical_city,
    r.canonical_country,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.mandali_id = m.id) AS true_member_count,
    (SELECT COUNT(*) FROM public.posts    po WHERE po.mandali_id = m.id) AS post_count
  FROM public.mandalis m
  CROSS JOIN LATERAL public.resolve_mandali_location(m.city, m.country) r
),
ranked AS (
  SELECT *,
    COUNT(*)     OVER (PARTITION BY LOWER(canonical_city), LOWER(canonical_country)) AS group_size,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(canonical_city), LOWER(canonical_country)
      ORDER BY true_member_count DESC, created_at ASC
    ) AS rn
  FROM resolved
)
SELECT
  canonical_city,
  canonical_country,
  CASE WHEN rn = 1 THEN 'SURVIVOR' ELSE 'DUPLICATE' END AS role,
  id,
  name,
  stored_city,
  stored_country,
  true_member_count,
  stored_member_count,
  post_count,
  created_at
FROM ranked
WHERE group_size > 1
ORDER BY LOWER(canonical_country), LOWER(canonical_city), rn;


-- ─── Report 2: total blast radius ─────────────────────────────────
WITH resolved AS (
  SELECT
    m.id,
    m.created_at,
    r.canonical_city,
    r.canonical_country,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.mandali_id = m.id) AS true_member_count
  FROM public.mandalis m
  CROSS JOIN LATERAL public.resolve_mandali_location(m.city, m.country) r
),
ranked AS (
  SELECT *,
    COUNT(*)     OVER (PARTITION BY LOWER(canonical_city), LOWER(canonical_country)) AS group_size,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(canonical_city), LOWER(canonical_country)
      ORDER BY true_member_count DESC, created_at ASC
    ) AS rn
  FROM resolved
),
dups AS (SELECT id FROM ranked WHERE group_size > 1 AND rn > 1)
SELECT
  (SELECT COUNT(*) FROM ranked WHERE group_size > 1 AND rn = 1) AS surviving_mandalis,
  (SELECT COUNT(*) FROM dups)                                   AS duplicate_mandalis_to_delete,
  (SELECT COUNT(*) FROM public.profiles WHERE mandali_id IN (SELECT id FROM dups)) AS profiles_to_reassign,
  (SELECT COUNT(*) FROM public.posts    WHERE mandali_id IN (SELECT id FROM dups)) AS posts_to_reassign;


-- ─── Report 3: stored-name drift (no duplicate, rename only) ──────
-- Mandalis whose stored city/country differ from the canonical form
-- (e.g. a lone ('Leicester','UK') row). mandali-merge-execute.sql
-- renames these in place; nothing is merged or deleted.
WITH resolved AS (
  SELECT
    m.id, m.name, m.city AS stored_city, m.country AS stored_country,
    r.canonical_city, r.canonical_country
  FROM public.mandalis m
  CROSS JOIN LATERAL public.resolve_mandali_location(m.city, m.country) r
),
grouped AS (
  SELECT *,
    COUNT(*) OVER (PARTITION BY LOWER(canonical_city), LOWER(canonical_country)) AS group_size
  FROM resolved
)
SELECT id, name, stored_city, stored_country, canonical_city, canonical_country
FROM grouped
WHERE group_size = 1
  AND (stored_city <> canonical_city OR stored_country <> canonical_country)
ORDER BY canonical_country, canonical_city;
