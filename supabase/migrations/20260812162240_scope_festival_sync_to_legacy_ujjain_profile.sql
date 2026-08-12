-- D32 (per-calendar-profile month-system branching) can now write more than
-- one observance_occurrences row per (definition_id, year) -- one per
-- calendar_profile -- for rules where amanta/purnimanta diverge. The legacy
-- festivals table has UNIQUE(name, year) and has only ever represented the
-- single `legacy-ujjain` view (confirmed: the legacy admin Festival
-- Management page reads exclusively from festivals). The existing
-- kind='vrat' skip (20260719172305) only protected recurring vrats, whose
-- multiplicity was the only known case at the time -- it did not anticipate
-- a 'major'-kind rule (Diwali, Maha Shivaratri, Krishna Janmashtami, ...)
-- ever having more than one row per year, so those still hit the unique
-- constraint the moment a second calendar_profile's row was inserted.
--
-- Fix: skip mirroring ANY row whose calendar_profile isn't 'legacy-ujjain',
-- regardless of kind. This changes nothing for existing data -- every row in
-- observance_occurrences today already is 'legacy-ujjain' -- it only stops
-- new per-profile rows from ever reaching a table that structurally cannot
-- hold them.

CREATE OR REPLACE FUNCTION public.sync_occurrence_to_festival() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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

  -- festivals has only ever represented the single legacy-ujjain view.
  IF NEW.calendar_profile IS DISTINCT FROM 'legacy-ujjain' THEN
    DELETE FROM public.festivals WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Fetch definition detail
  SELECT * INTO v_def FROM public.observance_definitions WHERE id = NEW.definition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observance definition with ID % not found', NEW.definition_id;
  END IF;

  -- Engine-generated vrat rows are served from observance_occurrences directly.
  -- The legacy festivals table has UNIQUE(name, year), so recurring rows like
  -- Ekadashi/Amavasya cannot be mirrored there safely.
  IF v_def.kind = 'vrat'
    AND NEW.final_date_source IN ('calculation_engine', 'calculation_engine_reviewed')
  THEN
    DELETE FROM public.festivals WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Upsert curated/manual/fallback rows into festivals for legacy compatibility.
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
$$;
