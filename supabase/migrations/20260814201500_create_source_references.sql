-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Normalized Source References Registry (Tracker 3.5 / Governance):
-- Create a queryable, de-duplicated registry table of distinct source citations
-- with audit controls, RLS enforcement, and SourceReference field parity.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. CREATE SOURCE REFERENCES REGISTRY TABLE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.source_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  text_name text,
  publisher text,
  edition text,
  page_or_section text,
  tier smallint NOT NULL CHECK (tier BETWEEN 1 AND 6),
  tradition text,
  region text,
  scholar_notes text,
  copyright_status text,
  usage_permitted text,
  url text,
  review_status text NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('approved', 'pending_review', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Approval audit constraint: an approved citation MUST record reviewer metadata
ALTER TABLE public.source_references
  DROP CONSTRAINT IF EXISTS source_references_approval_metadata_check;

ALTER TABLE public.source_references
  ADD CONSTRAINT source_references_approval_metadata_check CHECK (
    review_status <> 'approved' OR (
      NULLIF(BTRIM(reviewed_by), '') IS NOT NULL
      AND reviewed_at IS NOT NULL
    )
  );


-- ── 2. NATURAL DE-DUPLICATION UNIQUE INDEX ─────────────────────────────────────
-- De-duplicates identical citations by canonical source name, text, publisher,
-- edition, section, tradition, and region.

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_references_identity ON public.source_references (
  source_name,
  COALESCE(text_name, ''),
  COALESCE(publisher, ''),
  COALESCE(edition, ''),
  COALESCE(page_or_section, ''),
  COALESCE(tradition, ''),
  COALESCE(region, '')
);


-- ── 3. ROW LEVEL SECURITY (RLS) ────────────────────────────────────────────────

ALTER TABLE public.source_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_references FORCE ROW LEVEL SECURITY;

-- SELECT is public/anyone readable
CREATE POLICY "Anyone can view source references"
  ON public.source_references
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE is restricted to admins
CREATE POLICY "Admins can manage source references"
  ON public.source_references
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );


-- ── 4. PERFORMANCE INDEXES ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_source_references_tier
  ON public.source_references (tier);

CREATE INDEX IF NOT EXISTS idx_source_references_review_status
  ON public.source_references (review_status);

CREATE INDEX IF NOT EXISTS idx_source_references_source_name
  ON public.source_references (source_name);


-- ── 5. AUTO-UPDATED_AT TRIGGER ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_source_references_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_source_references_updated ON public.source_references;
CREATE TRIGGER trg_source_references_updated
  BEFORE UPDATE ON public.source_references
  FOR EACH ROW EXECUTE FUNCTION update_source_references_timestamp();


-- ── 6. TABLE AND COLUMN COMMENTS ───────────────────────────────────────────────

COMMENT ON TABLE public.source_references IS
  'Normalized citation registry for calendar governance, sourcing, and Advisory Council review.';
COMMENT ON COLUMN public.source_references.tier IS
  'Source Tier (1..6) per source-governance.md: Tier 1 (Ephemeris/Almanac Authority), Tier 2 (Primary Smriti Text), Tier 3 (Secondary Commentary), Tier 4 (Regional Tradition), Tier 5 (Modern Secondary), Tier 6 (Unverified).';
COMMENT ON COLUMN public.source_references.reviewed_by IS
  'Human decision owner for an approved citation; engineering agents may not populate this field autonomously.';
