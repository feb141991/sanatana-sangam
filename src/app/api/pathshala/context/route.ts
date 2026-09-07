import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { buildDailySacredText } from '@/lib/daily-sacred-text';
import { PATHSHALA_PATH_IDS } from '@/lib/pathshala-paths';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getDayOfYear } from '@/lib/sacred-texts';
import { ServerTimingCollector } from '@/lib/server-timing';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  tradition: string | null;
  app_language: string | null;
  timezone: string | null;
  is_banned: boolean | null;
};

type ProgressRow = {
  path_id: string;
  current_lesson: number | null;
  completed_lessons: number[] | null;
  status: string | null;
};

export async function GET(request: NextRequest) {
  const timings = new ServerTimingCollector();
  const { user, error: authError, supabase } = await timings.measure(
    'auth',
    'Authentication',
    () => getApiUser(request),
  );

  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profileResult, progressResult] = await timings.measure(
    'data',
    'Profile and Pathshala Progress',
    () => Promise.all([
      supabase
        .from('profiles')
        .select('tradition, app_language, timezone, is_banned')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>(),
      supabase
        .from('guided_path_progress')
        .select('path_id, current_lesson, completed_lessons, status')
        .eq('user_id', user.id)
        .in('path_id', PATHSHALA_PATH_IDS),
    ]),
  );

  if (profileResult.error || progressResult.error) {
    console.error('[pathshala/context] query failed', {
      profile: profileResult.error?.message ?? null,
      progress: progressResult.error?.message ?? null,
    });
    return NextResponse.json({ error: 'Could not load Pathshala context' }, { status: 500 });
  }

  const profile = profileResult.data;
  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
  }

  const composeStartedAt = performance.now();
  const timezone = profile?.timezone || 'UTC';
  const spiritualDate = localSpiritualDate(timezone, 4);
  const enrollments = ((progressResult.data ?? []) as ProgressRow[]).map((row) => ({
    pathId: row.path_id,
    currentLesson: row.current_lesson ?? 0,
    completedLessons: Array.isArray(row.completed_lessons) ? row.completed_lessons : [],
    status: row.status,
  }));
  const response = {
    profile: { tradition: profile?.tradition ?? 'hindu' },
    sacredText: buildDailySacredText(profile, getDayOfYear()),
    enrollments,
    spiritualDate,
    timezone,
  };
  timings.record('compose', performance.now() - composeStartedAt, 'Response Composition');

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Server-Timing': timings.toHeaderValue(),
    },
  });
}
