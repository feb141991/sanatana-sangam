-- Sanskara tracker, lifecycle hook: a share is voided when the Kul membership it rested on ends.
-- Contract: docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md section 9, events E2 and E3 ("all grants ... are void"; "every grant
-- they made is void"). Depends on M1 to M4a. NOT applied to any database by this commit.
--
-- THE DEFECT THIS CLOSES
--   sanskara_can re-checks that grantee and granter are in the grant's Kul at every read, so a share STOPS working the moment
--   someone leaves. But the grant row stayed live, so when that person (or the sharer) later joined the same Kul again the old
--   share started working again, with no new act by the owner. "Void" in the contract means gone, not paused. A person who is
--   removed and later re-invited must not silently recover what they were shown, and a sharer who rejoins must not silently
--   re-share what they decided to stop sharing when they left.
--
-- WHAT THIS CHANGES
--   sanskara_void_kul_grants(user, kul)   internal: revokes (revoked_at, revoked_by NULL = no person did it) every live grant in
--                                         that Kul where the user is the grantee or the granter, writes one metadata-only audit
--                                         row per grant, and deletes the followers' reminder subscriptions that lost their right
--                                         (the same access-lost hook an explicit revoke uses).
--   sanskara_kul_membership_end()         replaced: voids first, then does what it did before (cancel pending reminders).
--   sanskara_profile_kul_change           new trigger: a profile whose kul_id moves away from a Kul (to NULL or another Kul) is the
--                                         same event, because sanskara_can needs kul_members AND profiles.kul_id to agree.
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   * Authority over a dependent never came from the Kul, so a manager who leaves keeps managing; only the shares they made go.
--   * The audit row carries no actor and no target. This runs inside the cascade of an account deletion, where the account row
--     may already be gone. (Checked on the scratch database: a row naming the account did NOT block the deletion there, because
--     the cascade removes it afterwards; so this is not a proven failure, only a rule that the hook never depends on the order
--     in which a cascade visits tables. The row is metadata about the share, and the person is not needed to read it.)
--   * Owner-side consent withdrawal and the deletion cool-off still only suspend shares (E8): they are the owner's own, reversible
--     state, not a change of audience. Only a change of audience voids.
--
-- Privilege review: SECURITY DEFINER, empty search_path, fully qualified names; EXECUTE revoked from everyone (it is called only by
-- the triggers, which run as the function owner). Rollback: supabase/rollbacks/20261103090000_sanskara_lifecycle_voids_grants_rollback.sql.
-- Grants already revoked by this migration cannot be restored by the rollback (that is the point of voiding them).

begin;
-- CREATE TRIGGER on profiles takes SHARE ROW EXCLUSIVE, which waits behind any open write to profiles and holds later writers
-- behind it. Give up after 5 s instead of queueing: this is one transaction, so nothing is applied and it can simply be run again.
set local lock_timeout = '5s';

create function public.sanskara_void_kul_grants(p_user uuid, p_kul uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  g record;
  v_count integer := 0;
begin
  if p_user is null or p_kul is null then return 0; end if;
  for g in
    update public.sanskara_grants x
    set revoked_at = now(), revoked_by = null
    where x.revoked_at is null and x.kul_id = p_kul and (x.grantee_id = p_user or x.granted_by = p_user)
    returning x.subject_id, x.grantee_id
  loop
    v_count := v_count + 1;
    insert into public.sanskara_audit (actor_id, action, subject_id, target_id, detail)
    values (null, 'grant_revoked', g.subject_id, null, jsonb_build_object('reason', 'kul_membership_ended'));
    perform public.sanskara_on_access_lost(g.subject_id, g.grantee_id);
  end loop;
  return v_count;
end;
$$;

create or replace function public.sanskara_kul_membership_end() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
begin
  perform public.sanskara_void_kul_grants(old.user_id, old.kul_id);
  perform public.sanskara_cancel_reminders(old.user_id, null, null, 'sanskara_access_or_consent_changed');
  for s in
    select sj.id from public.sanskara_subjects sj
    where (sj.kind = 'account' and sj.account_id = old.user_id)
       or exists (select 1 from public.sanskara_subject_managers m where m.subject_id = sj.id and m.account_id = old.user_id)
  loop
    perform public.sanskara_cancel_reminders(null, s.id, null, 'sanskara_access_or_consent_changed');
  end loop;
  return old;
end;
$$;

create function public.sanskara_profile_kul_change() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.sanskara_void_kul_grants(new.id, old.kul_id);
  return null;
end;
$$;
create trigger sanskara_profile_kul_change after update of kul_id on public.profiles
  for each row when (old.kul_id is not null and old.kul_id is distinct from new.kul_id)
  execute function public.sanskara_profile_kul_change();

revoke all on function public.sanskara_void_kul_grants(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.sanskara_profile_kul_change() from public, anon, authenticated, service_role;

commit;
