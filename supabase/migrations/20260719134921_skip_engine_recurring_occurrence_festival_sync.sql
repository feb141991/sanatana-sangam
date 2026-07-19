-- Keep observance_occurrences as the canonical calendar table, but stop
-- generated recurring observances from being mirrored into the legacy
-- festivals table. festivals has UNIQUE(name, year), so rows like Ekadashi
-- can never be represented there more than once per year.

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

  -- Engine-generated rows are served from observance_occurrences directly.
  -- Mirroring them into festivals breaks recurring observances because the
  -- legacy table only permits one row per (name, year).
  IF NEW.final_date_source = 'calculation_engine' THEN
    DELETE FROM public.festivals WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Fetch definition detail
  SELECT * INTO v_def FROM public.observance_definitions WHERE id = NEW.definition_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observance definition with ID % not found', NEW.definition_id;
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
