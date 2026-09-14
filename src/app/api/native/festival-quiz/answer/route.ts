import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { rejectLargeRequest, rateLimitByIp } from '@/lib/api-security';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveFestivalQuizSeriesForUser } from '@/lib/calendar/resolve-festival-quiz-series';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 2_048)
    ?? rateLimitByIp(request, { keyPrefix: 'festival-quiz-answer', limit: 60, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;

  const { user, error } = await getApiUser(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const banned = await assertNotBanned(admin, user.id);
  if (banned) return banned;

  const body = await request.json().catch(() => null);
  const definitionKey = typeof body?.definitionKey === 'string' ? body.definitionKey : null;
  const daySequence = typeof body?.daySequence === 'number' ? body.daySequence : null;
  const chosenOptionIdx = typeof body?.chosenOptionIdx === 'number' ? body.chosenOptionIdx : null;
  if (!definitionKey || daySequence === null || chosenOptionIdx === null || chosenOptionIdx < 0 || chosenOptionIdx > 3) {
    return NextResponse.json({ error: 'definitionKey, daySequence, chosenOptionIdx (0-3) are required.' }, { status: 400 });
  }

  const { data: seasonRow } = await admin
    .from('festival_quiz_seasons')
    .select('definition_key, badge_slug')
    .eq('definition_key', definitionKey)
    .eq('active', true)
    .maybeSingle();
  const season = seasonRow as { definition_key: string; badge_slug: string } | null;
  if (!season) return NextResponse.json({ error: 'Season not found.' }, { status: 404 });

  // Re-resolve the user's own series server-side -- never trust the
  // client's claimed unlock state. Same helper the GET route uses, so the
  // unlock rule (child.civilDate <= today, not under_review) can never
  // drift between "what the client was shown" and "what's actually valid".
  const { today, allSeries } = await resolveFestivalQuizSeriesForUser(admin, user.id);
  const series = allSeries.find((s) => s.definitionKey === definitionKey) ?? null;
  const child = series?.children.find((c) => c.sequence === daySequence) ?? null;
  const unlocked = Boolean(child?.civilDate && child.civilDate <= today) && child?.status !== 'under_review';
  if (!child || !unlocked) {
    return NextResponse.json({ error: 'This day is not yet unlocked.' }, { status: 403 });
  }
  const year = series?.startDate ? Number(series.startDate.slice(0, 4)) : new Date().getUTCFullYear();

  const { data: question } = await admin
    .from('festival_quiz_questions')
    .select('correct_option_idx, explanation_en')
    .eq('definition_key', definitionKey)
    .eq('day_sequence', daySequence)
    .eq('active', true)
    .maybeSingle();
  if (!question) return NextResponse.json({ error: 'Question not available for this day.' }, { status: 404 });

  // Idempotent: a retry or double-tap on an already-answered day returns
  // the existing result instead of erroring or double-awarding, matching
  // /api/quiz/save's already-answered handling.
  const { data: existing } = await admin
    .from('user_festival_quiz_progress')
    .select('is_correct, chosen_option_idx')
    .eq('user_id', user.id)
    .eq('definition_key', definitionKey)
    .eq('year', year)
    .eq('day_sequence', daySequence)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      success: true,
      alreadyAnswered: true,
      isCorrect: (existing as any).is_correct,
      correctOptionIdx: (question as any).correct_option_idx,
      explanation: (question as any).explanation_en,
      karmaEarned: 0,
      badgeAwarded: false,
    });
  }

  const isCorrect = chosenOptionIdx === (question as any).correct_option_idx;

  const { error: insertError } = await admin.from('user_festival_quiz_progress').insert({
    user_id: user.id,
    definition_key: definitionKey,
    year,
    day_sequence: daySequence,
    chosen_option_idx: chosenOptionIdx,
    is_correct: isCorrect,
  } as never);
  if (insertError) {
    // Concurrent double-submit racing this same insert -- treat like the
    // already-answered branch above rather than surfacing a false failure.
    if ((insertError as any).code === '23505') {
      return NextResponse.json({
        success: true,
        alreadyAnswered: true,
        isCorrect,
        correctOptionIdx: (question as any).correct_option_idx,
        explanation: (question as any).explanation_en,
        karmaEarned: 0,
        badgeAwarded: false,
      });
    }
    return NextResponse.json({ error: 'Could not save answer.' }, { status: 500 });
  }

  let karmaEarned = 0;
  if (isCorrect) {
    const today8601 = new Date().toISOString().slice(0, 10);
    const { data: awarded, error: karmaError } = await admin.rpc('award_karma' as never, {
      p_user_id: user.id,
      p_reason: `festival_quiz_${definitionKey}_day_${daySequence}`,
      p_amount: 10,
      p_date: today8601,
      p_daily_cap: 500,
      p_source_route: '/api/native/festival-quiz/answer',
    } as never);
    if (karmaError) console.error('[festival-quiz/answer] karma award error:', karmaError.message);
    else karmaEarned = (awarded as unknown as number) ?? 0;
  }

  // Completion check: every day of this (definition_key, year) answered.
  let badgeAwarded = false;
  const totalDays = series?.totalDays ?? series?.children.length ?? 0;
  if (totalDays > 0) {
    const { count } = await admin
      .from('user_festival_quiz_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('definition_key', definitionKey)
      .eq('year', year);
    if ((count ?? 0) >= totalDays) {
      const { data: badgeResult, error: badgeError } = await admin.rpc('award_badge_if_earned' as never, {
        p_user_id: user.id,
        p_badge_slug: season.badge_slug,
        p_context: JSON.stringify({ definition_key: definitionKey, year }),
      } as never);
      if (badgeError) console.error('[festival-quiz/answer] badge award error:', badgeError.message);
      else badgeAwarded = Boolean(badgeResult);
    }
  }

  return NextResponse.json({
    success: true,
    alreadyAnswered: false,
    isCorrect,
    correctOptionIdx: (question as any).correct_option_idx,
    explanation: (question as any).explanation_en,
    karmaEarned,
    badgeAwarded,
  });
}
