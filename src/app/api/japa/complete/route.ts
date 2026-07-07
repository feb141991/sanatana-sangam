import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { localSpiritualDate } from '@/lib/sacred-time';
import { buildMalaSessionInsert } from '@/lib/mala-sessions';
import { getJapaPracticeType } from '@/lib/tradition-config';

// POST /api/japa/complete
//
// This route did not previously exist. Native's app/(tabs)/bhakti.tsx already
// called `POST /api/japa/complete` and silently fell through to a direct,
// native-only `mala_sessions` insert whenever that call 404'd — which was
// always, since the route was never built. That direct insert bypassed
// `daily_sadhana` (streak), `profiles.karma_points` (karma), and therefore
// left Home's Japa card, streak, and karma total all stale until some other
// action happened to update them.
//
// This route is a faithful server-side port of the one proven, real
// completion sequence in the app — src/app/(main)/japa/JapaClient.tsx's
// `saveSession()` (lines ~2615-2773), which is what actually runs on web.
// Mutations ported: mala_sessions insert (with the same schema-drift
// fallback), daily_sadhana upsert (japa_done + streak_count, same
// carried-streak formula), and streak-freeze award at 7-day milestones.
//
// Deliberately NOT ported: seva_score/weekly_seva/monthly_seva
// (increment_period_seva) and the /api/seva-tier/check tier-promotion side
// effect. Neither is in this task's explicit scope (mala session,
// daily_sadhana, karma, streak, Home state), and Home's native contract
// (`/api/native/home-summary`) does not read seva fields for the Japa card —
// only `daily_sadhana.japa_done`, `daily_sadhana.streak_count`, and
// `profiles.karma_points`. Adding seva/tier here would be undocumented scope
// creep with its own side effects (a push notification on tier promotion).
//
// Karma write — IMPORTANT DEVIATION from JapaClient.tsx, not an oversight:
// JapaClient.tsx calls `supabase.rpc('increment_karma', ...)` and only
// falls back to a direct `profiles.karma_points` update if that RPC errors.
// Reading the actual SQL (supabase/public_schema.sql, confirmed again by the
// newer supabase/migrations/20260602040000_award_karma_atomic.sql) shows
// `increment_karma` (and its newer replacement `award_karma`) both write to
// `profiles.seva_score`, NOT `karma_points`. Every karma display surface in
// this codebase (native's own home-summary.karmaPoints, web's /home,
// /progress, /quiz, /kul, /my-progress, /sadhana/challenge) reads
// `profiles.karma_points`. So on the RPC's happy path — which is the normal
// path, not an edge case — karma awarded via that RPC silently lands in a
// column nothing displays; only the rarely-hit fallback branch touches the
// column that's actually shown. This looks like a pre-existing, cross-route
// bug (src/app/api/quiz/save/route.ts and src/app/api/sankalpa/complete/route.ts
// have the identical RPC-first/karma_points-fallback pattern). Fixing that
// broadly is out of scope here (would mean editing JapaClient.tsx / quiz /
// sankalpa, none of which this task's scope covers). For THIS new route,
// the correct, evidence-backed choice is to write `karma_points` directly —
// otherwise native's karma award would reproduce the same silent-miss bug
// and violate this task's explicit requirement that completion update karma
// and Home state consistently.
//
// Auth via getApiUser (cookie first, Bearer-token fallback for native) — the
// same pattern already proven for /api/native/home-summary and
// /api/native/nitya-karma. All reads/writes are RLS-scoped through that
// resolved client; no service role is used. mala_sessions, daily_sadhana,
// and profiles all have "own row" RLS policies for the authenticated user
// (confirmed via supabase/step2_constraints_policies.sql), so a plain
// bearer-authenticated client can perform every write this route makes.

export const runtime = 'nodejs';

type JapaCompleteBody = {
  mantra?: unknown;
  count?: unknown;
  rounds?: unknown;
  tradition?: unknown;
  activeSymbolId?: unknown;
};

type ProfileRow = {
  timezone: string | null;
  karma_points: number | null;
  streak_freeze_count: number | null;
  last_freeze_used: string | null;
};

type SadhanaStreakRow = {
  streak_count: number | null;
  japa_done: boolean | null;
};

type PriorStreakRow = {
  date: string;
  streak_count: number | null;
};

// Ported verbatim from JapaClient.tsx's local getSpiritualTimeWindow(), but
// evaluated in the user's profile timezone rather than `Date.getHours()' —
// on a server there is no "device local time" to read, so this is the
// server-correct equivalent of the same rule, not a new rule.
function getSpiritualTimeWindow(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone,
  }).format(date);
  let hour = Number(parts);
  if (hour === 24) hour = 0;

  if (hour >= 3 && hour < 6) return 'brahma_muhurta';
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'midday';
  if (hour >= 16 && hour < 20) return 'sandhya';
  return 'night';
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as JapaCompleteBody | null;
    const mantra = typeof body?.mantra === 'string' ? body.mantra.trim() : '';
    const count = typeof body?.count === 'number' && Number.isFinite(body.count) ? Math.max(0, Math.floor(body.count)) : NaN;
    const rounds = typeof body?.rounds === 'number' && Number.isFinite(body.rounds) ? Math.max(0, Math.floor(body.rounds)) : NaN;
    const tradition = typeof body?.tradition === 'string' ? body.tradition : null;
    const activeSymbolId = typeof body?.activeSymbolId === 'string' ? body.activeSymbolId : null;

    if (!mantra || Number.isNaN(count) || Number.isNaN(rounds)) {
      return NextResponse.json({ error: 'mantra, count, and rounds are required' }, { status: 400 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('timezone, karma_points, streak_freeze_count, last_freeze_used')
      .eq('id', user.id)
      .maybeSingle();
    const profile = profileData as ProfileRow | null;

    const timezone = profile?.timezone ?? 'UTC';
    const today = localSpiritualDate(timezone, 4);
    const completedAt = new Date().toISOString();

    // ── 1. mala_sessions insert (schema-drift-tolerant, same fallback as
    // JapaClient.tsx: retry with only the original/canonical columns if the
    // full insert errors on a column that doesn't exist on this deployment) ──
    const malaSessionRow = buildMalaSessionInsert({
      userId: user.id,
      mantra,
      count,
      targetCount: 108,
      durationSeconds: 0,
      completedAt,
      date: today,
      malaId: activeSymbolId,
      tradition,
      practiceType: getJapaPracticeType(tradition),
      intention: 'daily_practice',
      completionType: rounds > 0 ? 'target_completed' : 'ended_manually',
      targetRounds: rounds > 0 ? rounds : null,
      completedRounds: rounds,
      completedBeads: count,
      spiritualTimeWindow: getSpiritualTimeWindow(new Date(), timezone),
      spiritualDate: today,
      timezone,
      hapticsEnabled: true,
      sourceRoute: '/bhakti',
    });

    const primaryInsert = await supabase.from('mala_sessions').insert(malaSessionRow);
    if (primaryInsert.error) {
      const {
        date: _date,
        rounds: _rounds,
        bead_count: _beadCount,
        mantra_id: _mantraId,
        duration_secs: _durationSecs,
        mala_id: _malaId,
        background_scene: _backgroundScene,
        tradition: _tradition,
        practice_type: _practiceType,
        intention: _intention,
        completion_type: _completionType,
        target_rounds: _targetRounds,
        completed_rounds: _completedRounds,
        completed_beads: _completedBeads,
        ambient_id: _ambientId,
        mood_before: _moodBefore,
        mood_after: _moodAfter,
        spiritual_time_window: _spiritualTimeWindow,
        spiritual_date: _spiritualDate,
        timezone: _timezone,
        haptics_enabled: _hapticsEnabled,
        source_route: _sourceRoute,
        panchang_context: _panchangContext,
        ...canonicalRow
      } = malaSessionRow;
      const fallbackInsert = await supabase.from('mala_sessions').insert(canonicalRow);
      if (fallbackInsert.error) {
        return NextResponse.json({ error: fallbackInsert.error.message }, { status: 500 });
      }
    }

    // ── 2. daily_sadhana streak (same carried-streak formula as JapaClient.tsx) ──
    const yesterdayObj = new Date(`${today}T12:00:00Z`);
    yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
    const yesterday = yesterdayObj.toISOString().slice(0, 10);

    const [todayResult, yesterdayResult, priorResult] = await Promise.all([
      supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('daily_sadhana').select('streak_count, japa_done').eq('user_id', user.id).eq('date', yesterday).maybeSingle(),
      supabase.from('daily_sadhana').select('date, streak_count').eq('user_id', user.id).lt('date', today).not('streak_count', 'is', null).order('date', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const todayRow = todayResult.data as SadhanaStreakRow | null;
    const yesterdayRow = yesterdayResult.data as SadhanaStreakRow | null;
    const latestPriorRow = priorResult.data as PriorStreakRow | null;

    const freezeBridgesYesterday = profile?.last_freeze_used === today && !yesterdayRow?.japa_done;
    const carriedStreak = yesterdayRow?.japa_done
      ? (yesterdayRow.streak_count ?? 0)
      : (freezeBridgesYesterday ? (yesterdayRow?.streak_count ?? latestPriorRow?.streak_count ?? 0) : 0);
    const newStreak = todayRow?.streak_count
      ? todayRow.streak_count
      : (carriedStreak > 0 ? carriedStreak + 1 : 1);

    const { error: sadhanaError } = await supabase.from('daily_sadhana').upsert({
      user_id: user.id,
      date: today,
      japa_done: true,
      streak_count: newStreak,
    }, { onConflict: 'user_id,date' });
    if (sadhanaError) {
      return NextResponse.json({ error: sadhanaError.message }, { status: 500 });
    }

    // ── 3. Streak-freeze award at 7-day milestones (increment_streak_freeze
    // only ever touches profiles.streak_freeze_count — confirmed via schema,
    // no RPC/column mismatch here, unlike the karma RPC above) ──
    if (!todayRow?.streak_count && newStreak > 0 && newStreak % 7 === 0 && (profile?.streak_freeze_count ?? 0) < 3) {
      await supabase.rpc('increment_streak_freeze', { p_user_id: user.id, p_amount: 1 });
    }

    // ── 4. Karma — direct profiles.karma_points write. See file header for
    // why this does not call the increment_karma/award_karma RPCs. ──
    let karmaPoints = profile?.karma_points ?? 0;
    if (rounds > 0) {
      const karmaGain = rounds * 5;
      karmaPoints = karmaPoints + karmaGain;
      const { error: karmaError } = await supabase
        .from('profiles')
        .update({ karma_points: karmaPoints })
        .eq('id', user.id);
      if (karmaError) {
        // Non-fatal — the session and streak are already saved; report but
        // don't fail the whole completion over a karma-write error.
        console.error('[api/japa/complete] karma_points update failed', karmaError.message);
      }
    }

    return NextResponse.json({ success: true, streak: newStreak, karmaPoints });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    console.error('[api/japa/complete POST]', message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
