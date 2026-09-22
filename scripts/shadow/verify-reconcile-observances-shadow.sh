#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C LANG=C

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp/}shoonaya-reconcile-shadow.XXXXXX")"
PORT=55433
export PGHOST="$TMP" PGPORT="$PORT" PGUSER="$(id -un)"

cleanup() {
  pg_ctl -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

initdb -D "$TMP/data" --auth-local=trust --auth-host=trust >/dev/null
pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP" -w start >/dev/null
createdb shoonaya_reconcile_shadow
psql -d shoonaya_reconcile_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/scripts/shadow/shadow-schema.sql"
psql -d shoonaya_reconcile_shadow -X -v ON_ERROR_STOP=1 -q -c 'create unique index observance_definitions_slug_key on observance_definitions(slug)'

# Seed test definitions
psql -d shoonaya_reconcile_shadow -X -v ON_ERROR_STOP=1 -q -c "
insert into observance_definitions (id, slug, display_name, tradition, kind)
values
  ('11111111-1111-1111-1111-111111111111', 'karva-chauth', 'Karva Chauth', 'hindu', 'vrat'),
  ('22222222-2222-2222-2222-222222222222', 'ram-navami', 'Ram Navami', 'hindu', 'major'),
  ('33333333-3333-3333-3333-333333333333', 'hartalika-teej', 'Hartalika Teej', 'hindu', 'vrat'),
  ('44444444-4444-4444-4444-444444444444', 'narasimha-jayanti', 'Narasimha Jayanti', 'hindu', 'major'),
  ('55555555-5555-5555-5555-555555555555', 'akshaya-tritiya', 'Akshaya Tritiya', 'hindu', 'major');

insert into observance_occurrences (id, definition_id, year, date, occurrence_date, calendar_profile, publication_status, manual_date_override)
values
  ('b14f99cf-4390-45ac-a228-9cf64b7c46c7', '11111111-1111-1111-1111-111111111111', 2026, '2026-10-15', '2026-10-15', 'legacy-ujjain', 'published', '2026-10-15'),
  ('80620335-a61d-47b3-9503-b19579aa8ada', '22222222-2222-2222-2222-222222222222', 2026, '2026-03-27', '2026-03-27', 'legacy-ujjain', 'published', null),
  ('656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868', '33333333-3333-3333-3333-333333333333', 2026, '2026-09-02', '2026-09-02', 'legacy-ujjain', 'withheld_disputed', '2026-09-02'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 2026, '2026-04-30', '2026-04-30', 'legacy-ujjain', 'withheld_disputed', null);
"

echo "Shadow seeded successfully. Testing migration..."
psql -d shoonaya_reconcile_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260922180000_reconcile_observances_and_remove_withheld.sql"

# Verify test results
KARVA_STATUS=$(psql -d shoonaya_reconcile_shadow -X -tAc "select publication_status from observance_occurrences where id = 'b14f99cf-4390-45ac-a228-9cf64b7c46c7'")
test "$KARVA_STATUS" = "withheld_disputed"
echo "PASS: Karva Chauth erroneous row withheld."

RAM_STATUS=$(psql -d shoonaya_reconcile_shadow -X -tAc "select publication_status from observance_occurrences where id = '80620335-a61d-47b3-9503-b19579aa8ada'")
test "$RAM_STATUS" = "withheld_disputed"
echo "PASS: Ram Navami duplicate row withheld."

TEEJ_DATE=$(psql -d shoonaya_reconcile_shadow -X -tAc "select date from observance_occurrences where id = '656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868'")
test "$TEEJ_DATE" = "2026-09-13"
TEEJ_STATUS=$(psql -d shoonaya_reconcile_shadow -X -tAc "select publication_status from observance_occurrences where id = '656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868'")
test "$TEEJ_STATUS" = "published"
echo "PASS: Hartalika Teej date corrected to 2026-09-13 and published."

NARASIMHA_STATUS=$(psql -d shoonaya_reconcile_shadow -X -tAc "select publication_status from observance_occurrences where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'")
test "$NARASIMHA_STATUS" = "published"
echo "PASS: Narasimha Jayanti restored from withheld to published."

AKSHAYA_COUNT=$(psql -d shoonaya_reconcile_shadow -X -tAc "select count(*) from observance_occurrences where definition_id = '55555555-5555-5555-5555-555555555555' and date = '2026-04-20' and publication_status = 'published'")
test "$AKSHAYA_COUNT" = "1"
echo "PASS: Akshaya Tritiya 2026 occurrence inserted as published."

echo "Testing migration idempotence (running second time)..."
psql -d shoonaya_reconcile_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260922180000_reconcile_observances_and_remove_withheld.sql"
AKSHAYA_COUNT2=$(psql -d shoonaya_reconcile_shadow -X -tAc "select count(*) from observance_occurrences where definition_id = '55555555-5555-5555-5555-555555555555' and date = '2026-04-20'")
test "$AKSHAYA_COUNT2" = "1"
echo "PASS: Migration is idempotent."

echo "All shadow checks passed successfully!"
