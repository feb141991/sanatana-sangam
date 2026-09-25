import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveFestivalQuizSeriesForUser } from '@/lib/calendar/resolve-festival-quiz-series';

export const runtime = 'nodejs';

type SeasonRow = { definition_key: string; title: string; badge_slug: string };
type QuestionRow = {
  definition_key: string;
  day_sequence: number;
  question_en: string;
  question_hi: string | null;
  question_pa: string | null;
  options_en: string[];
  options_hi: string[] | null;
  options_pa: string[] | null;
  correct_option_idx: number;
  explanation_en: string | null;
  explanation_hi: string | null;
  explanation_pa: string | null;
  source: string | null;
};
type ProgressRow = {
  definition_key: string;
  year: number;
  day_sequence: number;
  is_correct: boolean;
  chosen_option_idx: number;
};

export async function GET(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (error || !user) return getApiAuthFailureResponse(error);

  const admin = createAdminClient();

  const { data: seasons } = await admin
    .from('festival_quiz_seasons')
    .select('definition_key, title, badge_slug')
    .eq('active', true);
  const seasonRows = (seasons ?? []) as SeasonRow[];
  if (seasonRows.length === 0) return NextResponse.json({ seasons: [] });

  const { data: profile } = await admin.from('profiles').select('app_language').eq('id', user.id).maybeSingle();
  const language = (profile as any)?.app_language === 'hi' || (profile as any)?.app_language === 'pa' ? (profile as any).app_language : 'en';

  const { today, allSeries } = await resolveFestivalQuizSeriesForUser(admin, user.id);

  const definitionKeys = seasonRows.map((s) => s.definition_key);
  const [{ data: questions }, { data: progress }] = await Promise.all([
    admin.from('festival_quiz_questions').select('*').in('definition_key', definitionKeys).eq('active', true),
    admin.from('user_festival_quiz_progress').select('definition_key, year, day_sequence, is_correct, chosen_option_idx').eq('user_id', user.id).in('definition_key', definitionKeys),
  ]);
  const questionRows = (questions ?? []) as QuestionRow[];
  const progressRows = (progress ?? []) as ProgressRow[];

  const responseSeasons = seasonRows.map((season) => {
    const series = allSeries.find((s) => s.definitionKey === season.definition_key) ?? null;
    const year = series?.startDate ? Number(series.startDate.slice(0, 4)) : new Date().getUTCFullYear();
    const seasonQuestions = new Map(
      questionRows.filter((q) => q.definition_key === season.definition_key).map((q) => [q.day_sequence, q])
    );
    const seasonProgress = new Map(
      progressRows.filter((p) => p.definition_key === season.definition_key && p.year === year).map((p) => [p.day_sequence, p])
    );

    const days = (series?.children ?? []).map((child) => {
      const q = seasonQuestions.get(child.sequence);
      const answered = seasonProgress.get(child.sequence) ?? null;
      const unlocked = Boolean(child.civilDate && child.civilDate <= today) && child.status !== 'under_review';
      return {
        daySequence: child.sequence,
        title: child.title,
        civilDate: child.civilDate,
        unlocked,
        answered: answered ? { isCorrect: answered.is_correct, chosenOptionIdx: answered.chosen_option_idx } : null,
        question: unlocked && q
          ? {
              text: language === 'hi' ? q.question_hi ?? q.question_en : language === 'pa' ? q.question_pa ?? q.question_en : q.question_en,
              options: (language === 'hi' ? q.options_hi : language === 'pa' ? q.options_pa : null) ?? q.options_en,
              explanation: (language === 'hi' ? q.explanation_hi : language === 'pa' ? q.explanation_pa : null) ?? q.explanation_en,
              source: q.source,
            }
          : null,
      };
    });

    // Days until the earliest *resolved* day (not necessarily sequence 1 --
    // a day with no matching observance_definitions row, per the current
    // Navratri sub-day gap, simply never appears in `days` since it's
    // derived from series.children, which only includes what the calendar
    // engine actually resolved). null when nothing has a real date yet, or
    // the earliest resolved day has already arrived (it's unlocked, not
    // upcoming).
    const firstResolved = days.find((d) => d.civilDate);
    const daysUntilStart = firstResolved?.civilDate && firstResolved.civilDate > today
      ? Math.round((new Date(`${firstResolved.civilDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86_400_000)
      : null;

    return {
      definitionKey: season.definition_key,
      title: season.title,
      status: series?.status ?? 'upcoming',
      currentDay: series?.currentDay ?? null,
      totalDays: series?.totalDays ?? days.length,
      daysUntilStart,
      year,
      days,
    };
  }).filter((s) => s.days.length > 0);

  return NextResponse.json({ seasons: responseSeasons });
}
