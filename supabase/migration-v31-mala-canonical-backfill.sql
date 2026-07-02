-- Canonicalize Mala persistence after the Japa/Mala UI merge.
--
-- Product UI may say Japa, but the durable backend model is `mala_sessions`.
-- Original Mala fields are canonical:
--   mantra, count, target_count, duration_seconds, completed_at
--
-- v30 added compatibility aliases:
--   mantra_id, bead_count, rounds, duration_secs, date
--
-- This migration keeps both sets synchronized enough that old rows, v30 rows,
-- insights, progress, and reports all read consistently.

UPDATE public.mala_sessions
SET
  mantra = COALESCE(NULLIF(mantra, ''), mantra_id, 'om_namah_shivaya'),
  count = COALESCE(NULLIF(count, 0), bead_count, 0),
  target_count = COALESCE(target_count, 108),
  duration_seconds = COALESCE(NULLIF(duration_seconds, 0), duration_secs, 0),
  completed_at = COALESCE(completed_at, created_at, now())
WHERE
  mantra IS NULL OR mantra = ''
  OR count IS NULL OR count = 0
  OR target_count IS NULL
  OR duration_seconds IS NULL
  OR completed_at IS NULL;

UPDATE public.mala_sessions
SET
  date = COALESCE(date, completed_at::date::text, created_at::date::text),
  bead_count = COALESCE(bead_count, count, 0),
  mantra_id = COALESCE(mantra_id, mantra),
  duration_secs = COALESCE(duration_secs, duration_seconds, 0),
  rounds = CASE
    WHEN rounds IS NULL OR rounds = 0 THEN
      CASE
        WHEN COALESCE(count, bead_count, 0) > 0 THEN
          FLOOR(COALESCE(count, bead_count, 0)::numeric / COALESCE(NULLIF(target_count, 0), 108))::integer
        ELSE 0
      END
    ELSE rounds
  END
WHERE
  date IS NULL
  OR bead_count IS NULL
  OR mantra_id IS NULL
  OR duration_secs IS NULL
  OR rounds IS NULL
  OR rounds = 0;
