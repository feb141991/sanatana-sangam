-- Restores the preceding get_japa_context() JSON shape.
create or replace function public.get_japa_context()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_tradition text;
  v_active_symbol_id text;
  v_today date;
  v_japa_done boolean := false;
  v_streak integer := 0;
  v_total_beads bigint := 0;
  v_total_rounds bigint := 0;
  v_last_practiced timestamptz;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select
    case when exists (select 1 from pg_timezone_names where name = p.timezone)
      then p.timezone else 'UTC' end,
    coalesce(p.tradition, 'hindu'),
    p.active_symbol_id
  into v_timezone, v_tradition, v_active_symbol_id
  from public.profiles p
  where p.id = v_user_id;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_today := ((now() at time zone v_timezone) - interval '4 hours')::date;

  select coalesce(ds.japa_done, false), coalesce(ds.streak_count, 0)
  into v_japa_done, v_streak
  from public.daily_sadhana ds
  where ds.user_id = v_user_id and ds.date = v_today;

  select
    coalesce(sum(ms.count), 0),
    coalesce(sum(greatest(coalesce(ms.rounds, 0), floor(ms.count / nullif(coalesce(ms.target_count, 108), 0)))), 0),
    max(ms.completed_at)
  into v_total_beads, v_total_rounds, v_last_practiced
  from public.mala_sessions ms
  where ms.user_id = v_user_id;

  return jsonb_build_object(
    'tradition', v_tradition,
    'timezone', v_timezone,
    'activeSymbolId', v_active_symbol_id,
    'spiritualDate', v_today,
    'japaDone', coalesce(v_japa_done, false),
    'streak', coalesce(v_streak, 0),
    'lifetime', jsonb_build_object(
      'totalBeads', coalesce(v_total_beads, 0),
      'totalRounds', coalesce(v_total_rounds, 0),
      'lastPracticed', v_last_practiced
    )
  );
end;
$$;
