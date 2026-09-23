/**
 * pradosha-candidate-producer.ts
 *
 * Prompt 7: Pradosha Kala Twilight Window Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes an approved, profile/location-qualified Pradosha Vratam observance.
 * 2. Derives twilight window from local sunset (canonical 90m window: sunset - 45m to sunset + 45m).
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or invalid sunset instant
 *    - Polar / high-latitude conditions (|lat| > 60 or undefined sunset)
 *    - Inverted twilight window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('pradosha_kala').
 * 5. Priority: approved_ritual_window (rank 3, numeric 30, 100% budget-exempt).
 * 6. Spiritual Content Integrity: Skanda Purana (Shankara Samhita, Pradosha Vrata Mahatmya)
 *    and Shiva Purana canonical twilight worship of Bhagavan Shiva.
 */

import { deriveCandidateNotificationKey } from './notification-candidate-key';
import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { NotificationCandidateRow } from './notification-resolver';

export interface PradoshaTwilightInput {
  observanceSlug: string;
  observanceName: string;
  localDate: string; // YYYY-MM-DD
  sunset: Date | string;
  twilightStart?: Date | string | null;
  twilightEnd?: Date | string | null;
}

export interface PradoshaCandidateContext {
  userId: string;
  userTimezone: string;
  wantsPradoshaReminders?: boolean;
  wantsVratReminders?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  window: PradoshaTwilightInput;
}

export interface PradoshaCandidateResult {
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
    return d.toISOString().substring(11, 16) + ' UTC';
  }
}

export function producePradoshaCandidate(
  context: PradoshaCandidateContext,
): PradoshaCandidateResult {
  const mode = getCandidateTypePipelineMode('pradosha_kala');
  if (mode === 'disabled') {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['pradosha_kala pipeline mode is disabled'],
    };
  }

  const { window, userId, userTimezone, wantsPradoshaReminders, wantsVratReminders, latitude } = context;

  // 1. Check user preferences
  if (wantsPradoshaReminders === false || wantsVratReminders === false) {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['user opted out of pradosha/vrat reminders'],
    };
  }

  // 2. High-latitude / polar check fail-closed
  if (latitude !== undefined && latitude !== null && Math.abs(latitude) > 60) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`polar/high-latitude location (lat=${latitude}): twilight window cannot be safely derived`],
    };
  }

  // 3. Sunset parsing
  const sunsetDate = parseUtcDate(window.sunset);
  if (!sunsetDate) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['missing or unparseable sunset instant'],
    };
  }

  // 4. Derive or validate twilight window
  let startDate: Date;
  let endDate: Date;

  if (window.twilightStart && window.twilightEnd) {
    const parsedStart = parseUtcDate(window.twilightStart);
    const parsedEnd = parseUtcDate(window.twilightEnd);
    if (!parsedStart || !parsedEnd) {
      return {
        candidate: null,
        status: 'needs_review',
        diagnostics: ['explicit twilight window contains invalid Date'],
      };
    }
    startDate = parsedStart;
    endDate = parsedEnd;
  } else {
    // Canonical 90-minute window: 45m before sunset to 45m after sunset
    startDate = new Date(sunsetDate.getTime() - 45 * 60_000);
    endDate = new Date(sunsetDate.getTime() + 45 * 60_000);
  }

  if (startDate.getTime() >= endDate.getTime()) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`inverted or zero-length twilight window (start: ${startDate.toISOString()} >= end: ${endDate.toISOString()})`],
    };
  }

  // 5. Build candidate notification
  const notificationKey = deriveCandidateNotificationKey({
    event_type: 'pradosha_kala',
    event_id: window.observanceSlug,
    event_instance: 'twilight',
    local_date: window.localDate,
    audience_variant: 'general',
  });

  const formattedStart = formatTimeString(startDate, userTimezone);
  const formattedEnd = formatTimeString(endDate, userTimezone);

  // Scheduled for 15 minutes before twilight window opens to allow preparation,
  // or at start if already close
  const scheduledTime = new Date(startDate.getTime() - 15 * 60_000);

  const candidate: NotificationCandidateRow = {
    id: `cand_pradosha_${window.observanceSlug}_${window.localDate}`,
    user_id: userId,
    notification_key: notificationKey,
    event_type: 'pradosha_kala',
    title: `${window.observanceName} - Pradosha Kala`,
    body: `Pradosha Kala puja window is from ${formattedStart} to ${formattedEnd}. Dedicated twilight worship of Bhagavan Shiva.`,
    scheduled_for: scheduledTime.toISOString(),
    expires_at: endDate.toISOString(),
    priority_class: 'approved_ritual_window',
    priority_score: 30,
    status: 'pending',
    channel: 'push',
    data: {
      slug: window.observanceSlug,
      name: window.observanceName,
      local_date: window.localDate,
      sunset: sunsetDate.toISOString(),
      twilight_start: startDate.toISOString(),
      twilight_end: endDate.toISOString(),
      canonical_source: 'Skanda Purana & Shiva Purana',
      tradition: 'Shaiva / Smartha',
      deep_link: `/festivals/${window.observanceSlug}`,
    },
  };

  return {
    candidate,
    status: 'resolved',
    diagnostics: [],
  };
}
