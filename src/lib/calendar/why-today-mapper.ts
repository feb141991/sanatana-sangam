/**
 * why-today-mapper.ts
 *
 * Pure shared data mapper for Phase 5 "Why today?" calendar observance explanations.
 * Consumes ClientObservanceResult metadata and outputs a structured, human-dignified explanation.
 *
 * Rules:
 * - Do not expose internal debug text or fabricate explanations.
 * - Map technical evaluation reasons into concise, respectful human prose.
 * - Highlight required disclosures (latitude_proxy, compressed_night, vrddhi_tithi, extended_moonrise).
 * - Preserve under-review/disputed states and candidate alternatives.
 */

import type { ClientObservanceResult } from './observance-formatter';
import type { ResolvedCalendarContext } from './calendar-context';
import type { SourceTier } from '@sangam/dharma-rules';

export interface WhyTodayReason {
  code: string;
  label: string;
  description: string;
}

export interface WhyTodayRitualWindow {
  type: 'vedic_day' | 'observance' | 'puja' | 'paran';
  label: string;
  timeRange: string;
}

export interface WhyTodaySource {
  title: string;
  tier: string;
  tierNumber: SourceTier;
  citation?: string;
}

export interface WhyTodayDisclosure {
  code: string;
  label: string;
  description: string;
  severity: 'info' | 'warning';
}

export interface WhyTodayAlternative {
  traditionLabel: string;
  civilDate: string | null;
  formattedDate: string;
  note?: string | null;
}

import { resolveMonthLabelForProfile, type MonthLabelResult } from './month-label-resolver';

export interface WhyTodayExplanation {
  festivalId: string;
  title: string;
  description: string;
  emoji: string;
  civilDate: string | null;
  formattedDate: string;
  profileLabel: string;
  locationLabel: string;
  monthLabel?: MonthLabelResult | null;
  reasons: WhyTodayReason[];
  ritualWindows: WhyTodayRitualWindow[];
  sources: WhyTodaySource[];
  disclosures: WhyTodayDisclosure[];
  reviewState: {
    isUnderReview: boolean;
    statusLabel: string;
    reviewReason?: string;
  };
  alternatives: WhyTodayAlternative[];
}

/** Mapping dictionary for evaluation reason codes into concise, dignified prose */
const REASON_DICTIONARY: Record<string, { label: string; description: string }> = {
  tithi_sunrise_match: {
    label: 'Sunrise Tithi Match',
    description: 'The lunar tithi was active at local sunrise, establishing the Vedic day boundary.',
  },
  kshaya_tithi_resolution: {
    label: 'Skipped Tithi Rule (Kshaya)',
    description: 'The lunar tithi does not touch a sunrise; observance is resolved according to tradition policy.',
  },
  vrddhi_tithi_resolution: {
    label: 'Extended Tithi Rule (Vrddhi)',
    description: 'The tithi spans across two sunrises; primary observance is placed on the principal day.',
  },
  purvadhna_window_match: {
    label: 'Purvadhna Timing Match',
    description: 'The tithi coincides with morning hours (Purvadhna), optimal for morning vrat vows.',
  },
  madhyahna_window_match: {
    label: 'Madhyahna Timing Match',
    description: 'The tithi intersects midday (Madhyahna), the canonical window for puja rituals.',
  },
  pradosha_window_match: {
    label: 'Pradosha Timing Match',
    description: 'The tithi intersects evening twilight (Pradosha), the prescribed window for evening vrata.',
  },
  nishita_window_match: {
    label: 'Nishita Timing Match',
    description: 'The tithi aligns with midnight (Nishita Kala), the prescribed time for midnight celebrations.',
  },
  moonrise_window_match: {
    label: 'Moonrise Alignment',
    description: 'The observance aligns with local moonrise, as required for fast-breaking rituals.',
  },
  smarta_tradition_rule: {
    label: 'Smarta Tradition Standard',
    description: 'Date calculated using standard Smarta sunrise tithi rules.',
  },
  vaishnava_tradition_rule: {
    label: 'Vaishnava Suddha Rule',
    description: 'Date calculated using Vaishnava Suddha rules, requiring Arunodaya purity.',
  },
  disputed_year: {
    label: 'Under Governance Review',
    description: 'Multiple recognized source dates exist for this year; universal publication is withheld.',
  },
  engine_error: {
    label: 'Engine Ambiguity',
    description: 'Calculations yielded conflicting constraints requiring scholar review.',
  },
};

/** Required disclosures mapping */
const DISCLOSURE_DICTIONARY: Record<string, { label: string; description: string; severity: 'info' | 'warning' }> = {
  latitude_proxy: {
    label: 'High-Latitude Proxy Applied',
    description: 'High latitude prevents standard solar sunrise; astronomical proxy coordinates were used to determine daily timings.',
    severity: 'warning',
  },
  compressed_night: {
    label: 'Compressed Night Adjustments',
    description: 'Night duration is exceptionally short at this location; night ritual windows have been proportionally scaled.',
    severity: 'info',
  },
  vrddhi_tithi: {
    label: 'Vrddhi Tithi (Double Sunrise)',
    description: 'This lunar tithi touches two consecutive sunrises.',
    severity: 'info',
  },
  extended_moonrise: {
    label: 'Extended Moonrise Window',
    description: 'Moonrise occurs late in the evening or past midnight local time.',
    severity: 'info',
  },
  incomplete_profile_materialisation: {
    label: 'Fallback Calendar Active',
    description: 'Showing Ujjain reference calendar while complete regional materialization is underway.',
    severity: 'warning',
  },
  unspecified_tradition_default: {
    label: 'Unspecified Tradition Default',
    description: 'Calculated using standard Smarta guidelines as no specific tradition profile was selected.',
    severity: 'info',
  },
};

/** Formats ISO date into human-readable date */
function formatHumanDate(dateStr: string | null | undefined): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'Date Under Review';
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Formats regional calendar profile ID into human label */
function formatProfileLabel(calendarProfile?: string, traditionProfile?: string): string {
  const formatSlug = (value?: string) => value
    ? value.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    : 'Unspecified';
  const calendarMatch = calendarProfile?.match(/^(.*)_(amanta|purnimanta|solar)$/);
  const cal = calendarMatch
    ? `${formatSlug(calendarMatch[1])} (${formatSlug(calendarMatch[2])})`
    : formatSlug(calendarProfile);
  const trad = formatSlug(traditionProfile);
  return `${cal} · ${trad}`;
}

/** Formats location object into human string */
function formatLocationLabel(loc?: { label?: string; lat?: number; lon?: number; tz?: string }): string {
  if (!loc) return 'Ujjain, India (Reference Location)';
  const label = loc.label || 'Ujjain, India';
  const latStr = loc.lat != null ? `${Math.abs(loc.lat).toFixed(4)}° ${loc.lat >= 0 ? 'N' : 'S'}` : '';
  const lonStr = loc.lon != null ? `${Math.abs(loc.lon).toFixed(4)}° ${loc.lon >= 0 ? 'E' : 'W'}` : '';
  const coords = [latStr, lonStr].filter(Boolean).join(', ');
  return coords ? `${label} (${coords})` : label;
}

/** Maps ClientObservanceResult into WhyTodayExplanation */
export function mapWhyTodayExplanation(
  result: ClientObservanceResult,
  context?: ResolvedCalendarContext
): WhyTodayExplanation {
  const civilDate = result.civilDate ?? (result.date || null);
  const formattedDate = formatHumanDate(civilDate);
  const profileLabel = formatProfileLabel(result.profile?.calendar, result.profile?.tradition);
  const locationLabel = formatLocationLabel(result.location);

  const monthLabel = resolveMonthLabelForProfile(
    civilDate,
    {
      corrected_lunar_masa_name: result.corrected_lunar_masa_name,
      corrected_month_system: result.corrected_month_system,
      lunar_tithi_index: result.lunar_tithi_index,
    },
    context?.monthSystem
  );

  // 1. Reasons mapping
  const reasons: WhyTodayReason[] = [];
  if (Array.isArray(result.reasons)) {
    for (const r of result.reasons) {
      const code = r.code || 'general';
      const mapped = REASON_DICTIONARY[code];
      if (mapped) {
        reasons.push({
          code,
          label: mapped.label,
          description: r.text || mapped.description,
        });
      } else if (r.text) {
        // Human text without internal debug jargon
        const cleanText = r.text.replace(/\[debug:.*?\]/gi, '').trim();
        if (cleanText) {
          reasons.push({
            code,
            label: code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: cleanText,
          });
        }
      }
    }
  }

  // 2. Ritual Windows mapping
  const ritualWindows: WhyTodayRitualWindow[] = [];
  if (result.vedicDay) {
    ritualWindows.push({
      type: 'vedic_day',
      label: 'Vedic Sunrise Day',
      timeRange: `${result.vedicDay.start} – ${result.vedicDay.end}`,
    });
  }
  if (result.windows?.observance) {
    ritualWindows.push({
      type: 'observance',
      label: 'Observance Window',
      timeRange: `${result.windows.observance.start} – ${result.windows.observance.end}`,
    });
  }
  if (result.windows?.puja) {
    ritualWindows.push({
      type: 'puja',
      label: result.windows.puja.name || 'Puja Muhurta',
      timeRange: `${result.windows.puja.start} – ${result.windows.puja.end}`,
    });
  }
  if (result.windows?.paran) {
    ritualWindows.push({
      type: 'paran',
      label: 'Paran (Fast-Breaking)',
      timeRange: `${result.windows.paran.start} – ${result.windows.paran.end}`,
    });
  }

  // 3. Source References mapping
  const sources: WhyTodaySource[] = [];
  if (Array.isArray(result.sourceRefs)) {
    for (const s of result.sourceRefs) {
      if (!s?.sourceName || !s?.tier) continue;
      sources.push({
        title: s.sourceName,
        tier: `Tier ${s.tier}`,
        tierNumber: s.tier,
        citation: s.pageOrSection || undefined,
      });
    }
  }

  // 4. Diagnostics disclosures mapping
  const disclosures: WhyTodayDisclosure[] = [];
  const diagnosticsList = Array.isArray(result.diagnostics) ? result.diagnostics : [];

  for (const diagCode of diagnosticsList) {
    const disc = DISCLOSURE_DICTIONARY[diagCode];
    if (disc) {
      disclosures.push({
        code: diagCode,
        label: disc.label,
        description: disc.description,
        severity: disc.severity,
      });
    }
  }

  // Context disclosure additions
  if (context?.disclosureDiagnostics?.isUnspecifiedLabel) {
    if (!disclosures.some(d => d.code === 'unspecified_tradition_default')) {
      const disc = DISCLOSURE_DICTIONARY.unspecified_tradition_default;
      disclosures.push({
        code: 'unspecified_tradition_default',
        label: disc.label,
        description: disc.description,
        severity: disc.severity,
      });
    }
  }

  if (monthLabel?.isDivergentFromRuleDefault) {
    disclosures.push({
      code: 'month_system_label_adjusted',
      label: `Month System Label (${monthLabel.monthSystem})`,
      description: `Displayed month name is "${monthLabel.monthName}" under your profile's ${monthLabel.monthSystem} calendar system on this unchanged civil date.`,
      severity: 'info',
    });
  }

  // 5. Review State mapping
  const isUnderReview =
    result.status === 'under_review' ||
    result.status === 'unresolved' ||
    result.status === 'ambiguous' ||
    result.reviewStatus === 'in_review' ||
    result.reviewStatus === 'pending_review';

  const statusLabel = isUnderReview
    ? 'Under Governance Review'
    : sources.length > 0
      ? 'Published with Source Metadata'
      : 'Published Calendar Result';

  const reviewReason = isUnderReview
    ? reasons.find(r => r.code === 'disputed_year' || r.code === 'engine_error')?.description ||
      'Multiple recognized variants exist for this observance; universal publication is withheld.'
    : undefined;

  // 6. Alternatives mapping
  const alternatives: WhyTodayAlternative[] = [];
  if (Array.isArray(result.alternatives)) {
    for (const alt of result.alternatives) {
      const tradLabel = formatProfileLabel(alt.profile?.calendar, alt.profile?.tradition);
      alternatives.push({
        traditionLabel: tradLabel,
        civilDate: alt.civilDate,
        formattedDate: formatHumanDate(alt.civilDate),
        note: alt.note || null,
      });
    }
  }

  return {
    festivalId: result.festivalId || result.slug || 'observance',
    title: result.display_name || 'Observance',
    description: result.description || '',
    emoji: result.emoji || '🪔',
    civilDate,
    formattedDate,
    profileLabel,
    locationLabel,
    monthLabel,
    reasons,
    ritualWindows,
    sources,
    disclosures,
    reviewState: {
      isUnderReview,
      statusLabel,
      reviewReason,
    },
    alternatives,
  };
}
