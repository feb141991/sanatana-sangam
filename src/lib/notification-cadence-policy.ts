import { getLocalDateIso, getLocalHour, isHourInQuietWindow, resolveTimeZone } from './sacred-time';

/**
 * Engagement push cadence (engagement-cadence-v3: one other nudge a day).
 *
 * Every notification belongs to exactly one class:
 *   exempt   security, explicit user reminders, ritual windows, reviewed observances and the
 *            person-initiated Mandali rows. Never counted, never suppressed by this policy.
 *   shloka   one per user per local day, never crowded out by other nudges.
 *   learning one per user per local day, shared by quiz and dharm_veer (the learning slot).
 *   other    one per user per local day, shared by every remaining type.
 * `dailyCeiling` caps shloka + learning + other together. It is an outer safety ceiling, not a
 * target: the class limits already allow at most three.
 *
 * These numbers are enforced a second time in the database (`notification_cadence_limit`,
 * `notification_cadence_class`). The two MUST agree exactly: if the resolver accepts a row the trigger
 * then refuses, the whole claimed batch rolls back and retries. notification-cadence-parity.test.ts
 * reads the SQL and fails if either side drifts.
 */
export const NOTIFICATION_CADENCE_POLICY = {
  version: 'engagement-cadence-v3',
  dailyCeiling: 7,
  classLimits: { shloka: 1, learning: 1, other: 1 },
  minSpacingMinutes: 180,
  earliestLocalMinute: 7 * 60,
  latestLocalMinute: 21 * 60,
  searchStepMinutes: 15,
} as const;

export type NotificationCadenceClass = 'exempt' | 'shloka' | 'learning' | 'other';
export type CountedCadenceClass = Exclude<NotificationCadenceClass, 'exempt'>;
export type CadenceBlockKey = 'daily_ceiling' | 'shloka_slot' | 'learning_slot' | 'other_nudge';

/** Mirrors the array in public.notification_is_budget_exempt (migration 20261003174633). */
export const BUDGET_EXEMPT_EVENT_TYPES: readonly string[] = [
  'security', 'account', 'moderation', 'auth', 'transactional', 'critical_alert',
  'user_reminder', 'custom_reminder', 'explicit_request', 'user_sadhana_reminder',
  'sankalpa_midpoint', 'japa', 'brahma_muhurta', 'sandhya', 'nitya_madhyahn',
  'nitya_sandhya', 'ritual_window', 'pradosha_window', 'pradosha_kala',
  'ekadashi_parana', 'nitya', 'aarti', 'observance', 'festival', 'vrat', 'tithi',
  'observance_series', 'sankranti', 'sanskar_milestone', 'family_remembrance',
];

/**
 * Rows another person's action (or the person's own safety action) causes. They are not a Shoonaya
 * nudge, and the Mandali triggers write them without a local_date, so the resolver could never see
 * them while the database counted them. Mirrors the list in public.notification_cadence_class.
 */
export const PERSON_INITIATED_EVENT_TYPES: readonly string[] = [
  'connection_request', 'connection_accepted', 'connection_rejected', 'connection_cancelled',
  'post_reaction', 'comment_reaction', 'mandali_comment', 'user_blocked', 'content_reported',
];

export const SHLOKA_EVENT_TYPES: readonly string[] = ['shloka'];
export const LEARNING_EVENT_TYPES: readonly string[] = ['quiz', 'dharm_veer'];

/**
 * The class of a notification, from its type and (for generic bell rows) its semantic key. Unknown
 * types are `other`: a new feature is counted until someone decides it should not be.
 */
export function classifyNotificationCadence(
  rawEventType: string,
  notificationKey?: string | null,
): NotificationCadenceClass {
  const type = canonicalNotificationBudgetType(rawEventType, notificationKey);
  if (BUDGET_EXEMPT_EVENT_TYPES.includes(type) || PERSON_INITIATED_EVENT_TYPES.includes(type)) return 'exempt';
  if (SHLOKA_EVENT_TYPES.includes(type)) return 'shloka';
  if (LEARNING_EVENT_TYPES.includes(type)) return 'learning';
  return 'other';
}

export function cadenceBlockKeyForClass(cadenceClass: CountedCadenceClass): CadenceBlockKey {
  switch (cadenceClass) {
    case 'shloka': return 'shloka_slot';
    case 'learning': return 'learning_slot';
    default: return 'other_nudge';
  }
}

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
