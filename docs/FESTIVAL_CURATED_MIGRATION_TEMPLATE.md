# Festival Curated Migration Template

Use this pattern for yearly curated festival-date passes. The app should treat
curated, reviewed dates as the source of truth for high-trust observances.
The calendar engine remains a fallback and watchdog, not the final authority for
reviewed rows.

## Rules

- Keep `verification_confidence` to existing values only: `high`, `medium`,
  `low`.
- Use `verification_status = 'manual_review'` for ambiguous regional or
  sampradaya-sensitive cases. Do not invent a confidence value called
  `manual_review`.
- For runtime rows in `observance_occurrences`, protect curated dates with all
  three existing schema mechanisms:
  - `final_date_source = 'manual_override'`
  - `manual_date_override = <curated date>`
  - `locked_for_regeneration = true`
- Preserve source evidence in `source_provenance` with at least
  `source_kind`, `source_name`, and, when available, `source_url`.
- Keep the legacy `festivals` row aligned, but do not over-engineer protection
  there. Runtime Home/Panchang/native consumers read `observance_occurrences`.

## Runtime Row Pattern

When a migration updates both `festivals` and `observance_occurrences`, update
the legacy `festivals` row first and the runtime `observance_occurrences` row
last. The legacy sync trigger only carries `source_name`/`source_kind` back to
runtime provenance, so the final runtime update preserves richer
`source_provenance` such as `source_url` and notes.

## Legacy Festivals Pattern

```sql
update public.festivals
set
  date = '<YYYY-MM-DD>'::date,
  source_name = '<source name>',
  source_kind = 'curated',
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = '<high|medium|low>',
  verification_note = '<human-readable verification note>',
  verification_run_at = now(),
  suggested_date = null,
  verification_type = '<solar_fixed|lunar_tithi|nakshatra_based|regional_calendar|historical_commemoration>'
where name = '<Festival Display Name>'
  and year = <year>;
```

## Runtime Row Pattern

```sql
with target_definition as (
  select id
  from public.observance_definitions
  where slug = '<observance-slug>'
)
update public.observance_occurrences oo
set
  date = '<YYYY-MM-DD>'::date,
  final_date_source = 'manual_override',
  manual_date_override = '<YYYY-MM-DD>'::date,
  manual_override_reason = 'Curated verified source: <source name> lists <observance> <year> as <YYYY-MM-DD> for <location/convention>.',
  locked_for_regeneration = true,
  source_provenance = jsonb_build_object(
    'source_kind', 'curated',
    'source_name', '<source name>',
    'source_url', '<source url>',
    'note', '<short provenance note>'
  ),
  review_status = 'reviewed',
  verification_status = 'verified',
  verification_confidence = '<high|medium|low>',
  verification_note = '<human-readable verification note>',
  verification_run_at = now(),
  audit_status = 'completed',
  audit_failure_reason = null,
  audit_retry_count = 0,
  last_audited_at = now(),
  suggested_date = null,
  updated_at = now()
from target_definition td
where oo.definition_id = td.id
  and oo.year = <year>;
```

## After Applying

Run or inspect `/api/cron/calendar-health`. The deterministic integrity report
should show:

- no `engineCuratedMismatch` for unprotected curated rows,
- no `missingExternalSource` for launch-critical curated observances,
- no `multipleCandidatesNeedsReview` for unreviewed ambiguous one-off rules,
- reviewed, verified curated rows counted under `verifiedMatch` or
  `protectedManualOverride`.
