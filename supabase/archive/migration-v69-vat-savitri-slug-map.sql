-- ─────────────────────────────────────────────────────────────────────────────
-- Shoonaya — Migration v69 (Vat Savitri Slug Override & Custom Mapping)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename existing definition if it exists
UPDATE public.observance_definitions
SET slug = 'vat-savitri-amavasya'
WHERE slug = 'vat-savitri-vrat';

-- 2. Update the sync trigger function
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

  -- Explicit Override: Map Vat Savitri Vrat to vat-savitri-amavasya
  IF v_slug = 'vat-savitri-vrat' THEN
    v_slug := 'vat-savitri-amavasya';
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
