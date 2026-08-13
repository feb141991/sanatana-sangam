/**
 * month-label-resolver.ts
 *
 * Pure display-layer month label resolver.
 * Translates an observance's lunar month name for a viewing calendar profile's month system
 * without altering civil dates.
 *
 * Governance Invariant (docs/calendar-profiles.md §1.2):
 * Amānta and pūrṇimānta are two NAMES for the same astronomical day.
 * For a fixed civil date, the month name each system reports can differ
 * (only during Kṛṣṇa paksha: purnimantaMonth = amantaMonth + 1), but the
 * CIVIL DATE ITSELF NEVER CHANGES based on which naming system you use.
 *
 * Conversion Law:
 *   Śukla paksha  : purnimantaMonth = amantaMonth          (identical)
 *   Kṛṣṇa paksha  : purnimantaMonth = amantaMonth + 1      (next month name)
 */

import { getLunarMonth, type MonthSystem as EngineMonthSystem } from '@sangam/panchang-engine';
import type { MonthSystem as ContextMonthSystem } from './calendar-context';
import rulesData from '@sangam/dharma-rules/src/festivals/rules.json';

export type SupportedMonthSystem = 'amanta' | 'purnimanta';

export interface MonthLabelResult {
  monthName: string;
  monthSystem: SupportedMonthSystem;
  formattedLabel: string;
  isDivergentFromRuleDefault: boolean;
}

export interface ObservanceRuleMonthInput {
  corrected_lunar_masa_name?: string | null;
  corrected_month_system?: 'amanta' | 'purnimanta' | string | null;
  lunar_masa_name?: string | null;
  lunar_tithi_index?: number | null;
}

/**
 * Resolves the month label for a specific UTC date/instant given a target month system.
 * Uses `getLunarMonth(instant, targetSystem)` to obtain the exact label for that astronomical day.
 */
export function resolveMonthLabelForDate(
  dateOrInstant: Date | string,
  targetSystem: SupportedMonthSystem
): { monthName: string; monthIndex: number; paksha: 'shukla' | 'krishna'; isAdhika: boolean } | null {
  const instant = typeof dateOrInstant === 'string'
    ? new Date(`${dateOrInstant.split('T')[0]}T12:00:00Z`)
    : dateOrInstant;

  if (isNaN(instant.getTime())) return null;

  const result = getLunarMonth(instant, targetSystem as EngineMonthSystem);
  if (!result || !result.ok) return null;

  return {
    monthName: result.monthName,
    monthIndex: result.monthIndex,
    paksha: result.paksha,
    isAdhika: result.isAdhika,
  };
}

/**
 * Resolves the display month label for a rule on a published occurrence date according
 * to a viewing profile's target month system.
 *
 * Does NOT recompute dates or alter occurrences. Pure presentation-layer label translation.
 */
export function resolveMonthLabelForProfile(
  publishedDate: string | null | undefined,
  ruleInput: ObservanceRuleMonthInput,
  targetSystem: ContextMonthSystem | SupportedMonthSystem | string | null | undefined
): MonthLabelResult | null {
  const normTarget: SupportedMonthSystem | null =
    targetSystem === 'purnimanta' ? 'purnimanta'
    : targetSystem === 'amanta' ? 'amanta'
    : null;

  const ruleSystem: SupportedMonthSystem = ruleInput.corrected_month_system === 'purnimanta' ? 'purnimanta' : 'amanta';
  const defaultMonthName = ruleInput.corrected_lunar_masa_name || ruleInput.lunar_masa_name || '';

  // If no date or target system is unknown, return rule's default month name
  if (!publishedDate || !normTarget) {
    if (!defaultMonthName) return null;
    return {
      monthName: defaultMonthName,
      monthSystem: ruleSystem,
      formattedLabel: `${defaultMonthName} (${ruleSystem})`,
      isDivergentFromRuleDefault: false,
    };
  }

  // Look up what the target system calls this exact calendar date
  const dateInfo = resolveMonthLabelForDate(publishedDate, normTarget);

  if (!dateInfo) {
    if (!defaultMonthName) return null;
    return {
      monthName: defaultMonthName,
      monthSystem: ruleSystem,
      formattedLabel: `${defaultMonthName} (${ruleSystem})`,
      isDivergentFromRuleDefault: false,
    };
  }

  // Divergence must reflect the ACTUAL LABEL, not which system produced it.
  // Sukla-paksha rules give the identical month name under both systems (per
  // the conversion law), so comparing `normTarget !== ruleSystem` alone
  // flags every Sukla-paksha rule as "divergent" whenever a profile's system
  // merely differs from the rule's own default -- even though the displayed
  // name is unchanged. That produced a false "Profile Convention" badge on
  // roughly half of all lunar rules. Compare the resolved name against the
  // rule's own declared name instead.
  const isDivergent = defaultMonthName !== '' && dateInfo.monthName !== defaultMonthName;

  return {
    monthName: dateInfo.monthName,
    monthSystem: normTarget,
    formattedLabel: `${dateInfo.monthName} (${normTarget})`,
    isDivergentFromRuleDefault: isDivergent,
  };
}

/**
 * slug -> the rule's own corrected-masa fields. First-match-wins where a
 * slug has multiple variant rows (e.g. krishna-janmashtami's Smarta/
 * Gaudiya rows) -- every variant observed shares identical
 * corrected_month_system/corrected_lunar_masa_name, only citation/
 * sampradaya differ. Shared here so any caller resolving a label from just
 * a slug (rather than already holding the rule) uses the same lookup as
 * observance-formatter.ts's own copy, instead of re-parsing rules.json.
 */
const RULE_MONTH_FIELDS_BY_SLUG = new Map<string, ObservanceRuleMonthInput>();
for (const r of rulesData as Array<{ slug: string } & ObservanceRuleMonthInput>) {
  if (!RULE_MONTH_FIELDS_BY_SLUG.has(r.slug)) {
    RULE_MONTH_FIELDS_BY_SLUG.set(r.slug, {
      corrected_lunar_masa_name: r.corrected_lunar_masa_name,
      corrected_month_system: r.corrected_month_system,
      lunar_tithi_index: r.lunar_tithi_index,
    });
  }
}

/**
 * Convenience wrapper for callers that only have a rule's slug (not the
 * rule object itself) -- e.g. a route reading observance_definitions.slug
 * off a joined DB row. Looks up the rule's corrected-masa fields, then
 * delegates to resolveMonthLabelForProfile.
 */
export function resolveMonthLabelForSlug(
  publishedDate: string | null | undefined,
  slug: string,
  targetSystem: ContextMonthSystem | SupportedMonthSystem | string | null | undefined
): MonthLabelResult | null {
  const ruleInput = RULE_MONTH_FIELDS_BY_SLUG.get(slug);
  if (!ruleInput) return null;
  return resolveMonthLabelForProfile(publishedDate, ruleInput, targetSystem);
}
