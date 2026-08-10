import { calculateObservancesForYear } from './engine';
import { isBatchTrustworthy } from './materialisation-batch';
import { filterWithheldJoinedRows } from './withheld';
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
 * Where the two rows disagree -- exactly the amanta/purnimanta cases the profile
 * EXISTS to express -- the uncited-difference branch below flips the entry to
 * 'ambiguous', so choosing a regional calendar would make your own festivals
 * appear disputed. LATENT, not live: every stored occurrence is currently
 * `legacy-ujjain`, so there is no second row to duplicate. I previously called
 * this live and was wrong -- I had already queried this table for
 * `spiritual_tradition` and never ran the one-line check on `calendar_profile`.
 *
 * THE GROUPING KEY
 * ----------------
 * (slug, year, location). All three are load-bearing:
 *
 *   - LOCATION, so rows differing only because they were computed somewhere else
 *     are never merged (the failure the grouping comment further down warns of).
 *   - YEAR, because an `upcoming` window crosses New Year and a slug repeats
 *     across years. Without it, a profile row in one year would suppress the
 *     fallback in another.
 *   - SLUG alone is NOT a group for recurring rules. Ekadashi and Pradosh emit
 *     ~24 rows per year under one slug, so a slug-keyed group would let a single
 *     profile row anywhere in the range drop every legacy row for that slug,
 *     including dates the profile never covered.
 *
 * COMPLETENESS RULE. Filling gaps from `legacy-ujjain` would interleave two
 * calendars inside one year -- a sequence of Ekadashi dates belonging to neither
 * -- so a group is answered by ONE calendar. Which one is now decided by the
 * MATERIALISATION BATCH, not by counting rows.
 *
 * The count comparison this replaces (profile rows >= fallback rows -> profile
 * wins) was a heuristic with a hole: it could not see two equally-short sets, and
 * it could not tell "this profile legitimately has fewer occurrences" from "the
 * batch died half way". Both are questions only the WRITER can answer, so the
 * writer now answers them -- see materialisation-batch.ts.
 *
 *   batch complete AND produced == expected -> the profile answers the group
 *   anything else                           -> legacy is kept, rows are flagged
 *
 * Rows with no batch at all are the pre-contract legacy rows (all 557 of them at
 * time of writing). They are never treated as a complete profile batch, so they
 * can never suppress anything -- which is the correct reading of "we do not know
 * whether this set is complete".
 *
 * WHY A FALLBACK AND NOT A VARIANT
 * --------------------------------
 * `legacy-ujjain` here is a backstop for festivals not yet materialised under the
 * chosen profile, not a second legitimate reading. Publishing it alongside the
 * user's own profile would assert a disagreement between traditions that nobody
 * claimed -- the error AGENTS.md rule 7 forbids.
 *
 * Users on `legacy-ujjain` (the default) are unaffected: `.in()` collapses the
 * duplicate value, so their rows were never doubled.
 *
 * Shared by occurrences and review-queue items: both carry a slug, a year and a
 * location, and both are fetched with the same two-profile `.in()`, so a
 * queue-only entry under one profile could otherwise surface alongside the
 * occurrence from the other.
 */
function resolveCalendarProfile<T>(
  rows: T[],
  calendarProfile: string,
  /**
   * Whether a chosen-profile set must prove completeness via its batch.
   *
   * TRUE for occurrences: a partial batch there means missing observances, so
   * the legacy fallback is safer.
   *
   * FALSE for review-queue items, which have no batch and never will -- they are
   * unresolved questions, not materialised rows, and no batch describes them.
   * Demanding one made every profile-specific queue entry fail the check and
   * silently hand the slot back to the legacy entry, so a user on a regional
   * calendar saw the legacy candidate dates for a question about THEIR calendar.
   * Two different concepts had been collapsed into one gate.
   */
  requireCompleteBatch = true,
): T[] {
  if (!calendarProfile) return rows;

  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const r = row as any;
    const slug = r.observance_definitions?.slug ?? '';
    // Queue rows carry `year` directly; occurrences carry it too, but fall back
    // to the date so a row missing it is never silently grouped under ''.
    const year = r.year ?? String(r.date ?? r.occurrence_date ?? '').slice(0, 4);
    // Timezone is part of the identity: the same coordinates under a different
    // tz resolve sunrise to a different civil day, so those are genuinely
    // different materialisations rather than one to choose between.
    const key = `${slug}|${year}|${r.computed_latitude},${r.computed_longitude}|${r.computed_timezone ?? ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const kept = new Set<T>();
  for (const list of groups.values()) {
    const exact = list.filter(r => (r as any).calendar_profile === calendarProfile);
    const fallback = list.filter(r => (r as any).calendar_profile !== calendarProfile);

    // Never materialised for this profile -- show the fallback rather than
    // nothing.
    if (exact.length === 0) {
      for (const r of list) kept.add(r);
      continue;
    }

    // A profile set may only supersede the fallback when its batch SAYS it is
    // complete. Every row must carry a trustworthy batch: a group half of whose
    // rows came from a good batch and half from an aborted one is not complete,
    // whatever the totals look like.
    const complete = !requireCompleteBatch
      || (exact.length > 0 && exact.every(r => isBatchTrustworthy((r as any).batch)));

    if (!complete && fallback.length > 0) {
      for (const r of fallback) {
        kept.add(r);
        (r as any).__incompleteProfileBatch = calendarProfile;
      }
      continue;
    }

    // No fallback to fall back to. Publishing an incomplete profile set is worse
    // than publishing nothing only if the alternative exists -- here it does not,
    // so the rows are shown and flagged.
    if (!complete) {
      for (const r of exact) {
        kept.add(r);
        (r as any).__incompleteProfileBatch = calendarProfile;
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
    }, row.year ?? String(row.date ?? "").slice(0, 4), row.series_instance_key);
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

