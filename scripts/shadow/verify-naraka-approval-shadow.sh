#!/usr/bin/env bash
set -euo pipefail

DB_NAME="shoonaya_naraka_shadow_$$"
PSQL="/opt/homebrew/bin/psql"

cleanup() {
  "${PSQL}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "1. Creating ${DB_NAME}"
"${PSQL}" -d postgres -c "CREATE DATABASE ${DB_NAME};" >/dev/null

echo "2. Creating the governed table surface"
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE public.observance_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  kind text,
  tradition text,
  calendar_rule_type text,
  verification_type text,
  route_kind text,
  route_slug text,
  region text,
  active boolean NOT NULL DEFAULT true,
  emoji text,
  description text,
  is_shared boolean NOT NULL DEFAULT false
);

CREATE TABLE public.golden_fixtures (
  case_id text PRIMARY KEY,
  festival_id text NOT NULL,
  year integer NOT NULL,
  location jsonb NOT NULL,
  profile jsonb NOT NULL,
  expected jsonb,
  tolerance jsonb NOT NULL,
  source jsonb NOT NULL,
  reasoning text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  reviewed_by text,
  reviewed_at timestamptz,
  effective_from date,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT golden_fixtures_approval_evidence_check CHECK (
    approved = false OR (
      expected IS NOT NULL
      AND source ->> 'tier' IN ('1', '2', '3', '4')
      AND NULLIF(BTRIM(reviewed_by), '') IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND effective_from IS NOT NULL
    )
  )
);

CREATE TABLE public.observance_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id uuid NOT NULL REFERENCES public.observance_definitions(id)
);
SQL

echo "3. Applying the real Naraka approval migration"
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260823181312_approve_naraka_chaturdashi_rule.sql >/dev/null

echo "4. Verifying forward state and duplicate rejection"
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  definition_count integer;
  fixture_count integer;
BEGIN
  SELECT COUNT(*) INTO definition_count
  FROM public.observance_definitions
  WHERE slug = 'naraka-chaturdashi'
    AND kind = 'major'
    AND active = true;

  SELECT COUNT(*) INTO fixture_count
  FROM public.golden_fixtures
  WHERE case_id = 'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta'
    AND festival_id = 'naraka-chaturdashi'
    AND expected ->> 'civilDate' = '2026-11-08'
    AND source ->> 'tier' = '1'
    AND approved = true
    AND reviewed_by = 'Prince Sharma';

  IF definition_count <> 1 OR fixture_count <> 1 THEN
    RAISE EXCEPTION 'Forward verification failed: definition %, fixture %', definition_count, fixture_count;
  END IF;
END $$;
SQL

if "${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260823181312_approve_naraka_chaturdashi_rule.sql \
  >/tmp/shoonaya-naraka-duplicate.log 2>&1; then
  echo "Expected duplicate migration application to fail" >&2
  exit 1
fi
rm -f /tmp/shoonaya-naraka-duplicate.log

echo "5. Applying rollback and verifying byte-safe removal before materialisation"
"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
  -f supabase/rollbacks/20260823181312_approve_naraka_chaturdashi_rule_rollback.sql >/dev/null

"${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 -qAt <<'SQL'
SELECT CASE WHEN
  (SELECT COUNT(*) FROM public.observance_definitions WHERE slug = 'naraka-chaturdashi') = 0
  AND
  (SELECT COUNT(*) FROM public.golden_fixtures WHERE case_id = 'naraka-chaturdashi__2026__ujjain_india__north_indian_purnimanta') = 0
THEN '6/6 passed' ELSE 'rollback failed' END;
SQL
