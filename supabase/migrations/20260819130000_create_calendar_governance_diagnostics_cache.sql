-- Persists computeObservanceCandidateDiagnosticsForYear output so the
-- Calendar Governance Fixtures admin GET doesn't pay a ~4-7s (occasionally
-- ~8-14s on a legacy-map fallback) full-year ephemeris computation on every
-- cold serverless instance. Keyed by (year, rules_hash) so it self-
-- invalidates whenever rules.json changes -- never served stale against a
-- rules edit.
CREATE TABLE IF NOT EXISTS public.calendar_governance_diagnostics_cache (
  year integer NOT NULL,
  rules_hash text NOT NULL,
  diagnostics jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, rules_hash)
);

CREATE INDEX IF NOT EXISTS idx_calendar_governance_diagnostics_cache_year
  ON public.calendar_governance_diagnostics_cache (year);

ALTER TABLE public.calendar_governance_diagnostics_cache ENABLE ROW LEVEL SECURITY;
-- Service-role only, same as golden_fixture_audit_logs: no policies means
-- only the service-role key (used by all admin API routes) can read/write.
