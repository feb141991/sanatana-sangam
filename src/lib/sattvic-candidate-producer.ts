import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export interface DevoteeProfileForSattvic {
  id: string;
  tradition?: string | null;
  timezone?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
  wants_nitya_reminders?: boolean | null;
  is_deleting?: boolean | null;
}

export const SANDHYA_NUDGE_BY_TRADITION: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🌅 Evening Sandhyā — Sattvic Mode Awaits',
    body: 'The day softens. Step into Sattvic Mode for prānāyāma, kīrtana, or silent svādhyāya before the evening meal.',
  },
  sikh: {
    title: '☬ Evening Rehras Sahib Time',
    body: 'The ambrosial hour of dusk approaches. Open Sattvic Mode for Rehras Sahib or naam simran.',
  },
  buddhist: {
    title: '☸️ Evening Sitting Practice',
    body: 'As the day quietens, your sitting practice awaits. Five minutes of Sattvic presence before the evening.',
  },
  jain: {
    title: '🤲 Evening Pratikraman Reminder',
    body: "The evening hour calls for pratikraman. Open Sattvic Mode to sit, breathe, and reflect on today's actions.",
  },
};

/**
 * Produces a validated Sattvic Mode evening candidate for a devotee on a specific local civil date.
 *
 * Enforces:
 * 1. Opted-in reminder preference (wants_nitya_reminders === true).
 * 2. Active account (suppresses if is_deleting === true).
 * 3. Quiet-hours protection (suppresses if 17:00 falls in quiet window).
 * 4. Tradition-tailored Sandhyā reflection prompt.
 * 5. Exact canonical route `/bhakti/zen`.
 * 6. Timezone, DST, and quiet-hours safe scheduling for local 17:00.
 * 7. Priority: 60 (`routine_engagement` - evening practice).
 */
export function produceSattvicCandidate(
  devotee: DevoteeProfileForSattvic,
  localDate: string,
  copy?: { title: string; body: string }
): NotificationCandidateInsert | null {
  // 1. Check opt-in: requires wants_nitya_reminders === true
  if (devotee.wants_nitya_reminders !== true) {
    return null;
  }

  // 2. Account safety: skip accounts marked for deletion
  if (devotee.is_deleting === true) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);
  const targetHour = 17; // 5:00 PM local evening

  // 3. Quiet hours check
  const quietStart = devotee.notification_quiet_hours_start != null ? Number(devotee.notification_quiet_hours_start) : null;
  const quietEnd = devotee.notification_quiet_hours_end != null ? Number(devotee.notification_quiet_hours_end) : null;

  if (isHourInQuietWindow(targetHour, quietStart, quietEnd)) {
    return null;
  }

  const sendTime = `${String(targetHour).padStart(2, '0')}:00`;
  const scheduledForDate = localTimeToUtc(localDate, sendTime, timezone);
  const expiresAtDate = localTimeToUtc(localDate, '23:59', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  // 4. Tradition-specific Sandhyā reflection prompt
  const tradition = (devotee.tradition ?? 'hindu').toLowerCase();
  const nudge = SANDHYA_NUDGE_BY_TRADITION[tradition] ?? SANDHYA_NUDGE_BY_TRADITION.hindu;

  const title = copy?.title ?? nudge.title;
  const body = copy?.body ?? nudge.body;

  return {
    user_id: devotee.id,
    event_type: 'sattvic',
    event_id: 'sandhya',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 60, // Priority 6: routine engagement
    title,
    body,
    action_url: '/bhakti/zen',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/bhakti/zen',
      reminder_type: 'sattvic_sandhya',
    },
    metadata: {
      tradition,
      emoji: '🕉️',
      type: 'nitya',
      action_url: '/bhakti/zen',
      priority_class: 'routine_engagement',
    },
  };
}
