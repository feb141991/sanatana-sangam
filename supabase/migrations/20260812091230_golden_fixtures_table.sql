-- Reconstructed from production schema (this migration was applied via the
-- Supabase MCP apply_migration tool without a corresponding local file being
-- written at the time -- a process gap caught during a later D32 review).
-- Content below matches the live table/index/RLS definition exactly, verified
-- via information_schema and pg_constraint/pg_indexes/pg_policies queries.
--
-- DB-backed golden fixtures: replaces the git-tracked JSON fixture files with
-- a table so fixtures can be authored/approved through the admin governance
-- UI instead of a PR. RLS is enabled with zero policies (service-role only —
-- admin API routes are the only writer/reader, same as observance_review_queue).

CREATE TABLE IF NOT EXISTS public.golden_fixtures (
  case_id text PRIMARY KEY,
  festival_id text NOT NULL,
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
  location jsonb NOT NULL,
  profile jsonb NOT NULL,
  expected jsonb,
  tolerance jsonb NOT NULL,
  source jsonb NOT NULL,
  reasoning text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golden_fixtures_festival_year
  ON public.golden_fixtures (festival_id, year);

CREATE INDEX IF NOT EXISTS idx_golden_fixtures_approved
  ON public.golden_fixtures (approved);

ALTER TABLE public.golden_fixtures ENABLE ROW LEVEL SECURITY;
