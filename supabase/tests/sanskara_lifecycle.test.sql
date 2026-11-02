-- Integration assertions for 20261103090000_sanskara_lifecycle_voids_grants.sql (Sanskara tracker, lifecycle hooks).
-- Run against an isolated Supabase branch / scratch database after applying M1 to M4a and the migration above, as the
-- migration owner. Everything is rolled back at the end.
--
-- Contract section 9, events E2, E3, E9, E10 and E14. The point of this file is the RETURN of a person to the Kul:
--   * a share must not come back to life because someone left a Kul and later joined it again (E2, E3: "void", not
--     "paused"); only a new, explicit share gives access again;
--   * deleting an account must work for a person who is in a Kul and has shares (the hook must not write a row that points
--     at the account being deleted);
--   * the account-deletion outcomes of E9, E10 and E14 leave no orphan row anywhere in the tracker.
begin;
set local timezone to 'UTC';

create function public._t(n text) returns uuid language sql immutable as $$ select md5('sanskara-lifecycle:' || n)::uuid $$;

-- Mirrors public.leave_kul(): the membership row goes and the profile's pointer is cleared.
create function public._t_leave(u uuid, k uuid) returns void language plpgsql as $$
begin
  delete from public.kul_members where kul_id = k and user_id = u;
  update public.profiles set kul_id = null where id = u;
end $$;
create function public._t_join(u uuid, k uuid) returns void language plpgsql as $$
begin
  insert into public.kul_members (kul_id, user_id, role) values (k, u, 'sadhak');
  update public.profiles set kul_id = k where id = u;
end $$;
create function public._t_grant(subj uuid, grantee uuid, by_ uuid, k uuid, rec uuid) returns uuid language sql as $$
  insert into public.sanskara_grants (subject_id, grantee_id, granted_by, kul_id, scope, record_id)
  values (subj, grantee, by_, k, 'record', rec) returning id $$;
create function public._t_sub(rec uuid, acct uuid) returns uuid language sql as $$
  insert into public.sanskara_subscriptions (record_id, account_id, lead_days) values (rec, acct, 7) returning id $$;
create function public._t_can(a text, subj uuid, acct uuid, rec uuid) returns boolean language sql as $$ select public.sanskara_can(a, subj, acct, rec) $$;

-- ── Fixtures ────────────────────────────────────────────────────────────────────────────────────────────────────────
-- A owns a timeline. B, C and D are Kul members who may be shared with. M1 and M2 manage the minor S1 (M2 stays when M1
-- goes). L is the only manager of the minor S2. P is a member with no relationship. All are in K1.
insert into auth.users (id) select public._t(n) from unnest(array['A', 'B', 'C', 'D', 'M1', 'M2', 'L', 'P']) n;
insert into public.kuls (id) values (public._t('K1')), (public._t('K2'));
insert into public.profiles (id, kul_id, consent_religious_data, is_deleting, username, full_name)
select public._t(n), public._t('K1'), true, false, 'user_' || lower(n), 'Name ' || n
from unnest(array['A', 'B', 'C', 'D', 'M1', 'M2', 'L', 'P']) n;
insert into public.kul_members (kul_id, user_id, role)
select public._t('K1'), public._t(n), case when n = 'A' then 'guardian' else 'sadhak' end
from unnest(array['A', 'B', 'C', 'D', 'M1', 'M2', 'L', 'P']) n;

insert into public.sanskara_rites (rite_key, sensitivity, prenatal) values ('rite_b', 'B', false), ('rite_b2', 'B', false);
insert into public.sanskara_subjects (id, kind, account_id) values (public._t('SA'), 'account', public._t('A')), (public._t('SP'), 'account', public._t('P'));
insert into public.sanskara_subjects (id, kind, display_name, birth_date) values
  (public._t('S1'), 'dependent', 'Asha', current_date - interval '5 years'),
  (public._t('S2'), 'dependent', 'Ravi', current_date - interval '6 years');
insert into public.sanskara_subject_managers (subject_id, account_id) values
  (public._t('S1'), public._t('M1')), (public._t('S1'), public._t('M2')), (public._t('S2'), public._t('L'));
insert into public.sanskara_records (id, subject_id, rite_key, planned_date) values
  (public._t('ra'), public._t('SA'), 'rite_b', current_date + 30),
  (public._t('ra2'), public._t('SA'), 'rite_b2', current_date + 40),
  (public._t('rp'), public._t('SP'), 'rite_b', current_date + 30),
  (public._t('r1'), public._t('S1'), 'rite_b', current_date + 30),
  (public._t('r2'), public._t('S2'), 'rite_b', current_date + 30);

-- ── 1. E2: a grantee leaves the Kul and comes back ──────────────────────────────────────────────────────────────────
do $t$
declare g uuid; s uuid;
begin
  g := public._t_grant(public._t('SA'), public._t('B'), public._t('A'), public._t('K1'), public._t('ra'));
  s := public._t_sub(public._t('ra'), public._t('B'));
  assert public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'before leaving, the grantee reads the shared record';

  perform public._t_leave(public._t('B'), public._t('K1'));
  assert not public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'E2: after leaving, the grantee cannot read';

  perform public._t_join(public._t('B'), public._t('K1'));
  assert not public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'E2: coming back to the same Kul does not bring the share back';
  assert (select revoked_at is not null and revoked_by is null from public.sanskara_grants where id = g), 'E2: the grant is revoked on the row, not only denied by a check';
  assert not exists (select 1 from public.sanskara_subscriptions where id = s), 'E2: the grantee''s reminder for it is gone, so a later share does not resume an old reminder';

  -- A new, explicit share is the only way back.
  perform public._t_grant(public._t('SA'), public._t('B'), public._t('A'), public._t('K1'), public._t('ra'));
  assert public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'E2: a new share gives access again';
end
$t$;

-- ── 2. E3: the sharer leaves the Kul and comes back ─────────────────────────────────────────────────────────────────
do $t$
begin
  assert public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'precondition: B has the new share';
  perform public._t_leave(public._t('A'), public._t('K1'));
  assert not public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'E3: the sharer left, every share they made is void';
  perform public._t_join(public._t('A'), public._t('K1'));
  assert not public._t_can('read_record', public._t('SA'), public._t('B'), public._t('ra')), 'E3: the sharer coming back does not restore what they shared';
  assert not exists (select 1 from public.sanskara_grants g where g.granted_by = public._t('A') and g.revoked_at is null), 'E3: no live grant of theirs remains';
  -- Their own timeline is unaffected: the owner still reads and manages it.
  assert public._t_can('read_record', public._t('SA'), public._t('A'), public._t('ra')), 'E3: the owner keeps their own data';
end
$t$;

-- ── 3. E3 for a manager: shares they made end, their co-manager is untouched ────────────────────────────────────────
do $t$
begin
  perform public._t_grant(public._t('S1'), public._t('C'), public._t('M1'), public._t('K1'), public._t('r1'));
  perform public._t_grant(public._t('S1'), public._t('D'), public._t('M2'), public._t('K1'), public._t('r1'));
  assert public._t_can('read_record', public._t('S1'), public._t('C'), public._t('r1')), 'precondition: C reads through M1''s share';

  perform public._t_leave(public._t('M1'), public._t('K1'));
  perform public._t_join(public._t('M1'), public._t('K1'));
  assert not public._t_can('read_record', public._t('S1'), public._t('C'), public._t('r1')), 'E3: the manager who left and returned no longer shares with C';
  assert public._t_can('read_record', public._t('S1'), public._t('D'), public._t('r1')), 'E3: the co-manager''s share is not touched';
  assert public._t_can('write_record', public._t('S1'), public._t('M2'), public._t('r1')), 'the co-manager keeps managing';
  assert public._t_can('write_record', public._t('S1'), public._t('M1'), public._t('r1')), 'authority over a dependent never came from the Kul, so M1 still manages';
end
$t$;

-- ── 4. A change of the profile's Kul without a membership delete is the same event ──────────────────────────────────
do $t$
declare g uuid;
begin
  g := public._t_grant(public._t('SP'), public._t('C'), public._t('P'), public._t('K1'), public._t('rp'));
  assert public._t_can('read_record', public._t('SP'), public._t('C'), public._t('rp')), 'precondition';
  update public.profiles set kul_id = null where id = public._t('C');
  update public.profiles set kul_id = public._t('K1') where id = public._t('C');
  assert not public._t_can('read_record', public._t('SP'), public._t('C'), public._t('rp')), 'a profile that left its Kul and came back does not recover the share';
  assert (select revoked_at is not null from public.sanskara_grants where id = g), 'the grant is revoked on the row';
end
$t$;

-- ── 5. Unrelated grants are not touched ─────────────────────────────────────────────────────────────────────────────
do $t$
declare g uuid;
begin
  g := public._t_grant(public._t('SP'), public._t('D'), public._t('P'), public._t('K1'), public._t('rp'));
  perform public._t_leave(public._t('B'), public._t('K1'));
  perform public._t_join(public._t('B'), public._t('K1'));
  assert (select revoked_at is null from public.sanskara_grants where id = g), 'a grant between two people who stayed is untouched';
  assert public._t_can('read_record', public._t('SP'), public._t('D'), public._t('rp')), 'and still reads';
  -- A grant that rested on another Kul is not voided by leaving K1: a person leaves one Kul at a time.
  insert into public.kul_members (kul_id, user_id, role) values (public._t('K2'), public._t('B'), 'sadhak');
  assert (select count(*) from public.sanskara_grants where kul_id = public._t('K2')) = 0, 'precondition: no grant rests on K2';
  delete from public.kul_members where kul_id = public._t('K2') and user_id = public._t('B');
  assert (select revoked_at is null from public.sanskara_grants where id = g), 'leaving a different Kul changes nothing for this grant';
end
$t$;

-- ── 6. The audit trail records the void, without pointing at an account that may be going away ─────────────────────
do $t$
begin
  assert exists (select 1 from public.sanskara_audit where action = 'grant_revoked' and detail ->> 'reason' = 'kul_membership_ended' and actor_id is null and target_id is null),
    'the void is audited as metadata only, with no account reference';
  assert not exists (select 1 from public.sanskara_audit where detail::text ~* '(note|title|name)'), 'the audit detail carries no content';
end
$t$;

-- ── 7. Deleting an account that is in a Kul and has shares must succeed (the hook runs inside the cascade) ──────────
do $t$
begin
  perform public._t_grant(public._t('SA'), public._t('D'), public._t('A'), public._t('K1'), public._t('ra2'));
  perform public._t_sub(public._t('ra2'), public._t('D'));
  assert public._t_can('read_record', public._t('SA'), public._t('D'), public._t('ra2')), 'precondition: A has a live share to D';
  delete from auth.users where id = public._t('A');
  assert not exists (select 1 from public.sanskara_grants where granted_by = public._t('A') or subject_id = public._t('SA')), 'E9: the owner''s grants are gone';
  assert not exists (select 1 from public.sanskara_subjects where account_id = public._t('A')), 'E9: the owner''s subject is gone';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('SA')), 'E9: the owner''s records are gone';
  assert not exists (select 1 from public.sanskara_subscriptions s where s.record_id in (public._t('ra'), public._t('ra2'))), 'E9: reminders on the owner''s records are gone';
end
$t$;

-- ── 8. E14: a grantee's account is deleted ──────────────────────────────────────────────────────────────────────────
do $t$
declare s uuid;
begin
  perform public._t_grant(public._t('SP'), public._t('C'), public._t('P'), public._t('K1'), public._t('rp'));
  s := public._t_sub(public._t('rp'), public._t('C'));
  delete from auth.users where id = public._t('C');
  assert not exists (select 1 from public.sanskara_grants where grantee_id = public._t('C')), 'E14: the grantee''s grants are gone';
  assert not exists (select 1 from public.sanskara_subscriptions where account_id = public._t('C')), 'E14: the grantee''s subscriptions are gone';
  assert exists (select 1 from public.sanskara_records where id = public._t('rp')), 'E14: the owner''s record is untouched';
end
$t$;

-- ── 9. E10: a manager's account is deleted ──────────────────────────────────────────────────────────────────────────
do $t$
begin
  -- With another manager: the dependent stays, with them.
  delete from auth.users where id = public._t('M1');
  assert exists (select 1 from public.sanskara_subjects where id = public._t('S1')), 'E10: a dependent with another manager stays';
  assert exists (select 1 from public.sanskara_records where id = public._t('r1')), 'E10: and so do its records';
  assert public._t_can('write_record', public._t('S1'), public._t('M2'), public._t('r1')), 'E10: the remaining manager keeps authority';
  assert not exists (select 1 from public.sanskara_subject_managers where account_id = public._t('M1')), 'E10: the deleted manager holds nothing';

  -- The last manager: the dependent is deleted, never left without an owner (deletion over disclosure).
  perform public._t_grant(public._t('S2'), public._t('D'), public._t('L'), public._t('K1'), public._t('r2'));
  perform public._t_sub(public._t('r2'), public._t('D'));
  delete from auth.users where id = public._t('L');
  assert not exists (select 1 from public.sanskara_subjects where id = public._t('S2')), 'E10: the last manager is gone, so the dependent is deleted';
  assert not exists (select 1 from public.sanskara_records where subject_id = public._t('S2')), 'E10: its records are deleted';
  assert not exists (select 1 from public.sanskara_grants where subject_id = public._t('S2')), 'E10: its shares are deleted';
  assert not exists (select 1 from public.sanskara_subscriptions where record_id = public._t('r2')), 'E10: followers'' reminders for it are deleted';
end
$t$;

-- ── 10. Invariants that must hold after everything above ────────────────────────────────────────────────────────────
do $t$
begin
  assert not exists (select 1 from public.sanskara_subjects s where s.kind = 'dependent' and not exists (select 1 from public.sanskara_subject_managers m where m.subject_id = s.id)),
    'no dependent is left without a manager';
  assert not exists (select 1 from public.sanskara_records r where not exists (select 1 from public.sanskara_subjects s where s.id = r.subject_id)), 'no record without a subject';
  assert not exists (select 1 from public.sanskara_grants g where not exists (select 1 from public.sanskara_subjects s where s.id = g.subject_id)), 'no grant without a subject';
  assert not exists (select 1 from public.sanskara_grants g where g.revoked_at is null and (
      not exists (select 1 from public.kul_members km where km.kul_id = g.kul_id and km.user_id = g.grantee_id)
      or not exists (select 1 from public.kul_members km where km.kul_id = g.kul_id and km.user_id = g.granted_by))),
    'no live grant rests on a membership that has ended';
end
$t$;

rollback;
