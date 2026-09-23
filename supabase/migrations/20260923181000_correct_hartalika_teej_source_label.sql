-- Correct the provenance label for the reviewed Hartalika Teej occurrence.
-- The date and its manual override remain unchanged.
--
-- Rollback guidance: do not restore calculation_engine_reviewed while the
-- manual override remains authoritative; that would reintroduce false
-- provenance. If the override itself is later withdrawn, review the row and
-- set the correct source in a new forward migration.

begin;

do $migration$
declare
  changed_rows integer;
begin
  update public.observance_occurrences
  set final_date_source = 'manual_override',
      updated_at = now()
  where id = '656c0ef7-527f-4eeb-b5fd-dbbb5b4e1868'
    and date = date '2026-09-13'
    and occurrence_date = date '2026-09-13'
    and manual_date_override = date '2026-09-13'
    and publication_status = 'published'
    and final_date_source = 'calculation_engine_reviewed';

  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception
      'Expected exactly one unchanged Hartalika Teej row to relabel; updated % rows',
      changed_rows;
  end if;
end;
$migration$;

commit;
