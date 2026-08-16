-- ── 1. CREATE GOLDEN FIXTURES AUDIT LOG TABLE ──────────────────────────────
-- Records an immutable historical timeline of every admin action on golden fixtures:
-- newly_approved, re_confirmed, rejected, and content_updated.

CREATE TABLE IF NOT EXISTS public.golden_fixture_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL,
  festival_id text NOT NULL,
  year integer NOT NULL,
  actor text NOT NULL,
  action text NOT NULL CHECK (action IN ('newly_approved', 're_confirmed', 'rejected', 'content_updated')),
  previous_approved boolean,
  new_approved boolean,
  review_notes text,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. PERFORMANCE INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_golden_fixture_audit_logs_created_at
  ON public.golden_fixture_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_golden_fixture_audit_logs_case_id
  ON public.golden_fixture_audit_logs (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_golden_fixture_audit_logs_festival_year
  ON public.golden_fixture_audit_logs (festival_id, year);

-- ── 3. RLS SECURITY (Service-role only) ──────────────────────────────────────

ALTER TABLE public.golden_fixture_audit_logs ENABLE ROW LEVEL SECURITY;

