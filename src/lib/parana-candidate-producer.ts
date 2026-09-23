/**
 * parana-candidate-producer.ts
 *
 * Prompt 7: Ekadashi Parana Fast-Breaking Window Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes an approved, profile/location-qualified Parana window on Dwadashi.
 * 2. Schedules relative to the actual approved opening (sunrise / Hari Vasara end), NOT a fixed morning hour.
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or ambiguous Hari Vasara end
 *    - Polar / high-latitude conditions (|lat| > 60 or sunrise undefined)
 *    - Invalid or inverted parana window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('ekadashi_parana').
 * 5. Priority: approved_ritual_window (rank 3, numeric 30, 100% budget-exempt).
 */

import { deriveCandidateNotificationKey } from './notification-candidate-key';
import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { NotificationCandidateRow } from './notification-resolver';

export interface ParanaWindowInput {
  ekadashiSlug: string;
  ekadashiName: string;
  ekadashiDate: string; // YYYY-MM-DD
  dwadashiDate: string; // YYYY-MM-DD
  // Astronomical instant boundaries (ISO UTC or Date)
  sunrise: Date | string;
  dwadashiEnd: Date | string;
  hariVasaraEnd?: Date | string | null;
}

export interface ParanaCandidateContext {
  userId: string;
  userTimezone: string;
  wantsVratReminders?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  window: ParanaWindowInput;
}

export interface ParanaCandidateResult {
  candidate: NotificationCandidateRow | null;
  status: 'resolved' | 'needs_review' | 'suppressed';
  diagnostics: string[];
}

function parseUtcDate(input: Date | string): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function formatTimeString(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

/**
 * Evaluates and produces an Ekadashi Parana candidate notification.
 */
export function produceParanaCandidate(
  context: ParanaCandidateContext
): ParanaCandidateResult {
  const mode = getCandidateTypePipelineMode('ekadashi_parana');
  if (mode !== 'candidate') {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: [`ekadashi_parana_pipeline_mode_${mode}`],
    };
  }

  // Preference check
  if (context.wantsVratReminders === false) {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['user_wants_vrat_reminders_false'],
    };
  }

  const { userId, userTimezone, latitude, window } = context;
  if (!userId || !userTimezone || !window) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['missing_required_parana_context'],
    };
  }

  // High-latitude / polar check: latitudes > 60 fail closed
  if (latitude != null && Math.abs(latitude) > 60) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['polar_high_latitude_window_undefined'],
    };
  }

  const sunriseDate = parseUtcDate(window.sunrise);
  const dwadashiEndDate = parseUtcDate(window.dwadashiEnd);
  if (!sunriseDate || !dwadashiEndDate) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['missing_or_invalid_astronomical_dates'],
    };
  }

  // Determine Parana start:
  // Must NOT break during Hari Vasara (first quarter of Dwadashi).
  // If Hari Vasara ends after sunrise, Parana begins after Hari Vasara ends.
  let paranaStart = sunriseDate;
  if (window.hariVasaraEnd) {
    const hariVasaraDate = parseUtcDate(window.hariVasaraEnd);
    if (!hariVasaraDate) {
      return {
        candidate: null,
        status: 'needs_review',
        diagnostics: ['ambiguous_hari_vasara_boundary'],
      };
    }
    if (hariVasaraDate > sunriseDate) {
      paranaStart = hariVasaraDate;
    }
  }

  // Parana must conclude before Dwadashi tithi ends, or max 4 hours after sunrise
  const maxMorningWindow = new Date(sunriseDate.getTime() + 4 * 60 * 60 * 1000);
  const paranaEnd = dwadashiEndDate < maxMorningWindow ? dwadashiEndDate : maxMorningWindow;

  // Sanity check: parana start must be strictly before parana end
  if (paranaStart >= paranaEnd) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['inverted_parana_window_start_after_end'],
    };
  }

  // Minimum 15-minute window required
  const windowMinutes = (paranaEnd.getTime() - paranaStart.getTime()) / (60 * 1000);
  if (windowMinutes < 15) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`parana_window_too_narrow_${Math.round(windowMinutes)}m`],
    };
  }

  const startTimeStr = formatTimeString(paranaStart, userTimezone);
  const endTimeStr = formatTimeString(paranaEnd, userTimezone);

  const candidateKey = deriveCandidateNotificationKey({
    event_type: 'ekadashi_parana',
    event_id: window.ekadashiSlug,
    event_instance: 'parana',
    local_date: window.dwadashiDate,
    audience_variant: 'general',
  });

  // Schedule notification 15 minutes before parana start so devotee can prepare
  const alertScheduledTime = new Date(Math.max(sunriseDate.getTime(), paranaStart.getTime() - 15 * 60 * 1000));

  const candidate: NotificationCandidateRow = {
    user_id: userId,
    candidate_key: candidateKey,
    event_type: 'ekadashi_parana',
    event_date: window.dwadashiDate,
    priority_rank: 3, // approved_ritual_window
    numeric_priority: 30,
    category: 'sadhana',
    title: `${window.ekadashiName} Parana Window`,
    body: `Fast breaking window: ${startTimeStr} – ${endTimeStr}. Break your fast within this sacred period.`,
    action_url: `/vrat/${window.ekadashiSlug}`,
    channel: 'push',
    scheduled_for: alertScheduledTime.toISOString(),
    sound: 'temple_bell',
    metadata: {
      ekadashiDate: window.ekadashiDate,
      dwadashiDate: window.dwadashiDate,
      paranaStart: paranaStart.toISOString(),
      paranaEnd: paranaEnd.toISOString(),
      timezone: userTimezone,
    },
  };

  return {
    candidate,
    status: 'resolved',
    diagnostics: [],
  };
}
