#!/usr/bin/env bash
#
# One command, end to end: build a shadow database, apply the materialisation
# migration, run every acceptance check, verify the rollback, and drop it.
#
#   npm run verify:materialisation-shadow
#
# WHY THIS EXISTS IN THE REPO
# ---------------------------
# It did not, and that was a real defect. The first "19/19 shadow checks pass"
# lived only as prose in an assessment document, with the scripts in a temporary
# scratchpad -- unreproducible by anyone, including me on the following day. A
# number nobody can regenerate is not evidence, it is a claim. Standing rule in
# docs/REVIEW_CHECKLIST.md: conclusions come from a one-command script.
#
# PRODUCTION IS NEVER TOUCHED. Everything runs against a local database named
# below, created and dropped by this script.
set -uo pipefail
DB=shoonaya_shadow
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260811090000_materialisation_identity_and_completeness.sql"
ROLLBACK="$ROOT/supabase/rollbacks/20260811090000_materialisation_identity_and_completeness_rollback.sql"

command -v psql >/dev/null 2>&1 || { echo "psql not found -- a local PostgreSQL 15+ is required"; exit 2; }

echo "building shadow database '$DB' ..."
psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" -c "CREATE DATABASE $DB;" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-schema.sql" || exit 2

node "$HERE/gen-shadow-data.mjs" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-data.sql" || exit 2

# Baselines captured BEFORE the migration, so "unchanged" is measured rather than
# asserted.
psql -d "$DB" -tAc "
  SELECT md5(string_agg(t,'|' ORDER BY t)) FROM (
    SELECT concat_ws(':', d.slug,o.year,o.date,o.occurrence_date,o.calendar_profile,o.variant_key,
                     o.publication_status,o.review_status,o.locked_for_regeneration) t
    FROM observance_occurrences o JOIN observance_definitions d ON d.id=o.definition_id) x" \
  | tr -d ' ' > "$HERE/baseline.md5"
psql -d "$DB" -tAc "select md5(string_agg(column_name||':'||data_type, ',' ORDER BY table_name, ordinal_position)) from information_schema.columns where table_schema='public';" \
  | tr -d ' ' > "$HERE/baseline-schema.md5"

echo "applying migration ..."
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION" || exit 2

bash "$HERE/shadow-acceptance.sh"
ACCEPT=$?

echo
echo "=== rollback ============================================================"
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROLLBACK" || exit 2
AFTER=$(psql -d "$DB" -tAc "select md5(string_agg(column_name||':'||data_type, ',' ORDER BY table_name, ordinal_position)) from information_schema.columns where table_schema='public';" | tr -d ' ')
BEFORE=$(cat "$HERE/baseline-schema.md5")
ROWS=$(psql -d "$DB" -tAc "select count(*) from observance_occurrences;" | tr -d ' ')
if [ "$BEFORE" = "$AFTER" ] && [ "$ROWS" = "557" ]; then
  echo "  PASS  rollback restores the schema byte-identically, 557 rows intact"
  ROLL=0
else
  echo "  FAIL  rollback mismatch: before=$BEFORE after=$AFTER rows=$ROWS"
  ROLL=1
fi

psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;"
rm -f "$HERE/shadow-data.sql" "$HERE/baseline.md5" "$HERE/baseline-schema.md5"

echo
if [ "$ACCEPT" -eq 0 ] && [ "$ROLL" -eq 0 ]; then
  echo "verify:materialisation-shadow PASSED"; exit 0
else
  echo "verify:materialisation-shadow FAILED"; exit 1
fi
