import rules from '../packages/dharma-rules/src/festivals/rules.json';

export const DECLARED_AHEAD_OF_ENGINE = new Set([
  'losar-tibetan-new-year',
  'magha-puja',
  'vesak-buddha-purnima',
  'asalha-puja',
  'vassa-begins-rains-retreat',
  'ullambana-ancestor-day',
  'pavarana-end-of-vassa',
]);

// A night window (nishita) has no sunrise tithi. These rules keep a legacy SUNRISE index that is the tithi BEFORE the
// declared one, because the sunrise before the night holds the previous tithi. maha-shivaratri: Chaturdashi (Krishna 14)
// prevails at nishita, the legacy index 28 is Krishna 13 at sunrise. Measured on the engine (Ujjain 2026-2045), neither
// index 28 nor 29 reproduces the nishita date in every year, so the index is NOT "fixed" to 29: that gives the day after
// in most years. The proxy is allowed only for a nishita declaration, one tithi before.
export const LEGACY_INDEX_IS_NIGHT_PROXY = new Set(['maha-shivaratri']);

// These declarations use the newly supported period vocabulary before a
// rule-specific evaluator condition is wired. Their period is still checked
// against the canonical evaluator vocabulary below.
export const DECLARATIVE_ONLY_PERIODS = new Set<string>([
]);

type Rule = (typeof rules)[number] & {
  variant_key?: string;
  date_assignment?: {
    status: string;
    tithi: number;
    paksha: 'shukla' | 'krishna' | 'both';
    lunar_month: string;
    month_system: 'amanta' | 'purnimanta';
    period: string;
    mode: string;
    skipped_tithi: string;
    tie_break: string;
  };
};

function key(rule: Rule): string {
  return `${rule.slug}::${rule.variant_key ?? ''}`;
}

function pakshaFromTithi(tithi: number): 'shukla' | 'krishna' {
  return tithi > 15 ? 'krishna' : 'shukla';
}

function withinPakshaTithi(tithi: number): number {
  return tithi > 15 ? tithi - 15 : tithi;
}

function effectiveCondition(rule: Rule, type: string) {
  return (rule.evaluator_conditions ?? []).find((condition: any) => condition.type === type) as any;
}

export function validateWindowDeclarationParity(input: readonly Rule[] = rules as Rule[]): string[] {
  const issues: string[] = [];
  for (const rule of input) {
    const declaration = rule.date_assignment;
    if (!declaration) continue;
    if (!rule.window_source) issues.push(`${key(rule)}: missing window_source`);

    const lunarMonth = effectiveCondition(rule, 'lunar_month');
    const paksha = effectiveCondition(rule, 'paksha');
    const presence = effectiveCondition(rule, 'tithi_presence');
    const holika = effectiveCondition(rule, 'holika_dahan');
    const executableTithi = rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index;
    const nightProxy = LEGACY_INDEX_IS_NIGHT_PROXY.has(rule.slug);
    if (nightProxy && declaration.period !== 'nishita') issues.push(`${key(rule)}: night-proxy rule must declare a nishita period`);
    const expectedLegacyTithi = nightProxy ? declaration.tithi - 1 : declaration.tithi;
    if (!DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && executableTithi !== undefined && withinPakshaTithi(executableTithi) !== expectedLegacyTithi) {
      issues.push(`${key(rule)}: tithi ${declaration.tithi} != executable ${executableTithi}`);
    }
    if (!DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && executableTithi !== undefined && pakshaFromTithi(executableTithi) !== declaration.paksha) {
      issues.push(`${key(rule)}: paksha ${declaration.paksha} != executable ${pakshaFromTithi(executableTithi)}`);
    }
    if (!DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && paksha && paksha.value !== declaration.paksha) {
      issues.push(`${key(rule)}: paksha ${declaration.paksha} != evaluator ${paksha.value}`);
    }
    const executableMonth = lunarMonth?.value ?? rule.corrected_lunar_masa_name;
    if (!DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && executableMonth && executableMonth !== declaration.lunar_month) {
      issues.push(`${key(rule)}: lunar month ${declaration.lunar_month} != executable ${executableMonth}`);
    }
    const executableMonthSystem = lunarMonth?.monthSystem ?? rule.corrected_month_system;
    if (!DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && executableMonthSystem && executableMonthSystem !== declaration.month_system) {
      issues.push(`${key(rule)}: month system ${declaration.month_system} != executable ${executableMonthSystem}`);
    }
    if (presence && !DECLARED_AHEAD_OF_ENGINE.has(rule.slug)) {
      if (withinPakshaTithi(presence.tithi) !== declaration.tithi) {
        issues.push(`${key(rule)}: tithi ${declaration.tithi} != evaluator condition ${presence.tithi}`);
      }
      if (presence.period !== declaration.period) {
        issues.push(`${key(rule)}: period ${declaration.period} != evaluator ${presence.period}`);
      }
      if (presence.mode !== declaration.mode) {
        issues.push(`${key(rule)}: mode ${declaration.mode} != evaluator ${presence.mode}`);
      }
    } else if (holika) {
      if (declaration.period !== 'pradosha') issues.push(`${key(rule)}: period ${declaration.period} != holika_dahan pradosha`);
      if (declaration.mode !== 'touches') issues.push(`${key(rule)}: mode ${declaration.mode} != holika_dahan touches`);
    } else if (declaration.period !== 'sunrise' && !DECLARED_AHEAD_OF_ENGINE.has(rule.slug) && !DECLARATIVE_ONLY_PERIODS.has(rule.slug)) {
      const reference: string = (rule as any).corrected_tithi_reference_time ?? 'sunrise';
      const expectedPeriod = reference === 'madhyahna' ? 'madhyahna' : 'sunrise';
      if (declaration.period !== expectedPeriod) {
        issues.push(`${key(rule)}: period ${declaration.period} has no executable condition/reference time`);
      }
    } else if (presence && presence.mode !== declaration.mode) {
      issues.push(`${key(rule)}: mode mismatch`);
    }

    // A recurring observance that runs in both pakshas must say so, and only such a rule may.
    const recurringIndices = (rule as any).recurring_tithi_indices as number[] | undefined;
    const runsInBothPakshas = !!recurringIndices && recurringIndices.some((t) => t <= 15 && recurringIndices.includes(t + 15) && t === declaration.tithi);
    if (declaration.paksha === 'both') {
      if (!runsInBothPakshas) issues.push(`${key(rule)}: paksha both needs recurring_tithi_indices holding ${declaration.tithi} and ${declaration.tithi + 15}`);
      if (paksha) issues.push(`${key(rule)}: paksha both but an evaluator paksha condition exists`);
    } else if (runsInBothPakshas && !paksha) {
      issues.push(`${key(rule)}: runs in both pakshas but declares ${declaration.paksha}`);
    }

    const executableSkip = (rule as any).corrected_skipped_tithi_policy ?? (rule as any).skipped_tithi_policy;
    if (executableSkip) {
      const normalized = executableSkip === 'day_before' ? 'previous_day' : executableSkip === 'day_after' ? 'following_day' : executableSkip;
      if (normalized !== declaration.skipped_tithi) issues.push(`${key(rule)}: skipped_tithi ${declaration.skipped_tithi} != executable ${normalized}`);
    }
    const prefersLast = rule.corrected_prefer_last_match ?? rule.prefer_last_match;
    if (prefersLast !== undefined) {
      const expectedTie = prefersLast ? 'last_qualifying_date' : 'first_qualifying_date';
      if (expectedTie !== declaration.tie_break) issues.push(`${key(rule)}: tie_break ${declaration.tie_break} != executable ${expectedTie}`);
    }
  }
  return issues;
}
