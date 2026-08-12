/**
 * observance-status-helpers.ts
 *
 * Pure TypeScript helper functions for ObservanceStatusNotice component.
 * Provides data consolidation, status classification, profile eligibility check,
 * and source provenance formatting.
 */

import type { ResolvedCalendarContext } from '@/lib/calendar/calendar-context';
import type { SourceReference } from '@sangam/dharma-rules';
import type { ObservanceAlternative, ObservanceVariantItem } from './ObservanceStatusNotice';

/** Formats tradition / sampradaya key to human label */
export function formatTraditionLabel(traditionKey?: string | null): string {
  if (!traditionKey) return 'Standard / Unspecified';
  const labels: Record<string, string> = {
    smarta: 'Smarta Tradition',
    gaudiya_iskcon: 'Gaudiya Vaishnava',
    sri_vaishnava: 'Sri Vaishnava',
    swaminarayan: 'Swaminarayan',
    shaiva: 'Shaiva',
    shakta: 'Shakta',
    vaishnava: 'Vaishnava Tradition',
    vaishnava_vidhava: 'Vaishnava (Vidhava)',
    vaishnava_suddha: 'Vaishnava (Suddha)',
    unspecified: 'Unspecified Tradition',
  };
  return labels[traditionKey] || traditionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/** Formats source provenance object into clean human string without bare codes */
export function formatSourceProvenance(source?: SourceReference | null): string {
  if (!source?.sourceName || !source?.tier) return 'Source metadata unavailable';
  const citation = source.pageOrSection ? `, ${source.pageOrSection}` : '';
  return `Tier ${source.tier}: ${source.sourceName}${citation}`;
}

export interface NoticeDisplayState {
  isUnsupportedProfile: boolean;
  isUnderReview: boolean;
  isLocationVarianceOnly: boolean;
  consolidatedVariants: ObservanceVariantItem[];
}

/** Resolves notice state and consolidates variants */
export function resolveNoticeDisplayState(params: {
  status?: string;
  reviewStatus?: string;
  isLocationEffectOnly?: boolean;
  primaryDate?: string | null;
  variants?: ObservanceVariantItem[];
  alternatives?: ObservanceAlternative[];
  sourceRefs?: SourceReference[];
  context?: ResolvedCalendarContext;
}): NoticeDisplayState {
  const {
    status = 'resolved',
    reviewStatus,
    isLocationEffectOnly = false,
    primaryDate,
    variants = [],
    alternatives = [],
    sourceRefs = [],
    context,
  } = params;

  // Determine if unsupported or missing profile
  const isUnsupportedProfile = Boolean(
    (context && !context.disclosureDiagnostics?.calendarProfileKnown) ||
    (context && !context.disclosureDiagnostics?.traditionKnown) ||
    context?.disclosureDiagnostics?.resolutionStatus === 'guest' ||
    context?.disclosureDiagnostics?.resolutionStatus === 'invalid_credentials' ||
    context?.disclosureDiagnostics?.resolutionStatus === 'database_failure'
  );

  // Determine under review / unresolved status
  const isUnderReview = Boolean(
    status === 'unresolved' ||
    status === 'under_review' ||
    reviewStatus === 'in_review' ||
    reviewStatus === 'needs_review' ||
    reviewStatus === 'pending_review' ||
    isUnsupportedProfile
  );

  // Determine if location-only date variance
  const isLocationVarianceOnly = Boolean(
    isLocationEffectOnly || (status === 'ambiguous' && alternatives.length === 0)
  );

  // Consolidate all variants into one list
  const consolidatedVariants: ObservanceVariantItem[] = [];

  if (variants.length > 0) {
    consolidatedVariants.push(...variants);
  } else if (alternatives.length > 0) {
    alternatives.forEach((alt, idx) => {
      const tradKey = alt.profile?.tradition || 'unspecified';
      const tradLabel = formatTraditionLabel(tradKey);
      const isPrimaryMatch = !isUnsupportedProfile && primaryDate != null && alt.civilDate === primaryDate;
      const source = alt.sourceRef || sourceRefs[idx] || sourceRefs[0];

      consolidatedVariants.push({
        traditionKey: tradKey,
        traditionLabel: tradLabel,
        civilDate: alt.civilDate,
        isPrimary: isPrimaryMatch,
        profileEligibility: isPrimaryMatch
          ? 'Matches your active profile'
          : `Applies to ${tradLabel}`,
        sourceRef: source,
        note: alt.note || null,
      });
    });
  }

  return {
    isUnsupportedProfile,
    isUnderReview,
    isLocationVarianceOnly,
    consolidatedVariants,
  };
}
