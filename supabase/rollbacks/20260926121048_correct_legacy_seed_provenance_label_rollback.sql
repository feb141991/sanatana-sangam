-- Rollback for 20260926121048_correct_legacy_seed_provenance_label.sql
--
-- Matches ONLY rows carrying this migration's own diagnostics marker
-- ('legacy_seed_corrected_20260924120000') -- the marker retains the
-- original migration-authoring timestamp and is precise by construction,
-- not inferred from calculated_by/calculation_version, which 140 other
-- rows among the same 189 already shared before the forward migration
-- ever ran. See the forward migration's own header for why that matters.
-- updated_at is refreshed during rollback rather than restored historically.
--
-- Fixed after external review: also requires final_date_source still
-- equal 'calculation_engine' at rollback time. Without that guard, a
-- marked row whose final_date_source was legitimately changed again by
-- some LATER process (a manual correction, a future migration) would be
-- silently overwritten back to 'legacy_seed' by this rollback, discarding
-- that later change. With the guard, such a row simply does not match --
-- it is left alone, and the row-count check below distinguishes that case
-- from an unexpected one rather than either silently succeeding on fewer
-- rows or blindly overwriting.

begin;

do $migration$
declare
  marked_total integer;
  reverted_rows integer;
begin
  select count(*) into marked_total
  from public.observance_occurrences
  where diagnostics @> '["legacy_seed_corrected_20260924120000"]'::jsonb;

  update public.observance_occurrences
  set final_date_source = 'legacy_seed',
      diagnostics = diagnostics - 'legacy_seed_corrected_20260924120000',
      updated_at = now()
  where diagnostics @> '["legacy_seed_corrected_20260924120000"]'::jsonb
    and final_date_source = 'calculation_engine';

  get diagnostics reverted_rows = row_count;

  if marked_total <> 47 then
    raise exception
      'Expected exactly 47 rows carrying the legacy_seed_corrected_20260924120000 marker; found %. The forward migration may not have run as expected, or something else has changed the marker set -- investigate before proceeding.',
      marked_total;
  end if;

  if reverted_rows <> marked_total then
    raise exception
      'Found % marked rows but only reverted % -- % row(s) no longer have final_date_source = ''calculation_engine'', meaning something changed them after the forward migration ran. Not overwritten (by design); investigate those specific rows (diagnostics @> ''["legacy_seed_corrected_20260924120000"]''::jsonb and final_date_source <> ''calculation_engine'') before deciding how to proceed with this rollback.',
      marked_total, reverted_rows, marked_total - reverted_rows;
  end if;
end;
$migration$;

commit;
