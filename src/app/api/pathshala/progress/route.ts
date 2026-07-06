import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { getPathLessons } from '@/lib/pathshala-lessons';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import { localSpiritualDate } from '@/lib/sacred-time';

export const dynamic = 'force-dynamic';

type PathshalaProgressPayload = {
  pathId: string;
  lessonIndex: number;
  currentLesson: number;
  completedLessons: number[];
  completed: boolean;
};

type EnrollmentPayload = {
  pathId: string;
  currentLesson: number;
  completedLessons: number[];
  status: string | null;
};

const PATHSHALA_PATH_IDS = new Set(SEED_PATHS.map(path => path.id));

function isPathshalaPathId(pathId: string) {
  return PATHSHALA_PATH_IDS.has(pathId);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function parsePayload(value: unknown): PathshalaProgressPayload | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const { pathId, lessonIndex, currentLesson, completedLessons, completed } = candidate;

  if (
    typeof pathId !== 'string'
    || pathId.trim() === ''
    || !isNonNegativeInteger(lessonIndex)
    || !isNonNegativeInteger(currentLesson)
    || !Array.isArray(completedLessons)
    || completedLessons.some(item => !isNonNegativeInteger(item))
    || typeof completed !== 'boolean'
  ) {
    return null;
  }

  return {
    pathId: pathId.trim(),
    lessonIndex,
    currentLesson,
    completedLessons: Array.from(new Set(completedLessons)).sort((a, b) => a - b),
    completed,
  };
}

/**
 * GET /api/pathshala/progress
 * GET /api/pathshala/progress?pathId=<id>
 *
 * Read-only. Returns the authenticated user's Pathshala guided_path_progress rows.
 * - With `pathId`: { enrollment: EnrollmentPayload | null }
 * - Without: { enrollments: EnrollmentPayload[] }
 *
 * Uses getApiUser (cookie OR Bearer token) so native callers authenticate
 * correctly, and reuses the client it returns (RLS-scoped to the caller,
 * `auth.uid() = user_id`) rather than a service-role admin client — this
 * table's RLS already permits a user to read/write their own rows, so no
 * elevated privilege is needed here.
 */
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const pathId = req.nextUrl.searchParams.get('pathId');

  if (pathId) {
    if (!isPathshalaPathId(pathId)) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('guided_path_progress')
      .select('path_id, current_lesson, completed_lessons, status')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enrollment: EnrollmentPayload | null = data
      ? {
          pathId: data.path_id,
          currentLesson: data.current_lesson ?? 0,
          completedLessons: Array.isArray(data.completed_lessons) ? data.completed_lessons : [],
          status: data.status,
        }
      : null;

    return NextResponse.json({ enrollment });
  }

  const { data, error } = await supabase
    .from('guided_path_progress')
    .select('path_id, current_lesson, completed_lessons, status')
    .eq('user_id', user.id)
    .in('path_id', Array.from(PATHSHALA_PATH_IDS));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enrollments: EnrollmentPayload[] = (data ?? []).map((row) => ({
    pathId: row.path_id,
    currentLesson: row.current_lesson ?? 0,
    completedLessons: Array.isArray(row.completed_lessons) ? row.completed_lessons : [],
    status: row.status,
  }));

  return NextResponse.json({ enrollments });
}

/**
 * POST /api/pathshala/progress
 *
 * Centralizes lesson-completion side effects (karma award, sadhana_events
 * log, daily_sadhana upsert) so native does not bypass them with a direct
 * table write. Auth switched from a cookie-only server client to getApiUser
 * (cookie OR Bearer) — native requests carry only a Bearer token and were
 * being rejected with 401 by the previous cookie-only client. Uses the
 * RLS-scoped client returned by getApiUser rather than a service-role
 * admin client (see GET handler comment above for why).
 */
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const payload = parsePayload(await req.json());
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { pathId, lessonIndex, currentLesson, completed } = payload;

    if (!isPathshalaPathId(pathId)) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const lessonCount = getPathLessons(pathId).length;
    if (lessonCount === 0 || lessonIndex >= lessonCount || currentLesson >= lessonCount) {
      return NextResponse.json({ error: 'Invalid lesson index' }, { status: 400 });
    }

    const { data: existing, error: existingErr } = await supabase
      .from('guided_path_progress')
      .select('completed_lessons')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    const existingCompleted = Array.isArray(existing?.completed_lessons)
      ? existing.completed_lessons.filter(isNonNegativeInteger)
      : [];
    const isNewLessonCompletion = !existingCompleted.includes(lessonIndex);
    const completedLessons = Array.from(
      new Set([...existingCompleted, ...payload.completedLessons, lessonIndex])
    ).sort((a, b) => a - b);
    const nextCurrentLesson = Math.max(currentLesson, lessonIndex);

    const { error: upsertErr } = await supabase.from('guided_path_progress').upsert(
      {
        user_id: user.id,
        path_id: pathId,
        status: completed ? 'completed' : 'active',
        current_lesson: nextCurrentLesson,
        completed_lessons: completedLessons,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: 'user_id,path_id' }
    );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();
    const timezone = profile?.timezone || 'UTC';
    const today = localSpiritualDate(timezone, 4);

    let karmaEarned = 0;
    let eventLogged = false;
    let dailySadhanaUpdated = false;

    if (isNewLessonCompletion) {
      const { error: eventErr } = await supabase.from('sadhana_events').insert({
        user_id: user.id,
        event_type: 'shloka_read',
        event_data: {
          text_id: pathId,
          chapter: lessonIndex,
          verse: 0,
          time_spent_s: 0,
          client_timestamp: new Date().toISOString(),
          timezone,
        },
      });
      eventLogged = !eventErr;
      if (eventErr) {
        console.error('[pathshala/progress] Failed to log shloka_read:', eventErr);
      }

      const { data: karmaAward, error: karmaErr } = await supabase.rpc('award_karma', {
        p_user_id: user.id,
        p_reason: `pathshala_lesson:${pathId}:${lessonIndex}`,
        p_amount: 8,
        p_date: today,
        p_daily_cap: 8,
        p_source_route: '/api/pathshala/progress',
        p_metadata: { category: 'pathshala_lesson', pathId, lessonIndex },
      });

      if (karmaErr) {
        console.error('[pathshala/progress] Failed to award karma:', karmaErr);
      } else if (typeof karmaAward === 'number' && karmaAward > 0) {
        karmaEarned = karmaAward;
      }
    }

    const { error: sadhanaErr } = await supabase.from('daily_sadhana').upsert(
      { user_id: user.id, date: today, pathshala_done: true },
      { onConflict: 'user_id,date' }
    );
    dailySadhanaUpdated = !sadhanaErr;
    if (sadhanaErr) {
      console.error('[pathshala/progress] Failed to update daily_sadhana:', sadhanaErr);
    }

    return NextResponse.json({
      success: true,
      progress: {
        pathId,
        currentLesson: nextCurrentLesson,
        completedLessons,
        pathCompleted: completed,
      },
      karmaEarned,
      streakUpdated: false,
      eventLogged,
      dailySadhanaUpdated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
