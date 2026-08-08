import { calculateObservancesForYearCorrected } from './engine';
import type { SourceReference, EvaluationReason } from '@sangam/dharma-rules';

export interface ClientObservanceResult {
  // Backward compatibility
  date: string;
  slug: string;
  display_name: string;
  emoji: string;
  kind: "major" | "vrat" | "regional";
  tradition: "hindu" | "sikh" | "buddhist" | "jain" | "all";
  route_kind: string | null;
  route_slug: string | null;
  description: string;

  // ObservanceResult contract
  festivalId: string;
  status: 'resolved' | 'ambiguous' | 'unresolved';
  civilDate: string | null;
  vedicDay?: { start: string; end: string } | null;
  windows?: {
    observance?: { start: string; end: string } | null;
    puja?: { start: string; end: string; name?: string } | null;
    paran?: { start: string; end: string } | null;
  } | null;
  location: {
    label: string;
    lat: number;
    lon: number;
    tz: string;
  };
  profile: {
    calendar: string;
    tradition: string;
  };
  versions: {
    panchangaCore: string;
    calendarProfile: string;
    ruleEngine: string;
    rule: string;
  };
  reasons: EvaluationReason[];
  alternatives: Array<{
    profile: {
      calendar: string;
      tradition: string;
    };
    civilDate: string | null;
    monthLabel?: string | null;
    note?: string | null;
  }>;
  confidence: 'high' | 'medium' | 'low';
  diagnostics: string[];
  sourceRefs: SourceReference[];
  reviewStatus: string;
  isPrimary: boolean;
}

export function formatOccurrencesToResults(
  occurrences: any[],
  queueItems: any[],
  requestedTradition: string,
  calendarProfile: string,
  fromStr: string,
  toStr: string
): ClientObservanceResult[] {
  const results: ClientObservanceResult[] = [];

  // Keep a map of years to their baseline occurrences so we can look up legacy dates for unresolved ones
  const baselineByYear = new Map<number, any[]>();
  const getBaseline = (year: number) => {
    if (!baselineByYear.has(year)) {
      baselineByYear.set(year, calculateObservancesForYearCorrected(year));
    }
    return baselineByYear.get(year)!;
  };

  // 1. Process resolved/disputed occurrences
  for (const row of occurrences) {
    const def = row.observance_definitions;
    if (!def) continue;

    results.push({
      // Backward compatibility
      date: row.date,
      slug: def.slug,
      display_name: def.display_name,
      emoji: def.emoji ?? '🪔',
      kind: def.kind,
      tradition: def.tradition,
      route_kind: def.route_kind,
      route_slug: def.route_slug,
      description: def.description ?? '',

      // ObservanceResult contract
      festivalId: def.slug,
      status: row.review_status === 'needs_review' ? 'ambiguous' : 'resolved',
      civilDate: row.date,
      vedicDay: null,
      windows: null,
      location: {
        label: 'Ujjain, India',
        lat: row.computed_latitude ?? 23.1765,
        lon: row.computed_longitude ?? 75.7885,
        tz: row.computed_timezone ?? 'Asia/Kolkata',
      },
      profile: {
        calendar: row.calendar_profile || 'legacy-ujjain',
        tradition: row.spiritual_tradition || 'standard',
      },
      versions: {
        panchangaCore: row.astronomy_version || '1.0.0',
        calendarProfile: '1.0.0',
        ruleEngine: row.rule_version || '1.0.0',
        rule: '1.0.0',
      },
      reasons: (row.reasons as any) || [],
      alternatives: [],
      confidence: 'high',
      diagnostics: (row.diagnostics as any) || [],
      sourceRefs: (row.source_refs as any) || [],
      reviewStatus: row.review_status || 'reviewed',
      isPrimary: false, // will resolve below
    });
  }

  // 2. Process unresolved queue items
  for (const row of queueItems) {
    const def = row.observance_definitions;
    if (!def) continue;

    const baseline = getBaseline(row.year);
    const legacyDate = baseline.find(occ => occ.slug === def.slug)?.date;
    
    let candidateDatesArray: string[] = [];
    if (row.candidate_dates) {
      if (Array.isArray(row.candidate_dates)) {
        candidateDatesArray = row.candidate_dates;
      } else if (typeof row.candidate_dates === 'string') {
        try {
          candidateDatesArray = JSON.parse(row.candidate_dates);
        } catch {
          // ignore
        }
      }
    }

    const targetDates = candidateDatesArray.length > 0
      ? candidateDatesArray
      : (legacyDate ? [legacyDate] : []);

    for (const d of targetDates) {
      if (d >= fromStr && d <= toStr) {
        results.push({
          // Backward compatibility
          date: d,
          slug: def.slug,
          display_name: def.display_name,
          emoji: def.emoji ?? '🪔',
          kind: def.kind,
          tradition: def.tradition,
          route_kind: def.route_kind,
          route_slug: def.route_slug,
          description: def.description ?? '',

          // ObservanceResult contract
          festivalId: def.slug,
          status: 'unresolved',
          civilDate: null, // "Do NOT show a guessed date with a caveat" -> must be null in contract!
          vedicDay: null,
          windows: null,
          location: {
            label: row.location_label || 'Ujjain, India',
            lat: row.computed_latitude ?? 23.1765,
            lon: row.computed_longitude ?? 75.7885,
            tz: row.computed_timezone ?? 'Asia/Kolkata',
          },
          profile: {
            calendar: row.calendar_profile || 'legacy-ujjain',
            tradition: 'standard',
          },
          versions: {
            panchangaCore: '1.0.0',
            calendarProfile: '1.0.0',
            ruleEngine: '1.0.0',
            rule: '1.0.0',
          },
          reasons: [{ code: row.ambiguity_type, text: row.reasoning }],
          alternatives: [],
          confidence: 'low',
          diagnostics: (row.evaluator_details?.diagnostics as any) || [],
          sourceRefs: [],
          reviewStatus: 'in_review',
          isPrimary: true, // only representation of this unresolved item
        });
      }
    }
  }

  // 3. Group by festival slug (festivalId) to resolve primary variant and alternatives
  // We group items of the same festivalId and year/month context.
  const groups = new Map<string, ClientObservanceResult[]>();
  for (const item of results) {
    const key = item.festivalId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  for (const [_, list] of groups.entries()) {
    if (list.length === 1) {
      list[0].isPrimary = true;
      continue;
    }

    // Multiple variants or candidate dates exist. Let's find the primary one.
    // Preference:
    // 1. row.profile.tradition === requestedTradition
    // 2. row.profile.tradition is standard or null/unspecified
    // 3. First one
    let primaryIndex = list.findIndex(item => item.profile.tradition === requestedTradition);
    if (primaryIndex === -1) {
      primaryIndex = list.findIndex(item => item.profile.tradition === 'standard' || item.profile.tradition === 'unspecified');
    }
    if (primaryIndex === -1) {
      primaryIndex = 0;
    }

    for (let i = 0; i < list.length; i++) {
      list[i].isPrimary = (i === primaryIndex);
    }

    // Populate alternatives for all items in the group
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const otherVariants = list.filter((_, idx) => idx !== i);
      item.alternatives = otherVariants.map(other => ({
        profile: other.profile,
        civilDate: other.civilDate,
        monthLabel: null,
        note: other.status === 'unresolved' ? 'Under Review' : null,
      }));
    }
  }

  return results;
}
