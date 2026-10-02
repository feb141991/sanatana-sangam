import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { readMoodCheckinStatus } from '@/lib/mood/checkin-status';

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
  hasDismissedToday: boolean;
  spiritualDate: string;
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

async function getMoodStatus(
  supabase: NonNullable<Awaited<ReturnType<typeof getApiUser>>['supabase']>,
  userId: string,
  timeZone: string | null,
  dayBoundaryHour: number
): Promise<MoodStatus | null> {
  const result = await readMoodCheckinStatus(supabase, userId, timeZone, new Date(), dayBoundaryHour);
  if (result.error || !result.status) {
    // An unavailable read must not be represented as "no mood today"; that
    // false value makes Home show an automatic prompt for someone who may
    // already have checked in.
    console.error('[home-live] mood status unavailable', { hasError: Boolean(result.error) });
    return null;
  }

  return {
    hasLoggedMoodToday: result.status.hasLoggedMoodToday,
    lastMood: result.status.lastMood,
    hasDismissedToday: result.status.hasDismissedToday,
    spiritualDate: result.status.spiritualDate,
  };
}

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);

  if (error || !user || !supabase) {
    return getApiAuthFailureResponse(error);
  }

  const requested = request.nextUrl.searchParams.get('fields');
  const fields = requested
    ? (requested.split(',').map((f) => f.trim()).filter((f): f is Field => ALL_FIELDS.includes(f as Field)))
    : ALL_FIELDS;

  const [unreadNotifications, moodStatus] = await Promise.all([
    fields.includes('unreadNotifications') ? getUnreadNotificationCount(supabase, user.id) : Promise.resolve(undefined),
    fields.includes('moodStatus')
      ? getMoodStatus(
          supabase,
          user.id,
          request.nextUrl.searchParams.get('timezone'),
          request.nextUrl.searchParams.has('timezone') ? 4 : 0
        )
      : Promise.resolve(undefined),
  ]);

  const response: { unreadNotifications?: number; moodStatus?: MoodStatus } = {};
  if (unreadNotifications !== undefined) response.unreadNotifications = unreadNotifications;
  if (moodStatus) response.moodStatus = moodStatus;

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'private, no-store',
    },
  });
}
