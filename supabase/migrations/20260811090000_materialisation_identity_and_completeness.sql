-- Materialisation identity and completeness contract.
--
-- NOT APPLIED TO PRODUCTION. Exercised against a shadow database only, per the
-- standing gate: profile-qualified materialisation stays blocked until this and
-- the diagnostics-disclosure work are both done.
--
-- WHY
-- ---
-- Two read-time weaknesses cannot be fixed at read time, because the information
-- they need is only knowable at WRITE time:
--
-- 1. IDENTITY. The formatter had to infer which rows were "the same observance"
--    from slug + year + location, and for recurring rules it fell back to the
--    DATE. That works for ordinary Ekadashi rows and breaks for the case it most
--    needs to handle: two sampradaya readings of ONE Ekadashi land on different
--    days, so date-as-identity reads them as two separate observances rather
--    than one with a variant. Only the materialiser knows which emitted rows came
--    from the same series position, so only the materialiser can key them.
--
-- 2. COMPLETENESS. The formatter compared how many rows each profile had and
--    assumed the larger set was complete. That cannot see two equally-short sets,
--    and it cannot distinguish "this profile legitimately has fewer occurrences"
--    from "the batch died half way". Only the writer knows how many rows it
--    INTENDED to produce.
--
-- Both are the same shape of mistake: a reader guessing at a fact the writer knew
-- and discarded. This migration gives the writer somewhere to record it.

-- 1 ── batch / completion record ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.observance_materialisation_batches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- What was materialised
  definition_id       uuid NOT NULL REFERENCES public.observance_definitions(id) ON DELETE CASCADE,
  year                integer NOT NULL,
  calendar_profile    text NOT NULL,
  -- Sampradaya/tradition variant. NULL means the unqualified reading, which is
  -- distinct from any named variant; the unique index below treats it as a value
  -- rather than letting NULLs silently duplicate the row.
  spiritual_tradition text,
  variant_key         text,

  -- Where it was computed. Timezone is part of the identity, not decoration:
  -- the same lat/lon under a different tz resolves sunrise to a different civil
  -- day, so two such batches are genuinely different materialisations.
  computed_latitude   double precision NOT NULL,
  computed_longitude  double precision NOT NULL,
  computed_timezone   text NOT NULL,

  -- The completeness contract. expected is written when the batch OPENS, from
  -- the rule's own occurrence count for the year; produced is counted as rows
  -- land. A reader may only trust the batch when status = 'complete' AND the two
  -- agree -- both conditions, because a crash between the last insert and the
  -- status update would otherwise pass on status alone.
  expected_row_count  integer NOT NULL CHECK (expected_row_count >= 0),
  produced_row_count  integer NOT NULL DEFAULT 0 CHECK (produced_row_count >= 0),

  -- Provenance, so a stale batch is identifiable after an engine change.
  engine_version      text NOT NULL,
  rule_version        text NOT NULL,
  astronomy_version   text,

  status              text NOT NULL DEFAULT 'partial',
  failure_reason      text,
  completed_at        timestamptz,

  CONSTRAINT observance_materialisation_batches_status_check
    CHECK (status IN ('complete', 'partial', 'failed')),
  -- A batch claiming completeness must have produced what it promised. Enforced
  -- in the database because this is the single fact the read path trusts, and a
  -- constraint cannot be forgotten the way a code path can.
  CONSTRAINT observance_materialisation_batches_complete_means_complete
    CHECK (status <> 'complete' OR produced_row_count = expected_row_count)
);

-- One batch per materialisation identity.
--
-- NULLS NOT DISTINCT rather than COALESCE(...) expressions. The expression form
-- solved the NULL problem and created a worse one: PostgreSQL cannot infer an
-- EXPRESSION index from a raw-column ON CONFLICT target, so every upsert against
-- it fails with
--
--   there is no unique or exclusion constraint matching the ON CONFLICT
--   specification
--
-- which is what `openBatch` sends. The first real call would have thrown. It was
-- not caught because the batch path was only ever exercised through the test's
-- fake client, which cannot model conflict-target inference -- the shadow
-- database existed and the code was never routed through it.
--
-- NULLS NOT DISTINCT (PostgreSQL 15+; production runs 17) treats NULL as a value
-- for uniqueness, giving the same guarantee on raw columns that a conflict target
-- can name.
CREATE UNIQUE INDEX IF NOT EXISTS uq_observance_materialisation_batches_identity
  ON public.observance_materialisation_batches (
    definition_id, year, calendar_profile,
    spiritual_tradition, variant_key,
    computed_latitude, computed_longitude, computed_timezone
  ) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS idx_observance_materialisation_batches_lookup
  ON public.observance_materialisation_batches (definition_id, year, calendar_profile);

COMMENT ON TABLE public.observance_materialisation_batches IS
  'One row per materialisation run for a (definition, year, profile, variant, location). '
  'The read path may substitute a profile''s occurrences for the legacy fallback only when '
  'the matching batch is status=complete and produced_row_count = expected_row_count.';

-- 2 ── stable series-instance identity on the occurrence ─────────────────────
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS series_instance_key text;

COMMENT ON COLUMN public.observance_occurrences.series_instance_key IS
  'Stable identity for one observance INSTANCE, written by the materialiser. Rows sharing '
  'this key are readings of the same instance (e.g. Smarta vs Vaishnava Janmashtami, or the '
  'same Ekadashi in a series) and must be grouped as variants; rows with different keys are '
  'different observances. Never inferred at read time -- the date cannot carry this, because '
  'two variants of one instance fall on different days by definition.';

ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS batch_id uuid
  REFERENCES public.observance_materialisation_batches(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.observance_occurrences.batch_id IS
  'The materialisation batch that produced this row. NULL for rows written before this '
  'contract existed -- those are legacy fallback rows and are never suppressed by it.';

-- Read path looks up (slug-year-profile) rows and then their batch; index both.
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_batch
  ON public.observance_occurrences (batch_id);
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_series_instance
  ON public.observance_occurrences (series_instance_key)
  WHERE series_instance_key IS NOT NULL;

-- Deliberately NOT backfilled. Existing rows keep series_instance_key = NULL and
-- batch_id = NULL, which is what marks them as pre-contract legacy rows. Inventing
-- keys for them would fabricate the very identity this column exists to record
-- honestly, and would make 557 unverified rows look batch-verified.

-- 3 ── access control ────────────────────────────────────────────────────────
-- This is an internal integrity table. Nothing a user does should read or write
-- it, and the read path consults it only through a server-side query. Enabling
-- RLS with NO policy denies every anon/authenticated request outright; the
-- service role bypasses RLS by design, which is the only access this needs.
--
-- Enabled explicitly rather than relied upon: a table created without RLS in a
-- Supabase project is reachable by any client holding the anon key, so silence
-- here would have published the materialisation history of the whole calendar.
ALTER TABLE public.observance_materialisation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observance_materialisation_batches FORCE ROW LEVEL SECURITY;

-- Guarded so the migration is portable. `anon` and `authenticated` are Supabase
-- roles and do not exist in a plain PostgreSQL instance, so an unguarded REVOKE
-- aborts the script there -- which is exactly what happened on the shadow, and
-- would have meant the access-control half of this migration was never actually
-- executed against anything before reaching production.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.observance_materialisation_batches FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.observance_materialisation_batches FROM authenticated;
  END IF;
END $$;

COMMENT ON TABLE public.observance_materialisation_batches IS
  'Internal materialisation bookkeeping. RLS enabled with no policy: service-role only. '
  'The read path may substitute a profile''s occurrences for the legacy fallback only when '
  'the matching batch is status=complete and produced_row_count = expected_row_count.';
