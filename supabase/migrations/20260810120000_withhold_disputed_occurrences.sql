-- Publication withholding for disputed occurrences.
--
-- WHY
-- ---
-- `disputed_years` in rules.json stops the ENGINE producing contested dates, and
-- an app-code filter stops stored ones being served. Neither reaches the
-- database, which already held five contested occurrences written before either
-- existed. Two of them were even marked review_status = 'reviewed', leaving them
-- one admin action away from being notification-eligible -- and nothing in the
-- database knew they were disputed, so nothing would have stopped that.
--
-- App-layer filtering is the wrong last line of defence for this. It protects
-- the paths we remembered to change; it does not protect a psql session, an
-- admin tool, a future endpoint, or a re-materialisation run. This migration
-- puts the state where the data is.
--
-- WHAT
-- ----
--   1. observance_occurrences.publication_status -- 'published' | 'withheld_disputed'
--   2. observance_review_queue.ambiguity_type gains 'disputed_ratification'
--
-- The existing ambiguity types ('no_qualified_date', 'multiple_qualified_dates',
-- 'vrddhi_tithi') all describe the ASTRONOMY being unclear. These five are not
-- that: the astronomy is unambiguous and the disagreement is over which day the
-- tradition observes. Reusing one of them would have mislabelled the dispute and
-- sent a reviewer looking for a defect that is not there.

-- 1 ── occurrence-level publication state ────────────────────────────────────
ALTER TABLE public.observance_occurrences
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'published';

-- Default 'published' keeps all 3,000-odd existing rows behaving exactly as they
-- do today. Withholding is opt-in per row, so this migration cannot blank a
-- calendar by accident.
ALTER TABLE public.observance_occurrences
  DROP CONSTRAINT IF EXISTS observance_occurrences_publication_status_check;
ALTER TABLE public.observance_occurrences
  ADD CONSTRAINT observance_occurrences_publication_status_check
  CHECK (publication_status IN ('published', 'withheld_disputed'));

COMMENT ON COLUMN public.observance_occurrences.publication_status IS
  'Whether this occurrence may be published. ''withheld_disputed'' means the '
  'computed date is contested and must not reach a calendar, an .ics feed or a '
  'notification, regardless of review_status. Mirrors disputed_years in '
  'rules.json; see src/lib/calendar/withheld.ts.';

-- Partial index: withheld rows are a handful among thousands, and every read
-- path filters on this column.
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_withheld
  ON public.observance_occurrences (definition_id, year)
  WHERE publication_status <> 'published';

-- 2 ── a truthful ambiguity type for the review queue ────────────────────────
ALTER TABLE public.observance_review_queue
  DROP CONSTRAINT IF EXISTS observance_review_queue_ambiguity_type_check;
ALTER TABLE public.observance_review_queue
  ADD CONSTRAINT observance_review_queue_ambiguity_type_check
  CHECK (ambiguity_type IN (
    'no_qualified_date',
    'multiple_qualified_dates',
    'vrddhi_tithi',
    'disputed_ratification'
  ));

COMMENT ON CONSTRAINT observance_review_queue_ambiguity_type_check
  ON public.observance_review_queue IS
  '''disputed_ratification'': the astronomy is unambiguous but the resulting '
  'date is contested by a ratifying authority. Distinct from the other three, '
  'which all describe the astronomy itself being unclear.';
