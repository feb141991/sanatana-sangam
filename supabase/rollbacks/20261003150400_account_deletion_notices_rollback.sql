-- Rollback for 20261003150400_account_deletion_notices.sql. Drops the notice
-- ledger; ship the code revert (account-deletion-notices.ts callers) first or
-- the cron's reminder step will log errors (it never blocks the purge).

begin;
drop table if exists public.account_deletion_notices;
commit;
