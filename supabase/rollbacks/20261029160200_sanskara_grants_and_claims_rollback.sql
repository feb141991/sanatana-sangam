-- Reverses 20261029160200_sanskara_grants_and_claims.sql.
-- Drops the sharing and hand-over functions and the claims table. Pending claims are discarded (their tokens stop working).
-- Existing grants stay in the M2 table, and sanskara_can still honours them; revoke them first (or run the M2 rollback) if
-- the point is to stop sharing. Records already moved by an accepted claim stay where they were moved. Run the M4 to M6
-- rollbacks first if they have been applied.
begin;

drop function if exists public.sanskara_accept_claim(uuid, text);
drop function if exists public.sanskara_cancel_claim(uuid, uuid);
drop function if exists public.sanskara_start_claim(uuid, uuid);
drop function if exists public.sanskara_shared_with_me();
drop function if exists public.sanskara_list_access(uuid);
drop function if exists public.sanskara_revoke_grant(uuid, uuid);
drop function if exists public.sanskara_grant_view(uuid, uuid, uuid, uuid);
drop table if exists public.sanskara_claims cascade;

commit;
