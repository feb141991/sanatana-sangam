import { calculateObservancesForYear } from './engine';
import { filterWithheldJoinedRows } from './withheld';
import type { SourceReference, EvaluationReason } from '@sangam/dharma-rules';
import rulesData from '@sangam/dharma-rules/src/festivals/rules.json';

// Build a set of slugs that have an explicit citation in rules.json
const CITED_VARIANT_SLUGS = new Set<string>(
  (rulesData as Array<{ slug: string; citation?: string }> )
    .filter(r => !!r.citation)
    .map(r => r.slug)
);

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

/**
 * Picks the rows belonging to the user's chosen calendar profile.
 *
 * THE BUG THIS FIXES
 * ------------------
 * The routes query `.in('calendar_profile', [calendarProfile, 'legacy-ujjain'])`
 * -- the user's profile OR the legacy fallback -- so a user on any non-default
 * profile gets TWO rows per festival. `calendarProfile` was then passed into this
 * formatter and never read. Nothing downstream distinguished the two rows either:
 * they group on `festivalId@lat,lon` (both are computed at Ujjain, so they land
 * together) and the primary is chosen by `spiritual_tradition`, which both rows
 * satisfy identically. The winner was therefore whichever the query returned
 * first, and BOTH were emitted, since no route filters on `isPrimary`.
 *
 * The user-visible damage was worse than a duplicate. Where the two rows disagree
 * -- exactly the amanta/purnimanta cases the profile EXISTS to express -- the
 * uncited-difference branch below flips the entry to 'ambiguous'. Choosing a
 * regional calendar made your own festivals appear disputed, which is precisely
 * backwards.
 *
 * WHY A FALLBACK AND NOT A VARIANT
 * --------------------------------
 * `legacy-ujjain` here is a backstop for festivals not yet materialised under the
 * chosen profile, not a second legitimate reading. Publishing it alongside the
 * user's own profile would assert a disagreement between traditions that nobody
 * claimed -- the error AGENTS.md rule 7 forbids, and the one the grouping comment
 * below already warns about for locations.
 *
 * Users on `legacy-ujjain` (the default) are unaffected: `.in()` collapses the
 * duplicate value, so their rows were never doubled.
 */
function resolveCalendarProfile(rows: any[], calendarProfile: string): any[] {
  if (!calendarProfile) return rows;

  // Keyed by location as well as slug, so this never silently merges rows that
  // differ because they were computed at different places.
  const groups = new Map<string, any[]>();
  for (const row of rows) {
    const slug = row.observance_definitions?.slug ?? '';
    const key = `${slug}@${row.computed_latitude},${row.computed_longitude}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const kept = new Set<any>();
  for (const list of groups.values()) {
    const exact = list.filter(r => r.calendar_profile === calendarProfile);
    // No row under the chosen profile means it was never materialised for it --
    // keep the fallback rather than showing the user nothing.
    for (const r of exact.length > 0 ? exact : list) kept.add(r);
  }
  return rows.filter(r => kept.has(r));
}

export function formatOccurrencesToResults(
  occurrencesRaw: any[],
  queueItems: any[],
  /**
   * Retained for signature stability and for the queue-item path below. Festival
   * filtering by tradition happens in the SQL (`observance_definitions.tradition`),
   * so this must NOT be used for variant selection -- see requestedSampradaya.
   */
  requestedTradition: string,
  calendarProfile: string,
  /**
   * The user's SAMPRADAYA, which is what variant selection actually keys on.
   *
   * `requestedTradition` is 'hindu' | 'sikh' | 'buddhist' | 'jain' and correctly
   * filters WHICH festivals appear. Variant selection below asks a different
   * question -- which reading of one festival, e.g. Smarta vs Vaishnava
   * Janmashtami -- and that lives in `occurrences.spiritual_tradition`. Passing
   * tradition into that comparison could never match, so the user's own
   * sampradaya was never consulted and selection fell through to 'standard' or
   * to index 0, i.e. query order.
   *
   * Latent rather than live today: `spiritual_tradition` is NULL on all 557
   * stored rows, so no variant pair exists to choose between and the dispute
   * branch is unreachable. It would start returning the wrong variant the moment
   * sampradaya-qualified rows are materialised -- which is exactly when nobody
   * would be looking for a selection bug.
   */
  requestedSampradaya: string | null,
  fromStr: string,
  toStr: string
): ClientObservanceResult[] {
  // Withheld rows are dropped HERE rather than in each route, so the three
  // endpoints sharing this formatter cannot diverge and a fourth cannot forget.
  // Stored rows predate the disputed-years gate, so filtering at read time is
  // the only thing that keeps them out of a response.
  const occurrences = resolveCalendarProfile(filterWithheldJoinedRows(occurrencesRaw), calendarProfile);
  const results: ClientObservanceResult[] = [];

  // Keep a map of years to their baseline occurrences so we can look up fallback dates for unresolved ones
  const baselineByYear = new Map<number, any[]>();
  const getBaseline = (year: number) => {
    if (!baselineByYear.has(year)) {
      baselineByYear.set(year, calculateObservancesForYear(year));
    }
    return baselineByYear.get(year)!;
  };

  // 1. Process resolved/disputed occurrences
  for (const row of occurrences) {
    const def = row.observance_definitions;
    if (!def) continue;

    // Collect all diagnostics, preserving latitude_proxy, compressed_night, vrddhi_tithi, extended_moonrise if present
    const diagnosticsList: string[] = Array.isArray(row.diagnostics) ? [...row.diagnostics] : [];
    if (row.reasons && Array.isArray(row.reasons)) {
      for (const r of row.reasons) {
        if (r.code && ['latitude_proxy', 'compressed_night', 'vrddhi_tithi', 'extended_moonrise'].includes(r.code)) {
          if (!diagnosticsList.includes(r.code)) {
            diagnosticsList.push(r.code);
          }
        }
      }
    }

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
      diagnostics: diagnosticsList,
      sourceRefs: (row.source_refs as any) || [],
      reviewStatus: row.review_status || 'reviewed',
      isPrimary: false, // will resolve below
    });
  }

  // 2. Process unresolved queue items ([2] UNCERTAINTY)
  for (const row of queueItems) {
    const def = row.observance_definitions;
    if (!def) continue;

    const baseline = getBaseline(row.year);
    const fallbackDate = baseline.find(occ => occ.slug === def.slug)?.date;
    
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

    // `engine_error` means a reviewer has determined our computed date is WRONG,
    // not merely that we could not settle between candidates. `civilDate` is
    // already null on this path, but the backward-compatible `date` field is
    // populated from targetDates, and leaving a known-wrong value there keeps
    // surfacing it to any caller still reading the old field.
    //
    // The date is still needed to place the row in the requested range -- an
    // observance with no date at all cannot be filtered into a month, and
    // emptying targetDates would make the row disappear completely rather than
    // appear as "under review". So the candidate is kept for RANGE PLACEMENT and
    // blanked at emit time.
    //
    // Net effect: the observance still shows, in the right month, with no date
    // and an under-review notice. A missing date is recoverable; a confidently
    // wrong one is not.
    const isEngineError = row.ambiguity_type === 'engine_error';

    const targetDates = candidateDatesArray.length > 0
      ? candidateDatesArray
      : (fallbackDate ? [fallbackDate] : []);

    const evalDiagnostics: string[] = (row.evaluator_details?.diagnostics as any) || [];

    for (const d of targetDates) {
      if (d >= fromStr && d <= toStr) {
        results.push({
          // Backward compatibility -- blank for EVERY unresolved row, not just
          // engine_error.
          //
          // When no candidate exists the fallback above reruns the legacy engine,
          // so `d` is a GUESSED date. civilDate is correctly null, but this
          // legacy field would still hand that guess to any caller reading it,
          // which is exactly what the contract on the next lines forbids. The
          // guess is kept only long enough to place the row in the requested
          // range, then dropped.
          //
          // Every row emitted in this loop is status 'unresolved', so this is
          // unconditional rather than a special case.
          date: '',
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
          diagnostics: evalDiagnostics,
          sourceRefs: [],
          reviewStatus: 'in_review',
          isPrimary: true, // only representation of this unresolved item
        });
      }
    }
  }

  // 3. Group by festival slug AND location, then classify variants [1], [2], [3], [4].
  //
  // Location MUST be part of the key. The classification below decides "[1] DISPUTE vs
  // [4] LOCATION EFFECT" by counting distinct traditions in the group — a valid test only
  // when every row in the group was computed at the SAME place. None of the three API
  // routes (calendar/day, /month, /upcoming) constrain location in their query, so without
  // this a Smarta row computed at one location and a Gaudiya row computed at another would
  // land in one group, count as two traditions, and be published as a tradition dispute —
  // when the dates may differ purely because the locations do.
  //
  // Not a hypothetical failure mode: we made exactly this error in prose about Janmashtami
  // 2026, reporting it as Smarta 3 Sep vs Vaishnava 4 Sep. At Ujjain both traditions are
  // 4 Sep; the 3 Sep is Bedford-only. Telling a user two sampradayas disagree, when the
  // truth is their longitude moved a sunrise, invents a religious claim (AGENTS.md rule 7).
  const groups = new Map<string, ClientObservanceResult[]>();
  for (const item of results) {
    const key = `${item.festivalId}@${item.location.lat},${item.location.lon}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  for (const [groupKey, list] of groups.entries()) {
    const slug = groupKey.slice(0, groupKey.lastIndexOf('@'));
    if (list.length === 1) {
      list[0].isPrimary = true;
      continue;
    }

    // Multiple candidates/rows exist. Apply [1]/[2]/[3]/[4] classification.
    // [4] Location Effect: rows share a tradition but differ in lat/lon.
    // Filter out location-only duplicates for user's primary view (same tradition, different location).
    // Check if the festival slug has a cited variant in rules.json ([1] DISPUTE).
    const isCitedDispute = CITED_VARIANT_SLUGS.has(slug);

    // Group items by spiritual_tradition to detect [4] LOCATION EFFECT vs [1] DISPUTE
    const itemsByTradition = new Map<string, ClientObservanceResult[]>();
    for (const item of list) {
      const trad = item.profile.tradition || 'standard';
      if (!itemsByTradition.has(trad)) itemsByTradition.set(trad, []);
      itemsByTradition.get(trad)!.push(item);
    }

    // Determine if we have genuine distinct traditions with cited dispute [1]
    if (isCitedDispute && itemsByTradition.size > 1) {
      // [1] DISPUTE: Valid cited variant pair across traditions.
      // Resolve primary based on user's requested profile/tradition.
      let primaryIndex = requestedSampradaya
        ? list.findIndex(item => item.profile.tradition === requestedSampradaya)
        : -1;
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
    } else {
      // NOT a cited dispute. Could be [2] UNCERTAINTY, [3] ERROR, or [4] LOCATION EFFECT.
      // Never publish as a legitimate variant pair!
      // Select the primary item matching user profile/tradition/location.
      let primaryIndex = requestedSampradaya
        ? list.findIndex(item => item.profile.tradition === requestedSampradaya)
        : -1;
      if (primaryIndex === -1) {
        primaryIndex = list.findIndex(item => item.profile.tradition === 'standard' || item.profile.tradition === 'unspecified');
      }
      if (primaryIndex === -1) {
        primaryIndex = 0;
      }

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        item.isPrimary = (i === primaryIndex);
        // Do NOT populate alternatives as variant options for uncited or location-only differences!
        item.alternatives = [];
        if (item.status === 'resolved' && !isCitedDispute && list.some(other => other.civilDate !== item.civilDate)) {
          // If dates differ without a cited rule variant, mark as ambiguous/under review rather than variant pair
          item.status = 'ambiguous';
        }
      }
    }
  }

  return results;
}

