#!/usr/bin/env bash
# Isolated test of the 2026-09-24 legacy provenance-label migration and rollback.
# Creates a temporary local database only; never connects to Supabase or prod.
set -euo pipefail

command -v psql >/dev/null 2>&1 || { echo 'psql is required'; exit 2; }
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="shoonaya_provenance_shadow_$$"
cleanup() {
  psql -d postgres -q -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

psql -d postgres -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DB;"
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE public.observance_occurrences (
  id integer PRIMARY KEY,
  date date NOT NULL,
  diagnostics jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_status text NOT NULL,
  final_date_source text NOT NULL,
  calculated_by text NOT NULL,
  calculation_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.observance_occurrences
  (id, date, diagnostics, publication_status, final_date_source, calculated_by, calculation_version)
SELECT n, date '2026-01-01' + n,
       '["withheld_cross_profile_reviewed_duplicate_20260909"]'::jsonb,
       'withheld_disputed',
       CASE WHEN n <= 47 OR n > 187 THEN 'legacy_seed' ELSE 'calculation_engine' END,
       CASE WHEN n > 187 THEN 'other_writer' ELSE 'lazy_materialize_on_read' END,
       '1.0.0'
FROM generate_series(1, 189) AS n;
CREATE TABLE public.provenance_snapshot AS
SELECT id, date, publication_status, final_date_source, diagnostics FROM public.observance_occurrences;
SQL

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/20260924120000_correct_legacy_seed_provenance_label.sql"
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF (SELECT count(*) FROM observance_occurrences
      WHERE diagnostics @> '["legacy_seed_corrected_20260924120000"]'::jsonb
        AND final_date_source = 'calculation_engine') <> 47 THEN
    RAISE EXCEPTION 'forward migration did not mark exactly 47 rows';
  END IF;
  IF (SELECT count(*) FROM observance_occurrences
      WHERE id BETWEEN 48 AND 187 AND final_date_source = 'calculation_engine'
        AND NOT (diagnostics @> '["legacy_seed_corrected_20260924120000"]'::jsonb)) <> 140 THEN
    RAISE EXCEPTION 'forward migration changed rows outside its 47-row target';
  END IF;
  IF EXISTS (
    SELECT 1 FROM observance_occurrences o JOIN provenance_snapshot s USING (id)
    WHERE o.date <> s.date OR o.publication_status <> s.publication_status
  ) THEN
    RAISE EXCEPTION 'forward migration changed dates or publication status';
  END IF;
END $$;
SQL

psql -d "$DB" -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/rollbacks/20260924120000_correct_legacy_seed_provenance_label_rollback.sql"
psql -d "$DB" -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM observance_occurrences o JOIN provenance_snapshot s USING (id)
    WHERE o.date <> s.date OR o.publication_status <> s.publication_status
       OR o.final_date_source <> s.final_date_source OR o.diagnostics <> s.diagnostics
  ) THEN
    RAISE EXCEPTION 'rollback did not restore the original target and preserve other rows';
  END IF;
END $$;
SQL

echo 'PASS: forward migration relabeled exactly 47/189 synthetic rows; preserved dates/status and 140 similar rows; rollback restored source labels/diagnostics (updated_at refreshed by design).'
