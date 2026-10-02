import { getLocalDateIso, getLocalHour, isHourInQuietWindow, resolveTimeZone } from './sacred-time';

/**
 * Engagement push cadence. These limits apply only to non-exempt engagement
 * notifications; security, explicit user requests, approved ritual windows,
 * and reviewed observances retain their existing policy.
 */
export const NOTIFICATION_CADENCE_POLICY = {
  version: 'engagement-cadence-v2',
  maxBudgetedPerLocalDate: 5,
  maxPerCanonicalTypePerLocalDate: 5,
  minSpacingMinutes: 180,
  earliestLocalMinute: 7 * 60,
  latestLocalMinute: 21 * 60,
  searchStepMinutes: 15,
} as const;

export interface NotificationQuietHours {
  startHour: number | null;
  endHour: number | null;
}

export interface CadenceSlotInput {
  scheduledFor: string;
  expiresAt: string;
  localDate: string;
  timezone: string | null | undefined;
  now: Date;
  quietHours?: NotificationQuietHours;
  blockedInstants: readonly Date[];
  minSpacingMinutes?: number;
}

export interface CadenceSlotResult {
  scheduledFor: Date;
  delayMinutes: number;
}

/**
 * Finds the first safe same-day delivery instant at or after the candidate's
 * requested time. It preserves the producer's intended time unless that time
 * would create a push burst, overlap quiet hours, or fall outside the normal
 * daytime window. Exempt candidates do not use this function.
 */
export function findNextCadenceSlot(input: CadenceSlotInput): CadenceSlotResult | null {
  const requestedMs = Date.parse(input.scheduledFor);
  const expiresMs = Date.parse(input.expiresAt);
  if (!Number.isFinite(requestedMs) || !Number.isFinite(expiresMs) || expiresMs < requestedMs) {
    return null;
  }

  const timezone = resolveTimeZone(input.timezone);
  const spacingMs = Math.max(0, input.minSpacingMinutes ?? NOTIFICATION_CADENCE_POLICY.minSpacingMinutes) * 60_000;
  const minuteMs = 60_000;
  const stepMs = NOTIFICATION_CADENCE_POLICY.searchStepMinutes * minuteMs;
  const roundedNowMs = Math.ceil(input.now.getTime() / minuteMs) * minuteMs;
  let proposedMs = Math.max(requestedMs, roundedNowMs);
  let attempts = 0;

  while (proposedMs <= expiresMs && attempts <= 24 * 60 / NOTIFICATION_CADENCE_POLICY.searchStepMinutes) {
    attempts += 1;
    const proposed = new Date(proposedMs);
    if (getLocalDateIso(proposed, timezone) !== input.localDate) return null;

    const localMinute = getLocalMinuteOfDay(proposed, timezone);
    if (localMinute < NOTIFICATION_CADENCE_POLICY.earliestLocalMinute) {
      proposedMs += stepMs;
      continue;
    }
    if (localMinute >= NOTIFICATION_CADENCE_POLICY.latestLocalMinute) return null;

    const quietStart = normalizeQuietHour(input.quietHours?.startHour);
    const quietEnd = normalizeQuietHour(input.quietHours?.endHour);
    if (isHourInQuietWindow(getLocalHour(proposed, timezone), quietStart, quietEnd)) {
      proposedMs += stepMs;
      continue;
    }

    const conflicts = input.blockedInstants
      .map((instant) => instant.getTime())
      .filter(Number.isFinite)
      .filter((instantMs) => Math.abs(proposedMs - instantMs) < spacingMs);

    if (conflicts.length > 0) {
      const earliestAfterConflictMs = Math.max(...conflicts) + spacingMs;
      proposedMs = Math.ceil(earliestAfterConflictMs / stepMs) * stepMs;
      continue;
    }

    return {
      scheduledFor: proposed,
      delayMinutes: Math.max(0, Math.round((proposedMs - requestedMs) / minuteMs)),
    };
  }

  return null;
}

/**
 * Canonicalizes known legacy/candidate aliases so the same reminder consumes
 * the same per-type allowance regardless of which producer path created it.
 */
export function canonicalNotificationBudgetType(rawEventType: string, notificationKey?: string | null): string {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  let type = normalize(rawEventType);

  // Some legacy bell rows use the generic `general` type while retaining their
  // actual producer in the idempotency key (for example mood-evening:date).
  if (['', 'general', 'notification'].includes(type) && notificationKey) {
    type = normalize(notificationKey.split(':')[0] ?? type);
  }

  switch (type) {
    case 'mood_checkin':
    case 'mood_evening':
    case 'mood_midday':
    case 'mood_reminder':
      return 'mood';
    case 'sattvic_reminder':
      return 'sattvic';
    case 'streak':
    case 'streak_nudge':
      return 'shloka';
    case 'quiz_daily':
      return 'quiz';
    default:
      return type;
  }
}

function getLocalMinuteOfDay(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return hour * 60 + minute;
}

function normalizeQuietHour(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isInteger(value) && value >= 0 && value <= 23
    ? value
    : null;
}
