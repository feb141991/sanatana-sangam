-- Year/location materialisation manifest, plus day_boundary_version on the
-- existing batch ledger.
--
-- WHY
-- ---
-- The native Home "second hero pill" reliability fix needs to answer, cheaply
-- and on every Home request, "is this (year, calendar_profile, location) fully
-- materialised, or should we show a pending state and kick off background
-- work?" observance_materialisation_batches (20260811090000) already records
-- per-IDENTITY completeness (one definition/tradition/variant), but has no
-- record of how many identities a given (year, profile, location) run even
-- EXPECTED to produce. A reader that only inspects existing batch rows for
-- "all complete, none failed" can be fooled by an identity that was never
-- opened at all -- a missing row produces nothing to inspect, so it looks
-- indistinguishable from "there was nothing to expect here". This table
-- records the expected count and a content hash of the expected identity set
-- at write time, independent of which batch rows happen to exist later.
--
-- This is explicitly NOT a job queue: no locked_at/attempts, no dequeue
-- semantics. It is a durable, cheap-to-read fact about what one
-- materialisation run expected to produce.

-- 1 ── day_boundary_version on the existing batch ledger ─────────────────────
-- Deliberate extension of the batch contract: this table already tracks
-- engine_version/rule_version/astronomy_version but has never tracked
-- day_boundary_version, even though a day-boundary convention change can
-- alter computed civil dates independently of the other three. Backfilled
-- with the current literal ('1.0.0', matching every other reference to this
-- version in the codebase today -- see currentMaterializationProvenance() in
-- materialisation-batch.ts) so the column can be NOT NULL going forward.
ALTER TABLE public.observance_materialisation_batches
  ADD COLUMN IF NOT EXISTS day_boundary_version text;

UPDATE public.observance_materialisation_batches
  SET day_boundary_version = '1.0.0'
  WHERE day_boundary_version IS NULL;

ALTER TABLE public.observance_materialisation_batches
  ALTER COLUMN day_boundary_version SET NOT NULL;

-- 2 ── the manifest table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.observance_materialisation_manifests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  year                    integer NOT NULL,
  calendar_profile        text NOT NULL,
  computed_latitude       double precision NOT NULL,
  computed_longitude      double precision NOT NULL,
  computed_timezone       text NOT NULL,

  -- What this run expected to produce, known at write time, independent of
  -- which observance_materialisation_batches rows happen to exist later.
  -- expected_identity_hash is a sha256 of the sorted, canonically-serialized
  -- identity keys (canonicalMaterializationIdentitySetHash in
  -- materialisation-batch.ts) -- a matching COUNT alone cannot rule out a
  -- rule change that swapped one identity for a different one while leaving
  -- the total unchanged; the hash can.
  expected_identity_count integer NOT NULL CHECK (expected_identity_count >= 0),
  expected_identity_hash  text NOT NULL,

  -- Full calculation-input provenance tuple (currentMaterializationProvenance()
  -- in materialisation-batch.ts is the one place these values come from --
  -- never a literal typed again at a call site). A manifest is stale the
  -- moment ANY one of these no longer matches the current constants, even if
  -- the other three are unchanged.
  engine_version          text NOT NULL,
  rule_version            text NOT NULL,
  astronomy_version       text NOT NULL,
  day_boundary_version    text NOT NULL,

  status                  text NOT NULL DEFAULT 'pending',

  CONSTRAINT observance_materialisation_manifests_status_check
    CHECK (status IN ('pending', 'complete', 'partial', 'failed'))
);

-- One manifest per (year, profile, location) -- NULLS NOT DISTINCT so a
-- manifest upsert's ON CONFLICT target matches PostgreSQL's own inference the
-- same way uq_observance_materialisation_batches_identity already does (see
-- 20260811090000's own comment on this exact pitfall: a raw-column ON
-- CONFLICT target against a COALESCE-expression index fails at the first real
-- call, not at review time).
CREATE UNIQUE INDEX IF NOT EXISTS uq_observance_materialisation_manifests_identity
  ON public.observance_materialisation_manifests (
    year, calendar_profile,
    computed_latitude, computed_longitude, computed_timezone
  ) NULLS NOT DISTINCT;

COMMENT ON TABLE public.observance_materialisation_manifests IS
  'One row per (year, calendar_profile, location) materialisation run, recording '
  'what it EXPECTED to produce (count + content hash of the identity set) and the '
  'full provenance tuple it ran under. isYearMaterialized() in resolve-occurrences.ts '
  'trusts a combination only when status=complete, all four provenance fields match '
  'the current constants, and the live complete-batch identity set still matches '
  'both the recorded count and hash -- not from batch-row existence alone.';

-- 3 ── access control ────────────────────────────────────────────────────────
-- Same posture as observance_materialisation_batches (20260811090000): an
-- internal integrity/bookkeeping table, server-side reads and writes only.
-- RLS enabled with no policy denies every anon/authenticated request; the
-- service role bypasses RLS by design.
ALTER TABLE public.observance_materialisation_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observance_materialisation_manifests FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.observance_materialisation_manifests FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.observance_materialisation_manifests FROM authenticated;
  END IF;
END $$;
