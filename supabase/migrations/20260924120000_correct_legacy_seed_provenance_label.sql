-- Standalone provenance-label correction. Does NOT restore, publish, or
-- change any row's date, calendar_profile, variant_key, or
-- publication_status -- changes final_date_source, appends a diagnostics
-- marker this migration's rollback depends on, and refreshes updated_at.
-- All 189 rows
-- tagged withheld_cross_profile_reviewed_duplicate_20260909 remain
-- withheld_disputed after this migration runs; date-restoration is
-- deliberately a separate, later, more conservative decision (see
-- docs/PROFILE_AWARE_CALCULATION_CONTRACT_DESIGN.md and
-- docs/audits/cross-profile-withheld-189-reconciliation-2026-09-24/).
--
-- NOT APPLIED. Prepared for review and shadow-branch verification only.
--
-- What this corrects: `ensureYearMaterialized` (src/lib/calendar/
-- resolve-occurrences.ts) never set `final_date_source` on its insert
-- payload before commit f0f450a (2026-09-04, "fix(calendar): set
-- final_date_source on lazy-materialized rows..."), so the column
-- defaulted to 'legacy_seed' -- NOT an accurate description of these
-- rows' actual origin, which is the lazy materialize-on-read path
-- (calculated_by = 'lazy_materialize_on_read'), the same origin
-- 'calculation_engine'-labeled rows already share. This migration
-- corrects the LABEL to match the row's own recorded WRITER, exactly as
-- commit f0f450a's fix does for new rows going forward. It does not
-- relabel based on whether today's engine happens to reproduce the
-- stored date -- that would conflate two different claims (see this
-- program's own review, which caught exactly this conflation in an
-- earlier draft of the restore action that has been removed from scope).
--
-- ROLLBACK-SAFETY MARKER, why it exists:
-- An earlier draft of this migration's rollback matched rows by
-- `calculated_by = 'lazy_materialize_on_read' AND calculation_version =
-- '1.0.0' AND final_date_source = 'calculation_engine'` -- but 140 OTHER
-- rows among these same 189 already carry that exact combination before
-- this migration ever runs (verified 2026-09-24: 140 already
-- 'calculation_engine', 47 'legacy_seed', both sharing calculated_by/
-- calculation_version). After this migration relabels the 47, they become
-- indistinguishable from those 140 by that signature alone -- a rollback
-- using it would incorrectly revert all 187 rows, wrongly mislabeling 140
-- rows this migration never touched. Fixed by tagging exactly the rows
-- this migration writes with a new, migration-specific diagnostics entry
-- the rollback can match precisely, independent of any column whose value
-- this migration itself changes.
--
-- Rollback guidance: supabase/rollbacks/
-- 20260924120000_correct_legacy_seed_provenance_label_rollback.sql
-- matches ONLY rows carrying this migration's own diagnostics marker --
-- reverts final_date_source to 'legacy_seed' and removes the marker.
-- No row is deleted; no other column changes.
--
-- Privilege review: no new grants. RLS: no policy change.
--
-- Shadow verification required before any live application, per AGENTS.md
-- calendar-governance rule 2. Not performed by this file.

begin;

do $migration$
declare
  relabeled_rows integer;
begin
  update public.observance_occurrences
  set final_date_source = 'calculation_engine',
      diagnostics = diagnostics || '["legacy_seed_corrected_20260924120000"]'::jsonb,
      updated_at = now()
  where diagnostics @> '["withheld_cross_profile_reviewed_duplicate_20260909"]'::jsonb
    and final_date_source = 'legacy_seed'
    and calculated_by = 'lazy_materialize_on_read'
    and calculation_version = '1.0.0'
    -- Duplicate-tag prevention, NOT an idempotency guarantee: this clause
    -- stops a rerun from double-appending the marker to an already-
    -- corrected row (which would otherwise leave two copies of the same
    -- string in the diagnostics array). It does not make a rerun succeed
    -- -- a second run matches 0 rows here, so the `<> 47` check below
    -- correctly raises an exception rather than silently reporting
    -- success. That is the intended, safe behavior for normal migration
    -- tooling (apply once); it is a fail-safe on rerun, not idempotence.
    and not (diagnostics @> '["legacy_seed_corrected_20260924120000"]'::jsonb);

  get diagnostics relabeled_rows = row_count;
  if relabeled_rows <> 47 then
    raise exception
      'Expected exactly 47 legacy_seed rows with lazy_materialize_on_read/1.0.0 provenance to relabel; matched %. Re-run scripts/reproduce-cross-profile-withheld-189.ts against this environment before proceeding -- rules.json or the underlying data may have changed since this migration was written (2026-09-24).',
      relabeled_rows;
  end if;
end;
$migration$;

commit;
