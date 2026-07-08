import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { NATIVE_NITYA_STEP_ORDER, countCompletedNativeNityaSteps } from '@/lib/native-nitya-karma';

// P0-3 remediation, Slice 1 (see docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md).
//
// Previously this route trusted daily_sadhana.{japa_done,quiz_done,nitya_done,
// pathshala_done} directly. Those columns sit on a table with blanket
// GRANT ALL to authenticated/anon and ownership-only RLS (no column-level
// restriction), so any authenticated user could set all four to true with a
// single direct `.update()` and claim the bonus without doing any practice.
//
// Fix: re-derive each flag from its own source-of-truth table for today's
// spiritual date, instead of trusting the stored boolean. This does not
// require any GRANT/RLS change and does not touch any legitimate writer —
// see the remediation plan for why a REVOKE is deliberately not part of this
// slice (several legitimate call sites still write these columns directly
// and have not yet been migrated to a route; that is Slice 2+).
//
//   - japa:      a mala_sessions row exists today with rounds > 0. `rounds`
//                is computed server-side in buildMalaSessionInsert() from
//                floor(count / targetCount), not taken verbatim from the
//                caller — same trust level POST /api/japa/complete already
//                accepts, not a new gap.
//   - quiz:      a quiz_responses row exists for today (that insert only
//                ever happens via POST /api/quiz/save on both platforms).
//   - nitya:     ALL seven NATIVE_NITYA_STEP_ORDER steps are present in
//                nitya_karma_log for today — the same "all steps done"
//                definition /api/native/nitya-karma already uses as
//                canonical. Note: web's NityaKarmaClient.tsx currently
//                writes daily_sadhana.nitya_done after just the FIRST step
//                (a separate, already-documented correctness bug — see the
//                remediation plan's Slice 3), so this check is intentionally
//                stricter than the (buggy) stored flag for web users. That is
//                the correct behavior, not a regression: a "real" nitya
//                completion is all seven steps, matching FALLBACK_STEPS'
//                own "coreMorningDone" concept already used elsewhere in
//                NityaKarmaClient.tsx.
//   - pathshala: a guided_path_progress row's `updated_at` falls on today's
//                spiritual date. `last_interacted_at` was considered (see
//                remediation plan) but is NOT refreshed by the table's own
//                trigger (update_guided_path_progress_timestamp() only sets
//                updated_at) — verified by reading the trigger function
//                before relying on it, rather than assuming the plan's
//                original proposal was correct as written.
//   - dharmveer: still trusts daily_sadhana.dharmveer_done directly. No
//                independent source exists yet — native's own
//                POST /api/dharm-veer/submit call 404s (the route was never
//                built) and there is no per-swipe ledger table to check
//                against. Documented as an open question in the remediation
//                plan rather than silently left unaddressed; closing it
//                requires either a new table (blocked by this task's stop
//                rules without separate sign-off) or moving the write behind
//                a verified RPC (remediation plan Slice 2).
//
// Reward amounts (30 karma / 15 seva / 1 freeze) are unchanged — this task
// only changes what evidence is required to reach the award step, not how
// much is awarded.

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    // Always verify JWT server-side — getSession() returns unverified cached data.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeZone } = await req.json().catch(() => ({ timeZone: 'UTC' }));
    const spiritualDate = localSpiritualDate(timeZone);
    const userId = user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freeze_count, is_banned')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.is_banned) {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
    }

    // Fetch today's sadhana record — only for its id (needed for the atomic
    // claim below) and dharmveer_done (still trusted — see file header).
    // japa_done/quiz_done/nitya_done/pathshala_done are deliberately NOT
    // read from here anymore; they are re-derived below instead.
    const { data: sadhana, error } = await supabase
      .from('daily_sadhana')
      .select('id, dharmveer_done, perfect_day_bonus_given')
      .eq('user_id', userId)
      .eq('date', spiritualDate)
      .single();

    if (error || !sadhana) {
      return NextResponse.json({ awarded: false, reason: 'incomplete' });
    }

    // Check if bonus already given
    if (sadhana.perfect_day_bonus_given) {
      return NextResponse.json({ awarded: false, reason: 'already_given' });
    }

    // ── Re-derive completion evidence from source tables (see file header) ──
    const [malaResult, quizResult, nityaLogResult, pathshalaResult] = await Promise.all([
      supabase
        .from('mala_sessions')
        .select('user_id')
        .eq('user_id', userId)
        .eq('spiritual_date', spiritualDate)
        .gt('rounds', 0)
        .limit(1),
      supabase
        .from('quiz_responses')
        .select('user_id')
        .eq('user_id', userId)
        .eq('date', spiritualDate)
        .limit(1),
      supabase
        .from('nitya_karma_log')
        .select('step_id')
        .eq('user_id', userId)
        .eq('log_date', spiritualDate),
      supabase
        .from('guided_path_progress')
        .select('updated_at')
        .eq('user_id', userId),
    ]);

    const japaDone = (malaResult.data?.length ?? 0) > 0;
    const quizDone = (quizResult.data?.length ?? 0) > 0;

    const nityaDoneIds = new Set<string>(
      (nityaLogResult.data ?? [])
        .map((row: { step_id: string | null }) => row.step_id)
        .filter((id): id is string => Boolean(id))
    );
    const nityaDone = countCompletedNativeNityaSteps(nityaDoneIds) === NATIVE_NITYA_STEP_ORDER.length;

    const pathshalaDone = (pathshalaResult.data ?? []).some((row: { updated_at: string | null }) => {
      if (!row.updated_at) return false;
      return localSpiritualDate(timeZone, 4, new Date(row.updated_at)) === spiritualDate;
    });

    // dharmveer: still trusted directly — see file header for why.
    const dharmveerDone = Boolean(sadhana.dharmveer_done);

    const allDone = japaDone && quizDone && nityaDone && pathshalaDone && dharmveerDone;

    if (!allDone) {
      return NextResponse.json({ awarded: false, reason: 'incomplete' });
    }

    // Atomically claim the bonus: only succeeds if perfect_day_bonus_given is still false.
    // .select('id') returns the updated row — if the array is empty, a concurrent request
    // already set it to true and this request lost the race.
    const { data: claimedRows, error: updateError } = await supabase
      .from('daily_sadhana')
      .update({ perfect_day_bonus_given: true })
      .eq('id', sadhana.id)
      .eq('perfect_day_bonus_given', false)
      .select('id');

    if (updateError) {
      throw new Error(`Failed to update daily_sadhana: ${updateError.message}`);
    }

    // Another concurrent request won the race — bonus was already claimed.
    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json({ awarded: false, reason: 'already_given' });
    }

    // Call RPCs to award karma and seva
    const { error: karmaError } = await supabase.rpc('increment_karma', { p_user_id: userId, p_amount: 30 });
    if (karmaError) {
      console.error('Failed to award karma for perfect day:', karmaError);
      // We don't fail the request completely, but log it
    }

    const { error: sevaError } = await supabase.rpc('increment_period_seva', { p_user_id: userId, p_points: 15 });
    if (sevaError) {
      console.error('Failed to award seva for perfect day:', sevaError);
    } else {
      // PART C - fire-and-forget tier check
      fetch(new URL('/api/seva-tier/check', req.url).toString(), { 
        method: 'POST', 
        headers: { Cookie: req.headers.get('cookie') ?? '' } 
      }).catch((e: unknown) => {
        console.warn('[sadhana/perfect-day] seva-tier check failed:', (e as Error)?.message);
      });
    }

    let freezeAwarded = false;
    let freezesRemaining = profile?.streak_freeze_count ?? 0;
    if ((profile?.streak_freeze_count ?? 0) < 3) {
      const { data: freezeCount, error: freezeError } = await supabase.rpc('increment_streak_freeze', {
        p_user_id: userId,
        p_amount: 1,
      });
      if (freezeError) {
        console.error('Failed to award streak freeze for perfect day:', freezeError);
      } else if (typeof freezeCount === 'number') {
        freezeAwarded = freezeCount > (profile?.streak_freeze_count ?? 0);
        freezesRemaining = freezeCount;
      }
    }

    return NextResponse.json({ awarded: true, karma: 30, seva: 15, freezeAwarded, freezesRemaining });

  } catch (error) {
    console.error('Error in /api/sadhana/perfect-day:', error);
    return NextResponse.json({ awarded: false, reason: 'server_error' }, { status: 500 });
  }
}
