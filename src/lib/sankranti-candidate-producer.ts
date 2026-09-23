/**
 * sankranti-candidate-producer.ts
 *
 * Prompt 7: Solar Sankranti & Punya Kala Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes a verified solar transit (sāṅkrānti) occurrence or Punya Kala window.
 * 2. Derives or validates the sacred Punya Kala snana/dana window.
 * 3. Fails closed with zero candidates and diagnostics on:
 *    - Missing or unparseable transit instant and missing punya kala window
 *    - Polar / high-latitude conditions (|lat| > 60)
 *    - Inverted punya kala window (start >= end)
 * 4. Default-off via getCandidateTypePipelineMode('sankranti').
 * 5. Priority: approved_ritual_window (score 30) for bounded ritual windows,
 *    or reviewed_observance (score 20) for general transit day.
 * 6. Spiritual Content Integrity: Surya Siddhanta & Dharma Sindhu canonical
 *    auspicious transit of Surya Deva.
 */

import { deriveCandidateNotificationKey } from './notification-candidate-key';
import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { NotificationCandidateRow, NotificationPriorityClass } from './notification-resolver';

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

export function produceSankrantiCandidate(
  context: SankrantiCandidateContext,
): SankrantiCandidateResult {
  const mode = getCandidateTypePipelineMode('sankranti');
  if (mode === 'disabled') {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['sankranti pipeline mode is disabled'],
    };
  }

  const { window, userId, userTimezone, wantsSankrantiReminders, wantsObservanceReminders, latitude } = context;

  // 1. Check user preferences
  if (wantsSankrantiReminders === false || wantsObservanceReminders === false) {
    return {
      candidate: null,
      status: 'suppressed',
      diagnostics: ['user opted out of sankranti/observance reminders'],
    };
  }

  // 2. High-latitude / polar check fail-closed
  if (latitude !== undefined && latitude !== null && Math.abs(latitude) > 60) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`polar/high-latitude location (lat=${latitude}): solar transit timing cannot be safely verified`],
    };
  }

  // 3. Resolve Punya Kala Window
  let startDate: Date;
  let endDate: Date;
  let priorityClass: NotificationPriorityClass = 'reviewed_observance';
  let priorityScore = 20;

  const parsedPunyaStart = window.punyaKalaStart ? parseUtcDate(window.punyaKalaStart) : null;
  const parsedPunyaEnd = window.punyaKalaEnd ? parseUtcDate(window.punyaKalaEnd) : null;

  if (parsedPunyaStart && parsedPunyaEnd) {
    startDate = parsedPunyaStart;
    endDate = parsedPunyaEnd;
    priorityClass = 'approved_ritual_window';
    priorityScore = 30;
  } else if (window.transitInstant) {
    const transit = parseUtcDate(window.transitInstant);
    if (!transit) {
      return {
        candidate: null,
        status: 'needs_review',
        diagnostics: ['unparseable solar transit instant'],
      };
    }
    // Standard canonical Punya Kala: 16 ghatikas (~6.4 hours) starting from transit
    startDate = transit;
    endDate = new Date(transit.getTime() + 384 * 60_000); // 384 minutes = 6.4h
    priorityClass = 'approved_ritual_window';
    priorityScore = 30;
  } else {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: ['missing both explicit punya kala window and transit instant'],
    };
  }

  if (startDate.getTime() >= endDate.getTime()) {
    return {
      candidate: null,
      status: 'needs_review',
      diagnostics: [`inverted or zero-length punya kala window (start: ${startDate.toISOString()} >= end: ${endDate.toISOString()})`],
    };
  }

  // 4. Build candidate notification
  const notificationKey = deriveCandidateNotificationKey({
    event_type: 'sankranti',
    event_id: window.sankrantiSlug,
    event_instance: 'punyakala',
    local_date: window.localDate,
    audience_variant: 'general',
  });

  const formattedStart = formatTimeString(startDate, userTimezone);
  const formattedEnd = formatTimeString(endDate, userTimezone);

  // Scheduled 15 minutes before Punya Kala window opens
  const scheduledTime = new Date(startDate.getTime() - 15 * 60_000);

  const candidate: NotificationCandidateRow = {
    id: `cand_sankranti_${window.sankrantiSlug}_${window.localDate}`,
    user_id: userId,
    notification_key: notificationKey,
    event_type: 'sankranti',
    title: `${window.sankrantiName} - Punya Kala`,
    body: `Punya Kala auspicious window for Snana and Dana is from ${formattedStart} to ${formattedEnd}. Auspicious transit of Surya Deva.`,
    scheduled_for: scheduledTime.toISOString(),
    expires_at: endDate.toISOString(),
    priority_class: priorityClass,
    priority_score: priorityScore,
    status: 'pending',
    channel: 'push',
    data: {
      slug: window.sankrantiSlug,
      name: window.sankrantiName,
      local_date: window.localDate,
      punya_kala_start: startDate.toISOString(),
      punya_kala_end: endDate.toISOString(),
      transit_instant: window.transitInstant ? parseUtcDate(window.transitInstant)?.toISOString() : null,
      canonical_source: 'Surya Siddhanta & Dharma Sindhu',
      tradition: 'Sauramana / Smartha',
      deep_link: `/festivals/${window.sankrantiSlug}`,
    },
  };

  return {
    candidate,
    status: 'resolved',
    diagnostics: [],
  };
}
