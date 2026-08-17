import rulesJson from '../../../packages/dharma-rules/src/festivals/rules.json';

export interface DisputedVariant {
  variant_key: string;
  spiritual_tradition?: string;
  civil_date: string;
  source_ref: string;
  review_status: string;
}

export type SkippedTithiPolicy = 'previous_day' | 'following_day' | 'day_before' | 'day_after';

export interface ObservanceRule {
  slug: string;
  display_name: string;
  emoji: string;
  description: string;
  kind: 'major' | 'vrat' | 'regional';
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  rule_family: 'solar_fixed' | 'lunar_tithi' | 'lunar_tithi_recurring' | 'weekday_recurring' | 'relative_to_other_observance' | 'nakshatra_based' | 'regional_calendar' | 'solar_sankranti' | 'solar_month_day';
  verification_type: 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration' | 'solar_sankranti' | 'solar_month_day';
  solar_month?: number; // 1-12
  solar_day?: number;   // 1-31
  // 0=Mesha..11=Meena (sidereal rashi index, Math.floor(sunSidereal/30)%12).
  // The observed civil date is the IST calendar date of the sankranti
  // transit instant -- verified against known public dates (Makar Sankranti
  // 2024's well-known shift to Jan 15, 2025/2026 both on Jan 14) with no
  // sunrise/sunset cutoff needed. See SolarSankrantiHandler in engine.ts.
  sankranti_rashi_index?: number;
  // solar_month_day rules (Tamil/Malayalam/Bengali/Odia regional solar new
  // years and month-day observances -- e.g. Puthandu, Vishu, Poila Boishakh).
  // Unlike solar_sankranti (a single pan-India IST date), which CIVIL DAY a
  // Sankranti belongs to is a regional convention -- see
  // @sangam/panchang-engine's solar-month module. `[S]`: the four
  // day-assignment rules are documented but not council-ratified, so every
  // result these produce also carries `ratified: false`. See
  // SolarMonthDayHandler in engine.ts.
  solar_month_profile?: 'tamil' | 'malayalam' | 'bengali' | 'odia';
  // Target rashi (0=Mesha..11=Meena) of the solar month this rule falls in.
  solar_month_target_rashi?: number;
  // 1-based day within that solar month (1 = new year / month-start day).
  solar_month_day_of_month?: number;
  lunar_tithi_index?: number; // 1-30
  lunar_masa_name?: string;   // IMPORTANT: must match panchang.ts masaName output (shifted 2 months behind traditional)
  nanakshahi_month?: string;  // e.g. 'Vaisakh'
  nanakshahi_day?: number;    // 1-based day within the Nanakshahi month
  relative_base_slug?: string;
  relative_offset_days?: number;
  nakshatra_name?: string;
  prefer_last_match?: boolean;
  allow_skipped_tithi?: boolean;
  skipped_tithi_policy?: SkippedTithiPolicy;
  recurring_tithi_indices?: number[];
  recurring_weekday?: number;
  route_kind?: 'vrat' | null;
  route_slug?: string | null;
  region?: string | null;

  // ── Variant identity ──────────────────────────────────────────────────────
  // These fields exist in rules.json for rules that have per-tradition variants
  // (e.g. the two krishna-janmashtami rows). They are intentionally absent from
  // single-row rules, which carry no qualifier.
  //
  // `variant_key` is the canonical identity qualifier and takes precedence.
  // `sampradaya` is the older field on the janmashtami rows; used as fallback
  // when variant_key is absent. See ruleIdentityKey() in engine.ts.
  variant_key?: string;
  sampradaya?: string;
  spiritual_tradition?: string;

  // ── D1+D2 Corrected engine fields (Tracker 3.7, Stage 2) ─────────────────
  corrected_lunar_masa_name?: string;
  corrected_lunar_tithi_index?: number;
  corrected_month_system?: 'amanta' | 'purnimanta';
  adhika_policy?: 'nija' | 'adhika' | 'both';
  corrected_prefer_last_match?: boolean;
  corrected_allow_skipped_tithi?: boolean;
  corrected_skipped_tithi_policy?: SkippedTithiPolicy;
  // D34: which instant of the civil day determines the prevailing tithi.
  // Undefined/'sunrise' (default) matches every other lunar_tithi rule.
  // 'madhyahna' (solar noon) is a real, separately-documented dharma-śāstra
  // convention a handful of rules use instead -- see
  // docs/CALENDAR_ENGINE_ASSESSMENT.md D34. Corrected-engine only, matching
  // every other corrected_* field's scope.
  corrected_tithi_reference_time?: 'sunrise' | 'madhyahna';

  // ── Publication gating ────────────────────────────────────────────────────
  // These three decide whether a rule reaches a user, so they belong in the
  // type rather than behind `as` casts at each read site. They were cast-only
  // until a review pointed out that a gate the compiler cannot see is a gate
  // that silently accepts a typo -- `disputed_year: [2027]` would have parsed,
  // validated, and published the very date it was meant to withhold.

  /** Can we compute this honestly at all? Non-'computed' never publishes. */
  derivability?: 'computed' | 'requires_tradition_profile' | 'externally_curated';
  derivability_note?: string;
  /** Do we ship it now? A scheduling decision, distinct from derivability. */
  launch_status?: 'included' | 'deferred';
  ratification_note?: string;
  /** Tier-1..4 source citation for the rule's own (non-disputed) date. */
  citation?: string;
  /**
   * Years whose computed date is contested and must not be published.
   * Per-year because a rule can be sound in one year and disputed in the next.
   */
  disputed_years?: number[];
  disputed_variants?: DisputedVariant[];
}

export const CANONICAL_RULES: ObservanceRule[] = rulesJson as ObservanceRule[];
