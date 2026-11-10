import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';
import { getTraditionMeta } from './tradition-config';

/**
 * Local hour of the daily Shloka reminder. It was 19:00 and sat last in the day, behind every other nudge,
 * so the shared allowance was usually spent before it was considered. Founder decision 2026-11-08: Shloka
 * goes in the morning, protected. 07:00 is the earliest legal delivery time and is exactly three hours
 * before the 10:00 learning slot, so the three-hour spacing rule does not push that slot later. A person
 * whose quiet hours cover 07:00 is moved past them (below). The cron imports this so the two never differ.
 */
export const SHLOKA_REMINDER_LOCAL_HOUR = 7;

export interface DevoteeProfileForShloka {
  id: string;
  tradition?: string | null;
  timezone?: string | null;
  shloka_streak?: number | null;
  last_shloka_date?: string | null;
  wants_shloka_reminders?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
  is_deleting?: boolean | null;
}

/**
 * Produces a validated daily Shloka candidate (morning, 07:00 local) for a devotee on a specific local civil date.
 * Enforces:
 * 1. Opted-in reminder preference (wants_shloka_reminders !== false).
 * 2. Activity suppression (skips if devotee already read today's shloka, i.e. last_shloka_date === localDate).
 * 3. Dignified non-loss-pressure copy: avoids guilt or panic framing ("Don't break your streak! 🔥"),
 *    using serene devotional encouragement instead ("Continue your N-day sadhana journey 🙏").
 * 4. Exact canonical route `/home?focus=shloka`.
 * 5. Timezone, DST, and quiet-hours safety.
 */
export function produceShlokaCandidate(
  devotee: DevoteeProfileForShloka,
  localDate: string,
  copy?: { title: string; body: string }
): NotificationCandidateInsert | null {
  // Deletion may take time to propagate to token cleanup; never enqueue new
  // engagement after an account has entered its deletion lifecycle.
  if (devotee.is_deleting === true) {
    return null;
  }

  // 1. Check opt-in: default is true unless explicitly false
  if (devotee.wants_shloka_reminders === false) {
    return null;
  }

  // 2. Check completion: suppress if devotee already read today's shloka
  if (devotee.last_shloka_date === localDate) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);

  // 3. Morning (SHLOKA_REMINDER_LOCAL_HOUR, 07:00 local)
  let hour = SHLOKA_REMINDER_LOCAL_HOUR;
  let minute = 0;
  let sendTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

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

  // 5. Dignified, non-loss-pressure copy
  const tradition = devotee.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const streak = devotee.shloka_streak ?? 0;

  const streakMsg = streak > 0
    ? `Continue your ${streak}-day sadhana journey 🙏`
    : `Begin your ${meta.vocabulary.shloka.toLowerCase()} reflection today 🌱`;

  const title = copy?.title ?? `${meta.symbol} ${meta.sacredTextLabel} awaits`;
  const body = copy?.body ?? `${streakMsg} Take a quiet moment for today's verses.`;

  return {
    user_id: devotee.id,
    event_type: 'shloka',
    event_id: 'shloka-daily',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 45, // Priority 5: routine engagement - streak rescue
    title,
    body,
    action_url: '/home?focus=shloka',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/home?focus=shloka',
    },
    metadata: {
      priority_class: 'routine_engagement',
      routine_type: 'shloka',
      type: 'streak',
      emoji: meta.symbol,
      streak,
    },
    status: 'pending',
  };
}
