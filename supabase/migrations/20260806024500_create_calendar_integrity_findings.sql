-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Tracker 4.5 / Defect D12 Migration:
-- Create calendar_integrity_findings table and enable Row Level Security.
--
-- HONEST DESIGN NOTE (Defect D11 / D12):
--   This table persists findings from buildCalendarIntegrityReport() in
--   integrity.ts. As documented under Defect D11, the integrity audit compares
--   the engine against itself. It does NOT validate correctness against an external
--   canonical authority. It only detects drift or internal schema mismatches
--   (e.g., curated stored dates differing from engine results, missing sources,
--   or multiple candidates). Persisting findings does NOT make it a correctness check.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.calendar_integrity_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  display_name text NOT NULL,
  year integer NOT NULL,
  stored_date text,
  engine_date text,
  candidate_dates text[],
  issue_type text NOT NULL CHECK (issue_type IN ('engine_curated_mismatch', 'missing_external_source', 'multiple_candidates_needs_review', 'unreviewed_or_not_verified')),
  reason text NOT NULL,
  engine_version text NOT NULL,
  detected_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_open boolean NOT NULL DEFAULT true,
  resolved_at timestamptz,
  CONSTRAINT uq_calendar_integrity_findings_issue UNIQUE (slug, year, issue_type)
);

-- Enable RLS and create public read policy
ALTER TABLE public.calendar_integrity_findings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.calendar_integrity_findings'::regclass
      AND polname = 'Allow public read access for calendar_integrity_findings'
  ) THEN
    CREATE POLICY "Allow public read access for calendar_integrity_findings"
      ON public.calendar_integrity_findings FOR SELECT USING (true);
  END IF;
END $$;
