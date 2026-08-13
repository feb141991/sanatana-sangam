import { isBatchTrustworthy, type BatchRow } from './materialisation-batch';
import { filterWithheldJoinedRows } from './withheld';
import { resolveCalendarContext, type ResolvedCalendarContext } from './calendar-context';
import { selectTraditionVariant, type EkadashiVariantCandidate } from './ekadashi-selection';
import { resolveMonthLabelForProfile, type MonthLabelResult } from './month-label-resolver';
import type { SourceReference, EvaluationReason } from '@sangam/dharma-rules';
import rulesData from '@sangam/dharma-rules/src/festivals/rules.json';

// Build a set of slugs that have an explicit citation in rules.json
/**
 * Slugs whose rule emits a SERIES rather than a single dated instance.
 *
 * Ekadashi and Pradosh produce ~24 occurrences a year under one slug. Every
 * grouping in this file that means "one observance instance" must therefore
 * exclude them, or the whole series collapses into a single group and gets
 * classified as though its members were competing readings of one date.
 */
const RECURRING_SLUGS = new Set<string>(
  (rulesData as Array<{ slug: string; rule_family?: string }>)
    .filter(r => r.rule_family === 'lunar_tithi_recurring' || r.rule_family === 'weekday_recurring')
    .map(r => r.slug)
);

const CITED_VARIANT_SLUGS = new Set<string>(
  (rulesData as Array<{ slug: string; citation?: string }> )
    .filter(r => !!r.citation)
    .map(r => r.slug)
);

/**
 * slug -> the rule's own corrected-masa fields, for month-label resolution
 * (src/lib/calendar/month-label-resolver.ts). First-match-wins where a slug
 * has multiple variant rows (e.g. krishna-janmashtami's Smarta/Gaudiya
 * rows) -- every variant observed shares identical corrected_month_system/
 * corrected_lunar_masa_name, only citation/sampradaya differ.
 */
const RULE_MONTH_FIELDS_BY_SLUG = new Map<
  string,
  { corrected_lunar_masa_name?: string; corrected_month_system?: string; lunar_tithi_index?: number }
>();
for (const r of rulesData as Array<{
  slug: string;
  corrected_lunar_masa_name?: string;
  corrected_month_system?: string;
  lunar_tithi_index?: number;
}>) {
  if (!RULE_MONTH_FIELDS_BY_SLUG.has(r.slug)) {
    RULE_MONTH_FIELDS_BY_SLUG.set(r.slug, {
      corrected_lunar_masa_name: r.corrected_lunar_masa_name,
      corrected_month_system: r.corrected_month_system,
      lunar_tithi_index: r.lunar_tithi_index,
    });
  }
}

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
  variantKey?: string | null;
  status: 'resolved' | 'ambiguous' | 'unresolved' | 'under_review';
  civilDate: string | null;
  /** Candidate dates may be disclosed for review, but never treated as confirmed. */
  candidateDates: string[];
  /** Used only to place a review item in a day/month response; never a confirmed date. */
  reviewPlacementDate: string | null;
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
  /**
   * The rule's own corrected-masa fields, for month-label resolution
   * (src/lib/calendar/month-label-resolver.ts). Not part of the original
   * ObservanceResult contract -- added so callers no longer need an `any`
   * cast to reach these fields (see why-today-mapper.ts).
   */
  corrected_lunar_masa_name?: string | null;
  corrected_month_system?: string | null;
  lunar_tithi_index?: number | null;
  /**
   * Display-layer label for the viewer's own calendar_profile month-system,
   * resolved against this SAME civilDate (never a different one -- see
   * month-label-resolver.ts's governing invariant). Null when civilDate is
   * unresolved/withheld, or when the viewer's profile has no month_system.
   */
  monthLabel?: MonthLabelResult | null;
  alternatives: Array<{
    variantKey?: string | null;
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

/** The profile every pre-contract row carries; it is the fallback itself. */
const DEFAULT_FALLBACK_PROFILE = 'legacy-ujjain';

/**
 * Clips occurrence rows to the requested window.
 *
 * The routes over-fetch by a pad so profile resolution can see rows just outside
 * the window (see the call site). That pad must not reach the response, or a
 * "September" request would return August dates.
 */
function clipToRange<T>(rows: T[], fromStr: string, toStr: string): T[] {
  return rows.filter(row => {
    const d = (row as any).date ?? (row as any).occurrence_date;
    // A row with no date cannot be placed; keep it rather than silently dropping
    // it, so the fault surfaces instead of a festival quietly vanishing.
    if (!d) return true;
    return d >= fromStr && d <= toStr;
  });
}

function resolveCalendarProfile<T>(
  rows: T[],
  calendarProfile: string,
  requireCompleteBatch = true,
): T[] {
  if (!calendarProfile) return rows;

  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const r = row as any;
    const slug = r.observance_definitions?.slug ?? '';
    const year = r.year ?? String(r.date ?? r.occurrence_date ?? '').slice(0, 4);
    const key = `${slug}|${year}|${r.computed_latitude},${r.computed_longitude}|${r.computed_timezone ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const kept = new Set<T>();
  for (const list of groups.values()) {
    const exact = list.filter(r => (r as any).calendar_profile === calendarProfile);
    const fallback = list.filter(r => (r as any).calendar_profile !== calendarProfile);

    if (exact.length === 0) {
      for (const r of list) {
        kept.add(r);
        const materialisation = r as unknown as { requested_profile_family_incomplete?: boolean };
        if (materialisation.requested_profile_family_incomplete === true) {
          (r as unknown as { __incompleteProfileBatch?: string }).__incompleteProfileBatch = calendarProfile;
        }
      }
      continue;
    }

    const complete = !requireCompleteBatch
      || (exact.length > 0 && exact.every(r => {
        const materialisation = r as unknown as {
          batch?: BatchRow | null;
          batch_family_complete?: boolean;
        };
        return isBatchTrustworthy(materialisation.batch)
          && materialisation.batch_family_complete === true;
      }));

    if (!complete && fallback.length > 0) {
      for (const r of fallback) {
        kept.add(r);
        (r as any).__incompleteProfileBatch = calendarProfile;
      }
      continue;
    }

    if (!complete) {
      const isDefaultFallback = calendarProfile === DEFAULT_FALLBACK_PROFILE;
      for (const r of exact) {
        kept.add(r);
        if (!isDefaultFallback) (r as any).__incompleteProfileBatch = calendarProfile;
      }
      continue;
    }

    for (const r of exact) kept.add(r);
  }
  return rows.filter(r => kept.has(r));
}

export function formatOccurrencesToResults(
  occurrencesRaw: any[],
  queueItemsRaw: any[],
  requestedTradition: string,
  calendarProfile: string,
  requestedSampradaya: string | null,
  fromStr: string,
  toStr: string,
  calendarContext?: ResolvedCalendarContext,
): ClientObservanceResult[] {
  const context = calendarContext ?? resolveCalendarContext({
    calendarProfile,
    traditionProfile: requestedSampradaya || requestedTradition,
  });
  // Withheld rows are dropped HERE rather than in each route, so the three
  // endpoints sharing this formatter cannot diverge and a fourth cannot forget.
  // Stored rows predate the disputed-years gate, so filtering at read time is
  // the only thing that keeps them out of a response.
  // ORDER MATTERS: withheld -> profile -> range.
  //
  // Profile precedence must be decided BEFORE the requested window is applied.
  // The routes now fetch a padded range precisely so this can see across the
  // boundary: if the chosen profile puts a festival on 1 September and the legacy
  // fallback puts it on 31 August, an August query that had already been clipped
  // would contain only the legacy row, and the "not materialised for this
  // profile" fallback below would fire and publish it. The profile row exists --
  // it is just one day outside the window. Resolving first distinguishes
  // "not materialised" from "materialised just outside the window"; clipping
  // afterwards keeps the response honest to what was asked for.
  const occurrences = clipToRange(
    resolveCalendarProfile(filterWithheldJoinedRows(occurrencesRaw), calendarProfile),
    fromStr,
    toStr,
  );
  // Queue items are fetched with the same two-profile `.in()`, so they need the
  // same resolution. They are range-filtered separately further down, against
  // their candidate dates rather than a stored date.
  // `requireCompleteBatch: false` -- see the parameter's note. Queue rows are
  // unresolved questions rather than materialised occurrences, so completeness
  // is not a property they can have.
  const queueItems = resolveCalendarProfile(queueItemsRaw, calendarProfile, false);
  const results: ClientObservanceResult[] = [];
  // Instance year per emitted result. Held beside the results rather than on
  // them because ClientObservanceResult is the public API shape, and grouping is
  // an internal concern. An unresolved row has its `date` blanked deliberately,
  // so the year cannot be recovered from the result afterwards -- it has to be
  // captured here, at emit time, while the source row is still in hand.
  const instanceYear = new WeakMap<ClientObservanceResult, string>();
  // The materialiser's own instance identity, when the row has one. Preferred
  // over anything derived here -- see the grouping note below.
  const instanceKey = new WeakMap<ClientObservanceResult, string>();
  const emit = (
    result: ClientObservanceResult,
    year: string | number | null | undefined,
    seriesInstanceKey?: string | null,
  ) => {
    results.push(result);
    if (year) instanceYear.set(result, String(year));
    if (seriesInstanceKey) instanceKey.set(result, seriesInstanceKey);
  };

  // 1. Process resolved/disputed occurrences
  for (const row of occurrences) {
    const def = row.observance_definitions;
    if (!def) continue;

    // Collect all diagnostics, preserving latitude_proxy, compressed_night, vrddhi_tithi, extended_moonrise if present
    const diagnosticsList: string[] = Array.isArray(row.diagnostics) ? [...row.diagnostics] : [];
    // Set by resolveCalendarProfile when the chosen profile had fewer rows than
    // the fallback for this slug-year, i.e. a partial materialisation. Surfaced
    // so the condition is observable instead of silently changing which calendar
    // a user is reading.
    if (row.__incompleteProfileBatch) diagnosticsList.push('incomplete_profile_materialisation');
    if (row.reasons && Array.isArray(row.reasons)) {
      for (const r of row.reasons) {
        if (r.code && ['latitude_proxy', 'compressed_night', 'vrddhi_tithi', 'extended_moonrise'].includes(r.code)) {
          if (!diagnosticsList.includes(r.code)) {
            diagnosticsList.push(r.code);
          }
        }
      }
    }

    emit({
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
      variantKey: row.variant_key ?? null,
      status: row.review_status === 'needs_review' ? 'ambiguous' : 'resolved',
      civilDate: row.date,
      candidateDates: row.date ? [row.date] : [],
      reviewPlacementDate: row.date ?? null,
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
      corrected_lunar_masa_name: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.corrected_lunar_masa_name ?? null,
      corrected_month_system: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.corrected_month_system ?? null,
      lunar_tithi_index: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.lunar_tithi_index ?? null,
      alternatives: [],
      confidence: 'high',
      diagnostics: diagnosticsList,
      sourceRefs: (row.source_refs as any) || [],
      reviewStatus: row.review_status || 'reviewed',
      isPrimary: false, // will resolve below
    }, row.year ?? String(row.date ?? "").slice(0, 4), row.series_instance_key);
  }

  // 2. Process unresolved queue items ([2] UNCERTAINTY)
  for (const row of queueItems) {
    const def = row.observance_definitions;
    if (!def) continue;

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

    // A queue item with no candidates remains available to the council in the
    // persisted review queue, but cannot honestly be placed on a user calendar.
    // Never rerun the engine here to manufacture a placement date.
    const targetDates = candidateDatesArray;

    const evalDiagnostics: string[] = (row.evaluator_details?.diagnostics as any) || [];

    for (const d of targetDates) {
      if (d >= fromStr && d <= toStr) {
        emit({
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
          variantKey: row.variant_key ?? null,
          status: 'unresolved',
          civilDate: null, // "Do NOT show a guessed date with a caveat" -> must be null in contract!
          candidateDates: candidateDatesArray,
          reviewPlacementDate: d,
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
            tradition: row.spiritual_tradition || 'unspecified',
          },
          versions: {
            panchangaCore: '1.0.0',
            calendarProfile: '1.0.0',
            ruleEngine: '1.0.0',
            rule: '1.0.0',
          },
          reasons: [{ code: row.ambiguity_type, text: row.reasoning }],
          corrected_lunar_masa_name: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.corrected_lunar_masa_name ?? null,
          corrected_month_system: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.corrected_month_system ?? null,
          lunar_tithi_index: RULE_MONTH_FIELDS_BY_SLUG.get(def.slug)?.lunar_tithi_index ?? null,
          alternatives: [],
          confidence: 'low',
          diagnostics: evalDiagnostics,
          sourceRefs: [],
          reviewStatus: 'in_review',
          isPrimary: true, // only representation of this unresolved item
        }, row.year ?? String(d ?? "").slice(0, 4));
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
  // The key must identify ONE OBSERVANCE INSTANCE, not one festival. Keying on
  // slug+location alone collapsed every Ekadashi in the range into a single
  // group, and the classification below then read them as competing readings of
  // one date: a probe with three ordinary March Ekadashis returned all three as
  // 'ambiguous' with only the first isPrimary, so any consumer honouring
  // isPrimary would drop two real observances.
  //
  // For a recurring series each row IS its own instance, so the date completes
  // the key. Genuine variants of one recurring instance cannot be expressed this
  // way -- two sampradayas observing the same Ekadashi on different days would
  // look like two instances -- but that needs a stored series/instance
  // identifier, which no column provides today. Recorded rather than papered
  // over: nothing materialises recurring variants at present, and inventing an
  // identity here would guess at pairings the data does not state.
  const groups = new Map<string, ClientObservanceResult[]>();
  for (const item of results) {
    // YEAR belongs in the key for EVERY observance, not only recurring ones.
    // Restricting the date component to recurring slugs left annual festivals
    // keyed on slug+location alone, so Diwali 2026 and Diwali 2027 -- two
    // instances an `upcoming` window can legitimately span -- grouped together
    // and were classified as competing readings of one date: both 'ambiguous',
    // one primary. Two separate years of the same festival are not a dispute.
    //
    // This is the third time the same shape of bug has appeared in this file, and
    // each time the test asserted the rows were PRESENT without asserting what
    // they were. Cardinality is the thing to check.
    const year = instanceYear.get(item) ?? '';

    // STORED KEY WINS. `series_instance_key` is written by the materialiser from
    // the instance the row was actually derived from, so it states the identity
    // rather than guessing it. That matters most in the case the date CANNOT
    // express: two sampradaya readings of one Ekadashi fall on different days by
    // definition, so date-as-identity reads them as two observances and loses the
    // variant. Only rows written under the batch contract carry it.
    //
    // Rows without one are the 557 pre-contract legacy rows, which fall back to
    // the derived key: slug + year, plus the date for recurring series (whose one
    // slug-year holds many distinct instances), plus location INCLUDING timezone.
    const stored = instanceKey.get(item);
    const instance = stored
      ? `#${stored}`
      : RECURRING_SLUGS.has(item.festivalId) ? `#${item.civilDate ?? item.date}` : '';
    const key = `${item.festivalId}|${year}${instance}@${item.location.lat},${item.location.lon},${item.location.tz}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  for (const [groupKey, list] of groups.entries()) {
    const slug = groupKey.slice(0, groupKey.lastIndexOf('@')).split('|')[0];
    if (list.length === 1) {
      list[0].isPrimary = true;
      continue;
    }

    const isCitedDispute = CITED_VARIANT_SLUGS.has(slug);

    const itemsByVariantKey = new Map<string, ClientObservanceResult[]>();
    for (const item of list) {
      const key = item.variantKey || item.profile.tradition || 'standard';
      if (!itemsByVariantKey.has(key)) itemsByVariantKey.set(key, []);
      itemsByVariantKey.get(key)!.push(item);
    }

    if (isCitedDispute && itemsByVariantKey.size > 1) {
      const candidates: EkadashiVariantCandidate[] = list.map(item => ({
        variantKey: item.variantKey || item.profile.tradition,
        date: item.civilDate ?? item.date,
        displayName: item.display_name,
      }));

      const isUnspecified = context.disclosureDiagnostics.isUnspecifiedLabel;
      const targetLabel = isUnspecified ? 'unspecified' : context.displayedTraditionProfile;

      const selectionMethod = slug === 'krishna-janmashtami'
        ? context.janmashtamiMethod
        : context.ekadashiMethod;
      const selResult = selectTraditionVariant(candidates, selectionMethod, targetLabel, slug);

      if (selResult.status === 'resolved' && selResult.selectedVariant) {
        let primaryIndex = list.findIndex(item =>
          (item.variantKey && item.variantKey === selResult.selectedVariant?.variantKey) ||
          item.profile.tradition === selResult.selectedVariant?.variantKey ||
          (selResult.selectedVariant?.variantKey === 'vaishnava_vidhava' && (
            item.variantKey === 'vaishnava_vidhava' ||
            item.profile.tradition === 'vaishnava' ||
            item.profile.tradition === 'gaudiya_iskcon' ||
            item.profile.tradition === 'sri_vaishnava' ||
            item.profile.tradition === 'swaminarayan'
          ))
        );
        if (primaryIndex === -1) primaryIndex = 0;

        for (let i = 0; i < list.length; i++) {
          list[i].isPrimary = (i === primaryIndex);
          const isUnresolvedOrWithheld = list[i].reviewStatus === 'in_review' ||
            list[i].reviewStatus === 'pending_review' ||
            list[i].status === 'unresolved' ||
            list[i].status === 'under_review';

          if (isUnresolvedOrWithheld) {
            list[i].status = 'under_review';
            list[i].civilDate = null;
            list[i].date = '';
          } else {
            list[i].status = 'resolved';
          }

          if (isUnspecified && list[i].isPrimary) {
            list[i].profile.tradition = 'unspecified';
            if (!list[i].diagnostics.includes('unspecified_tradition_default')) {
              list[i].diagnostics.push('unspecified_tradition_default');
            }
          }
        }

        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          const otherVariants = list.filter((_, idx) => idx !== i);
          item.alternatives = otherVariants.map(other => ({
            variantKey: other.variantKey ?? null,
            profile: other.profile,
            civilDate: other.civilDate ?? other.reviewPlacementDate ?? other.candidateDates?.[0] ?? null,
            sourceRefs: other.sourceRefs ?? [],
            monthLabel: null,
            note: (other.status === 'unresolved' || other.status === 'under_review') ? 'Under Review' : null,
          }));
        }
      } else {
        const candidateDatesByItem = new Map(
          list.map(item => [item, item.civilDate ?? item.candidateDates[0] ?? null]),
        );
        const allCandidateDates = Array.from(
          new Set(Array.from(candidateDatesByItem.values()).filter((date): date is string => Boolean(date))),
        );
        for (const item of list) {
          item.status = 'under_review';
          item.civilDate = null;
          item.date = '';
          item.candidateDates = allCandidateDates;
          item.reviewPlacementDate = candidateDatesByItem.get(item) ?? null;
          item.isPrimary = false;
        }
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          const otherVariants = list.filter((_, idx) => idx !== i);
          item.alternatives = otherVariants.map(other => ({
            variantKey: other.variantKey ?? null,
            profile: other.profile,
            civilDate: candidateDatesByItem.get(other) ?? null,
            monthLabel: null,
            note: 'Under Review',
          }));
        }
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

  // Month-label resolution runs LAST, after grouping/dispute-resolution may
  // have blanked civilDate for under-review items -- resolving earlier would
  // compute a label for a date the item no longer carries. Never recomputes
  // or moves civilDate itself; purely a display label for the same date.
  if (context.monthSystem === 'amanta' || context.monthSystem === 'purnimanta') {
    for (const item of results) {
      if (!item.civilDate) continue;
      item.monthLabel = resolveMonthLabelForProfile(
        item.civilDate,
        {
          corrected_lunar_masa_name: item.corrected_lunar_masa_name,
          corrected_month_system: item.corrected_month_system,
          lunar_tithi_index: item.lunar_tithi_index,
        },
        context.monthSystem,
      );
    }
  }

  return results;
}
