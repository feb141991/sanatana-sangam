begin;

do $$
declare
  v_audit jsonb;
  v_old jsonb;
  v_definition_id uuid;
begin
  select id into strict v_definition_id
  from public.observance_definitions where slug = 'dussehra';

  select detail into v_audit
  from public.observance_content_audit_log
  where action = 'approve_2026_mainstream_date'
    and entity_type = 'observance_occurrence'
    and entity_id = v_definition_id::text
    and detail->>'migration' = '20261019104312_approve_dussehra_2026_and_publish_story'
  order by created_at desc
  limit 1;

  if v_audit is null then
    raise exception 'Cannot rollback Dussehra date approval: before-image audit record not found';
  end if;

  for v_old in
    select value from jsonb_array_elements(
      coalesce(v_audit->'mainstream_previous_rows', '[]'::jsonb)
      || coalesce(v_audit->'regional_previous_rows', '[]'::jsonb)
    )
  loop
    update public.observance_occurrences
    set date = (v_old->>'date')::date,
        occurrence_date = (v_old->>'occurrence_date')::date,
        manual_date_override = nullif(v_old->>'manual_date_override', '')::date,
        manual_override_reason = v_old->>'manual_override_reason',
        locked_for_regeneration = coalesce((v_old->>'locked_for_regeneration')::boolean, false),
        final_date_source = v_old->>'final_date_source',
        review_status = v_old->>'review_status',
        verification_status = v_old->>'verification_status',
        verification_confidence = v_old->>'verification_confidence',
        verification_note = v_old->>'verification_note',
        audit_status = v_old->>'audit_status',
        source_provenance = nullif(v_old->'source_provenance', 'null'::jsonb),
        reviewed_at = nullif(v_old->>'reviewed_at', '')::timestamptz,
        verification_run_at = nullif(v_old->>'verification_run_at', '')::timestamptz,
        last_audited_at = nullif(v_old->>'last_audited_at', '')::timestamptz,
        review_notes = v_old->>'review_notes',
        updated_at = now()
    where id = (v_old->>'id')::uuid;
  end loop;

  update public.observance_story_versions
  set status = 'archived', updated_at = now()
  where definition_id = v_definition_id and version = 2
    and status = 'published';

  insert into public.observance_content_audit_log(action, entity_type, entity_id, actor, detail)
  values ('rollback_2026_mainstream_date', 'observance_occurrence', v_definition_id::text, 'migration rollback',
    jsonb_build_object('migration', '20261019104312_approve_dussehra_2026_and_publish_story',
      'restored_count', jsonb_array_length(coalesce(v_audit->'mainstream_previous_rows', '[]'::jsonb))
        + jsonb_array_length(coalesce(v_audit->'regional_previous_rows', '[]'::jsonb))));
end $$;

commit;
