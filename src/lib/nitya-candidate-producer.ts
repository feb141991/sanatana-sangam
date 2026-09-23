import type { NotificationCandidateInsert } from '@/types/database';
import { localTimeToUtc } from './observance-timing';
import { isHourInQuietWindow, resolveTimeZone } from './sacred-time';
import { getPanchangTimes, getTithiReminder, isInWindow } from './panchang';
import { getAshramaNudgeSuffix, type LifeStage, type GenderContext } from './ashrama';

export type NityaSlot = 'morning' | 'madhyahn' | 'sandhya';

export interface DevoteeProfileForNitya {
  id: string;
  full_name?: string | null;
  tradition?: string | null;
  life_stage?: LifeStage | null;
  gender_context?: GenderContext | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
  wants_nitya_reminders?: boolean | null;
  wants_madhyahn_reminder?: boolean | null;
  wants_evening_reminder?: boolean | null;
  nitya_rhythm_mode?: string | null;
  is_deleting?: boolean | null;
}

export const MORNING_NITYA_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🌅 Brahma Muhurta — Your Sadhana Path Awaits',
    body: 'Suprabhat! Your personalised morning sequence is ready. Begin with snana and let the day unfold in dharma.',
  },
  sikh: {
    title: '☬ Amrit Vela — Your Nitnem Awaits',
    body: "Sat Sri Akal! The ambrosial hour is here. Your personalised Nitnem brings Waheguru's grace.",
  },
  buddhist: {
    title: '☸️ Your Morning Practice Awaits',
    body: 'May this dawn bring clarity. Your personalised sitting practice is ready — begin before the day takes hold.',
  },
  jain: {
    title: '🤲 Your Morning Pratikraman Awaits',
    body: 'Jai Jinendra! The dawn hour is auspicious. Your personalised Samayika and Navkar sequence is ready.',
  },
};

export const MADHYAHN_NITYA_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🌞 Madhyahn Sandhya — 2 minutes',
    body: 'Pause at noon. Offer the midday Surya namaskar. Brief and complete.',
  },
  sikh: {
    title: '🌞 Midday Simran',
    body: "Waheguru's naam in the afternoon — brief and complete.",
  },
  buddhist: {
    title: '🌞 Midday Mindfulness',
    body: 'Three conscious breaths. That is enough.',
  },
  jain: {
    title: '🌞 Madhyahn Pratikraman',
    body: 'Two minutes of equanimity at noon.',
  },
};

export const SANDHYA_NITYA_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🪔 Sandhya Diya — the day closes',
    body: 'Light the lamp. Offer the evening prayer. The day returns to the one who gave it.',
  },
  sikh: {
    title: '🪔 Rehras Sahib',
    body: 'The sun is setting. Rehras Sahib closes the day with grace.',
  },
  buddhist: {
    title: '🪔 Evening Sitting',
    body: 'The day is done. 10 minutes before it fully closes.',
  },
  jain: {
    title: '🪔 Sayam Pratikraman',
    body: 'Evening repentance — examine the day before it becomes the past.',
  },
};

const RAHU_TOLERANCE_MS = 5 * 60_000;
const BRAHMA_TOLERANCE_MS = 60 * 60_000;

/**
 * Produces a validated morning Brahma Muhurta Nitya candidate for a devotee on a local civil date.
 *
 * Enforces:
 * 1. Opt-in: wants_nitya_reminders !== false.
 * 2. Active account: is_deleting !== true.
 * 3. Daily completion: startedToday !== true.
 * 4. Quiet-hours safety for 05:00 morning window.
 * 5. Panchang Brahma Muhurta and Rahu Kalam checking when coordinates and time are provided.
 * 6. Panchang tithi/nakshatra and Ashrama life-stage enrichment.
 * 7. Canonical route: `/nitya-karma`.
 * 8. Priority: 30 (`approved_ritual_window` - budget exempt).
 */
export function produceMorningNityaCandidate(
  devotee: DevoteeProfileForNitya,
  localDate: string,
  options?: {
    now?: Date;
    startedToday?: boolean;
    skipPanchangCheck?: boolean;
    customTitle?: string;
    customBody?: string;
  }
): NotificationCandidateInsert | null {
  if (devotee.wants_nitya_reminders === false) {
    return null;
  }

  if (devotee.is_deleting === true) {
    return null;
  }

  if (options?.startedToday === true) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);
  const targetHour = 5;

  const quietStart = devotee.notification_quiet_hours_start != null ? Number(devotee.notification_quiet_hours_start) : null;
  const quietEnd = devotee.notification_quiet_hours_end != null ? Number(devotee.notification_quiet_hours_end) : null;

  if (isHourInQuietWindow(targetHour, quietStart, quietEnd)) {
    return null;
  }

  const scheduledForDate = localTimeToUtc(localDate, '05:00', timezone);
  const expiresAtDate = localTimeToUtc(localDate, '11:59', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  const tradition = (devotee.tradition ?? 'hindu').toLowerCase();
  const nudge = MORNING_NITYA_NUDGE[tradition] ?? MORNING_NITYA_NUDGE.hindu;

  // Optional real-time Brahma Muhurta / Rahu Kalam filter
  if (!options?.skipPanchangCheck && options?.now && devotee.latitude != null && devotee.longitude != null) {
    try {
      const times = getPanchangTimes(options.now, devotee.latitude, devotee.longitude);
      if (!isInWindow(options.now, times.brahmaMuhurtaStart, times.brahmaMuhurtaEnd, BRAHMA_TOLERANCE_MS)) {
        return null;
      }
      if (isInWindow(options.now, times.rahuKaalStart, times.rahuKaalEnd, RAHU_TOLERANCE_MS)) {
        return null;
      }
    } catch {
      // Fallback gracefully on calculation error
    }
  }

  // Enrich copy with Panchang tithi / nakshatra
  let tithiSuffix = '';
  try {
    const lat = devotee.latitude ?? null;
    const lon = devotee.longitude ?? null;
    const times = getPanchangTimes(options?.now ?? scheduledForDate, lat, lon);
    const tithiReminder = getTithiReminder(times.tithiIndex, tradition);
    if (tithiReminder) {
      tithiSuffix = ` Today is ${times.tithi} — ${tithiReminder.body}`;
    } else {
      tithiSuffix = ` Today's nakshatra is ${times.nakshatra}.`;
    }
  } catch {
    // Best effort panchang enrichment
  }

  const ashramaSuffix = getAshramaNudgeSuffix(devotee.life_stage, devotee.gender_context);

  const title = options?.customTitle ?? nudge.title;
  const body = options?.customBody ?? `${nudge.body}${tithiSuffix}${ashramaSuffix}`;

  return {
    user_id: devotee.id,
    event_type: 'nitya',
    event_id: 'morning',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 30, // Priority 3: Approved ritual window (budget-exempt)
    title,
    body,
    action_url: '/nitya-karma',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/nitya-karma',
      slot: 'morning',
    },
    metadata: {
      slot: 'morning',
      tradition,
      emoji: '🌅',
      type: 'nitya',
      action_url: '/nitya-karma',
      priority_class: 'approved_ritual_window',
    },
  };
}

/**
 * Produces a validated midday Madhyahn Sandhya Nitya candidate for a devotee on a local civil date.
 *
 * Enforces:
 * 1. Opt-in: wants_madhyahn_reminder === true.
 * 2. Rhythm mode: nitya_rhythm_mode in ('full_day', 'advanced').
 * 3. Active account: is_deleting !== true.
 * 4. Quiet-hours safety for 12:00 noon window.
 * 5. Tradition-specific midday reflection copy.
 * 6. Canonical route: `/nitya-karma`.
 * 7. Priority: 30 (`approved_ritual_window` - budget exempt).
 */
export function produceMadhyahnNityaCandidate(
  devotee: DevoteeProfileForNitya,
  localDate: string,
  options?: {
    copy?: { title: string; body: string };
  }
): NotificationCandidateInsert | null {
  if (devotee.wants_madhyahn_reminder !== true) {
    return null;
  }

  const rhythm = devotee.nitya_rhythm_mode ?? '';
  if (!['full_day', 'advanced'].includes(rhythm)) {
    return null;
  }

  if (devotee.is_deleting === true) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);
  const targetHour = 12;

  const quietStart = devotee.notification_quiet_hours_start != null ? Number(devotee.notification_quiet_hours_start) : null;
  const quietEnd = devotee.notification_quiet_hours_end != null ? Number(devotee.notification_quiet_hours_end) : null;

  if (isHourInQuietWindow(targetHour, quietStart, quietEnd)) {
    return null;
  }

  const scheduledForDate = localTimeToUtc(localDate, '12:00', timezone);
  const expiresAtDate = localTimeToUtc(localDate, '16:00', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  const tradition = (devotee.tradition ?? 'hindu').toLowerCase();
  const defaultNudge = MADHYAHN_NITYA_NUDGE[tradition] ?? MADHYAHN_NITYA_NUDGE.hindu;

  const title = options?.copy?.title ?? defaultNudge.title;
  const body = options?.copy?.body ?? defaultNudge.body;

  return {
    user_id: devotee.id,
    event_type: 'nitya',
    event_id: 'madhyahn',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 30, // Priority 3: Approved ritual window (budget-exempt)
    title,
    body,
    action_url: '/nitya-karma',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/nitya-karma',
      slot: 'madhyahn',
    },
    metadata: {
      slot: 'madhyahn',
      tradition,
      emoji: '🌞',
      type: 'nitya',
      action_url: '/nitya-karma',
      priority_class: 'approved_ritual_window',
    },
  };
}

/**
 * Produces a validated evening Sandhya Nitya candidate for a devotee on a local civil date.
 *
 * Enforces:
 * 1. Opt-in: wants_evening_reminder === true.
 * 2. Rhythm mode: nitya_rhythm_mode in ('full_day', 'advanced').
 * 3. Active account: is_deleting !== true.
 * 4. Quiet-hours safety for 18:00 evening window.
 * 5. Tradition-specific evening Diya reflection copy.
 * 6. Canonical route: `/nitya-karma`.
 * 7. Priority: 30 (`approved_ritual_window` - budget exempt).
 */
export function produceSandhyaNityaCandidate(
  devotee: DevoteeProfileForNitya,
  localDate: string,
  options?: {
    copy?: { title: string; body: string };
  }
): NotificationCandidateInsert | null {
  if (devotee.wants_evening_reminder !== true) {
    return null;
  }

  const rhythm = devotee.nitya_rhythm_mode ?? '';
  if (!['full_day', 'advanced'].includes(rhythm)) {
    return null;
  }

  if (devotee.is_deleting === true) {
    return null;
  }

  const timezone = resolveTimeZone(devotee.timezone);
  const targetHour = 18;

  const quietStart = devotee.notification_quiet_hours_start != null ? Number(devotee.notification_quiet_hours_start) : null;
  const quietEnd = devotee.notification_quiet_hours_end != null ? Number(devotee.notification_quiet_hours_end) : null;

  if (isHourInQuietWindow(targetHour, quietStart, quietEnd)) {
    return null;
  }

  const scheduledForDate = localTimeToUtc(localDate, '18:00', timezone);
  const expiresAtDate = localTimeToUtc(localDate, '22:00', timezone);

  if (!scheduledForDate || !expiresAtDate) {
    return null;
  }

  const tradition = (devotee.tradition ?? 'hindu').toLowerCase();
  const defaultNudge = SANDHYA_NITYA_NUDGE[tradition] ?? SANDHYA_NITYA_NUDGE.hindu;

  const title = options?.copy?.title ?? defaultNudge.title;
  const body = options?.copy?.body ?? defaultNudge.body;

  return {
    user_id: devotee.id,
    event_type: 'nitya',
    event_id: 'sandhya',
    event_instance: '',
    local_date: localDate,
    audience_variant: 'general',
    scheduled_for: scheduledForDate.toISOString(),
    expires_at: expiresAtDate.toISOString(),
    priority: 30, // Priority 3: Approved ritual window (budget-exempt)
    title,
    body,
    action_url: '/nitya-karma',
    language: 'en',
    timezone,
    tradition,
    calendar_profile: null,
    source_status: 'verified',
    source_refs: {
      canonical_route: '/nitya-karma',
      slot: 'sandhya',
    },
    metadata: {
      slot: 'sandhya',
      tradition,
      emoji: '🪔',
      type: 'nitya',
      action_url: '/nitya-karma',
      priority_class: 'approved_ritual_window',
    },
  };
}

/**
 * Universal dispatcher for Nitya karma candidates across morning, madhyahn, and sandhya slots.
 */
export function produceNityaCandidate(
  devotee: DevoteeProfileForNitya,
  slot: NityaSlot,
  localDate: string,
  options?: any
): NotificationCandidateInsert | null {
  switch (slot) {
    case 'morning':
      return produceMorningNityaCandidate(devotee, localDate, options);
    case 'madhyahn':
      return produceMadhyahnNityaCandidate(devotee, localDate, options);
    case 'sandhya':
      return produceSandhyaNityaCandidate(devotee, localDate, options);
    default:
      return null;
  }
}
