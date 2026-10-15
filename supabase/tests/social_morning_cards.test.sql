-- Integration assertions for 20261015100000_social_morning_cards.sql.
-- Run against an isolated Supabase branch/local database after applying the migration; the transaction rolls
-- back everything it inserts.
begin;

do $test$
declare
  v_hash constant text := repeat('a', 64);
  v_other constant text := repeat('b', 64);
  v_id uuid;
  v_status text;
  v_failed boolean;
begin
  -- A draft needs an image and a source.
  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, generated_by) values ('2026-10-16', 'hindu', 'test');
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'a non-withheld card without an image must be rejected';

  insert into public.social_morning_cards (card_date, tradition, source_ref, image_path, image_content_hash, caption, generated_by)
  values ('2026-10-16', 'hindu', 'gita-2-47', 'morning/x.png', v_hash, 'Good morning', 'test')
  returning id into v_id;

  -- One per day per tradition.
  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, source_ref, image_path, image_content_hash, generated_by)
    values ('2026-10-16', 'hindu', 'gita-2-48', 'morning/y.png', v_hash, 'test');
  exception when unique_violation then v_failed := true; end;
  assert v_failed, 'a second card for the same day and tradition must be rejected';

  -- Approval binds to the image hash.
  v_failed := false;
  begin
    update public.social_morning_cards set status = 'approved', approved_by = 'a', approved_at = now(),
           approved_image_content_hash = v_other where id = v_id;
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'approval with a hash that is not the current image hash must be rejected';

  update public.social_morning_cards set status = 'approved', approved_by = 'a', approved_at = now(),
         approved_image_content_hash = v_hash where id = v_id;
  select status into v_status from public.social_morning_cards where id = v_id;
  assert v_status = 'approved', 'a draft with the matching hash can be approved';

  -- Editing the caption, or the image, sends it back to draft and clears the approval.
  update public.social_morning_cards set caption = 'Edited' where id = v_id;
  select status into v_status from public.social_morning_cards where id = v_id;
  assert v_status = 'draft', format('a caption edit must reset approval; status is %s', v_status);
  assert (select approved_by is null and approved_at is null and approved_image_content_hash is null
            from public.social_morning_cards where id = v_id), 'approval metadata must be cleared';

  update public.social_morning_cards set status = 'approved', approved_by = 'a', approved_at = now(),
         approved_image_content_hash = v_hash where id = v_id;
  update public.social_morning_cards set image_content_hash = v_other, image_path = 'morning/z.png' where id = v_id;
  select status into v_status from public.social_morning_cards where id = v_id;
  assert v_status = 'draft', format('an image change must reset approval; status is %s', v_status);

  -- Only a draft can be approved: not a rejected one.
  update public.social_morning_cards set status = 'rejected', rejected_by = 'a', rejected_at = now() where id = v_id;
  v_failed := false;
  begin
    update public.social_morning_cards set status = 'approved', approved_by = 'a', approved_at = now(),
           approved_image_content_hash = v_other where id = v_id;
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'a rejected card cannot be approved directly';

  -- Withheld cards carry a reason and no image.
  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, status, generated_by)
    values ('2026-10-16', 'jain', 'withheld', 'test');
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'a withheld card must say why';

  insert into public.social_morning_cards (card_date, tradition, status, withheld_reason, withheld_detail, generated_by)
  values ('2026-10-16', 'jain', 'withheld', 'corpus_not_usable', 'placeholder text', 'test');

  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, status, withheld_reason, image_path, image_content_hash, generated_by)
    values ('2026-10-16', 'buddhist', 'withheld', 'corpus_not_usable', 'morning/q.png', v_hash, 'test');
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'a withheld card must not carry an image';

  -- Shape checks.
  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, source_ref, image_path, image_content_hash, generated_by)
    values ('2026-10-17', 'hindu', 'x', 'morning/x.png', 'not-a-hash', 'test');
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'a malformed image hash must be rejected';

  v_failed := false;
  begin
    insert into public.social_morning_cards (card_date, tradition, source_ref, image_path, image_content_hash, generated_by)
    values ('2026-10-17', 'christian', 'x', 'morning/x.png', v_hash, 'test');
  exception when check_violation then v_failed := true; end;
  assert v_failed, 'an unknown tradition must be rejected';

  -- Service-role only.
  assert not has_table_privilege('anon', 'public.social_morning_cards', 'select'), 'anon must not read';
  assert not has_table_privilege('authenticated', 'public.social_morning_cards', 'select'), 'authenticated must not read';
  assert has_table_privilege('service_role', 'public.social_morning_cards', 'select, insert, update'), 'service_role must have access';
  assert (select relrowsecurity from pg_class where oid = 'public.social_morning_cards'::regclass), 'RLS must be enabled';
end
$test$;

rollback;
