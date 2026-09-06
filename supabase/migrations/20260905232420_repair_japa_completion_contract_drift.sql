-- Forward repair: restore complete_japa_session() and get_japa_context() to
-- the contract committed in 20260831060651_atomic_idempotent_japa_completion.sql.
--
-- INCIDENT
-- --------
-- Live pg_get_functiondef showed both functions had diverged from the
-- committed migration. No migration after 20260831060651 touches either
-- function name (grepped supabase/migrations/ and cross-checked against
-- list_migrations against this live project) -- the live versions were
-- replaced outside the tracked migration mechanism. Attribution to a
-- specific change/author is not established and is not claimed here.
--
-- complete_japa_session() drift, confirmed against live schema:
--   - Referenced daily_sadhana.updated_at, a column that does not exist
--     (confirmed via information_schema.columns) -- every completion that
--     reached that statement raised and rolled back the ENTIRE call,
--     including the mala_sessions insert already performed in the same
--     transaction. This made every genuinely new completion fail; only an
--     idempotent-replay of an already-recorded id (short-circuits before
--     that statement) could ever succeed.
--   - Idempotency lookup was `client_completion_id` alone, no `user_id`
--     filter (the committed contract, and the unique index itself, are both
--     user-scoped: mala_sessions_user_completion_uidx on
--     (user_id, client_completion_id)).
--   - No `for update` profile row lock (the concurrency guard the committed
--     migration relies on to make duplicate concurrent calls resolve to one
--     insert deterministically).
--   - No input bounds validation, no profile-existence guard.
--   - No karma/ledger award at all.
--   - Returned {session_id, already_processed, spiritual_date} instead of
--     the full get_japa_context() shape merged with
--     {success, idempotentReplay, sessionId, karmaPoints, karmaAwarded}.
--
-- get_japa_context() drift: returned a flat snake_case shape
-- (active_symbol_id, today, japa_done, total_beads, total_rounds,
-- last_practiced) instead of the committed camelCase/nested shape
-- (activeSymbolId, spiritualDate, japaDone, lifetime: {totalBeads,
-- totalRounds, lastPracticed}).
--
-- WHY THIS IS THE CORRECT TARGET, NOT A GUESS
-- --------------------------------------------
-- Checked the actual consumers, not just the two Postgres functions:
--   - src/app/api/japa/complete/route.ts and .../context/route.ts are both
--     pure `NextResponse.json(data)` pass-throughs -- whatever shape the
--     Postgres function returns is exactly what the client receives.
--   - shoonaya-mobile/lib/japaContextCache.ts's normalizeJapaContext()
--     requires row.spiritualDate, row.japaDone, row.activeSymbolId, and a
--     nested lifetime.{totalBeads,totalRounds} -- the committed shape,
--     verbatim. It silently returns null (not a crash) on the live
--     snake-case shape, meaning get_japa_context() has ALSO been silently
--     unusable to the installed client, independent of the completion bug.
--   - shoonaya-mobile/lib/japaCompleteRetry.ts's own doc comment names this
--     exact migration file and describes the for-update-lock idempotency
--     behavior it relies on.
-- The native client was built against, and still expects, the committed
-- contract. Restoring the live functions to it is a genuine repair, not a
-- backward-incompatible guess.
--
-- VERIFIED COMPATIBLE WITH LIVE SCHEMA BEFORE WRITING THIS MIGRATION
-- -------------------------------------------------------------------
-- Every column/table the committed function bodies reference was checked
-- against live information_schema.columns: mala_sessions (all 24 columns
-- incl. client_completion_id, target_count, duration_secs, bead_count,
-- mantra_id, mala_id, intention, completion_type, target_rounds,
-- completed_rounds, completed_beads, spiritual_time_window, spiritual_date,
-- timezone, haptics_enabled, source_route), daily_sadhana (user_id, date,
-- japa_done, streak_count -- no updated_at reference in the committed body
-- at all), profiles (timezone, tradition, active_symbol_id,
-- last_freeze_used, streak_freeze_count, karma_points), karma_ledger
-- (user_id, amount, reason, source_route, metadata, earned_date). The
-- mala_sessions_user_completion_uidx unique index the committed contract
-- depends on for idempotency is confirmed present and untouched.
--
-- LIVE BEHAVIORAL VERIFICATION (this session, before/after this migration)
-- --------------------------------------------------------------------------
-- Applied to production, then verified via auth.uid()-spoofed transactions
-- against two real test accounts with zero pre-existing session history
-- (all test rows deleted afterward, profiles restored to their exact
-- pre-test karma_points/daily_sadhana state):
--   - A new completion with p_rounds=0 (avoiding the karma branch) now
--     succeeds and returns the full committed shape.
--   - Replaying the same client_completion_id for the SAME user returns
--     idempotentReplay=true with the SAME sessionId; exactly one
--     mala_sessions row exists for that id.
--   - The SAME client_completion_id from a DIFFERENT user creates a
--     genuinely separate session (idempotentReplay=false, a new sessionId)
--     -- proving the missing user_id scoping on the idempotency lookup is
--     actually fixed, not just theoretically fixed.
--   - An out-of-bounds p_count (99999) raises 22023 and rolls back with
--     zero rows written.
--
-- ROLLBACK
-- --------
-- To roll back, re-apply this same migration's function bodies again (they
-- are idempotent CREATE OR REPLACE) or restore whatever function bodies
-- were live immediately before this migration -- captured in this
-- incident's audit trail (pg_get_functiondef output), not repeated here.

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

create or replace function public.complete_japa_session(
  p_client_completion_id uuid,
  p_mantra text,
  p_count integer,
  p_rounds integer,
  p_duration_seconds integer,
  p_tradition text default null,
  p_practice_type text default null,
  p_active_symbol_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_today date;
  v_yesterday date;
  v_existing_session_id uuid;
  v_session_id uuid;
  v_today_row public.daily_sadhana%rowtype;
  v_yesterday_row public.daily_sadhana%rowtype;
  v_latest_streak integer := 0;
  v_carried_streak integer := 0;
  v_new_streak integer := 1;
  v_last_freeze_used date;
  v_streak_freeze_count integer := 0;
  v_karma_gain integer := 0;
  v_karma_points integer := 0;
  v_context jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_client_completion_id is null then
    raise exception 'client_completion_id is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_mantra), '') is null then
    raise exception 'mantra is required' using errcode = '22023';
  end if;
  if p_count < 0 or p_count > 11664 or p_rounds < 0 or p_rounds > 108
     or p_duration_seconds < 0 or p_duration_seconds > 86400 then
    raise exception 'Invalid completion values' using errcode = '22023';
  end if;

  select
    case when exists (select 1 from pg_timezone_names where name = p.timezone)
      then p.timezone else 'UTC' end,
    p.last_freeze_used,
    coalesce(p.streak_freeze_count, 0),
    coalesce(p.karma_points, 0)
  into v_timezone, v_last_freeze_used, v_streak_freeze_count, v_karma_points
  from public.profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select id into v_existing_session_id
  from public.mala_sessions
  where user_id = v_user_id and client_completion_id = p_client_completion_id;

  if v_existing_session_id is not null then
    v_context := public.get_japa_context();
    return v_context || jsonb_build_object(
      'success', true,
      'idempotentReplay', true,
      'sessionId', v_existing_session_id,
      'karmaPoints', v_karma_points,
      'karmaAwarded', 0
    );
  end if;

  v_today := ((now() at time zone v_timezone) - interval '4 hours')::date;
  v_yesterday := v_today - 1;

  insert into public.mala_sessions (
    user_id, client_completion_id, mantra, count, target_count,
    duration_seconds, duration_secs, completed_at, date, rounds, bead_count,
    mantra_id, mala_id, tradition, practice_type, intention, completion_type,
    target_rounds, completed_rounds, completed_beads, spiritual_time_window,
    spiritual_date, timezone, haptics_enabled, source_route
  ) values (
    v_user_id, p_client_completion_id, btrim(p_mantra), p_count, 108,
    p_duration_seconds, p_duration_seconds, now(), v_today::text, p_rounds, p_count,
    btrim(p_mantra), p_active_symbol_id, p_tradition,
    coalesce(p_practice_type, 'mala'), 'daily_practice',
    case when p_rounds > 0 then 'target_completed' else 'ended_manually' end,
    nullif(p_rounds, 0), p_rounds, p_count,
    case
      when extract(hour from now() at time zone v_timezone) between 3 and 5 then 'brahma_muhurta'
      when extract(hour from now() at time zone v_timezone) between 6 and 10 then 'morning'
      when extract(hour from now() at time zone v_timezone) between 11 and 15 then 'midday'
      when extract(hour from now() at time zone v_timezone) between 16 and 19 then 'sandhya'
      else 'night'
    end,
    v_today, v_timezone, true, '/japa'
  ) returning id into v_session_id;

  select * into v_today_row from public.daily_sadhana
  where user_id = v_user_id and date = v_today;
  select * into v_yesterday_row from public.daily_sadhana
  where user_id = v_user_id and date = v_yesterday;
  select coalesce(streak_count, 0) into v_latest_streak
  from public.daily_sadhana
  where user_id = v_user_id and date < v_today and streak_count is not null
  order by date desc limit 1;

  if coalesce(v_yesterday_row.japa_done, false) then
    v_carried_streak := coalesce(v_yesterday_row.streak_count, 0);
  elsif v_last_freeze_used = v_today then
    v_carried_streak := greatest(coalesce(v_yesterday_row.streak_count, 0), coalesce(v_latest_streak, 0));
  end if;

  v_new_streak := case
    when coalesce(v_today_row.japa_done, false) then coalesce(v_today_row.streak_count, 1)
    when v_carried_streak > 0 then v_carried_streak + 1
    else 1
  end;

  insert into public.daily_sadhana (user_id, date, japa_done, streak_count)
  values (v_user_id, v_today, true, v_new_streak)
  on conflict (user_id, date) do update
    set japa_done = true, streak_count = excluded.streak_count;

  if not coalesce(v_today_row.japa_done, false)
     and v_new_streak % 7 = 0 and v_streak_freeze_count < 3 then
    update public.profiles
    set streak_freeze_count = least(3, coalesce(streak_freeze_count, 0) + 1)
    where id = v_user_id;
  end if;

  if p_rounds > 0 then
    v_karma_gain := least(p_rounds * 5, 540);
    update public.profiles
    set karma_points = coalesce(karma_points, 0) + v_karma_gain
    where id = v_user_id
    returning karma_points into v_karma_points;

    insert into public.karma_ledger
      (user_id, amount, reason, source_route, metadata, earned_date)
    values
      (v_user_id, v_karma_gain, 'japa_completion', '/api/japa/complete',
       jsonb_build_object('clientCompletionId', p_client_completion_id, 'sessionId', v_session_id), v_today);
  end if;

  v_context := public.get_japa_context();
  return v_context || jsonb_build_object(
    'success', true,
    'idempotentReplay', false,
    'sessionId', v_session_id,
    'karmaPoints', v_karma_points,
    'karmaAwarded', v_karma_gain
  );
end;
$$;

revoke all on function public.get_japa_context() from public, anon;
revoke all on function public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text) from public, anon;
grant execute on function public.get_japa_context() to authenticated, service_role;
grant execute on function public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text) to authenticated, service_role;
