import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export interface DevoteeProfileForJapa {
  id: string;
  timezone?: string | null;
  japa_reminder_enabled?: boolean | null;
  japa_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
}

/**
 * Queries daily_sadhana for devotees who have already completed Japa on the given local date.
 */
export async function getCompletedJapaUserIds(
  supabase: SupabaseClient,
  userIds: string[],
  localDate: string
): Promise<Set<string>> {
  if (!userIds || userIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from('daily_sadhana')
    .select('user_id, japa_done')
    .in('user_id', userIds)
    .eq('date', localDate);

  if (error) {
    console.warn(`[japa-candidate-producer] sadhana fetch warning for date ${localDate}:`, error.message);
    return new Set();
  }

  const completed = new Set<string>();
  for (const row of data || []) {
    if (row.japa_done) {
      completed.add(row.user_id);
    }
  }

  return completed;
}

/**
 * Produces a validated Japa candidate for an incomplete devotee on a specific local civil date.
 * Enforces:
 * 1. Opted-in reminder preference (japa_reminder_enabled === true).
 * 2. Completion suppression (skips if already completed on local date).
 * 3. Exact canonical route `/japa`.
 * 4. Timezone, DST, and quiet-hours safety.
 */
export function produceJapaCandidate(
  devotee: DevoteeProfileForJapa,
  localDate: string,
  isAlreadyCompleted: boolean = false,
  copy?: { title: string; body: string }
): NotificationCandidateInsert | null {
  // 1. Check opt-in
  if (devotee.japa_reminder_enabled !== true) {
    return null;
  }

  // 2. Check completion
  if (isAlreadyCompleted) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);

  // 3. Determine local send time (default 07:00 morning)
  let sendTime = devotee.japa_reminder_time || '07:00';
  let [hour, minute] = sendTime.split(':').map(Number);

  // 4. Adjust if falling inside quiet hours window
  if (
    devotee.notification_quiet_hours_start != null &&
    devotee.notification_quiet_hours_end != null &&
    isHourInQuietWindow(hour, devotee.notification_quiet_hours_start, devotee.notification_quiet_hours_end)
  ) {
    hour = (devotee.notification_quiet_hours_end + 1) % 24;
    sendTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const scheduledForDate = localTimeToUtc(localDate, sendTime, timezone);
  const expiresAtDate = localTimeToUtc(localDate, '23:59', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  const title = copy?.title ?? '🔔 Time for Japa';
  const body = copy?.body ?? 'Your daily Japa practice awaits. Keep your streak alive 🙏';

  return {
    user_id: devotee.id,
    event_type: 'japa',
    event_id: 'japa-daily',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 50, // Routine streak / practice reminder
    title,
    body,
    action_url: '/japa',
    language: 'en',
    timezone,
    tradition: null,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/japa',
    },
    metadata: {
      priority_class: 'routine_engagement',
      routine_type: 'japa',
    },
    status: 'pending',
  };
}
