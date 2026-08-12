/**
 * Publication withholding for occurrences ALREADY STORED IN THE DATABASE.
 *
 * WHY THIS EXISTS SEPARATELY FROM `isPublishableForYear`
 * -----------------------------------------------------
 * That function gates CALCULATION. This one gates READS. They are not the same
 * gate and the difference is not academic: when the disputed-years gate landed,
 * five contested occurrences were already sitting in `observance_occurrences`,
 * written before the gate existed. Gating the calculator stopped new ones being
 * produced and did nothing whatsoever about the rows already there, which every
 * calendar endpoint went on serving.
 *
 * The lesson generalises. A gate at write time protects only the future; a gate
 * at read time protects what is already stored. Anything derived from rules.json
 * that decides whether a user may see something needs both, because the database
 * is older than the rule that governs it.
 *
 * DEFENCE IN DEPTH, NOT A REPLACEMENT FOR CLEANUP
 * -----------------------------------------------
 * The stored rows should also be quarantined at the database level. This filter
 * is the layer that holds regardless -- it keeps working if a quarantine misses
 * a row, if a row is re-materialised by an older deployment, or if an admin
 * approves a disputed row by hand (the database has no knowledge of
 * `disputed_years`, so nothing there would stop them).
 */
import { CANONICAL_RULES, ObservanceRule } from './rules';
import { isPublishableForYear, ruleIdentityKey } from './engine';

/** ruleIdentityKey -> rule, for variant-qualified O(1) lookup. */
const BY_RULE_KEY = new Map<string, ObservanceRule>(
  CANONICAL_RULES.map(r => [ruleIdentityKey(r), r]),
);

/** slug -> list of rules sharing that slug. */
const BY_SLUG_VARIANTS = new Map<string, ObservanceRule[]>();
for (const rule of CANONICAL_RULES) {
  const existing = BY_SLUG_VARIANTS.get(rule.slug) ?? [];
  existing.push(rule);
  BY_SLUG_VARIANTS.set(rule.slug, existing);
}

/**
 * Whether a stored occurrence must be withheld from public output.
 *
 * Checks variant_key first, then spiritual_tradition/sampradaya. For legacy rows
 * without variant identity, fails conservatively if ANY same-slug rule is withheld.
 */
export function isWithheldOccurrence(
  slug: string | null | undefined,
  date: string | null | undefined,
  variantKey?: string | null | undefined,
  spiritualTradition?: string | null | undefined,
  customRuleList?: ObservanceRule[],
  outDiagnostics?: string[],
): boolean {
  if (!slug || !date) return false;
  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(year)) return false;

  let ruleKeyMap = BY_RULE_KEY;
  let slugVariantsMap = BY_SLUG_VARIANTS;

  if (customRuleList) {
    ruleKeyMap = new Map(customRuleList.map(r => [ruleIdentityKey(r), r]));
    slugVariantsMap = new Map();
    for (const rule of customRuleList) {
      const existing = slugVariantsMap.get(rule.slug) ?? [];
      existing.push(rule);
      slugVariantsMap.set(rule.slug, existing);
    }
  }

  let matchedRule: ObservanceRule | undefined;
  if (variantKey) {
    matchedRule = ruleKeyMap.get(`${slug}::${variantKey}`);
  }
  if (!matchedRule && spiritualTradition) {
    matchedRule = ruleKeyMap.get(`${slug}::${spiritualTradition}`);
  }

  if (matchedRule) {
    return !isPublishableForYear(matchedRule, year);
  }

  const rulesForSlug = slugVariantsMap.get(slug) ?? [];
  if (rulesForSlug.length === 0) return false;
  if (rulesForSlug.length === 1) {
    return !isPublishableForYear(rulesForSlug[0], year);
  }

  // Legacy row without variant_key or spiritual_tradition when multiple rules exist.
  // Fail conservatively: if ANY rule for this slug is withheld in this year, return true.
  if (outDiagnostics && !outDiagnostics.includes('legacy-insufficient-identity')) {
    outDiagnostics.push('legacy-insufficient-identity');
  }

  return rulesForSlug.some(r => !isPublishableForYear(r, year));
}

/**
 * Filters stored occurrence rows, dropping withheld ones.
 */
export function filterWithheldOccurrences<T>(
  rows: T[],
  getSlug: (row: T) => string | null | undefined,
  getDate: (row: T) => string | null | undefined,
  getVariantKey?: (row: T) => string | null | undefined,
  getSpiritualTradition?: (row: T) => string | null | undefined,
): T[] {
  return rows.filter(row => {
    const identity = row as {
      variant_key?: string | null;
      spiritual_tradition?: string | null;
    };
    return !isWithheldOccurrence(
      getSlug(row),
      getDate(row),
      getVariantKey ? getVariantKey(row) : identity.variant_key,
      getSpiritualTradition ? getSpiritualTradition(row) : identity.spiritual_tradition,
    );
  });
}

/**
 * Convenience for the common `{ date, observance_definitions: { slug } }` shape.
 */
export function filterWithheldJoinedRows<T>(rows: T[]): T[] {
  return rows.filter(row => {
    const r = row as {
      date?: string | null;
      occurrence_date?: string | null;
      variant_key?: string | null;
      spiritual_tradition?: string | null;
      observance_definitions?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
    };
    const def = Array.isArray(r.observance_definitions)
      ? r.observance_definitions[0]
      : r.observance_definitions;
    return !isWithheldOccurrence(
      def?.slug,
      r.date ?? r.occurrence_date,
      r.variant_key,
      r.spiritual_tradition,
    );
  });
}
