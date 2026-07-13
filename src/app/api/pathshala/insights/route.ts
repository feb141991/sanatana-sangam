import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { PATHSHALA_PATH_IDS, SEED_PATHS } from '@/lib/pathshala-paths';

export const dynamic = 'force-dynamic';

type ProgressRow = {
  path_id: string;
  status: string | null;
  completed_at: string | null;
  current_lesson: number | null;
  completed_lessons: number[] | null;
  created_at: string;
  updated_at: string;
};

const PATH_INFO = new Map(SEED_PATHS.map(path => [path.id, path]));

function toCompletedLessons(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => Number.isInteger(item) && item >= 0);
}

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const { data, error } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, completed_at, current_lesson, completed_lessons, created_at, updated_at')
    .eq('user_id', user.id)
    .in('path_id', PATHSHALA_PATH_IDS)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as ProgressRow[]).filter(row => PATH_INFO.has(row.path_id));
  const active = rows.filter(row => row.status === 'active');
  const completed = rows.filter(row => row.status === 'completed');
  const enrolled = rows.filter(row => row.status !== 'dismissed');
  const firstEnrollment = (enrolled.length > 0 ? enrolled : rows).reduce<ProgressRow | null>(
    (earliest, row) => (!earliest || row.created_at < earliest.created_at ? row : earliest),
    null,
  );
  const daysOnJourney = firstEnrollment
    ? Math.max(1, Math.round((Date.now() - new Date(firstEnrollment.created_at).getTime()) / 86400000))
    : 0;

  const paths = rows.map((row) => {
    const path = PATH_INFO.get(row.path_id);
    const completedLessons = toCompletedLessons(row.completed_lessons);
    const totalLessons = Math.max(1, path?.total_lessons ?? row.current_lesson ?? 1);

    return {
      pathId: row.path_id,
      title: path?.title ?? row.path_id,
      difficulty: path?.difficulty ?? 'beginner',
      status: row.status,
      totalLessons,
      completedLessons: completedLessons.length,
      progressPct: Math.min(100, Math.round((completedLessons.length / totalLessons) * 100)),
      startedAt: row.created_at,
      lastActiveAt: row.updated_at,
      completedAt: row.completed_at,
    };
  });

  return NextResponse.json({
    daysOnJourney,
    pathsEnrolled: enrolled.length,
    pathsComplete: completed.length,
    activePaths: active.length,
    lessonsDone: enrolled.reduce((sum, row) => sum + toCompletedLessons(row.completed_lessons).length, 0),
    paths,
  });
}
