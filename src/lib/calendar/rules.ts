import rulesJson from '../../../packages/dharma-rules/src/festivals/rules.json';

export interface ObservanceRule {
  slug: string;
  display_name: string;
  emoji: string;
  description: string;
  kind: 'major' | 'vrat' | 'regional';
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  rule_family: 'solar_fixed' | 'lunar_tithi' | 'lunar_tithi_recurring' | 'weekday_recurring' | 'relative_to_other_observance' | 'nakshatra_based' | 'regional_calendar';
  verification_type: 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration';
  solar_month?: number; // 1-12
  solar_day?: number;   // 1-31
  lunar_tithi_index?: number; // 1-30
  lunar_masa_name?: string;   // IMPORTANT: must match panchang.ts masaName output (shifted 2 months behind traditional)
  nanakshahi_month?: string;  // e.g. 'Vaisakh'
  nanakshahi_day?: number;    // 1-based day within the Nanakshahi month
  relative_base_slug?: string;
  relative_offset_days?: number;
  nakshatra_name?: string;
  prefer_last_match?: boolean;
  allow_skipped_tithi?: boolean;
  recurring_tithi_indices?: number[];
  recurring_weekday?: number;
  route_kind?: 'vrat' | null;
  route_slug?: string | null;
  region?: string | null;

  // ── D1+D2 Corrected engine fields (Tracker 3.7, Stage 2) ─────────────────
  corrected_lunar_masa_name?: string;
  corrected_lunar_tithi_index?: number;
  corrected_month_system?: 'amanta' | 'purnimanta';
  adhika_policy?: 'nija' | 'adhika' | 'both';
  corrected_prefer_last_match?: boolean;
  corrected_allow_skipped_tithi?: boolean;
}

export const CANONICAL_RULES: ObservanceRule[] = rulesJson as ObservanceRule[];
