/**
 * series-candidate-producer.ts
 *
 * Prompt 7: Sourced Navratri & Observance Multi-Day Series Candidate Producer.
 *
 * Governance & Integrity Rules:
 * 1. Consumes the canonical sourced observance-series contract (SERIES_DEFINITIONS & SERIES_CONTENT_DATA).
 * 2. Emits candidates ONLY for published, reviewed daily children on their verified date.
 * 3. Never produces unsourced daily colors, mantras, deity claims, or ritual instructions.
 * 4. Fails closed if an occurrence is withheld, unreviewed, or lacks source refs; approved editorial requires a review record.
 * 5. Default-off via getCandidateTypePipelineMode('observance_series').
 */

import { getCandidateTypePipelineMode } from './notification-candidate-pipeline-mode';
import type { Json, NotificationCandidateInsert } from '@/types/database';
import { zonedTimeToUtcIso } from './marketing/social/schedule-time';
import {
  SERIES_DEFINITIONS,
} from './calendar/observance-series';
import seriesContentJson from '@sangam/dharma-rules/src/festivals/series-content.json';
import { isEditorialFieldDisplayable } from './calendar/series-card-helpers';
import type { LocalizedEditorialField } from '../../contracts/observance-series-contract';

type LocalizedField<T> = LocalizedEditorialField<{ en: T; hi?: T; pa?: T }>;

type SeriesContentFile = {
  series: Array<{
    definitionKey: string;
    tradition: string;
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

function getApprovedField<T>(field: LocalizedField<T> | undefined, tradition: string): { value: T; refs: Json[] } | null {
  // Use the same source/review/applicability contract as Native and calendar cards.
  // Human-approved editorial is curated copy, never a purported scripture quotation.
  if (!isEditorialFieldDisplayable(field, { tradition, calendarProfile: 'legacy-ujjain' })
    || field.translationStatus?.en === 'pending') return null;
  return { value: field.value.en, refs: field.sourceRefs as unknown as Json[] };
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
  tradition: string;
  nameEditorial: LocalizedField<string>;
  titleEditorial: LocalizedField<string>;
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
  const seriesNameField = getApprovedField(s.name, s.tradition);
  const totalDays = def?.children.length ?? s.children?.length ?? 0;
  if (!seriesNameField) continue;
  for (const child of (s.children || [])) {
    const canonicalTitleField = getApprovedField(child.canonicalTitle, s.tradition);
    if (!canonicalTitleField) continue;

    CONTENT_BY_SLUG.set(child.slug, {
      seriesName: seriesNameField.value,
      seriesNameRefs: seriesNameField.refs,
      seriesKey: s.definitionKey,
      tradition: s.tradition,
      nameEditorial: s.name!,
      titleEditorial: child.canonicalTitle!,
      sequence: child.sequence,
      totalDays,
      canonicalTitle: canonicalTitleField.value,
      canonicalTitleRefs: canonicalTitleField.refs,
      deityOrTheme: getApprovedField(child.deityOrTheme, s.tradition) ?? undefined,
      rituals: getApprovedField(child.rituals, s.tradition) ?? undefined,
      significance: getApprovedField(child.significance, s.tradition) ?? undefined,
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
    if (content.tradition !== 'all' && content.tradition !== child.tradition) {
      diagnostics.push(`child_${child.slug}_tradition_mismatch`);
      continue;
    }
    const editorialContext = { tradition: child.tradition ?? undefined, calendarProfile: child.calendarProfile ?? undefined };
    if (!isEditorialFieldDisplayable(content.nameEditorial, editorialContext)
      || !isEditorialFieldDisplayable(content.titleEditorial, editorialContext)) {
      diagnostics.push(`child_${child.slug}_editorial_scope_mismatch`);
      continue;
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
