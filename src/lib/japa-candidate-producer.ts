import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc, shiftCivilDate } from './observance-timing';
import { getLocalDateIso, isHourInQuietWindow, localSpiritualDate, resolveTimeZone } from './sacred-time';

export interface DevoteeProfileForJapa {
  id: string;
  timezone?: string | null;
  japa_reminder_enabled?: boolean | null;
  japa_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
}

export interface PlannedJapaReminder {
  localDate: string;
  completionDate: string;
  scheduledFor: Date;
  expiresAt: Date;
  timezone: string;
}

const LOCAL_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Selects the next future local reminder slot. The producer cron can run once
 * daily at one UTC hour without scheduling a past local date for users west or
 * east of that UTC hour.
 */
export function planNextJapaReminder(
  devotee: DevoteeProfileForJapa,
  now: Date
): PlannedJapaReminder | null {
  const timezone = resolveTimeZone(devotee.timezone);
  const preferredTime = devotee.japa_reminder_time || '07:00';
  const timeMatch = LOCAL_TIME_RE.exec(preferredTime);
  if (!timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  let scheduleDate = getLocalDateIso(now, timezone);

  if (
    devotee.notification_quiet_hours_start != null &&
    devotee.notification_quiet_hours_end != null &&
    isHourInQuietWindow(
      hour,
      devotee.notification_quiet_hours_start,
      devotee.notification_quiet_hours_end
    )
  ) {
    const adjustedHour = (devotee.notification_quiet_hours_end + 1) % 24;
    // A quiet-hours adjustment that wraps past midnight belongs to tomorrow.
    if (adjustedHour <= hour) {
      const nextDate = shiftCivilDate(scheduleDate, 1);
      if (!nextDate) return null;
      scheduleDate = nextDate;
    }
    hour = adjustedHour;
  }

  const sendTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  let scheduledFor = localTimeToUtc(scheduleDate, sendTime, timezone);
  if (!scheduledFor) return null;

  if (scheduledFor.getTime() <= now.getTime()) {
    const nextDate = shiftCivilDate(scheduleDate, 1);
    if (!nextDate) return null;
    scheduleDate = nextDate;
    scheduledFor = localTimeToUtc(scheduleDate, sendTime, timezone);
    if (!scheduledFor || scheduledFor.getTime() <= now.getTime()) return null;
  }

  const dayAfterSchedule = shiftCivilDate(scheduleDate, 1);
  if (!dayAfterSchedule) return null;
  const expiresAt = localTimeToUtc(dayAfterSchedule, '00:00', timezone);
  if (!expiresAt || expiresAt.getTime() < scheduledFor.getTime()) return null;

  return {
    localDate: scheduleDate,
    completionDate: localSpiritualDate(timezone, 4, scheduledFor),
    scheduledFor,
    expiresAt,
    timezone,
  };
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
    throw new Error(`Could not verify Japa completion for ${localDate}: ${error.message}`);
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
  plan: PlannedJapaReminder,
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

  const title = copy?.title ?? '🔔 Time for Japa';
  const body = copy?.body ?? 'Your daily Japa practice awaits. Keep your streak alive 🙏';

  return {
    user_id: devotee.id,
    event_type: 'japa',
    event_id: 'japa-daily',
    event_instance: '',
    local_date: plan.localDate,
    audience_variant: 'general',
    scheduled_for: plan.scheduledFor.toISOString(),
    expires_at: plan.expiresAt.toISOString(),
    priority: 50, // Routine streak / practice reminder
    title,
    body,
    action_url: '/japa',
    language: 'en',
    timezone: plan.timezone,
    tradition: null,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/japa',
    },
    metadata: {
      priority_class: 'routine_engagement',
      routine_type: 'japa',
      completion_guard: 'japa',
      local_date: plan.localDate,
      completion_date: plan.completionDate,
    },
    status: 'pending',
  };
}
