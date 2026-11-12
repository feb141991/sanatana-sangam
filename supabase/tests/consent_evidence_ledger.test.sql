-- Assertions for 20261112140000_consent_evidence_ledger.sql. Run on a scratch database after applying it. Rolls back.
begin;
do $test$
declare
  u uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); u3 uuid := gen_random_uuid();
  w record; e record; t0 timestamptz; ok boolean;
begin
  -- Every registered wording hashes to what it says it does.
  assert not exists (select 1 from public.consent_wording where wording_sha256 <> encode(sha256(convert_to(wording, 'UTF8')), 'hex')), 'wording hashes are exact';

  insert into auth.users (id) values (u), (u2), (u3);
  insert into public.profiles (id) values (u), (u2);

  -- 1. A change with a registered wording is recorded with the database's own checksum, and the context input is cleared.
  select wording_sha256 into w from public.consent_wording where consent_key = 'notification_taps' and surface = 'settings' and version = '2026-11-12';
  update public.profiles set consent_notification_taps = true,
    consent_context_in = '{"surface":"settings","wording_versions":{"notification_taps":"2026-11-12"},"platform":"ios","app_version":"1.4.0"}'
    where id = u;
  select * into e from public.consent_events where user_id = u and consent_key = 'notification_taps';
  assert e.granted is true and e.previous_value is false, 'granted, previous false';
  assert e.surface = 'settings' and e.wording_status = 'registered' and e.evidence = 'recorded', 'registered on settings';
  assert e.wording_sha256 = w.wording_sha256, 'checksum comes from the registry, not the client';
  assert e.platform = 'ios' and e.app_version = '1.4.0', 'platform and version kept';
  assert (select consent_context_in from public.profiles where id = u) is null, 'context cleared at rest';

  -- 2. A client cannot choose the checksum: an unknown version is recorded as unregistered with no checksum.
  update public.profiles set consent_product_analytics = true,
    consent_context_in = '{"surface":"settings","wording_versions":{"product_analytics":"9999-01-01"}}' where id = u;
  select * into e from public.consent_events where user_id = u and consent_key = 'product_analytics';
  assert e.wording_status = 'unregistered' and e.wording_sha256 is null and e.wording_version = '9999-01-01', 'unknown version is unregistered';

  -- 3. A change with no context is still recorded.
  update public.profiles set consent_activity_personalization = true where id = u;
  select * into e from public.consent_events where user_id = u and consent_key = 'activity_personalization';
  assert e.surface = 'unspecified' and e.wording_status = 'none' and e.evidence = 'recorded', 'no context is still evidence of the change';

  -- 4. Two consents in one statement make two chained rows; an unchanged value makes none; withdrawal is recorded.
  update public.profiles set consent_religious_data = true, consent_notification_taps = true,
    consent_context_in = '{"surface":"onboarding","wording_versions":{"religious_data":"2026-11-12"}}' where id = u2;
  assert (select count(*) from public.consent_events where user_id = u2) = 2, 'two changes, two rows';
  update public.profiles set consent_notification_taps = true where id = u2;
  assert (select count(*) from public.consent_events where user_id = u2) = 2, 'an unchanged value writes nothing';
  update public.profiles set consent_notification_taps = false where id = u2;
  select * into e from public.consent_events where user_id = u2 and consent_key = 'notification_taps' order by seq desc limit 1;
  assert e.granted is false and e.previous_value is true, 'withdrawal is recorded with the value it replaced';
  assert (select consent_updated_at from public.profiles where id = u2) >= e.recorded_at, 'consent_updated_at follows the server clock';

  -- 5. An unrelated profile update does not write to the ledger.
  update public.profiles set consent_updated_at = consent_updated_at where id = u2;
  update public.profiles set updated_at = now() where id = u2;
  assert (select count(*) from public.consent_events where user_id = u2) = 3, 'unrelated updates write nothing';

  -- 6. A new profile that arrives with a consent already on is recorded; one that arrives off is not.
  insert into public.profiles (id, consent_religious_data) values (u3, true);
  assert (select count(*) from public.consent_events where user_id = u3) = 1, 'insert with a consent on is recorded';

  -- 7. The chain verifies, and any tampering is detected.
  assert public.verify_consent_chain(u) and public.verify_consent_chain(u2) and public.verify_consent_chain(u3), 'chains verify';
  assert (select prev_hash is null from public.consent_events where user_id = u order by seq limit 1), 'chain starts empty';
  assert (select count(*) from public.consent_events c where c.user_id = u and c.prev_hash is not null) = 2, 'later rows link to the earlier ones';
end
$test$;

-- 8. Append-only: direct edits, deletes and truncation are refused.
do $t$
declare ok boolean := false;
begin
  begin update public.consent_events set granted = not granted; exception when insufficient_privilege then ok := true; end;
  assert ok, 'update refused'; ok := false;
  begin delete from public.consent_events; exception when insufficient_privilege then ok := true; end;
  assert ok, 'delete refused'; ok := false;
  begin truncate public.consent_events; exception when insufficient_privilege then ok := true; end;
  assert ok, 'truncate refused';
end
$t$;

-- 9. Tampering is caught by the verifier (done with the trigger off, as a superuser would).
do $t$
declare u uuid; ok boolean;
begin
  select user_id into u from public.consent_events limit 1;
  alter table public.consent_events disable trigger consent_events_no_update;
  update public.consent_events set granted = not granted where seq = (select min(seq) from public.consent_events where user_id = u);
  alter table public.consent_events enable trigger consent_events_no_update;
  assert not public.verify_consent_chain(u), 'an edited row breaks the chain';
end
$t$;
rollback;
