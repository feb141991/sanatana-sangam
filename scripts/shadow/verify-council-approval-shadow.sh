#!/usr/bin/env bash
set -uo pipefail

DB=shoonaya_council_approval_shadow
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260814011638_approve_calendar_pilot_batch_0.sql"
ROLLBACK="$ROOT/supabase/rollbacks/20260814011638_approve_calendar_pilot_batch_0_rollback.sql"
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  PASS  %s: %s\n' "$label" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  FAIL  %s: expected=%s actual=%s\n' "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

cleanup() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

command -v psql >/dev/null 2>&1 || {
  echo 'psql not found -- a local PostgreSQL 15+ is required'
  exit 2
}

cleanup
psql -d postgres -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB;" || exit 2

psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL' || exit 2
CREATE TABLE public.golden_fixtures (
  case_id text PRIMARY KEY,
  festival_id text NOT NULL,
  year integer NOT NULL,
  location jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  expected jsonb,
  tolerance jsonb NOT NULL DEFAULT '{}'::jsonb,
  source jsonb NOT NULL,
  reasoning text NOT NULL DEFAULT 'shadow',
  approved boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_profiles (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  region text NOT NULL,
  month_system text,
  solar_month_rule text,
  era text,
  ayanamsha text NOT NULL DEFAULT 'lahiri',
  sunrise_rule text NOT NULL DEFAULT 'upper_limb_refracted',
  month_name_locale text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  scholarly_status text NOT NULL DEFAULT '[S] ratification pending',
  citation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tradition_profiles (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  ekadashi_method text NOT NULL,
  janmashtami_method text NOT NULL,
  shivaratri_method text NOT NULL,
  paran_rule text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  scholarly_status text NOT NULL DEFAULT '[S] ratification pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.calendar_profiles
  (slug, display_name, region, month_system, era, month_name_locale, citation)
VALUES
  ('north_indian_purnimanta', 'North Indian', 'North India', 'purnimanta', 'vikram_north', 'hi', 'calendar-profiles.md section 4'),
  ('global_sanatan', 'Global', 'Global', 'amanta', 'vikram_north', 'en', 'calendar-profiles.md section 4');

INSERT INTO public.tradition_profiles
  (slug, display_name, ekadashi_method, janmashtami_method, shivaratri_method, paran_rule)
VALUES ('smarta', 'Smarta', 'smarta', 'smarta_nishita', 'nishita', 'standard');

INSERT INTO public.golden_fixtures
  (case_id, festival_id, year, expected, source)
VALUES
  ('vijaya-ekadashi__2027__ujjain_india__north_indian_purnimanta', 'vijaya-ekadashi', 2027, '{"civilDate":"2027-03-04"}', '{"tier":1,"verifiedBy":"engineering"}'),
  ('yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta', 'yogini-ekadashi', 2026, '{"civilDate":"2026-07-10"}', '{"tier":1,"verifiedBy":"engineering"}'),
  ('yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__vaishnava_vidhava', 'yogini-ekadashi', 2026, '{"civilDate":"2026-07-11"}', '{"tier":1,"verifiedBy":"engineering"}'),
  ('empty_scaffold', 'future-observance', 2028, NULL, '{"tier":1,"verifiedBy":"engineering"}');
SQL

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$MIGRATION" || exit 2

echo '=== council approval migration ========================================='
check 'approved evidence-complete fixtures' '3' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM golden_fixtures WHERE approved" | tr -d ' ')"
check 'empty scaffolds remain pending' '1' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM golden_fixtures WHERE expected IS NULL AND NOT approved" | tr -d ' ')"
check 'approved fixtures carry complete review metadata' '3' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM golden_fixtures WHERE approved AND reviewed_by='Prince Sharma' AND reviewed_at IS NOT NULL AND effective_from='2026-08-14'" | tr -d ' ')"
check 'approved calendar profiles' '1' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM calendar_profiles WHERE scholarly_status='approved'" | tr -d ' ')"
check 'unrelated calendar profiles remain pending' '1' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM calendar_profiles WHERE scholarly_status<>'approved'" | tr -d ' ')"
check 'tradition profiles remain unapproved' '0' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM tradition_profiles WHERE scholarly_status='approved'" | tr -d ' ')"

if psql -d "$DB" -q -v ON_ERROR_STOP=1 -c "UPDATE golden_fixtures SET approved=true WHERE case_id='empty_scaffold'" >/dev/null 2>&1; then
  check 'approval guard rejects empty fixture' 'rejected' 'accepted'
else
  check 'approval guard rejects empty fixture' 'rejected' 'rejected'
fi

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROLLBACK" || exit 2

echo '=== rollback ==========================================================='
check 'fixture approvals reverted' '0' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM golden_fixtures WHERE approved" | tr -d ' ')"
check 'pilot profile reverted' '0' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM calendar_profiles WHERE scholarly_status='approved'" | tr -d ' ')"
check 'approval-only columns removed' '0' "$(psql -d "$DB" -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND ((table_name='golden_fixtures' AND column_name='effective_from') OR (table_name IN ('calendar_profiles','tradition_profiles') AND column_name IN ('effective_from','reviewed_by','reviewed_at','review_notes')))" | tr -d ' ')"

echo
echo "$PASS passed / $FAIL failed"
[ "$FAIL" -eq 0 ]
