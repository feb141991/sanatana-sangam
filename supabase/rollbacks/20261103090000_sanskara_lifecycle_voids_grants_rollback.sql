-- Rollback for 20261103090000_sanskara_lifecycle_voids_grants.sql.
-- Drops the profile trigger and the void function and restores the M3 sanskara_kul_membership_end verbatim.
-- Grants already voided stay revoked (they cannot be told apart from an owner's own revoke except by the audit detail
-- 'kul_membership_ended'); audit rows are kept.
begin;

drop trigger if exists sanskara_profile_kul_change on public.profiles;
drop function if exists public.sanskara_profile_kul_change();

create or replace function public.sanskara_kul_membership_end() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
begin
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

drop function if exists public.sanskara_void_kul_grants(uuid, uuid);

commit;
