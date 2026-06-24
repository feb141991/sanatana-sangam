-- 20260624114236_vrat_reminders_2026_verify.sql
-- Review and activate women-focused vrats for 2026 notifications.
-- Target definitions: 'vat-savitri-amavasya', 'vat-savitri-purnima', 'hartalika-teej', 'karva-chauth'

WITH updates (slug, verified_date) AS (
  VALUES
    ('vat-savitri-amavasya', '2026-05-16'::date),
    ('vat-savitri-purnima',  '2026-05-31'::date),
    ('hartalika-teej',       '2026-09-02'::date),
    ('karva-chauth',         '2026-10-15'::date)
)
UPDATE public.observance_occurrences oo
SET
  date = u.verified_date,
  manual_date_override = u.verified_date,
  review_status = 'reviewed',
  verification_status = 'verified',
  audit_status = 'completed',
  final_date_source = 'manual_override',
  source_provenance = jsonb_build_object(
    'source_kind', 'curated',
    'source_name', 'Shoonaya Corpus src/lib/festivals.ts',
    'source_migration', '20260624114236_vrat_reminders_2026_verify'
  ),
  verification_confidence = 'high',
  reviewed_at = now(),
  verification_run_at = now(),
  last_audited_at = now(),
  updated_at = now()
FROM updates u
JOIN public.observance_definitions od ON od.slug = u.slug
WHERE oo.definition_id = od.id
  AND oo.year = 2026;
