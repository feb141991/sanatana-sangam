-- Drops the retired OneSignal device-token table and its two helper functions. NOT applied to any database by this commit.
-- Origin: the 2026-11-12 privacy audit found `public.device_tokens` (OneSignal `player_id`, linked to a user) still in production
-- although OneSignal was removed. It holds 0 rows, has no caller in the Native or backend code, and `push_tokens` replaced it
-- (supabase/migrations/20260716124259_push_tokens.sql). Keeping a table of identifiers nobody uses is data nobody can account for.
--
-- ROC pre-flight (AGENTS.md section 4):
--  1. Function overload trap (PGRST203): nothing is created or redefined. `upsert_device_token(uuid, text, text)` is dropped by its exact
--     signature, so no overload is left behind. A leftover would still compile and then fail at runtime against a missing table.
--  2. Caller contract: no caller exists (searched src, scripts, the Native app and generated types on 2026-11-12). PostgREST would answer a
--     removed RPC or table with 404/PGRST202; nothing sends it. Installed app versions do not reference it.
--  3. User data and opt-out safety: no UPDATE and no data change. The migration REFUSES to run if the table has any row, so it can never
--     silently destroy an identifier. Re-read `select count(*) from public.device_tokens` on the day it is applied (0 on 2026-11-12).
--  4. Locks: DROP TABLE takes a brief ACCESS EXCLUSIVE lock on a 32 kB empty table; lock_timeout 5s fails fast. No foreign key points at it.
--  5. Rollback: supabase/rollbacks/20261112120000_drop_legacy_device_tokens_rollback.sql recreates the empty table, its indexes, policy, trigger
--     and both functions exactly as they were on 2026-11-12. Rows cannot be restored (there are none).

begin;
set local lock_timeout = '5s';

do $check$
begin
  if exists (select 1 from public.device_tokens) then
    raise exception 'device_tokens is not empty: refusing to drop identifiers that may still be in use';
  end if;
  if exists (
    select 1 from pg_trigger
    where tgfoid = 'public.update_device_token_timestamp'::regproc
      and tgrelid <> 'public.device_tokens'::regclass
  ) then
    raise exception 'update_device_token_timestamp() is used by another table: leave it in place';
  end if;
end
$check$;

drop function if exists public.upsert_device_token(uuid, text, text);
drop table public.device_tokens;
drop function if exists public.update_device_token_timestamp();

do $verify$
begin
  assert to_regclass('public.device_tokens') is null, 'device_tokens must be gone';
  assert not exists (select 1 from pg_proc where proname in ('upsert_device_token', 'update_device_token_timestamp') and pronamespace = 'public'::regnamespace),
    'both helper functions must be gone';
end
$verify$;

commit;
