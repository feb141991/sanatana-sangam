import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';
import { localSpiritualDate } from '@/lib/sacred-time';

type PathshalaProgressPayload = {
  pathId: string;
  lessonIndex: number;
  currentLesson: number;
  completedLessons: number[];
  completed: boolean;
};

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

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { user, error: authError } = await requireUserNotBanned(supabase);
  if (authError) return authError;

  try {
    const payload = parsePayload(await req.json());
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { pathId, lessonIndex, currentLesson, completed } = payload;

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
