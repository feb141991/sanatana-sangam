-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v68 (Observance Data Model Transition)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create public.observance_definitions table
CREATE TABLE IF NOT EXISTS public.observance_definitions (
  id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at          timestamptz   DEFAULT now() NOT NULL,
  updated_at          timestamptz   DEFAULT now() NOT NULL,
  slug                text          NOT NULL UNIQUE,
  display_name        text          NOT NULL,
  kind                text          CHECK (kind IN ('major', 'vrat', 'regional')),
  tradition           text          CHECK (tradition IN ('hindu', 'sikh', 'buddhist', 'jain', 'all')),
  calendar_rule_type  text,
  verification_type   text          CHECK (verification_type IN ('solar_fixed', 'lunar_tithi', 'nakshatra_based', 'regional_calendar', 'historical_commemoration')),
  route_kind          text,
  route_slug          text,
  region              text,
  active              boolean       DEFAULT true NOT NULL,
  emoji               text          DEFAULT '🪔',
  description         text,
  is_shared           boolean       DEFAULT false NOT NULL
);

-- 2. Create public.observance_occurrences table
CREATE TABLE IF NOT EXISTS public.observance_occurrences (
  id                      uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at              timestamptz   DEFAULT now() NOT NULL,
  updated_at              timestamptz   DEFAULT now() NOT NULL,
  definition_id           uuid          NOT NULL REFERENCES public.observance_definitions(id) ON DELETE CASCADE,
  year                    int           NOT NULL,
  date                    date          NOT NULL,
  calculation_version     text          DEFAULT '1.0.0' NOT NULL,
  calculated_by           text          DEFAULT 'system' NOT NULL,
  verification_status     text          CHECK (verification_status IN ('verified', 'mismatch', 'uncertain', 'not_checked', 'manual_review')),
  verification_note       text,
  suggested_date          date,
  review_status           text          CHECK (review_status IN ('needs_review', 'reviewed')),
  source_provenance       jsonb         DEFAULT '{}'::jsonb NOT NULL,
  verification_confidence  text          CHECK (verification_confidence IN ('high', 'medium', 'low')),
  verification_run_at     timestamptz,
  reviewed_at             timestamptz,
  review_notes            text,
  CONSTRAINT uq_observance_definition_date UNIQUE (definition_id, date)
);

-- 3. Row Level Security (RLS) policies
ALTER TABLE public.observance_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read observance_definitions" ON public.observance_definitions;
CREATE POLICY "Anyone can read observance_definitions" ON public.observance_definitions FOR SELECT USING (true);

ALTER TABLE public.observance_occurrences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read observance_occurrences" ON public.observance_occurrences;
CREATE POLICY "Anyone can read observance_occurrences" ON public.observance_occurrences FOR SELECT USING (true);

-- 4. Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_observance_definitions_slug ON public.observance_definitions (slug);
CREATE INDEX IF NOT EXISTS idx_observance_definitions_tradition ON public.observance_definitions (tradition);
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_date ON public.observance_occurrences (date);
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_year ON public.observance_occurrences (year);
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_definition ON public.observance_occurrences (definition_id);
CREATE INDEX IF NOT EXISTS idx_observance_occurrences_ver_status ON public.observance_occurrences (verification_status);

-- 5. Seed initial data from festivals table to new tables
-- Backfill Definitions
INSERT INTO public.observance_definitions (
  slug,
  display_name,
  kind,
  tradition,
  calendar_rule_type,
  verification_type,
  route_kind,
  route_slug,
  region,
  active,
  emoji,
  description,
  is_shared
)
SELECT DISTINCT ON (
  CASE 
    WHEN lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) = '' THEN 'observance-' || substr(md5(name), 1, 8)
    ELSE lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  END
)
  CASE 
    WHEN lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) = '' THEN 'observance-' || substr(md5(name), 1, 8)
    ELSE lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  END as slug,
  name as display_name,
  type as kind,
  COALESCE(tradition, 'all') as tradition,
  verification_type as calendar_rule_type,
  verification_type,
  NULL as route_kind,
  NULL as route_slug,
  NULL as region,
  true as active,
  COALESCE(emoji, '🪔') as emoji,
  description,
  is_shared
FROM public.festivals
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  kind = COALESCE(EXCLUDED.kind, observance_definitions.kind),
  tradition = COALESCE(EXCLUDED.tradition, observance_definitions.tradition),
  verification_type = COALESCE(EXCLUDED.verification_type, observance_definitions.verification_type),
  calendar_rule_type = COALESCE(EXCLUDED.calendar_rule_type, observance_definitions.calendar_rule_type),
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  is_shared = EXCLUDED.is_shared;

-- Backfill Occurrences
INSERT INTO public.observance_occurrences (
  id,
  definition_id,
  year,
  date,
  calculation_version,
  calculated_by,
  verification_status,
  verification_note,
  suggested_date,
  review_status,
  source_provenance,
  verification_confidence,
  verification_run_at,
  reviewed_at,
  review_notes
)
SELECT
  f.id,
  d.id as definition_id,
  f.year,
  f.date,
  '1.0.0' as calculation_version,
  'legacy_seed' as calculated_by,
  f.verification_status,
  f.verification_note,
  f.suggested_date,
  f.review_status,
  jsonb_build_object(
    'source_name', f.source_name,
    'source_kind', f.source_kind
  ) as source_provenance,
  f.verification_confidence,
  f.verification_run_at,
  f.reviewed_at,
  f.review_notes
FROM public.festivals f
JOIN public.observance_definitions d ON d.slug = (
  CASE 
    WHEN lower(regexp_replace(regexp_replace(f.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) = '' THEN 'observance-' || substr(md5(f.name), 1, 8)
    ELSE lower(regexp_replace(regexp_replace(f.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  END
)
ON CONFLICT (id) DO UPDATE SET
  definition_id = EXCLUDED.definition_id,
  year = EXCLUDED.year,
  date = EXCLUDED.date,
  verification_status = EXCLUDED.verification_status,
  verification_note = EXCLUDED.verification_note,
  suggested_date = EXCLUDED.suggested_date,
  review_status = EXCLUDED.review_status,
  source_provenance = EXCLUDED.source_provenance,
  verification_confidence = EXCLUDED.verification_confidence,
  verification_run_at = EXCLUDED.verification_run_at,
  reviewed_at = EXCLUDED.reviewed_at,
  review_notes = EXCLUDED.review_notes;

-- 6. Trigger to sync public.festivals changes TO new observance tables
CREATE OR REPLACE FUNCTION public.sync_festival_to_observance()
RETURNS TRIGGER AS $$
DECLARE
  v_slug text;
  v_def_id uuid;
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.observance_occurrences WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Slugify name
  v_slug := lower(regexp_replace(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  IF v_slug = '' OR v_slug IS NULL THEN
    v_slug := 'observance-' || substr(md5(NEW.name), 1, 8);
  END IF;

  -- Upsert definition
  INSERT INTO public.observance_definitions (
    slug,
    display_name,
    kind,
    tradition,
    calendar_rule_type,
    verification_type,
    route_kind,
    route_slug,
    region,
    active,
    emoji,
    description,
    is_shared
  ) VALUES (
    v_slug,
    NEW.name,
    NEW.type,
    COALESCE(NEW.tradition, 'all'),
    NEW.verification_type,
    NEW.verification_type,
    NULL,
    NULL,
    NULL,
    true,
    COALESCE(NEW.emoji, '🪔'),
    NEW.description,
    COALESCE(NEW.is_shared, false)
  )
  ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    kind = COALESCE(EXCLUDED.kind, observance_definitions.kind),
    tradition = COALESCE(EXCLUDED.tradition, observance_definitions.tradition),
    verification_type = COALESCE(EXCLUDED.verification_type, observance_definitions.verification_type),
    calendar_rule_type = COALESCE(EXCLUDED.calendar_rule_type, observance_definitions.calendar_rule_type),
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    is_shared = EXCLUDED.is_shared
  RETURNING id INTO v_def_id;

  -- Upsert occurrence with matching ID
  INSERT INTO public.observance_occurrences (
    id,
    definition_id,
    year,
    date,
    calculation_version,
    calculated_by,
    verification_status,
    verification_note,
    suggested_date,
    review_status,
    source_provenance,
    verification_confidence,
    verification_run_at,
    reviewed_at,
    review_notes
  ) VALUES (
    NEW.id,
    v_def_id,
    NEW.year,
    NEW.date,
    '1.0.0',
    'legacy_sync',
    NEW.verification_status,
    NEW.verification_note,
    NEW.suggested_date,
    NEW.review_status,
    jsonb_build_object(
      'source_name', NEW.source_name,
      'source_kind', NEW.source_kind
    ),
    NEW.verification_confidence,
    NEW.verification_run_at,
    NEW.reviewed_at,
    NEW.review_notes
  )
  ON CONFLICT (id) DO UPDATE SET
    definition_id = EXCLUDED.definition_id,
    year = EXCLUDED.year,
    date = EXCLUDED.date,
    verification_status = EXCLUDED.verification_status,
    verification_note = EXCLUDED.verification_note,
    suggested_date = EXCLUDED.suggested_date,
    review_status = EXCLUDED.review_status,
    source_provenance = EXCLUDED.source_provenance,
    verification_confidence = EXCLUDED.verification_confidence,
    verification_run_at = EXCLUDED.verification_run_at,
    reviewed_at = EXCLUDED.reviewed_at,
    review_notes = EXCLUDED.review_notes;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_festival_to_observance ON public.festivals;
CREATE TRIGGER trg_sync_festival_to_observance
  AFTER INSERT OR UPDATE OR DELETE ON public.festivals
  FOR EACH ROW EXECUTE FUNCTION public.sync_festival_to_observance();

-- 7. Trigger to sync public.observance_occurrences changes BACK to festivals table
CREATE OR REPLACE FUNCTION public.sync_occurrence_to_festival()
RETURNS TRIGGER AS $$
DECLARE
  v_def public.observance_definitions%ROWTYPE;
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.festivals WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Fetch definition detail
  SELECT * INTO v_def FROM public.observance_definitions WHERE id = NEW.definition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observance definition with ID % not found', NEW.definition_id;
  END IF;

  -- Upsert into festivals
  INSERT INTO public.festivals (
    id,
    name,
    date,
    emoji,
    description,
    type,
    year,
    tradition,
    is_shared,
    source_name,
    source_kind,
    review_status,
    reviewed_at,
    review_notes,
    verification_status,
    verification_confidence,
    verification_note,
    suggested_date,
    verification_run_at,
    verification_type
  ) VALUES (
    NEW.id,
    v_def.display_name,
    NEW.date,
    v_def.emoji,
    COALESCE(v_def.description, ''),
    COALESCE(v_def.kind, 'major'),
    NEW.year,
    v_def.tradition,
    v_def.is_shared,
    NEW.source_provenance->>'source_name',
    NEW.source_provenance->>'source_kind',
    NEW.review_status,
    NEW.reviewed_at,
    NEW.review_notes,
    NEW.verification_status,
    NEW.verification_confidence,
    NEW.verification_note,
    NEW.suggested_date,
    NEW.verification_run_at,
    v_def.verification_type
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    date = EXCLUDED.date,
    emoji = EXCLUDED.emoji,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    year = EXCLUDED.year,
    tradition = EXCLUDED.tradition,
    is_shared = EXCLUDED.is_shared,
    source_name = EXCLUDED.source_name,
    source_kind = EXCLUDED.source_kind,
    review_status = EXCLUDED.review_status,
    reviewed_at = EXCLUDED.reviewed_at,
    review_notes = EXCLUDED.review_notes,
    verification_status = EXCLUDED.verification_status,
    verification_confidence = EXCLUDED.verification_confidence,
    verification_note = EXCLUDED.verification_note,
    suggested_date = EXCLUDED.suggested_date,
    verification_run_at = EXCLUDED.verification_run_at,
    verification_type = EXCLUDED.verification_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_occurrence_to_festival ON public.observance_occurrences;
CREATE TRIGGER trg_sync_occurrence_to_festival
  AFTER INSERT OR UPDATE OR DELETE ON public.observance_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.sync_occurrence_to_festival();

-- 8. Trigger to sync public.observance_definitions updates BACK to festivals table (via occurrences)
CREATE OR REPLACE FUNCTION public.sync_definition_to_festival()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent infinite recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Propagate definition details to the legacy festivals table
  -- through the occurrences relation (id maps directly to festivals.id)
  UPDATE public.festivals f
  SET
    name = NEW.display_name,
    emoji = NEW.emoji,
    description = COALESCE(NEW.description, ''),
    type = COALESCE(NEW.kind, 'major'),
    tradition = NEW.tradition,
    is_shared = NEW.is_shared,
    verification_type = NEW.verification_type
  FROM public.observance_occurrences o
  WHERE f.id = o.id AND o.definition_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_definition_to_festival ON public.observance_definitions;
CREATE TRIGGER trg_sync_definition_to_festival
  AFTER UPDATE ON public.observance_definitions
  FOR EACH ROW EXECUTE FUNCTION public.sync_definition_to_festival();
