import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { getLocalDateIso, isHourInQuietWindow, resolveTimeZone } from './sacred-time';

export type QuizReminderStage = 'available' | 'evening_nudge';

export interface DevoteeProfileForQuiz {
  id: string;
  tradition?: string | null;
  language?: string | null;
  timezone?: string | null;
  quiz_reminder_enabled?: boolean | null;
  quiz_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
}

const EVENING_REMINDER_TIME = '18:00';
const EVENING_REMINDER_EXPIRES = '20:45';
const AVAILABILITY_WINDOW_MINUTES = 60;

function parseClock(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function formatClock(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function localMinuteOfDay(date: Date, timezone: string): number | null {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return Number.isInteger(hour) && Number.isInteger(minute) ? hour * 60 + minute : null;
}

function effectiveLocalTime(
  devotee: DevoteeProfileForQuiz,
  requestedTime: string,
  stage: QuizReminderStage,
): string | null {
  let minute = parseClock(requestedTime);
  if (minute === null) return null;

  const requestedHour = Math.floor(minute / 60);
  if (
    isHourInQuietWindow(
      requestedHour,
      devotee.notification_quiet_hours_start ?? null,
      devotee.notification_quiet_hours_end ?? null,
    )
  ) {
    const end = devotee.notification_quiet_hours_end;
    if (end == null || !Number.isInteger(end) || end < 0 || end > 23) return null;
    minute = (end + 1) * 60 + (minute % 60);
  }

  // Keep the two nudges at least three hours apart and inside the app's
  // ordinary daytime delivery window. If quiet hours make that impossible,
  // omit the push rather than send it late at night.
  if (stage === 'available' && (minute < 7 * 60 || minute > 15 * 60)) return null;
  if (stage === 'evening_nudge' && (minute < 18 * 60 || minute > 19 * 60)) return null;
  return formatClock(minute);
}

/**
 * The producer is polled every ten minutes. It creates a stage only during
 * the hour after that stage's local target time; semantic uniqueness makes
 * repeated polls idempotent. Quiz is explicitly opt-in and defaults off.
 */
export function getDueQuizReminderStage(
  devotee: DevoteeProfileForQuiz,
  localDate: string,
  now: Date,
): QuizReminderStage | null {
  if (devotee.quiz_reminder_enabled !== true) return null;

  const timezone = resolveTimeZone(devotee.timezone);
  if (getLocalDateIso(now, timezone) !== localDate) return null;
  const currentMinute = localMinuteOfDay(now, timezone);
  if (currentMinute === null) return null;

  const availableTime = effectiveLocalTime(devotee, devotee.quiz_reminder_time ?? '08:00', 'available');
  const availableMinute = availableTime ? parseClock(availableTime) : null;
  if (
    availableMinute !== null &&
    currentMinute >= availableMinute &&
    currentMinute < availableMinute + AVAILABILITY_WINDOW_MINUTES
  ) {
    return 'available';
  }

  const eveningTime = effectiveLocalTime(devotee, EVENING_REMINDER_TIME, 'evening_nudge');
  const eveningMinute = eveningTime ? parseClock(eveningTime) : null;
  if (
    eveningMinute !== null &&
    currentMinute >= eveningMinute &&
    currentMinute < Math.min(eveningMinute + AVAILABILITY_WINDOW_MINUTES, 20 * 60)
  ) {
    return 'evening_nudge';
  }

  return null;
}

/** Produces one opt-in Daily Quiz notification stage for a user's local date. */
export function produceQuizCandidate(
  devotee: DevoteeProfileForQuiz,
  localDate: string,
  stage: QuizReminderStage = 'available',
): NotificationCandidateInsert | null {
  if (devotee.quiz_reminder_enabled !== true) return null;

  const timezone = resolveTimeZone(devotee.timezone);
  const sendTime = effectiveLocalTime(
    devotee,
    stage === 'available' ? devotee.quiz_reminder_time ?? '08:00' : EVENING_REMINDER_TIME,
    stage,
  );
  if (!sendTime) return null;

  const scheduledForDate = localTimeToUtc(localDate, sendTime, timezone);
  const expiryTime = stage === 'available'
    ? formatClock((parseClock(sendTime) ?? 0) + AVAILABILITY_WINDOW_MINUTES)
    : EVENING_REMINDER_EXPIRES;
  const expiresAtDate = localTimeToUtc(localDate, expiryTime, timezone);
  if (!scheduledForDate || !expiresAtDate || expiresAtDate <= scheduledForDate) return null;

  const language = devotee.language ?? 'en';
  const copy = stage === 'evening_nudge'
    ? language === 'hi'
      ? { title: 'आज की प्रश्नोत्तरी', body: 'यदि आपने आज का प्रश्न अभी तक नहीं हल किया है, तो रात से पहले इसे देख सकते हैं।' }
      : language === 'pa'
        ? { title: 'ਅੱਜ ਦੀ ਪ੍ਰਸ਼ਨੋਤਰੀ', body: 'ਜੇ ਤੁਸੀਂ ਅੱਜ ਦਾ ਸਵਾਲ ਹਾਲੇ ਨਹੀਂ ਕੀਤਾ, ਤਾਂ ਰਾਤ ਤੋਂ ਪਹਿਲਾਂ ਇਸਨੂੰ ਵੇਖ ਸਕਦੇ ਹੋ।' }
        : { title: 'A gentle quiz reminder', body: 'If you haven’t taken today’s quiz yet, there’s still time before the day ends.' }
    : language === 'hi'
      ? { title: 'आज की प्रश्नोत्तरी तैयार है', body: 'आज के प्रश्न के साथ थोड़ा समय सीखने और मनन में बिताएँ।' }
      : language === 'pa'
        ? { title: 'ਅੱਜ ਦੀ ਪ੍ਰਸ਼ਨੋਤਰੀ ਤਿਆਰ ਹੈ', body: 'ਅੱਜ ਦੇ ਸਵਾਲ ਨਾਲ ਸਿੱਖਣ ਅਤੇ ਵਿਚਾਰ ਕਰਨ ਲਈ ਕੁਝ ਪਲ ਕੱਢੋ।' }
        : { title: 'Today’s Daily Quiz is ready', body: 'Take a moment to explore today’s question.' };

  return {
    user_id: devotee.id,
    event_type: 'quiz',
    event_id: `daily-${localDate}`,
    event_instance: stage,
    local_date: localDate,
    // Language is carried separately. Keep the semantic id stable so changing
    // a user's language during the day cannot create a second push for the
    // same local quiz date and reminder stage.
    audience_variant: 'default',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 50,
    title: copy.title,
    body: copy.body,
    action_url: '/quiz',
    language,
    timezone,
    tradition: devotee.tradition ?? 'universal',
    calendar_profile: null,
    source_status: 'verified',
    source_refs: { canonical_route: '/quiz', completion_source: 'quiz_responses.date' },
    metadata: {
      priority_class: 'routine_engagement',
      learning_slot: true,
      route: '/quiz',
      quiz_reminder_stage: stage,
    },
    status: 'pending',
  };
}
