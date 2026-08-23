-- =============================================================================
-- SQL DRAFT ONLY — DO NOT APPLY UNTIL COUNCIL RATIFICATION
-- =============================================================================
-- Location: docs/sql-drafts/naraka-chaturdashi-definition.sql
-- (Moved from supabase/migrations/ per ANTIGRAVITY_NARAKA_PROMPT_1_REMEDIATION.md)
--
-- Note on Schema Governance:
--   The public.observance_definitions table uses (id, slug, display_name, kind,
--   tradition, calendar_rule_type, verification_type, description, emoji, active,
--   is_shared, region).
--   It does NOT have 'publication_status' or 'review_status' columns (those exist
--   on public.observance_occurrences).
--   Because active = true immediately exposes definitions to calendar queries,
--   this definition row MUST NOT be inserted into the production database until
--   council ratification of the Purvarunodaya rule interpretation is complete.
--
-- Target definition payload upon ratification:
-- =============================================================================

DO $draft$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.observance_definitions
    WHERE slug = 'naraka-chaturdashi'
  ) THEN
    RAISE EXCEPTION
      'naraka-chaturdashi already exists; compare the reviewed row explicitly instead of silently preserving it';
  END IF;

  INSERT INTO public.observance_definitions (
    slug,
    display_name,
    kind,
    tradition,
    calendar_rule_type,
    verification_type,
    description,
    emoji,
    active,
    is_shared,
    region
  ) VALUES (
    'naraka-chaturdashi',
    'Naraka Chaturdashi',
    'major',
    'hindu',
    'lunar_tithi',
    'lunar_tithi',
    'A Krishna Chaturdashi observance identified by Rashtriya Panchang with the Purvarunodaya qualifier.',
    '🪔',
    true,
    false,
    null
  );
END
$draft$;
