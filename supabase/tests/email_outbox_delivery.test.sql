-- Integration assertions for 20261004113946_email_outbox_delivery.sql.
-- Run against an isolated Supabase branch/local database after applying the
-- migration. The transaction rolls back its synthetic account and queue rows.
begin;

do $test$
declare
  v_count integer;
  v_status text;
  v_attempts integer;
  v_new_device boolean;
  v_new_event boolean;
  v_worker uuid := '00000000-0000-0000-0000-0000000000e1';
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-0000000000e1', 'email-outbox-test@example.invalid', '{"username":"email_outbox_test"}'::jsonb)
  on conflict (id) do nothing;

  update public.profiles
     set onboarding_completed = true
   where id = '00000000-0000-0000-0000-0000000000e1';

  select count(*) into v_count
    from public.email_outbox
   where idempotency_key = 'onboarding-welcome:00000000-0000-0000-0000-0000000000e1';
  assert v_count = 1, format('onboarding transition should enqueue once; got %s', v_count);

  update public.profiles
     set onboarding_completed = true
   where id = '00000000-0000-0000-0000-0000000000e1';
  select count(*) into v_count
    from public.email_outbox
   where idempotency_key = 'onboarding-welcome:00000000-0000-0000-0000-0000000000e1';
  assert v_count = 1, format('repeated completed state must not enqueue again; got %s', v_count);

  update public.profiles
     set is_deleting = true,
         deletion_requested_at = '2026-10-01T10:00:00Z'
   where id = '00000000-0000-0000-0000-0000000000e1';
  select count(*) into v_count
    from public.email_outbox
   where idempotency_key = 'account-deletion:00000000-0000-0000-0000-0000000000e1:2026-10-01T10:00:00.000Z:scheduled';
  assert v_count = 1, format('deletion request should enqueue confirmation transactionally; got %s', v_count);

  select status, attempt_count into v_status, v_attempts
    from public.claim_email_outbox(v_worker, 20, 120)
   where idempotency_key = 'onboarding-welcome:00000000-0000-0000-0000-0000000000e1';
  assert v_status = 'processing', format('claimed row should be processing; got %s', v_status);
  assert v_attempts = 1, format('claim should increment attempts once; got %s', v_attempts);

  assert not has_table_privilege('anon', 'public.email_outbox', 'select'), 'anon must not read email outbox';
  assert not has_table_privilege('authenticated', 'public.email_outbox', 'select'), 'authenticated must not read email outbox';
  assert not has_function_privilege('anon', 'public.claim_email_outbox(uuid,integer,integer)', 'execute'), 'anon must not claim email';
  assert has_function_privilege('service_role', 'public.claim_email_outbox(uuid,integer,integer)', 'execute'), 'service role must claim email';

  v_new_device := public.register_email_security_device(
    '00000000-0000-0000-0000-0000000000e1', repeat('a', 64), 'ios'
  );
  assert v_new_device, 'first sign-in from a device should enqueue a security email';
  v_new_device := public.register_email_security_device(
    '00000000-0000-0000-0000-0000000000e1', repeat('a', 64), 'ios'
  );
  assert not v_new_device, 'repeat sign-in from the same device must not enqueue another email';
  select count(*) into v_count from public.email_outbox
   where idempotency_key = 'new-device:00000000-0000-0000-0000-0000000000e1:' || repeat('a', 64);
  assert v_count = 1, format('new-device notice should enqueue exactly once; got %s', v_count);
  for v_attempts in 1..5 loop
    perform public.register_email_security_device(
      '00000000-0000-0000-0000-0000000000e1', repeat(substr('bcdefg', v_attempts, 1), 64), 'android'
    );
  end loop;
  select count(*) into v_count from public.email_security_devices
   where user_id = '00000000-0000-0000-0000-0000000000e1';
  assert v_count = 5, format('new-device registration storage should also be capped at 5 per day; got %s', v_count);
  select count(*) into v_count from public.email_outbox
   where recipient_user_id = '00000000-0000-0000-0000-0000000000e1'
     and template_key = 'new_device_login';
  assert v_count = 5, format('new-device notices should be capped at 5 per day; got %s', v_count);

  v_new_event := public.process_resend_email_suppression_event(
    'evt_email_test_1', 'email.bounced', 'hard_bounce', array[repeat('b', 64)]
  );
  assert v_new_event, 'first provider event should be recorded';
  v_new_event := public.process_resend_email_suppression_event(
    'evt_email_test_1', 'email.bounced', 'hard_bounce', array[repeat('b', 64)]
  );
  assert not v_new_event, 'duplicate provider event must be a no-op';
  select count(*) into v_count from public.email_suppressions
   where email_hash = repeat('b', 64) and reason = 'hard_bounce';
  assert v_count = 1, 'permanent bounce should create one address suppression';

  assert has_table_privilege('service_role', 'public.email_security_devices', 'select'), 'service role must inspect registered devices';
  assert not has_table_privilege('authenticated', 'public.email_security_devices', 'select'), 'users must not read device digests';
  assert not has_function_privilege('anon', 'public.register_email_security_device(uuid,text,text)', 'execute'), 'anon must not register security devices';
  assert has_function_privilege('service_role', 'public.register_email_security_device(uuid,text,text)', 'execute'), 'service role must register security devices';
  assert not has_function_privilege('authenticated', 'public.process_resend_email_suppression_event(text,text,text,text[])', 'execute'), 'authenticated must not record provider events';
  assert has_function_privilege('service_role', 'public.process_resend_email_suppression_event(text,text,text,text[])', 'execute'), 'service role must process provider events';
end
$test$;

rollback;
