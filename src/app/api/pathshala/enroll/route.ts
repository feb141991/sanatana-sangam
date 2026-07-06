import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { SEED_PATHS } from '@/lib/pathshala-paths';

export const dynamic = 'force-dynamic';

const PATHSHALA_PATH_IDS = new Set(SEED_PATHS.map(path => path.id));

/**
 * POST /api/pathshala/enroll
 *
 * Creates a fresh guided_path_progress row for the authenticated user
 * (current_lesson=0, completed_lessons=[], status='active'). Kept separate
 * from POST /api/pathshala/progress so that a brand-new enrollment never
 * triggers that route's "isNewLessonCompletion" karma-award / sadhana_events
 * side effects meant for lesson 0 completion, not enrollment itself.
 *
 * Idempotent: if the user is already enrolled in this path, the existing
 * row is left untouched and the current enrollment is returned.
 *
 * Uses the RLS-scoped client from getApiUser (not a service-role admin
 * client) — guided_path_progress RLS already permits a user to insert/read
 * their own rows, so no elevated privilege is needed.
 */
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (authError || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  let pathId: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && typeof (body as { pathId?: unknown }).pathId === 'string') {
      pathId = ((body as { pathId: string }).pathId).trim();
    }
  } catch {
    // fall through to validation error below
  }

  if (!pathId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!PATHSHALA_PATH_IDS.has(pathId)) {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 });
  }

  const { data: existing, error: existingErr } = await supabase
    .from('guided_path_progress')
    .select('path_id, current_lesson, completed_lessons, status')
    .eq('user_id', user.id)
    .eq('path_id', pathId)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      enrollment: {
        pathId: existing.path_id,
        currentLesson: existing.current_lesson ?? 0,
        completedLessons: Array.isArray(existing.completed_lessons) ? existing.completed_lessons : [],
        status: existing.status,
      },
    });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('guided_path_progress')
    .insert({
      user_id: user.id,
      path_id: pathId,
      status: 'active',
      current_lesson: 0,
      completed_lessons: [],
    })
    .select('path_id, current_lesson, completed_lessons, status')
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    enrollment: {
      pathId: inserted.path_id,
      currentLesson: inserted.current_lesson ?? 0,
      completedLessons: Array.isArray(inserted.completed_lessons) ? inserted.completed_lessons : [],
      status: inserted.status,
    },
  });
}
