import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Batches the small "still live while Home is on screen" signals that used
// to be independent round-trips from the native app: the bell badge count
// (lib/notificationsData.ts's getMyUnreadNotificationCount) and the mood
// check-in status (lib/mood.ts's fetchMoodStatus, GET /api/mood/checkin
// without ?history). Both are cheap, both get polled on every Home focus,
// and neither needs its own network round-trip when they can share one.
// `?fields=` (comma-separated) only runs the sub-queries actually asked
// for; omit it to get everything.
type Field = 'unreadNotifications' | 'moodStatus';
const ALL_FIELDS: Field[] = ['unreadNotifications', 'moodStatus'];

type MoodStatus = {
  hasLoggedMoodToday: boolean;
  lastMood: string | null;
};

async function getUnreadNotificationCount(supabase: NonNullable<Awaited<ReturnType<typeof getApiUser>>['supabase']>, userId: string): Promise<number> {
  // Matches web's own limitation (see src/app/(main)/home/HomeDashboard.tsx
  // and native's lib/notificationsData.ts fetchUnreadCount): the unread
  // count is derived from the same capped 20-row fetch, not a true
  // unbounded aggregate. Kept identical on purpose so this endpoint's
  // number always agrees with the one native already showed before this
  // endpoint existed, rather than "fixing" it into a second, disagreeing
  // definition of unread.
  const { data, error } = await supabase
    .from('notifications')
    .select('id, read')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return 0;
  return (data ?? []).filter((row) => !row.read).length;
}

async function getMoodStatus(supabase: NonNullable<Awaited<ReturnType<typeof getApiUser>>['supabase']>, userId: string): Promise<MoodStatus> {
  // Same today-window query and hasLoggedMoodToday/lastMood derivation as
  // GET /api/mood/checkin (no ?history) -- see that route for the full
  // rationale on why "any row with a non-null before_mood today" is the
  // right definition for native's minimal check-in surface.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('user_mood_checkins')
    .select('before_mood, created_at')
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) return { hasLoggedMoodToday: false, lastMood: null };

  const loggedToday = (data ?? []).find((row) => row.before_mood);
  return {
    hasLoggedMoodToday: Boolean(loggedToday),
    lastMood: loggedToday?.before_mood ?? null,
  };
}

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);

  if (error || !user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requested = request.nextUrl.searchParams.get('fields');
  const fields = requested
    ? (requested.split(',').map((f) => f.trim()).filter((f): f is Field => ALL_FIELDS.includes(f as Field)))
    : ALL_FIELDS;

  const [unreadNotifications, moodStatus] = await Promise.all([
    fields.includes('unreadNotifications') ? getUnreadNotificationCount(supabase, user.id) : Promise.resolve(undefined),
    fields.includes('moodStatus') ? getMoodStatus(supabase, user.id) : Promise.resolve(undefined),
  ]);

  const response: { unreadNotifications?: number; moodStatus?: MoodStatus } = {};
  if (unreadNotifications !== undefined) response.unreadNotifications = unreadNotifications;
  if (moodStatus !== undefined) response.moodStatus = moodStatus;

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}
