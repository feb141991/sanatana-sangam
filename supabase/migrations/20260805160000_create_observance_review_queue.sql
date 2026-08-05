-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Persisted Calendar Review Queue (Tracker 3.9 / 3.8):
-- Build review queue for unresolved, ambiguous or vrddhi calendar occurrences
-- to await Advisory Council adjudication.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. CREATE REVIEW QUEUE TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.observance_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL REFERENCES public.observance_definitions(id) ON DELETE CASCADE,
  year integer NOT NULL,
  calendar_profile text NOT NULL,
  location_label text NOT NULL,
  computed_latitude double precision NOT NULL,
  computed_longitude double precision NOT NULL,
  computed_timezone text NOT NULL,
  ambiguity_type text NOT NULL CHECK (ambiguity_type IN ('no_qualified_date', 'multiple_qualified_dates', 'vrddhi_tithi')),
  reasoning text NOT NULL,
  candidate_dates jsonb NOT NULL,
  evaluator_details jsonb NOT NULL,
  review_status text NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('approved', 'pending_review', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Unique constraint: exactly one active review queue entry per definition, year, profile, and location
  CONSTRAINT uq_observance_review_queue_location UNIQUE (definition_id, year, calendar_profile, computed_latitude, computed_longitude)
);


-- ── 2. ROW LEVEL SECURITY (RLS) ────────────────────────────────────────────────

ALTER TABLE public.observance_review_queue ENABLE ROW LEVEL SECURITY;

-- SELECT is public/anyone readable (matching occurrences)
CREATE POLICY "Anyone can view review queue items"
  ON public.observance_review_queue
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE is restricted to admins
CREATE POLICY "Admins can manage all review queue items"
  ON public.observance_review_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );


-- ── 3. PERFORMANCE INDEXES ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_observance_review_queue_def_id
  ON public.observance_review_queue (definition_id);

CREATE INDEX IF NOT EXISTS idx_observance_review_queue_status
  ON public.observance_review_queue (review_status);


-- ── 4. AUTO-UPDATED_AT TRIGGER ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_observance_review_queue_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_observance_review_queue_updated ON public.observance_review_queue;
CREATE TRIGGER trg_observance_review_queue_updated
  BEFORE UPDATE ON public.observance_review_queue
  FOR EACH ROW EXECUTE FUNCTION update_observance_review_queue_timestamp();
