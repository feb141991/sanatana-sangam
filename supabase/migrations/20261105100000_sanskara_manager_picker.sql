-- Sanskara tracker G4 (contract E10): let the last manager of a child hand the child's timeline to another adult in the SAME Kul, instead of the
-- timeline being deleted when they leave. NOT applied to any database by this commit.
-- The hand-over itself is the existing sanskara_add_manager (the new manager must be a current member of the caller's Kul) followed by the
-- existing sanskara_remove_manager. What was missing is a way to SEE who the managers are and who can be added, and to know before deleting an
-- account which children would be deleted with it. This migration adds those two reads and nothing else.
--
--   sanskara_manager_picker(p_subject)         For a manager of the dependent: the current managers, and the Kul members who could be added
--                                              (same Kul as the caller in BOTH kul_members and profiles.kul_id, as sanskara_add_manager checks;
--                                              not deleting; with consent to religious data, since without it they would see nothing; not already
--                                              a manager; not the caller). Names are username and full name only: the same fields a Kul already
--                                              shows its own members, and the same shape sanskara_list_access returns.
--   sanskara_sole_manager_dependents()         The caller's dependents for which the caller is the ONLY manager (id and display name).
--
-- Both are read-only, STABLE, SECURITY DEFINER with an empty search_path, identify the caller from auth.uid() and answer not-found for anyone
-- who is not allowed (sanskara_can 'manage_managers'). Executable by authenticated only. ROC pre-flight: two NEW function names, no existing
-- function is changed (no PGRST203); no table, column, default or data is touched; no lock beyond a catalog lock; callers: only the new
-- /api/native/sanskara routes in this commit; older app builds never call them. Rollback: supabase/rollbacks/20261105100000_*.sql.

begin;
set local lock_timeout = '5s';

create function public.sanskara_manager_picker(p_subject uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(true);
  v_kul uuid;
begin
  if p_subject is null or not public.sanskara_can('manage_managers', p_subject, v_uid) then
    raise exception 'sanskara_not_found' using errcode = 'SK404';
  end if;

  select km.kul_id into v_kul
  from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
  where km.user_id = v_uid;

  return jsonb_build_object(
    'managers', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.account_id, 'username', mp.username, 'full_name', mp.full_name,
                                          'is_me', m.account_id = v_uid, 'added_at', m.added_at) order by m.added_at, m.account_id)
      from public.sanskara_subject_managers m left join public.profiles mp on mp.id = m.account_id
      where m.subject_id = p_subject), '[]'::jsonb),
    'candidates', case when v_kul is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'username', c.username, 'full_name', c.full_name) order by c.full_name nulls last, c.id)
      from (
        select p.id, p.username, p.full_name
        from public.kul_members km join public.profiles p on p.id = km.user_id and p.kul_id = km.kul_id
        where km.kul_id = v_kul and p.id <> v_uid and not p.is_deleting and p.consent_religious_data is true
          and not exists (select 1 from public.sanskara_subject_managers m where m.subject_id = p_subject and m.account_id = p.id)
        order by p.full_name nulls last, p.id
        limit 50) c), '[]'::jsonb) end,
    'limit', 4
  );
end;
$$;

create function public.sanskara_sole_manager_dependents() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := public.sanskara_actor(false);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'display_name', s.display_name) order by s.created_at, s.id)
    from public.sanskara_subject_managers m
    join public.sanskara_subjects s on s.id = m.subject_id and s.kind = 'dependent'
    where m.account_id = v_uid
      and (select count(*) from public.sanskara_subject_managers x where x.subject_id = m.subject_id) = 1
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.sanskara_manager_picker(uuid) from public, anon;
revoke all on function public.sanskara_sole_manager_dependents() from public, anon;
grant execute on function public.sanskara_manager_picker(uuid) to authenticated;
grant execute on function public.sanskara_sole_manager_dependents() to authenticated;

commit;
