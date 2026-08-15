#!/usr/bin/env bash
# Verify source_references table migration and rollback pair in shoonaya_shadow
set -uo pipefail
DB=shoonaya_shadow
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260814201500_create_source_references.sql"
ROLLBACK="$ROOT/supabase/rollbacks/20260814201500_create_source_references_rollback.sql"

command -v psql >/dev/null 2>&1 || { echo "psql not found -- a local PostgreSQL 15+ is required"; exit 2; }

PASS=0; FAIL=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then printf '  PASS  %-58s %s\n' "$1" "$3"; PASS=$((PASS+1));
  else printf '  FAIL  %-58s expected %s, got %s\n' "$1" "$2" "$3"; FAIL=$((FAIL+1)); fi
}
q() { psql -d "$DB" -tAc "$1" | tr -d ' '; }

cleanup() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "building shadow database '$DB' ..."
psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" -c "CREATE DATABASE $DB;" || exit 1
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$HERE/shadow-schema.sql" || exit 1

echo
echo "=== 1. applying migration ==============================================="
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION"

check "source_references table created" "1" "$(q "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='source_references'")"
check "initial row count is 0" "0" "$(q "SELECT count(*) FROM public.source_references")"

echo
echo "=== 2. checking schema & constraints ===================================="
# Tier check constraint [1..6]
BAD_TIER_LOW=$(psql -d "$DB" -tAc "INSERT INTO public.source_references (source_name, tier) VALUES ('Test', 0);" 2>&1 | grep -c "violates check constraint")
check "tier 0 is rejected by check constraint" "1" "$BAD_TIER_LOW"

BAD_TIER_HIGH=$(psql -d "$DB" -tAc "INSERT INTO public.source_references (source_name, tier) VALUES ('Test', 7);" 2>&1 | grep -c "violates check constraint")
check "tier 7 is rejected by check constraint" "1" "$BAD_TIER_HIGH"

OK_INSERT=$(psql -d "$DB" -tAc "INSERT INTO public.source_references (source_name, text_name, publisher, edition, page_or_section, tier) VALUES ('Rashtriya Panchang', 'Saka 1948', 'Positional Astronomy Centre', '2026', 'p.30', 1) RETURNING 1;" 2>/dev/null | grep -x 1)
check "valid Tier 1 citation inserted" "1" "$OK_INSERT"

echo
echo "=== 3. checking natural de-duplication identity ========================="
DUP_INSERT=$(psql -d "$DB" -tAc "INSERT INTO public.source_references (source_name, text_name, publisher, edition, page_or_section, tier) VALUES ('Rashtriya Panchang', 'Saka 1948', 'Positional Astronomy Centre', '2026', 'p.30', 1);" 2>&1 | grep -c "duplicate key")
check "duplicate citation identity is rejected" "1" "$DUP_INSERT"

DIFF_PAGE_INSERT=$(psql -d "$DB" -tAc "INSERT INTO public.source_references (source_name, text_name, publisher, edition, page_or_section, tier) VALUES ('Rashtriya Panchang', 'Saka 1948', 'Positional Astronomy Centre', '2026', 'p.113', 1) RETURNING 1;" 2>/dev/null | grep -x 1)
check "citation with different section is accepted" "1" "$DIFF_PAGE_INSERT"
check "table row count is now 2" "2" "$(q "SELECT count(*) FROM public.source_references")"

echo
echo "=== 4. checking audit & approval constraint ============================"
BAD_APPROVAL=$(psql -d "$DB" -tAc "UPDATE public.source_references SET review_status = 'approved' WHERE page_or_section = 'p.30';" 2>&1 | grep -c "violates check constraint")
check "approval without reviewer metadata is rejected" "1" "$BAD_APPROVAL"

OK_APPROVAL=$(psql -d "$DB" -tAc "UPDATE public.source_references SET review_status = 'approved', reviewed_by = 'Prince Sharma', reviewed_at = now() WHERE page_or_section = 'p.30' RETURNING 1;" 2>/dev/null | grep -x 1)
check "approval with reviewer metadata is accepted" "1" "$OK_APPROVAL"

echo
echo "=== 5. checking RLS enforcement ======================================="
check "RLS enabled" "true" "$(q "SELECT relrowsecurity::text FROM pg_class WHERE relname='source_references'")"
check "RLS forced" "true" "$(q "SELECT relforcerowsecurity::text FROM pg_class WHERE relname='source_references'")"

echo
echo "=== 6. applying rollback ==============================================="
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROLLBACK"

check "source_references table dropped by rollback" "0" "$(q "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='source_references'")"

echo
echo "========================================================================="
printf 'verify-source-references-shadow: %d passed, %d failed\n' "$PASS" "$FAIL"
if [ "$FAIL" -gt 0 ]; then exit 1; fi
