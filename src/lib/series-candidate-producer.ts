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

import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { Json, NotificationCandidateInsert } from '@/types/database';
import { zonedTimeToUtcIso } from './marketing/social/schedule-time';
import {
  SERIES_DEFINITIONS,
  type SeriesDefinition,
} from './calendar/observance-series';
import seriesContentJson from '@sangam/dharma-rules/src/festivals/series-content.json';

type LocalizedField<T> = {
  value?: { en?: T };
  en?: T;
  status?: string;
  sourceRefs?: Json[];
};

type SeriesContentFile = {
  series: Array<{
    definitionKey: string;
    name?: LocalizedField<string>;
    children?: Array<{
      slug: string;
      sequence: number;
      canonicalTitle?: LocalizedField<string>;
      deityOrTheme?: LocalizedField<string>;
      rituals?: LocalizedField<string[]>;
      significance?: LocalizedField<string>;
    }>;
  }>;
};

const SERIES_CONTENT = seriesContentJson as SeriesContentFile;

function getSourceBackedField<T>(field: LocalizedField<T> | undefined): { value: T; refs: Json[] } | null {
  if (field?.status !== 'source_backed' || !Array.isArray(field.sourceRefs) || field.sourceRefs.length === 0) return null;
  const value = field.value?.en ?? field.en;
  return value === undefined ? null : { value, refs: field.sourceRefs };
}

export interface ReviewedSeriesOccurrence {
  id?: string | null;
  slug: string;
  civilDate: string | null;
  status: string;
  reviewStatus: string;
  publicationStatus: string | null;
  verificationStatus: string | null;
  auditStatus: string | null;
  finalDateSource: string | null;
  sourceRefs: Json[];
  calendarProfile: string | null;
  tradition: string | null;
}

// Map children by slug for O(1) canonical lookup
const CONTENT_BY_SLUG = new Map<string, {
  seriesName: string;
  seriesNameRefs: Json[];
  seriesKey: string;
  sequence: number;
  totalDays: number;
  canonicalTitle: string;
  canonicalTitleRefs: Json[];
  deityOrTheme?: { value: string; refs: Json[] };
  rituals?: { value: string[]; refs: Json[] };
  significance?: { value: string; refs: Json[] };
}>();

for (const s of SERIES_CONTENT.series) {
  const def = SERIES_DEFINITIONS.find(d => d.definitionKey === s.definitionKey);
  const seriesNameField = getSourceBackedField(s.name);
  const totalDays = def?.children.length ?? s.children?.length ?? 0;
  if (!seriesNameField) continue;
  for (const child of (s.children || [])) {
    const canonicalTitleField = getSourceBackedField(child.canonicalTitle);
    if (!canonicalTitleField) continue;

    CONTENT_BY_SLUG.set(child.slug, {
      seriesName: seriesNameField.value,
      seriesNameRefs: seriesNameField.refs,
      seriesKey: s.definitionKey,
      sequence: child.sequence,
      totalDays,
      canonicalTitle: canonicalTitleField.value,
      canonicalTitleRefs: canonicalTitleField.refs,
      deityOrTheme: getSourceBackedField(child.deityOrTheme) ?? undefined,
      rituals: getSourceBackedField(child.rituals) ?? undefined,
      significance: getSourceBackedField(child.significance) ?? undefined,
    });
  }
}

export interface SeriesCandidateContext {
  targetDate: string; // YYYY-MM-DD
  userId: string;
  userTimezone: string;
  wantsFestivalReminders?: boolean;
  childOccurrences: ReviewedSeriesOccurrence[];
}

export interface SeriesCandidateResult {
  candidates: NotificationCandidateInsert[];
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

  const candidates: NotificationCandidateInsert[] = [];
  const diagnostics: string[] = [];

  for (const child of childOccurrences) {
    const date = child.civilDate;
    if (date !== targetDate) continue;

    // Check if this occurrence is a member of any canonical series
    const content = CONTENT_BY_SLUG.get(child.slug);
    if (!content) {
      continue; // Not a recognized series child
    }

    // Rule: Send only published, reviewed daily children
    if (
      child.status !== 'resolved' ||
      child.reviewStatus !== 'reviewed' ||
      child.verificationStatus !== 'verified' ||
      child.publicationStatus !== 'published' ||
      child.auditStatus !== 'completed' ||
      child.finalDateSource === 'fallback' ||
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

    const body = content.significance?.value
      ?? (content.deityOrTheme && content.rituals
        ? `Honoring ${content.deityOrTheme.value}. Ritual observances: ${content.rituals.value.slice(0, 2).join(' and ')}.`
        : content.deityOrTheme
          ? `Sacred day honoring ${content.deityOrTheme.value}.`
          : `Day ${content.sequence} of ${content.seriesName}.`);
    const contentRefs = [
      ...content.seriesNameRefs,
      ...content.canonicalTitleRefs,
      ...(content.significance?.refs ?? []),
      ...(content.deityOrTheme?.refs ?? []),
      ...(content.rituals?.refs ?? []),
    ];
    const sourceRefs = [...new Map([...child.sourceRefs, ...contentRefs].map((ref) => [JSON.stringify(ref), ref])).values()];

    // Default morning delivery for daily series child: 07:00 local time
    let scheduledIso: string;
    try {
      scheduledIso = zonedTimeToUtcIso(targetDate, '07:00', userTimezone);
    } catch {
      diagnostics.push(`child_${child.slug}_invalid_timezone_or_local_schedule`);
      continue;
    }
    const expiresAt = new Date(new Date(scheduledIso).getTime() + 24 * 60 * 60 * 1000).toISOString();

    candidates.push({
      user_id: userId,
      event_type: 'observance_series',
      event_id: child.slug,
      event_instance: content.seriesKey,
      local_date: targetDate,
      audience_variant: 'general',
      priority: 20,
      title: `${content.seriesName}: ${content.canonicalTitle}`,
      body,
      action_url: `/festivals/${child.slug}`,
      scheduled_for: scheduledIso,
      expires_at: expiresAt,
      timezone: userTimezone,
      tradition: child.tradition,
      calendar_profile: child.calendarProfile,
      source_status: 'verified',
      source_refs: sourceRefs,
      metadata: {
        seriesKey: content.seriesKey,
        childSlug: child.slug,
        sequence: content.sequence,
        totalDays: content.totalDays,
        sourceCount: sourceRefs.length,
        timezone: userTimezone,
      },
    });
  }

  return { candidates, diagnostics };
}
