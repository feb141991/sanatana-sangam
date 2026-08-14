#!/usr/bin/env bash
set -uo pipefail

DB=shoonaya_approved_pilot_shadow
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PROFILE_MIGRATION="$ROOT/supabase/migrations/20260805195000_create_calendar_and_tradition_profiles.sql"
BATCH_MIGRATION="$ROOT/supabase/migrations/20260811090000_materialisation_identity_and_completeness.sql"
RETIREMENT_MIGRATION="$ROOT/supabase/migrations/20260814002825_retire_obsolete_materialisation_batches.sql"
APPROVAL_MIGRATION="$ROOT/supabase/migrations/20260814011638_approve_calendar_pilot_batch_0.sql"
SOURCE_MIGRATION="$ROOT/supabase/migrations/20260814123000_correct_calendar_pilot_source_pages.sql"
PILOT_ROLLBACK="$ROOT/supabase/rollbacks/20260814124500_materialize_approved_calendar_pilot_batch_0_rollback.sql"

cleanup() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
  rm -f "$HERE/shadow-data.sql"
}
trap cleanup EXIT INT TERM

command -v psql >/dev/null 2>&1 || { echo 'psql not found -- local PostgreSQL 15+ is required'; exit 2; }
cleanup
psql -d postgres -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB;" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-schema.sql" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$PROFILE_MIGRATION" || exit 2
node "$HERE/gen-shadow-data.mjs" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-data.sql" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$BATCH_MIGRATION" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$RETIREMENT_MIGRATION" || exit 2

psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL' || exit 2
CREATE TABLE public.golden_fixtures (
  case_id text PRIMARY KEY,
  festival_id text NOT NULL,
  year integer NOT NULL,
  location jsonb NOT NULL,
  profile jsonb NOT NULL,
  expected jsonb,
  tolerance jsonb NOT NULL DEFAULT '{}'::jsonb,
  source jsonb NOT NULL,
  reasoning text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.golden_fixtures
  (case_id, festival_id, year, location, profile, expected, tolerance, source, reasoning)
VALUES
  (
    'vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta',
    'vijaya-ekadashi', 2027,
    '{"label":"Ujjain, India","lat":23.1765,"lon":75.7885,"tz":"Asia/Kolkata"}',
    '{"calendar":"north_indian_purnimanta","tradition":"unspecified"}',
    '{"civilDate":"2027-03-04","reasonCodes":["vrddhi_tithi_second_day_preferred"]}',
    '{"windowMinutes":2}',
    '{"tier":1,"ref":"rashtriya-panchang-saka-1948-p113","citation":"Rashtriya Panchang p.113","verifiedBy":"engineering","verifiedOn":"2026-08-10"}',
    'Tier-1 source reconciliation'
  ),
  (
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
    'yogini-ekadashi', 2026,
    '{"label":"Ujjain, India","lat":23.1765,"lon":75.7885,"tz":"Asia/Kolkata"}',
    '{"calendar":"north_indian_purnimanta","tradition":"smarta","variantKey":"smarta"}',
    '{"civilDate":"2026-07-10","reasonCodes":["kshaya_tithi_prevails_before_sunrise"]}',
    '{"windowMinutes":2}',
    '{"tier":1,"ref":"rashtriya-panchang-saka-1948-p30","citation":"Rashtriya Panchang p.30","verifiedBy":"engineering","verifiedOn":"2026-08-10"}',
    'Tier-1 source reconciliation'
  ),
  (
    'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava',
    'yogini-ekadashi', 2026,
    '{"label":"Ujjain, India","lat":23.1765,"lon":75.7885,"tz":"Asia/Kolkata"}',
    '{"calendar":"north_indian_purnimanta","tradition":"unspecified","variantKey":"vaishnava_vidhava"}',
    '{"civilDate":"2026-07-11","reasonCodes":["kshaya_tithi_skipped_at_sunrise"]}',
    '{"windowMinutes":2}',
    '{"tier":1,"ref":"rashtriya-panchang-saka-1948-p30","citation":"Rashtriya Panchang p.30","verifiedBy":"engineering","verifiedOn":"2026-08-10"}',
    'Tier-1 source reconciliation'
  );
SQL

BASELINE="$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM observance_occurrences" | tr -d ' ')"
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$APPROVAL_MIGRATION" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$SOURCE_MIGRATION" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL' || exit 2
INSERT INTO public.golden_fixtures
  (case_id, festival_id, year, location, profile, expected, tolerance, source,
   reasoning, approved, reviewed_by, reviewed_at, review_notes, effective_from)
VALUES (
  'shadow-engine-mismatch',
  'vijaya-ekadashi',
  2027,
  '{"label":"Ujjain, India","lat":23.1765,"lon":75.7885,"tz":"Asia/Kolkata"}',
  '{"calendar":"north_indian_purnimanta","tradition":"unspecified"}',
  '{"civilDate":"2027-03-05","reasonCodes":["shadow_negative_control"]}',
  '{"windowMinutes":2}',
  '{"tier":1,"ref":"shadow-negative-control","citation":"Shadow negative control, p.1"}',
  'Approved-looking negative control; engine must exclude it.',
  true,
  'Shadow Council',
  '2026-08-14T00:00:00Z',
  'Negative control only.',
  '2026-08-14'
);
SQL

(cd "$ROOT" && SHADOW_DATABASE_URL="postgresql:///$DB" npx tsx "$HERE/run-approved-calendar-pilot-shadow.mts")
RESULT=$?

STORED="$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM observance_occurrences WHERE calculated_by='approved-golden-pilot-v1'" | tr -d ' ')"
COMPLETE="$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM observance_materialisation_batches WHERE engine_version='approved-golden-pilot-1.0.0' AND status='complete' AND expected_row_count=produced_row_count" | tr -d ' ')"

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$PILOT_ROLLBACK" || exit 2
AFTER="$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM observance_occurrences" | tr -d ' ')"
FAILED_AUDIT="$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM observance_materialisation_batches WHERE engine_version='approved-golden-pilot-1.0.0' AND status='failed' AND produced_row_count=0" | tr -d ' ')"

printf '  INFO  baseline_rows=%s pilot_rows=%s complete_batches=%s rollback_rows=%s failed_audit_batches=%s\n' \
  "$BASELINE" "$STORED" "$COMPLETE" "$AFTER" "$FAILED_AUDIT"

if [ "$RESULT" -eq 0 ] && [ "$BASELINE" = '557' ] && [ "$STORED" = '3' ] && [ "$COMPLETE" = '3' ] && [ "$AFTER" = '557' ] && [ "$FAILED_AUDIT" = '3' ]; then
  echo 'verify:approved-calendar-pilot-shadow PASSED'
  exit 0
fi

echo 'verify:approved-calendar-pilot-shadow FAILED'
exit 1
