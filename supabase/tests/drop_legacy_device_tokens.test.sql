-- Assertions for 20261112120000_drop_legacy_device_tokens.sql. Run on a scratch database that has the legacy table and both functions
-- (the rollback file builds them), then apply the migration, then run this. Read-only.
do $test$
begin
  assert to_regclass('public.device_tokens') is null, 'the table is gone';
  assert not exists (select 1 from pg_proc where proname = 'upsert_device_token' and pronamespace = 'public'::regnamespace), 'upsert_device_token is gone';
  assert not exists (select 1 from pg_proc where proname = 'update_device_token_timestamp' and pronamespace = 'public'::regnamespace), 'the trigger function is gone';
  -- push_tokens, the replacement, is untouched.
  assert to_regclass('public.push_tokens') is not null, 'push_tokens must remain';
end
$test$;
