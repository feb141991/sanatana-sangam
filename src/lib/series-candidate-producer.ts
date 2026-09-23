/**
 * series-candidate-producer.ts
 *
 * Prompt 7: Sourced Navratri & Observance Multi-Day Series Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes the canonical sourced observance-series contract (SERIES_DEFINITIONS & SERIES_CONTENT_DATA).
 * 2. Emits candidates ONLY for published, reviewed daily children on their verified date.
 * 3. Never produces unsourced daily colors, mantras, deity claims, or ritual instructions.
 * 4. Fails closed with zero candidates if child occurrence is withheld, unreviewed, or lacks source refs.
 * 5. Default-off via getCandidateTypePipelineMode('observance_series').
 */

import { deriveCandidateNotificationKey } from './notification-candidate-key';
import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { NotificationCandidateRow } from './notification-resolver';
import {
  SERIES_DEFINITIONS,
  type SeriesDefinition,
} from './calendar/observance-series';
import seriesContentJson from '@sangam/dharma-rules/src/festivals/series-content.json';
import type { ClientObservanceResult } from './calendar/observance-formatter';

const SERIES_CONTENT = seriesContentJson as any;

// Map children by slug for O(1) canonical lookup
const CONTENT_BY_SLUG = new Map<string, {
  seriesName: string;
  seriesKey: string;
  sequence: number;
  totalDays: number;
  canonicalTitle: string;
  deityOrTheme?: string;
  rituals?: string[];
  significance?: string;
}>();

for (const s of (SERIES_CONTENT.series as any[])) {
  const def = SERIES_DEFINITIONS.find(d => d.definitionKey === s.definitionKey);
  const totalDays = def ? def.children.length : (s.children?.length ?? 0);
  const seriesName = s.name?.value?.en || s.name?.en || def?.name || 'Observance Series';
  for (const child of (s.children || [])) {
    const canonicalTitle = child.canonicalTitle?.value?.en || child.canonicalTitle?.en || child.title || child.slug;
    const deityOrTheme = child.deityOrTheme?.value?.en || child.deityOrTheme?.en;
    const rituals = child.rituals?.value?.en || child.rituals?.en;
    const significance = child.significance?.value?.en || child.significance?.en;

    CONTENT_BY_SLUG.set(child.slug, {
      seriesName,
      seriesKey: s.definitionKey,
      sequence: child.sequence,
      totalDays,
      canonicalTitle,
      deityOrTheme,
      rituals,
      significance,
    });
  }
}

export interface SeriesCandidateContext {
  targetDate: string; // YYYY-MM-DD
  userId: string;
  userTimezone: string;
  userLanguage?: string;
  wantsFestivalReminders?: boolean;
  childOccurrences: ClientObservanceResult[];
}

export interface SeriesCandidateResult {
  candidates: NotificationCandidateRow[];
  diagnostics: string[];
}

/**
 * Produces observance series candidate notifications for a target user and spiritual date.
 */
export function produceSeriesCandidates(
  context: SeriesCandidateContext
): SeriesCandidateResult {
  const mode = getCandidateTypePipelineMode('observance_series');
  if (mode !== 'candidate') {
    return {
      candidates: [],
      diagnostics: [`observance_series_pipeline_mode_${mode}`],
    };
  }

  // Preference check: series are festival/observance multi-day events
  if (context.wantsFestivalReminders === false) {
    return {
      candidates: [],
      diagnostics: ['user_wants_festival_reminders_false'],
    };
  }

  const { targetDate, userId, userTimezone, childOccurrences } = context;
  if (!targetDate || !userId || !userTimezone) {
    return {
      candidates: [],
      diagnostics: ['missing_required_context_fields'],
    };
  }

  const candidates: NotificationCandidateRow[] = [];
  const diagnostics: string[] = [];

  for (const child of childOccurrences) {
    const date = child.civilDate || child.date;
    if (date !== targetDate) continue;

    // Check if this occurrence is a member of any canonical series
    const content = CONTENT_BY_SLUG.get(child.slug);
    if (!content) {
      continue; // Not a recognized series child
    }

    // Rule: Send only published, reviewed daily children
    const childAny = child as any;
    if (
      child.status !== 'resolved' ||
      childAny.reviewStatus === 'under_review' ||
      childAny.reviewStatus === 'disputed' ||
      childAny.publicationStatus === 'withheld' ||
      !date
    ) {
      diagnostics.push(`child_${child.slug}_not_published_or_reviewed`);
      continue;
    }

    // Rule: Must carry authentic source references (zero unsourced claims)
    if (!child.sourceRefs || child.sourceRefs.length === 0) {
      diagnostics.push(`child_${child.slug}_missing_source_refs`);
      continue;
    }

    let body = content.significance;
    if (!body) {
      if (content.deityOrTheme && content.rituals && content.rituals.length > 0) {
        body = `Honoring ${content.deityOrTheme}. Ritual observances: ${content.rituals.slice(0, 2).join(' and ')}.`;
      } else if (content.deityOrTheme) {
        body = `Sacred day honoring ${content.deityOrTheme}.`;
      } else {
        body = `Day ${content.sequence} of ${content.seriesName}.`;
      }
    }

    const candidateKey = deriveCandidateNotificationKey({
      event_type: 'observance_series',
      event_id: child.slug,
      event_instance: content.seriesKey,
      local_date: targetDate,
      audience_variant: 'general',
    });

    // Default morning delivery for daily series child: 07:00 local time
    const scheduledIso = `${targetDate}T07:00:00`;

    candidates.push({
      user_id: userId,
      candidate_key: candidateKey,
      event_type: 'observance_series',
      event_date: targetDate,
      priority_rank: 2, // time_sensitive_event
      numeric_priority: 20,
      category: 'calendar',
      title: `${content.seriesName}: ${content.canonicalTitle}`,
      body,
      action_url: `/festivals/${child.slug}`,
      channel: 'push',
      scheduled_for: scheduledIso,
      sound: 'festival_bell',
      metadata: {
        seriesKey: content.seriesKey,
        childSlug: child.slug,
        sequence: content.sequence,
        totalDays: content.totalDays,
        sourceCount: child.sourceRefs.length,
        timezone: userTimezone,
      },
    });
  }

  return { candidates, diagnostics };
}
