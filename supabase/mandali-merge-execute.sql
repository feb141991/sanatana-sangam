-- ══════════════════════════════════════════════════════════════════
--  MANDALI MERGE — EXECUTE                       ⚠ DESTRUCTIVE ⚠
--
--  DO NOT run as part of any automated migration.
--  Run manually, once, in the Supabase SQL editor, AFTER:
--   1. migration 20260611100000_mandali_slice0_data_integrity is live
--   2. mandali-merge-dryrun.sql output has been reviewed and the
--      survivor/duplicate assignments look correct
--   3. alias seed rows have been adjusted if the dry run surfaced
--      pairs that should NOT merge
--
--  What it does, in one transaction:
--   1. Builds the same merge plan as the dry run
--   2. Reassigns profiles and posts from duplicates to survivors
--      (posts.mandali_id is ON DELETE CASCADE — reassignment MUST
--      happen before the delete or posts are destroyed)
--   3. Backfills survivor coordinates from a duplicate when the
--      survivor has the 0,0 placeholder
--   4. Deletes duplicate mandalis
--   5. Renames all remaining mandalis to canonical city/country/name
--   6. Recounts member_count from profiles (stored counts not trusted)
--   7. Creates the UNIQUE index on (lower(city), lower(country)) —
--      from this point the database itself prevents re-fragmentation
--
--  Roll back at any point before COMMIT with: ROLLBACK;
-- ══════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Merge plan (same ranking as the dry run) ──────────────────
CREATE TEMP TABLE merge_plan ON COMMIT DROP AS
WITH resolved AS (
  SELECT
    m.id,
    m.created_at,
    m.latitude,
    m.longitude,
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
)
SELECT
  d.id  AS duplicate_id,
  s.id  AS survivor_id,
  d.latitude  AS dup_latitude,
  d.longitude AS dup_longitude
FROM ranked d
JOIN ranked s
  ON LOWER(s.canonical_city)    = LOWER(d.canonical_city)
 AND LOWER(s.canonical_country) = LOWER(d.canonical_country)
 AND s.rn = 1
WHERE d.group_size > 1
  AND d.rn > 1;

-- Sanity check: how many merges are about to happen?
SELECT COUNT(*) AS duplicates_to_merge FROM merge_plan;

-- ─── 2. Reassign profiles, then posts (BEFORE deleting) ──────────
UPDATE public.profiles p
SET mandali_id = mp.survivor_id
FROM merge_plan mp
WHERE p.mandali_id = mp.duplicate_id;

UPDATE public.posts po
SET mandali_id = mp.survivor_id
FROM merge_plan mp
WHERE po.mandali_id = mp.duplicate_id;

-- ─── 3. Coordinate backfill for 0,0 survivors ─────────────────────
UPDATE public.mandalis m
SET latitude = mp.dup_latitude,
    longitude = mp.dup_longitude
FROM merge_plan mp
WHERE m.id = mp.survivor_id
  AND m.latitude = 0 AND m.longitude = 0
  AND (mp.dup_latitude <> 0 OR mp.dup_longitude <> 0);

-- ─── 4. Delete duplicates ─────────────────────────────────────────
DELETE FROM public.mandalis
WHERE id IN (SELECT duplicate_id FROM merge_plan);

-- ─── 5. Canonical rename for ALL remaining mandalis ──────────────
-- Covers lone rows with stale forms (e.g. ('Leicester','UK')) and
-- merged survivors alike. Collisions are impossible here: any two
-- rows resolving to the same canonical pair were just merged.
UPDATE public.mandalis m
SET city    = r.canonical_city,
    country = r.canonical_country,
    name    = r.canonical_city || ' Mandali'
FROM LATERAL public.resolve_mandali_location(m.city, m.country) r
WHERE m.city <> r.canonical_city
   OR m.country <> r.canonical_country;

-- ─── 6. Recount member_count from profiles ────────────────────────
UPDATE public.mandalis m
SET member_count = (
  SELECT COUNT(*) FROM public.profiles p WHERE p.mandali_id = m.id
);

-- ─── 7. Unique protection — fragmentation now impossible ─────────
CREATE UNIQUE INDEX IF NOT EXISTS mandalis_city_country_unique
  ON public.mandalis (LOWER(city), LOWER(country));

-- Review the post-merge state before committing:
SELECT id, name, city, country, member_count, latitude, longitude
FROM public.mandalis
ORDER BY country, city;

COMMIT;
