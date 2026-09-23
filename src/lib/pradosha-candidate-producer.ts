/**
 * pradosha-candidate-producer.ts
 *
 * Prompt 7: Pradosha Kala Twilight Window Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes an approved, profile/location-qualified Pradosha Vratam observance.
 * 2. Consumes explicit reviewed twilight boundaries; it does not infer a generic duration from sunset.
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or invalid sunset instant
 *    - Polar / high-latitude conditions (|lat| > 60 or undefined sunset)
 *    - Inverted twilight window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('pradosha_kala').
 * 5. Priority: approved_ritual_window (rank 3, numeric 30, 100% budget-exempt).
 * 6. Timing source references must be supplied with the reviewed boundaries.
 */

import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { Json, NotificationCandidateInsert } from '@/types/database';

export interface PradoshaTwilightInput {
  observanceSlug: string;
  observanceName: string;
  localDate: string; // YYYY-MM-DD
  sunset: Date | string;
  twilightStart?: Date | string | null;
  twilightEnd?: Date | string | null;
  sourceRefs?: Json[];
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
  candidate: NotificationCandidateInsert | null;
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

function hasValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function producePradoshaCandidate(
  context: PradoshaCandidateContext,
): PradoshaCandidateResult {
  const mode = getCandidateTypePipelineMode('pradosha_kala');
  if (mode !== 'candidate') {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: [`pradosha_kala_pipeline_mode_${mode}`],
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
  if (!userId || !userTimezone || !window || !hasValidTimeZone(userTimezone)) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_context_or_invalid_timezone'] };
  }
  if (latitude == null || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_or_invalid_location_latitude'] };
  }

  // 2. High-latitude / polar check fail-closed
  if (Math.abs(latitude) > 60) {
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
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_reviewed_twilight_boundaries'] };
  }

  if (startDate.getTime() >= endDate.getTime()) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`inverted or zero-length twilight window (start: ${startDate.toISOString()} >= end: ${endDate.toISOString()})`],
    };
  }
  if (sunsetDate < startDate || sunsetDate > endDate) {
    return { candidate: null, status: 'needs_review', diagnostics: ['reviewed_twilight_boundaries_do_not_contain_sunset'] };
  }
  if (!window.sourceRefs?.length) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_reviewed_twilight_source_refs'] };
  }

  // 5. Build candidate notification
  const formattedStart = formatTimeString(startDate, userTimezone);
  const formattedEnd = formatTimeString(endDate, userTimezone);

  // Scheduled for 15 minutes before twilight window opens to allow preparation,
  // or at start if already close
  const scheduledTime = new Date(startDate.getTime() - 15 * 60_000);

  const candidate: NotificationCandidateInsert = {
    user_id: userId,
    event_type: 'pradosha_kala',
    event_id: window.observanceSlug,
    event_instance: 'twilight',
    local_date: window.localDate,
    audience_variant: 'general',
    title: `${window.observanceName} - Pradosha Kala`,
    body: `Pradosha Kala puja window is from ${formattedStart} to ${formattedEnd}. Dedicated twilight worship of Bhagavan Shiva.`,
    scheduled_for: scheduledTime.toISOString(),
    expires_at: endDate.toISOString(),
    priority: 30,
    action_url: `/festivals/${window.observanceSlug}`,
    timezone: userTimezone,
    source_status: 'verified',
    source_refs: window.sourceRefs,
    metadata: {
      slug: window.observanceSlug,
      name: window.observanceName,
      local_date: window.localDate,
      sunset: sunsetDate.toISOString(),
      twilight_start: startDate.toISOString(),
      twilight_end: endDate.toISOString(),
    },
  };

  return {
    candidate,
    status: 'resolved',
    diagnostics: [],
  };
}
