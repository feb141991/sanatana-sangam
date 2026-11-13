import rules from '../packages/dharma-rules/src/festivals/rules.json';

export const DECLARED_AHEAD_OF_ENGINE = new Set([
  'chhath-puja',
  'vinayaka-chaturthi',
]);

// These declarations use the newly supported period vocabulary before a
// rule-specific evaluator condition is wired. Their period is still checked
// against the canonical evaluator vocabulary below.
export const DECLARATIVE_ONLY_PERIODS = new Set([
  'akshaya-tritiya',
  'vasant-panchami',
  'hartalika-teej',
]);

type Rule = (typeof rules)[number] & {
  variant_key?: string;
  date_assignment?: {
    status: string;
    tithi: number;
    paksha: 'shukla' | 'krishna';
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
    if (executableTithi !== undefined && withinPakshaTithi(executableTithi) !== declaration.tithi) {
      issues.push(`${key(rule)}: tithi ${declaration.tithi} != executable ${executableTithi}`);
    }
    if (executableTithi !== undefined && pakshaFromTithi(executableTithi) !== declaration.paksha) {
      issues.push(`${key(rule)}: paksha ${declaration.paksha} != executable ${pakshaFromTithi(executableTithi)}`);
    }
    if (paksha && paksha.value !== declaration.paksha) {
      issues.push(`${key(rule)}: paksha ${declaration.paksha} != evaluator ${paksha.value}`);
    }
    const executableMonth = lunarMonth?.value ?? rule.corrected_lunar_masa_name;
    if (executableMonth && executableMonth !== declaration.lunar_month) {
      issues.push(`${key(rule)}: lunar month ${declaration.lunar_month} != executable ${executableMonth}`);
    }
    const executableMonthSystem = lunarMonth?.monthSystem ?? rule.corrected_month_system;
    if (executableMonthSystem && executableMonthSystem !== declaration.month_system) {
      issues.push(`${key(rule)}: month system ${declaration.month_system} != executable ${executableMonthSystem}`);
    }
    if (presence) {
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
