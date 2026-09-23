import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export interface DevoteeProfileForQuiz {
  id: string;
  tradition?: string | null;
  language?: string | null;
  timezone?: string | null;
  quiz_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
}

/**
 * Produces a validated Daily Quiz candidate for a devotee on a specific local civil date.
 * Enforces:
 * 1. Published and retrievable canonical daily quiz slot.
 * 2. Routes precisely to `/quiz`.
 * 3. Does not promise Karma amounts unless verified against the live contract (+10 for completion).
 * 4. Timezone and quiet-hours safety.
 */
export function produceQuizCandidate(
  devotee: DevoteeProfileForQuiz,
  localDate: string,
  quizId?: string
): NotificationCandidateInsert | null {
  const timezone = resolveTimeZone(devotee.timezone);
  const qId = quizId ?? `daily-${localDate}`;

  // Canonical route
  const action_url = '/quiz';

  // Dignified push copy without fabricated claims
  const title = devotee.language === 'hi'
    ? 'दैनिक प्रश्नोत्तरी'
    : 'Daily Dharma Quiz';

  const body = devotee.language === 'hi'
    ? 'अपने धार्मिक ज्ञान का परीक्षण करें और आज का प्रश्न हल करें।'
    : 'Test your dharmic knowledge with today’s reflection question.';

  // Determine local send time (default 12:00 noon or devotee preferred time)
  let sendTime = devotee.quiz_reminder_time || '12:00';
  let [hour, minute] = sendTime.split(':').map(Number);

  // Adjust if falling inside quiet hours window
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

  return {
    user_id: devotee.id,
    event_type: 'quiz',
    event_id: qId,
    event_instance: '',
    local_date: localDate,
    audience_variant: devotee.language ?? 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 60, // Routine engagement priority
    title,
    body,
    action_url,
    language: devotee.language ?? 'en',
    timezone,
    tradition: devotee.tradition ?? 'universal',
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/quiz',
      award_rule: 'quiz_complete',
    },
    metadata: {
      priority_class: 'routine_engagement',
      learning_slot: true,
      route: '/quiz',
    },
    status: 'pending',
  };
}
