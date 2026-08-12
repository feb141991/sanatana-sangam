#!/usr/bin/env bash
# Proves the review-queue variant migration against real PostgreSQL. Production
# is never touched.
set -uo pipefail

DB=shoonaya_review_queue_shadow
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260811153000_review_queue_variant_identity.sql"
ROLLBACK="$ROOT/supabase/rollbacks/20260811153000_review_queue_variant_identity_rollback.sql"
PASS=0
FAIL=0

cleanup() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
}

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  PASS  %s\n' "$label"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %s (expected %s, got %s)\n' "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

build_shadow() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" -c "CREATE DATABASE $DB;" || return 1
  psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-schema.sql" || return 1
  psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO tradition_profiles
  (slug, display_name, ekadashi_method, janmashtami_method, shivaratri_method, paran_rule)
VALUES
  ('smarta', 'Smarta', 'smarta', 'smarta_nishita', 'nishita', 'standard'),
  ('gaudiya_iskcon', 'Gaudiya / ISKCON', 'vaishnava_suddha', 'vaishnava_rohini', 'nishita', 'vaishnava'),
  ('unspecified', 'Unspecified', 'smarta', 'smarta_nishita', 'nishita', 'standard');

INSERT INTO observance_definitions (slug, display_name, kind, tradition, active)
VALUES ('shadow-variant', 'Shadow Variant', 'major', 'hindu', true);

INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, location_label,
  computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2026, 'legacy-ujjain', 'Ujjain, India',
       23.1765, 75.7885, 'Asia/Kolkata',
       'multiple_qualified_dates', 'shadow', '["2026-09-04"]'::jsonb,
       '{"ruleId":"smarta"}'::jsonb
FROM observance_definitions WHERE slug = 'shadow-variant';
SQL
}

trap cleanup EXIT INT TERM
command -v psql >/dev/null 2>&1 || { echo 'psql not found -- PostgreSQL 15+ is required'; exit 2; }

build_shadow || exit 2
BEFORE_ROWS=$(psql -d "$DB" -tAc 'SELECT count(*) FROM observance_review_queue;' | tr -d ' ')
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION" || exit 2

check 'existing queue row count unchanged' "$BEFORE_ROWS" "$(psql -d "$DB" -tAc 'SELECT count(*) FROM observance_review_queue;' | tr -d ' ')"
check 'legacy ruleId backfilled into variant_key' 'smarta' "$(psql -d "$DB" -tAc 'SELECT variant_key FROM observance_review_queue LIMIT 1;' | tr -d ' ')"

psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2026, 'legacy-ujjain', 'gaudiya_iskcon', 'gaudiya_iskcon',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'engine_error', 'shadow', '["2026-09-05"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'shadow-variant';
SQL

check 'two variants coexist at one profile/location' '2' "$(psql -d "$DB" -tAc 'SELECT count(*) FROM observance_review_queue;' | tr -d ' ')"
check 'engine_error is persistable' '1' "$(psql -d "$DB" -tAc "SELECT count(*) FROM observance_review_queue WHERE ambiguity_type='engine_error';" | tr -d ' ')"

# variant_key is not the only identity axis. Two recognised traditions may use
# the same generic evaluator key and must remain two council questions.
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2027, 'legacy-ujjain', 'smarta', 'standard',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'multiple_qualified_dates', 'smarta standard', '["2027-09-01"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'shadow-variant';

INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2027, 'legacy-ujjain', 'gaudiya_iskcon', 'standard',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'multiple_qualified_dates', 'gaudiya standard', '["2027-09-02"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'shadow-variant';
SQL

check 'same variant key across traditions remains distinct' '2' "$(psql -d "$DB" -tAc "SELECT count(*) FROM observance_review_queue WHERE year=2027 AND variant_key='standard';" | tr -d ' ')"

# A rerun may not reset a terminal state, but a council correction must remain
# possible. The trigger distinguishes those two update intents.
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
UPDATE observance_review_queue
SET review_status='approved', reviewed_by='00000000-0000-0000-0000-000000000001', reviewed_at=now()
WHERE year=2027 AND spiritual_tradition='smarta';

UPDATE observance_review_queue
SET review_status='rejected', reviewed_by='00000000-0000-0000-0000-000000000002',
    reviewed_at=now(), review_notes='corrected decision'
WHERE year=2027 AND spiritual_tradition='smarta';
SQL

check 'terminal council decision can be corrected' 'rejected' "$(psql -d "$DB" -tAc "SELECT review_status FROM observance_review_queue WHERE year=2027 AND spiritual_tradition='smarta';" | tr -d ' ')"

if psql -d "$DB" -q -v ON_ERROR_STOP=1 -c "
  INSERT INTO observance_review_queue (
    definition_id, year, calendar_profile, spiritual_tradition, variant_key,
    location_label, computed_latitude, computed_longitude, computed_timezone,
    ambiguity_type, reasoning, candidate_dates, evaluator_details
  ) SELECT id, 2026, 'legacy-ujjain', NULL, 'smarta', 'Ujjain, India',
           23.1765, 75.7885, 'Asia/Kolkata', 'multiple_qualified_dates',
           'duplicate', '[]'::jsonb, '{}'::jsonb
    FROM observance_definitions WHERE slug='shadow-variant';" >/dev/null 2>&1; then
  check 'same variant duplicate rejected' 'rejected' 'accepted'
else
  check 'same variant duplicate rejected' 'rejected' 'rejected'
fi

# Yogini 2026 dual variant review queue upsert test
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO observance_definitions (slug, display_name, kind, tradition, active)
VALUES ('yogini-ekadashi', 'Yogini Ekadashi', 'vrat', 'hindu', true);

INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2026, 'legacy-ujjain', 'smarta', 'smarta',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'disputed_ratification', 'Disputed variant pending council ratification', '["2026-07-10"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'yogini-ekadashi'
ON CONFLICT ON CONSTRAINT uq_observance_review_queue_variant_location
DO UPDATE SET candidate_dates = EXCLUDED.candidate_dates;

INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2026, 'legacy-ujjain', 'gaudiya_iskcon', 'vaishnava_vidhava',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'disputed_ratification', 'Disputed variant pending council ratification', '["2026-07-11"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'yogini-ekadashi'
ON CONFLICT ON CONSTRAINT uq_observance_review_queue_variant_location
DO UPDATE SET candidate_dates = EXCLUDED.candidate_dates;
SQL

check 'Yogini 2026 dual variants exist in queue' '2' "$(psql -d "$DB" -tAc "SELECT count(*) FROM observance_review_queue WHERE definition_id = (SELECT id FROM observance_definitions WHERE slug = 'yogini-ekadashi');" | tr -d ' ')"

# Idempotency rerun
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO observance_review_queue (
  definition_id, year, calendar_profile, spiritual_tradition, variant_key,
  location_label, computed_latitude, computed_longitude, computed_timezone,
  ambiguity_type, reasoning, candidate_dates, evaluator_details
)
SELECT id, 2026, 'legacy-ujjain', 'smarta', 'smarta',
       'Ujjain, India', 23.1765, 75.7885, 'Asia/Kolkata',
       'disputed_ratification', 'Disputed variant pending council ratification', '["2026-07-10"]'::jsonb, '{}'::jsonb
FROM observance_definitions WHERE slug = 'yogini-ekadashi'
ON CONFLICT ON CONSTRAINT uq_observance_review_queue_variant_location
DO UPDATE SET candidate_dates = EXCLUDED.candidate_dates;
SQL

check 'Yogini 2026 upsert is idempotent' '2' "$(psql -d "$DB" -tAc "SELECT count(*) FROM observance_review_queue WHERE definition_id = (SELECT id FROM observance_definitions WHERE slug = 'yogini-ekadashi');" | tr -d ' ')"

# Application-code shadow harness driving real collector & materializer persistence
build_shadow || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION" || exit 2
SHADOW_DATABASE_URL="postgres:///$DB" npx tsx "$HERE/run-review-queue-shadow-app.ts" || exit 2

build_shadow || exit 2
BASELINE=$(psql -d "$DB" -tAc "SELECT md5(string_agg(column_name||':'||data_type, ',' ORDER BY table_name, ordinal_position)) FROM information_schema.columns WHERE table_schema='public';" | tr -d ' ')
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION" || exit 2
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROLLBACK" || exit 2
AFTER=$(psql -d "$DB" -tAc "SELECT md5(string_agg(column_name||':'||data_type, ',' ORDER BY table_name, ordinal_position)) FROM information_schema.columns WHERE table_schema='public';" | tr -d ' ')
check 'rollback restores baseline columns' "$BASELINE" "$AFTER"

printf 'review queue shadow: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
