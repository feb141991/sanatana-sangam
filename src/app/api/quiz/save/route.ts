import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { computeQuizStreak, getStreakMilestone } from '@/lib/quiz-streak';
import { localSpiritualDate } from '@/lib/sacred-time';

// ─── POST /api/quiz/save ──────────────────────────────────────────────────────
// Persists a daily quiz response. Increments karma_points on the profile.
// Karma: +10 for correct, +2 for wrong, plus milestone bonuses.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const body = await req.json();
    const { question, chosen_index, correct_index, is_correct, tradition, explanation, daily_quiz_id } = body;
    const { data: timezoneRow } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const todayStr = localSpiritualDate(timezoneRow?.timezone, 4);

    // a. Query past responses (last 92 days to compute streak efficiently)
    const ninetyTwoDaysAgo = new Date();
    ninetyTwoDaysAgo.setUTCDate(ninetyTwoDaysAgo.getUTCDate() - 92);
    const dateLimit = ninetyTwoDaysAgo.toISOString().split('T')[0];

    const { data: pastResponses } = await supabase
      .from('quiz_responses')
      .select('date')
      .eq('user_id', user.id)
      .gte('date', dateLimit)
      .order('date', { ascending: false });

    const dates = Array.from(new Set([
      todayStr,
      ...(pastResponses || []).map(r => r.date)
    ]));

    const currentStreak = computeQuizStreak(dates);

    // Check if response already exists to prevent point farming.
    if (pastResponses?.some(r => r.date === todayStr)) {
      return NextResponse.json({
        success: true,
        karma_earned: 0,
        streak: currentStreak,
        streak_milestone: null
      });
    }

    // b. Call computeQuizStreak
    const streak_milestone = getStreakMilestone(currentStreak);

    // Persist quiz response (upsert, so we insert or update)
    const { error: insertError } = await supabase
      .from('quiz_responses')
      .insert({
        user_id: user.id,
        question,
        chosen_index,
        correct_index,
        is_correct,
        tradition,
        explanation: explanation ?? null,
        date: todayStr,
        daily_quiz_id: daily_quiz_id || null,
        streak_at_answer: currentStreak,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: true,
          karma_earned: 0,
          streak: currentStreak,
          streak_milestone: null,
        });
      }
      throw insertError;
    }

    try {
      await supabase
        .from('daily_sadhana')
        .upsert(
          { user_id: user.id, date: todayStr, quiz_done: true },
          { onConflict: 'user_id,date' }
        );
    } catch {
      // Non-fatal: quiz save should still succeed.
    }

    // Compute karma
    let karmaGain = is_correct ? 10 : 2;
    let bonusKarma = 0;

    if (streak_milestone === 'three_days') bonusKarma = 5;
    else if (streak_milestone === 'week') bonusKarma = 15;
    else if (streak_milestone === 'month') bonusKarma = 50;
    else if (streak_milestone === 'century') bonusKarma = 200;

    const totalKarma = karmaGain + bonusKarma;

    try {
      await supabase.rpc('increment_karma', { p_user_id: user.id, p_amount: totalKarma });
      // Record in karma ledger — fire and forget, non-blocking
      supabase.from('karma_ledger').insert({
        user_id: user.id,
        amount: totalKarma,
        reason: 'quiz_complete',
        source_route: '/api/quiz/save',
      }).then(({ error }) => {
        if (error) console.warn('[quiz/save] ledger insert failed:', error.message);
      });
    } catch { /* safe */ }

    return NextResponse.json({
      success: true,
      karma_earned: totalKarma,
      streak: currentStreak,
      streak_milestone
    });
  } catch (err) {
    console.error('[quiz/save] Failed:', err);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
