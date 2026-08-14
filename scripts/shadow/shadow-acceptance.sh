#!/usr/bin/env bash
# Shadow acceptance checks for the materialisation identity + completeness
# contract. Runs against shoonaya_shadow ONLY -- production is never touched.
set -uo pipefail
DB=shoonaya_shadow
SP="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SP/../.." && pwd)"
PASS=0; FAIL=0

check() { # name expected actual
  if [ "$2" = "$3" ]; then printf '  PASS  %-58s %s\n' "$1" "$3"; PASS=$((PASS+1));
  else printf '  FAIL  %-58s expected %s, got %s\n' "$1" "$2" "$3"; FAIL=$((FAIL+1)); fi
}
q() { psql -d "$DB" -tAc "$1" | tr -d ' '; }

echo
echo "=== 1. existing rows untouched ==========================================="
check "row count still 557" "557" "$(q 'select count(*) from observance_occurrences')"
check "data checksum unchanged" "$(cat "$SP/baseline.md5")" "$(q "
  SELECT md5(string_agg(t,'|' ORDER BY t)) FROM (
    SELECT concat_ws(':', d.slug,o.year,o.date,o.occurrence_date,o.calendar_profile,o.variant_key,
                     o.publication_status,o.review_status,o.locked_for_regeneration) t
    FROM observance_occurrences o JOIN observance_definitions d ON d.id=o.definition_id) x")"
check "no stored date moved" "0" "$(q "select count(*) from observance_occurrences where date::text <> occurrence_date")"
check "pre-contract rows keep NULL batch" "557" "$(q 'select count(*) from observance_occurrences where batch_id is null')"
check "pre-contract rows keep NULL series key" "557" "$(q 'select count(*) from observance_occurrences where series_instance_key is null')"
check "5 withheld rows still withheld" "5" "$(q "select count(*) from observance_occurrences where publication_status<>'published'")"

echo
echo "=== 2. the completeness CHECK is enforced by the database ================"
# A batch may not claim completeness without the rows. If this INSERT succeeds,
# the constraint is decorative and the read path's trust is unfounded.
BAD=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2030, 'gujarati-amanta', 1, 1, 'Asia/Kolkata', 24, 2, 'x', 'y', 'complete'
  FROM observance_definitions LIMIT 1;" 2>&1 | grep -c "violates check constraint")
check "complete-means-complete rejected a lying batch" "1" "$BAD"

# The honest version of the same batch must be accepted.
OK=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2030, 'gujarati-amanta', 1, 1, 'Asia/Kolkata', 24, 2, 'x', 'y', 'partial'
  FROM observance_definitions LIMIT 1 RETURNING 1;" 2>/dev/null | grep -x 1 | tail -1)
check "a partial batch is accepted" "1" "$OK"

echo
echo "=== 3. batch identity is unique ==========================================="
DUP=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2030, 'gujarati-amanta', 1, 1, 'Asia/Kolkata', 24, 2, 'x', 'y', 'partial'
  FROM observance_definitions LIMIT 1;" 2>&1 | grep -c "duplicate key")
check "duplicate identity rejected (NULL variant included)" "1" "$DUP"

echo
echo "=== 4. timezone is part of identity ======================================"
TZOK=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2030, 'gujarati-amanta', 1, 1, 'Europe/London', 24, 2, 'x', 'y', 'partial'
  FROM observance_definitions LIMIT 1 RETURNING 1;" 2>/dev/null | grep -x 1 | tail -1)
check "same lat/lon, different tz = different batch" "1" "$TZOK"

psql -d "$DB" -q -c "DELETE FROM observance_materialisation_batches WHERE year=2030;"

echo
echo "=== 4b. the REAL openBatch upsert (raw-column conflict target) ==========="
# The check the fake client structurally could not make. openBatch sends a
# raw-column ON CONFLICT; against the original COALESCE(...) expression index
# PostgreSQL answered "no unique or exclusion constraint matching the ON CONFLICT
# specification" and the first real call would have thrown.
UPSERT=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, spiritual_tradition, variant_key,
     computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2032, 'p', NULL, NULL, 1, 1, 'Asia/Kolkata', 5, 0, 'e', 'r', 'partial'
  FROM observance_definitions LIMIT 1
  ON CONFLICT (definition_id, year, calendar_profile, spiritual_tradition, variant_key,
               computed_latitude, computed_longitude, computed_timezone)
  DO UPDATE SET produced_row_count = 0, status = 'partial'
  RETURNING 1;" 2>&1 | grep -x 1 | tail -1)
check "openBatch conflict target resolves (NULL variant)" "1" "$UPSERT"

# Re-opening must RESET, not inherit a previous 'complete'.
psql -d "$DB" -q -c "UPDATE observance_materialisation_batches SET status='complete', produced_row_count=5 WHERE year=2032;"
psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, spiritual_tradition, variant_key,
     computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2032, 'p', NULL, NULL, 1, 1, 'Asia/Kolkata', 5, 0, 'e', 'r', 'partial'
  FROM observance_definitions LIMIT 1
  ON CONFLICT (definition_id, year, calendar_profile, spiritual_tradition, variant_key,
               computed_latitude, computed_longitude, computed_timezone)
  DO UPDATE SET produced_row_count = 0, status = 'partial';" >/dev/null 2>&1
check "re-open resets a previously complete batch" "partial" "$(q "select status from observance_materialisation_batches where year=2032")"
psql -d "$DB" -q -c "DELETE FROM observance_materialisation_batches WHERE year=2032;"

echo
echo "=== 4c. access control =================================================="
check "RLS enabled on the batches table" "t" "$(q "select relrowsecurity from pg_class where relname='observance_materialisation_batches'")"
check "RLS forced (owner not exempt)" "t" "$(q "select relforcerowsecurity from pg_class where relname='observance_materialisation_batches'")"
check "no policy exists -> deny by default" "0" "$(q "select count(*) from pg_policies where tablename='observance_materialisation_batches'")"

echo
echo "=== 4d. retired lifecycle is auditable ================================="
check "D32 rollback fixture is retired by the migration" "retired" "$(q "select status from observance_materialisation_batches where year=2034")"
check "D32 retirement records its timestamp and reason" "1" "$(q "select count(*) from observance_materialisation_batches where year=2034 and retired_at is not null and retirement_reason like 'D32 rollback:%'")"
check "unrelated failed batch is not retired" "failed" "$(q "select status from observance_materialisation_batches where year=2035")"

BAD_RETIRED=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status)
  SELECT id, 2033, 'global_sanatan', 1, 1, 'Asia/Kolkata', 0, 0, 'e', 'r', 'retired'
  FROM observance_definitions LIMIT 1;" 2>&1 | grep -c "observance_materialisation_batches_retired_has_audit")
check "retired batch without audit reason is rejected" "1" "$BAD_RETIRED"

NULL_REASON=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status, retired_at)
  SELECT id, 2033, 'global_sanatan', 2, 2, 'Asia/Kolkata', 0, 0, 'e', 'r', 'retired', now()
  FROM observance_definitions LIMIT 1;" 2>&1 | grep -c "observance_materialisation_batches_retired_has_audit")
check "retired batch with timestamp but NULL reason is rejected" "1" "$NULL_REASON"

GOOD_RETIRED=$(psql -d "$DB" -tAc "
  INSERT INTO observance_materialisation_batches
    (definition_id, year, calendar_profile, computed_latitude, computed_longitude, computed_timezone,
     expected_row_count, produced_row_count, engine_version, rule_version, status,
     retired_at, retirement_reason)
  SELECT id, 2033, 'global_sanatan', 1, 1, 'Asia/Kolkata', 0, 0, 'e', 'r', 'retired',
         now(), 'shadow obsolete identity'
  FROM observance_definitions LIMIT 1 RETURNING 1;" 2>/dev/null | grep -x 1 | tail -1)
check "retired batch with audit reason is accepted" "1" "$GOOD_RETIRED"
psql -d "$DB" -q -c "DELETE FROM observance_materialisation_batches WHERE year=2033;"

echo
echo "=== 4e. rollback lives outside the migrations directory =================="
check "no .down.sql under supabase/migrations" "0" "$(ls "$ROOT/supabase/migrations" | grep -c 'down.sql')"
check "both batch rollbacks are in supabase/rollbacks" "2" "$(ls "$ROOT/supabase/rollbacks" | grep -Ec '20260811090000|20260814002825')"

echo
echo "=== 5. engine flags untouched ==========================================="
check "USE_CORRECTED_MASA still false" "1" "$(grep -c 'export const USE_CORRECTED_MASA: boolean = false;' "$ROOT/src/lib/calendar/engine.ts")"
check "USE_CONDITION_EVALUATOR still false" "1" "$(grep -c 'export const USE_CONDITION_EVALUATOR: boolean = false;' "$ROOT/src/lib/calendar/engine.ts")"

echo
echo "========================================================================="
printf 'shadow acceptance: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
