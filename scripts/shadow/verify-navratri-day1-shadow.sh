#!/usr/bin/env bash
# Disposable local PostgreSQL test: migration twice, then real batch writer
# through the pg-backed Supabase shim. Production credentials are never read.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp/}shoonaya-navratri-shadow.XXXXXX")"
PORT=55432
export PGHOST="$TMP" PGPORT="$PORT" PGUSER="$(id -un)"

cleanup() {
  pg_ctl -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

initdb -D "$TMP/data" --auth-local=trust --auth-host=trust >/dev/null
pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP" -w start >/dev/null
createdb shoonaya_navratri_shadow
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/scripts/shadow/shadow-schema.sql"
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -c 'create unique index observance_definitions_slug_key on observance_definitions(slug)'
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260811090000_materialisation_identity_and_completeness.sql"
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260814002825_retire_obsolete_materialisation_batches.sql"
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260818220000_observance_occurrences_location_identity.sql"
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260905180000_calendar_materialisation_manifests.sql"
for _ in 1 2; do
  psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260915093808_register_sharad_navratri_day_1_definition.sql"
done
COUNT="$(psql -d shoonaya_navratri_shadow -X -tAc "select count(*) from observance_definitions where slug = 'navratri-day-1-shailaputri'")"
test "$COUNT" = 1

# Model the parallel-production case: an unreviewed Day 1 row escaped under
# DEFAULT 'published'. A genuinely approved row at another location must stay
# published. Both rows are removed only from this disposable shadow afterward.
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -c "
  insert into observance_occurrences
    (definition_id, year, date, occurrence_date, calendar_profile,
     spiritual_tradition, variant_key, computed_latitude, computed_longitude,
     computed_timezone, final_date_source, verification_status,
     publication_status, audit_status)
  select id, 2026, date '2026-10-11', '2026-10-11', 'legacy-ujjain',
         null, 'legacy-default', 23.1765, 75.7885, 'Asia/Kolkata',
         'calculation_engine', 'not_checked', 'published', 'not_run'
  from observance_definitions where slug = 'navratri-day-1-shailaputri';
  insert into observance_occurrences
    (definition_id, year, date, occurrence_date, calendar_profile,
     spiritual_tradition, variant_key, computed_latitude, computed_longitude,
     computed_timezone, final_date_source, verification_status,
     publication_status, review_status, audit_status)
  select id, 2026, date '2026-10-11', '2026-10-11', 'legacy-ujjain',
         null, 'legacy-default', 40, 20, 'Europe/Tirane',
         'calculation_engine_reviewed', 'verified', 'published', 'reviewed', 'completed'
  from observance_definitions where slug = 'navratri-day-1-shailaputri';"
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/migrations/20260915093808_register_sharad_navratri_day_1_definition.sql"
STATES="$(psql -d shoonaya_navratri_shadow -X -tAc "
  select string_agg(computed_latitude::text || ':' || publication_status, ',' order by computed_latitude)
  from observance_occurrences")"
test "$STATES" = '23.1765:withheld_disputed,40:published'
psql -d shoonaya_navratri_shadow -X -v ON_ERROR_STOP=1 -q -c "
  delete from observance_occurrences
  where definition_id = (select id from observance_definitions where slug = 'navratri-day-1-shailaputri');"

cd "$ROOT"
SHADOW_DATABASE_URL="postgresql://$PGUSER@localhost:$PORT/shoonaya_navratri_shadow?host=$PGHOST" \
  npx tsx scripts/shadow/run-navratri-day1-shadow.mts
