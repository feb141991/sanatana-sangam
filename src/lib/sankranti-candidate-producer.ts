/**
 * sankranti-candidate-producer.ts
 *
 * Prompt 7: Solar Sankranti & Punya Kala Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes explicit reviewed Punya Kala boundaries and their source references.
 * 2. A solar transit instant alone is insufficient; this module does not derive a ritual window.
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or incomplete reviewed Punya Kala boundaries
 *    - Polar / high-latitude conditions (|lat| > 60)
 *    - Inverted punya kala window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('sankranti').
 * 5. Priority: approved_ritual_window (score 30) for bounded ritual windows,
 *    or reviewed_observance (score 20) for general transit day.
 * 6. Timing source references must be supplied with the reviewed boundaries.
 */

import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { Json, NotificationCandidateInsert } from '@/types/database';

export interface SankrantiInput {
  sankrantiSlug: string;
  sankrantiName: string;
  localDate: string; // YYYY-MM-DD
  transitInstant?: Date | string | null;
  rashiIndex?: number;
  punyaKalaStart?: Date | string | null;
  punyaKalaEnd?: Date | string | null;
  mahaPunyaKalaStart?: Date | string | null;
  mahaPunyaKalaEnd?: Date | string | null;
  sourceRefs?: Json[];
}

export interface SankrantiCandidateContext {
  userId: string;
  userTimezone: string;
  wantsSankrantiReminders?: boolean;
  wantsObservanceReminders?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  window: SankrantiInput;
}

export interface SankrantiCandidateResult {
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

export function produceSankrantiCandidate(
  context: SankrantiCandidateContext,
): SankrantiCandidateResult {
  const mode = getCandidateTypePipelineMode('sankranti');
  if (mode !== 'candidate') {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: [`sankranti_pipeline_mode_${mode}`],
    };
  }

  const { window, userId, userTimezone, wantsSankrantiReminders, wantsObservanceReminders, latitude } = context;
  if (!userId || !userTimezone || !window || !hasValidTimeZone(userTimezone)) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_context_or_invalid_timezone'] };
  }

  // 1. Check user preferences
  if (wantsSankrantiReminders === false || wantsObservanceReminders === false) {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['user opted out of sankranti/observance reminders'],
    };
  }
  if (latitude == null || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_or_invalid_location_latitude'] };
  }

  // 2. High-latitude / polar check fail-closed
  if (Math.abs(latitude) > 60) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`polar/high-latitude location (lat=${latitude}): solar transit timing cannot be safely verified`],
    };
  }

  // 3. Resolve Punya Kala Window
  let startDate: Date;
  let endDate: Date;
  const parsedPunyaStart = window.punyaKalaStart ? parseUtcDate(window.punyaKalaStart) : null;
  const parsedPunyaEnd = window.punyaKalaEnd ? parseUtcDate(window.punyaKalaEnd) : null;

  if (window.punyaKalaStart && window.punyaKalaEnd && parsedPunyaStart && parsedPunyaEnd) {
    startDate = parsedPunyaStart;
    endDate = parsedPunyaEnd;
  } else {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['missing or incomplete reviewed punya kala boundaries'],
    };
  }

  if (startDate.getTime() >= endDate.getTime()) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`inverted or zero-length punya kala window (start: ${startDate.toISOString()} >= end: ${endDate.toISOString()})`],
    };
  }

  if (!window.sourceRefs?.length) {
    return { candidate: null, status: 'needs_review', diagnostics: ['missing_reviewed_punya_kala_source_refs'] };
  }

  // 4. Build candidate notification
  const formattedStart = formatTimeString(startDate, userTimezone);
  const formattedEnd = formatTimeString(endDate, userTimezone);

  // Scheduled 15 minutes before Punya Kala window opens
  const scheduledTime = new Date(startDate.getTime() - 15 * 60_000);
  const transitInstant = window.transitInstant
    ? parseUtcDate(window.transitInstant)?.toISOString() ?? null
    : null;

  const candidate: NotificationCandidateInsert = {
    user_id: userId,
    event_type: 'sankranti',
    event_id: window.sankrantiSlug,
    event_instance: 'punyakala',
    local_date: window.localDate,
    audience_variant: 'general',
    title: `${window.sankrantiName} - Punya Kala`,
    body: `Punya Kala auspicious window for Snana and Dana is from ${formattedStart} to ${formattedEnd}. Auspicious transit of Surya Deva.`,
    scheduled_for: scheduledTime.toISOString(),
    expires_at: endDate.toISOString(),
    priority: 30,
    action_url: `/festivals/${window.sankrantiSlug}`,
    timezone: userTimezone,
    source_status: 'verified',
    source_refs: window.sourceRefs,
    metadata: {
      slug: window.sankrantiSlug,
      name: window.sankrantiName,
      local_date: window.localDate,
      punya_kala_start: startDate.toISOString(),
      punya_kala_end: endDate.toISOString(),
      transit_instant: transitInstant,
    },
  };

  return {
    candidate,
    status: 'resolved',
    diagnostics: [],
  };
}
