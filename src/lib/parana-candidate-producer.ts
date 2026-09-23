/**
 * parana-candidate-producer.ts
 *
 * Prompt 7: Ekadashi Parana Fast-Breaking Window Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes an explicit reviewed, profile/location-qualified Parana window on Dwadashi.
 * 2. Validates the supplied window against sunrise, Hari Vasara end and Dwadashi end; it does not derive ritual boundaries.
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or ambiguous reviewed window boundaries or source references
 *    - Polar / high-latitude conditions (|lat| > 60 or sunrise undefined)
 *    - Invalid or inverted parana window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('ekadashi_parana').
 * 5. Priority: approved_ritual_window (rank 3, numeric 30, 100% budget-exempt).
 */

import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { Json, NotificationCandidateInsert } from '@/types/database';

export interface ParanaWindowInput {
  ekadashiSlug: string;
  ekadashiName: string;
  ekadashiDate: string; // YYYY-MM-DD
  dwadashiDate: string; // YYYY-MM-DD
  // Astronomical instant boundaries (ISO UTC or Date)
  sunrise: Date | string;
  dwadashiEnd: Date | string;
  hariVasaraEnd?: Date | string | null;
  paranaStart?: Date | string | null;
  paranaEnd?: Date | string | null;
  sourceRefs?: Json[];
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
    return d.toISOString().slice(11, 16);
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
  if (!hasValidTimeZone(userTimezone)) {
    return { candidate: null, status: 'needs_review', diagnostics: ['invalid_user_timezone'] };
  }

  if (latitude == null || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_or_invalid_location_latitude'] };
  }
  // High-latitude / polar check: latitudes > 60 fail closed
  if (Math.abs(latitude) > 60) {
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

  if (window.hariVasaraEnd == null || window.paranaStart == null || window.paranaEnd == null) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_reviewed_parana_boundaries'] };
  }
  if (!window.sourceRefs?.length) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_reviewed_parana_source_refs'] };
  }
  const hariVasaraDate = parseUtcDate(window.hariVasaraEnd);
  const paranaStart = parseUtcDate(window.paranaStart);
  const paranaEnd = parseUtcDate(window.paranaEnd);
  if (!hariVasaraDate || !paranaStart || !paranaEnd) {
    return { candidate: null, status: 'needs_review', diagnostics: ['invalid_reviewed_parana_boundaries'] };
  }

  // The caller must supply a reviewed window; this module validates it rather
  // than deriving tradition-specific ritual boundaries.
  if (paranaStart < sunriseDate || paranaStart < hariVasaraDate || paranaEnd > dwadashiEndDate) {
    return { candidate: null, status: 'needs_review', diagnostics: ['parana_window_conflicts_with_sunrise_hari_vasara_or_dwadashi'] };
  }

  // Sanity check: parana start must be strictly before parana end
  if (paranaStart >= paranaEnd) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['inverted_parana_window_start_after_end'],
    };
  }

  const startTimeStr = formatTimeString(paranaStart, userTimezone);
  const endTimeStr = formatTimeString(paranaEnd, userTimezone);

  // Schedule notification 15 minutes before parana start so devotee can prepare
  const alertScheduledTime = new Date(Math.max(sunriseDate.getTime(), paranaStart.getTime() - 15 * 60 * 1000));

  const candidate: NotificationCandidateInsert = {
    user_id: userId,
    event_type: 'ekadashi_parana',
    event_id: window.ekadashiSlug,
    event_instance: 'parana',
    local_date: window.dwadashiDate,
    audience_variant: 'general',
    priority: 30,
    title: `${window.ekadashiName} Parana Window`,
    body: `Fast breaking window: ${startTimeStr} – ${endTimeStr}. Break your fast within this sacred period.`,
    action_url: `/vrat/${window.ekadashiSlug}`,
    scheduled_for: alertScheduledTime.toISOString(),
    expires_at: paranaEnd.toISOString(),
    timezone: userTimezone,
    source_status: 'verified',
    source_refs: window.sourceRefs,
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
