import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { countCompletedNativeNityaSteps } from '@/lib/native-nitya-karma';
import { localSpiritualDate } from '@/lib/sacred-time';
import { SACRED_RELICS } from '@/lib/relics';
import { PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import { NATIVE_NITYA_STEP_ORDER } from '@/lib/native-nitya-karma';

export const runtime = 'nodejs';

type ProfileRow = {
  id: string;
  full_name: string | null;
  tradition: string | null;
  sampradaya: string | null;
  ishta_devata: string | null;
  city: string | null;
  app_language: string | null;
  active_symbol_id: string | null;
  seva_score: number | null;
  wants_festival_reminders: boolean | null;
  wants_shloka_reminders: boolean | null;
  wants_nitya_reminders: boolean | null;
  wants_community_notifications: boolean | null;
  wants_family_notifications: boolean | null;
  shloka_streak: number | null;
  is_pro: boolean | null;
  subscription_status: string | null;
  timezone: string | null;
};

type DailySadhanaRow = {
  date: string;
  streak_count: number | null;
  japa_done: boolean | null;
  quiz_done: boolean | null;
  nitya_done: boolean | null;
  pathshala_done: boolean | null;
  dharmveer_done: boolean | null;
};

type GuidedPathProgressRow = {
  path_id: string;
  status: string | null;
  updated_at: string | null;
  current_lesson: number | null;
  completed_lessons: number[] | null;
};

function withTimeout<T>(promise: PromiseLike<{ data: T | null }>, timeoutMs: number): Promise<{ data: T | null }> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), timeoutMs)),
  ]);
}

function isPresentString(value: string | null): value is string {
  return Boolean(value);
}

const COMPLETION_FIELDS: { key: keyof ProfileRow; label: string }[] = [
  { key: 'full_name', label: 'Name' },
  { key: 'tradition', label: 'Tradition' },
  { key: 'city', label: 'Location' },
  { key: 'app_language', label: 'Language Preference' },
  { key: 'wants_community_notifications', label: 'Notification Preference' },
];

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);

  if (error || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DB_TIMEOUT = 4_000;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name, tradition, sampradaya, ishta_devata, city, app_language, active_symbol_id, seva_score, wants_festival_reminders, wants_shloka_reminders, wants_nitya_reminders, wants_community_notifications, wants_family_notifications, shloka_streak, is_pro, subscription_status, timezone')
    .eq('id', user.id)
    .maybeSingle();

  const profile = profileData as ProfileRow | null;
  const timezone = profile?.timezone ?? 'Asia/Kolkata';
  const today = localSpiritualDate(timezone, 4);

  const [
    guidedResult,
    sadhanaResult,
    nityaResult,
    nityaStreakResult,
    malaResult,
  ] = await Promise.all([
    withTimeout<GuidedPathProgressRow[]>(
      supabase
        .from('guided_path_progress')
        .select('path_id, status, updated_at, current_lesson, completed_lessons')
        .eq('user_id', user.id),
      DB_TIMEOUT,
    ),
    withTimeout<DailySadhanaRow[]>(
      supabase
        .from('daily_sadhana')
        .select('date, streak_count, japa_done, quiz_done, nitya_done, pathshala_done, dharmveer_done')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30),
      DB_TIMEOUT,
    ),
    withTimeout<Array<{ log_date: string; step_id: string | null }>>(
      supabase
        .from('nitya_karma_log')
        .select('log_date, step_id')
        .eq('user_id', user.id)
        .eq('log_date', today),
      DB_TIMEOUT,
    ),
    withTimeout<{ current_streak: number | null, longest_streak: number | null }>(
      supabase
        .from('nitya_karma_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', user.id)
        .maybeSingle(),
      DB_TIMEOUT,
    ),
    withTimeout<Array<{ id: string }>>(
      supabase
        .from('mala_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00Z`)
        .lte('completed_at', `${today}T23:59:59Z`)
        .limit(1),
      DB_TIMEOUT,
    ),
  ]);

  const guidedPathProgress = guidedResult.data ?? [];
  const sadhanaRows = sadhanaResult.data ?? [];
  const nityaRows = nityaResult.data ?? [];
  const nityaStreak = nityaStreakResult.data?.current_streak ?? 0;
  const nityaBestStreak = nityaStreakResult.data?.longest_streak ?? 0;
  const malaRows = malaResult.data ?? [];

  const todaySadhana = sadhanaRows.find((row) => row.date === today) ?? null;
  const latestStreakRow = sadhanaRows
    .filter((row) => row.streak_count != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const shlokaStreak = todaySadhana?.streak_count ?? latestStreakRow?.streak_count ?? profile?.shloka_streak ?? 0;

  const bestShlokaStreak = Math.max(
    ...sadhanaRows.map((r) => r.streak_count ?? 0),
    profile?.shloka_streak ?? 0,
  );

  const activePathshala = guidedPathProgress.find(
    (progress) => progress.status === 'active' && PATHSHALA_PATH_IDS.includes(progress.path_id),
  );
  const pathshalaDoneToday = guidedPathProgress.some((progress) => progress.updated_at?.startsWith(today));

  const nityaDoneIdsToday = new Set(
    nityaRows
      .filter((row) => row.step_id)
      .map((row) => row.step_id)
      .filter(isPresentString),
  );
  const nityaCompletedCount = countCompletedNativeNityaSteps(nityaDoneIdsToday);

  let pct = 0;
  let missing: string[] = [];
  if (profile) {
    const missingKeys = COMPLETION_FIELDS.filter(f => profile[f.key] == null || profile[f.key] === '');
    missing = missingKeys.map(f => f.label);
    pct = Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100);
  } else {
    missing = COMPLETION_FIELDS.map(f => f.label);
  }

  const practices = [
    Boolean(todaySadhana?.japa_done) || malaRows.length > 0,
    Boolean(todaySadhana?.nitya_done) || nityaCompletedCount === NATIVE_NITYA_STEP_ORDER.length,
    Boolean(todaySadhana?.pathshala_done) || pathshalaDoneToday,
    Boolean(todaySadhana?.quiz_done),
    Boolean(todaySadhana?.dharmveer_done),
  ];
  const practicesCompleted = practices.filter(Boolean).length;
  const totalPractices = practices.length;

  const response = {
    profile: {
      id: profile?.id,
      fullName: profile?.full_name ?? '',
      tradition: profile?.tradition ?? 'hindu',
      sampradaya: profile?.sampradaya ?? '',
      ishtaDevata: profile?.ishta_devata ?? '',
      appLanguage: profile?.app_language ?? 'en',
      activeSymbolId: profile?.active_symbol_id,
      sevaScore: profile?.seva_score ?? 0,
      isPro: profile?.is_pro ?? false,
      subscriptionStatus: profile?.subscription_status ?? 'free',
      activeRelic: profile?.active_symbol_id ? SACRED_RELICS.find(r => r.id === profile.active_symbol_id) ?? null : null,
    },
    completion: {
      pct,
      missing,
    },
    progress: {
      practices: {
        completed: practicesCompleted,
        total: totalPractices,
        japaDone: practices[0],
        nityaDone: practices[1],
        pathshalaDone: practices[2],
        quizDone: practices[3],
        dharmveerDone: practices[4],
      },
      streaks: {
        shloka: shlokaStreak,
        bestShloka: bestShlokaStreak,
        nitya: nityaStreak,
        bestNitya: nityaBestStreak,
      },
      seva: profile?.seva_score ?? 0,
      pathshala: {
        doneToday: pathshalaDoneToday,
        activePathId: activePathshala?.path_id ?? null,
        completedLessons: activePathshala?.completed_lessons?.length ?? 0,
      },
      quiz: {
        doneToday: Boolean(todaySadhana?.quiz_done),
      }
    }
  };

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
