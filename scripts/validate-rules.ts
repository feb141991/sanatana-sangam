import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';
import { EVALUATOR_RULES } from '../src/lib/calendar/materialize';

try {
  const root = join(__dirname, '..');
  const rulesPath = join(root, 'packages/dharma-rules/src/festivals/rules.json');
  const schemaPath = join(root, 'packages/dharma-rules/src/festivals/rules.schema.json');

  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(rules);

  if (!valid) {
    console.error('❌ Validation failed for rules.json:');
    if (validate.errors) {
      for (const err of validate.errors) {
        const errorObj = err as any;
        console.error(`  - Path: ${errorObj.instancePath || errorObj.dataPath || '/'}, Message: ${errorObj.message}, Params: ${JSON.stringify(errorObj.params)}`);
      }
    }
    process.exit(1);
  }

  // Custom validation rules:
  // 1. Slug uniqueness: duplicate slugs allowed ONLY if calendar_profile or sampradaya differ.
  // 2. Citation enforcement: any variant / multi-entry slug must have a citation.
  const seenKeys = new Map<string, any>();
  const slugCounts = new Map<string, number>();

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const count = (slugCounts.get(rule.slug) || 0) + 1;
    slugCounts.set(rule.slug, count);
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const key = `${rule.slug}|${rule.calendar_profile || ''}|${rule.variant_key || rule.sampradaya || rule.variant_id || ''}`;
    if (seenKeys.has(key)) {
      console.error(`❌ Duplicate rule entry for key "${key}" at index ${i}. Rules with same slug must differ by calendar_profile, variant_key, or sampradaya.`);
      process.exit(1);
    }
    seenKeys.set(key, rule);

    const isVariant = (slugCounts.get(rule.slug) || 0) > 1 || !!rule.sampradaya || !!rule.variant_id;
    if (isVariant && !rule.citation) {
      console.error(`❌ Missing citation for variant rule "${rule.slug}" (sampradaya: ${rule.sampradaya || 'none'}) at index ${i}. Variants must have citations.`);
      process.exit(1);
    }
  }

  // ---------------------------------------------------------------------------
  // D32 guards. A rule's month name only identifies a lunation once you know
  // which reckoning it is written in. Amanta ends the month at the new moon,
  // purnimanta at the full moon, so they label the same DARK fortnight
  // differently (purnimanta = amanta + 1). Bright fortnights agree, which is why
  // only krishna-paksha rules are at risk -- and why this went unnoticed until
  // Shani Jayanti was found to be a month late.
  // ---------------------------------------------------------------------------
  const KRISHNA = (r: any) => {
    if (Number(r.lunar_tithi_index) > 15) return true;
    if (Array.isArray(r.span_tithis) && r.span_tithis.some((t: number) => t > 15)) return true;
    return false;
  };

  // Guard 1: a krishna-paksha rule that names a corrected month MUST state its
  // system explicitly. Inheriting a default is what produced D32.
  for (const rule of rules as any[]) {
    if (rule.corrected_lunar_masa_name && KRISHNA(rule) && !rule.corrected_month_system) {
      console.error(
        `❌ "${rule.slug}" is krishna-paksha (tithi ${rule.lunar_tithi_index ?? rule.span_tithis}) and names ` +
        `corrected month "${rule.corrected_lunar_masa_name}", but does not declare ` +
        `corrected_month_system. Amanta and purnimanta name this fortnight differently, ` +
        `so the date is ambiguous by exactly one month. Declare it explicitly.`
      );
      process.exit(1);
    }
  }

  // Guard 1b: `lunar_masa_name` must never equal `corrected_lunar_masa_name`.
  //
  // The legacy naming is D1-shifted, so a rule genuinely calibrated for the
  // legacy path always names a DIFFERENT month from the corrected one -- 0 of
  // the 47 rules carrying both names have them equal. Equality is therefore the
  // signature of the corrected value having been copied into the legacy field.
  //
  // That is not cosmetic. USE_CORRECTED_MASA is false, so materialisation runs
  // the LEGACY path; a copied name makes it resolve at a D1-shifted date and
  // publish it. It happened with the 16 named ekadashi rules -- Kamada Ekadashi
  // would have shipped as 2026-05-26 instead of 2026-03-29, about two months
  // out. Omitting the legacy field entirely is correct for a new observance:
  // LunarTithiHandler returns [] without it, so the legacy path publishes
  // nothing, and a missing date is recoverable where a confident wrong one is not.
  for (const rule of rules as any[]) {
    if (
      rule.lunar_masa_name &&
      rule.corrected_lunar_masa_name &&
      rule.lunar_masa_name === rule.corrected_lunar_masa_name
    ) {
      console.error(
        `❌ "${rule.slug}" has lunar_masa_name === corrected_lunar_masa_name ` +
        `("${rule.lunar_masa_name}"). The legacy naming is D1-shifted, so these ` +
        `should never match -- this is the corrected value copied into the legacy ` +
        `field, and it will publish a wrong date while USE_CORRECTED_MASA is false. ` +
        `Omit lunar_masa_name for observances that have no calibrated legacy name.`
      );
      process.exit(1);
    }
  }

  // Guard: an included lunar-family rule must declare corrected_lunar_masa_name,
  // unless it's fully evaluator-covered (in which case the evaluator's own
  // lunar_month/paksha conditions govern it directly, bypassing this field
  // entirely -- see USE_CONDITION_EVALUATOR's dispatch in engine.ts).
  //
  // This used to be a silent runtime fallback to the rule's legacy attribute
  // instead of a build-time error. That was a deliberate safety net while the
  // amanta/purnimanta migration was in progress and most rules genuinely
  // lacked the field -- but checked directly on 2026-08-19, only 6 of 67
  // lunar-family rules were missing it, and after migrating purnima-vrat/
  // amavasya-vrat to the evaluator that day, the only rules left relying on
  // the fallback are already `deferred` (not live). At that coverage level
  // the silent fallback isn't protecting anything anymore, it's just hiding
  // the next rule author's mistake -- so it's now a loud, build-time check.
  const evaluatorCoveredSlugs = new Set(EVALUATOR_RULES.map((r) => r.slug));
  const LUNAR_FAMILIES = new Set(['lunar_tithi', 'lunar_tithi_recurring', 'lunar_tithi_span']);
  for (const rule of rules as any[]) {
    if (rule.launch_status !== 'included') continue;
    if (!LUNAR_FAMILIES.has(rule.rule_family)) continue;
    if (evaluatorCoveredSlugs.has(rule.slug)) continue;
    if (!rule.corrected_lunar_masa_name) {
      console.error(
        `❌ "${rule.slug}" (rule_family: ${rule.rule_family}) is launch_status: 'included' ` +
        `but has no corrected_lunar_masa_name and is not evaluator-covered. It would silently ` +
        `fall back to its legacy (D1-shifted) attribute -- either add the corrected field, ` +
        `add it to EVALUATOR_RULES in materialize.ts, or set launch_status to 'deferred' ` +
        `until one of those is done.`
      );
      process.exit(1);
    }
  }

  // Guard 3: a launch rule must not depend on a deferred one.
  //
  // `relative_to_other_observance` resolves against a base slug. If the base is
  // deferred it produces no occurrence, so the dependent produces nothing
  // either -- silently, with no error anywhere. Diwali carries five dependants
  // and navratri-begins three, so one careless deferral empties a whole cluster.
  for (const rule of rules as any[]) {
    if (rule.launch_status !== 'included' || !rule.relative_base_slug) continue;
    const base = (rules as any[]).find(r => r.slug === rule.relative_base_slug);
    if (!base) {
      console.error(`❌ "${rule.slug}" is anchored to "${rule.relative_base_slug}", which does not exist.`);
      process.exit(1);
    }
    if (base.launch_status === 'deferred') {
      console.error(
        `❌ "${rule.slug}" is in the launch set but its base "${base.slug}" is deferred. ` +
        `A relative rule offsets from its base's date, so this would publish nothing at ` +
        `all rather than erroring. Either include the base or defer the dependant.`
      );
      process.exit(1);
    }
  }

  // Guard 2: report observances sharing a (month, tithi, system) slot.
  //
  // WARNING, not an error. Co-occurrence is often correct -- Gudi Padwa, Ugadi
  // and Chaitra Navratri really are the same day, Chaitra Shukla Pratipada, under
  // different regional names. The first version of this check failed the build on
  // exactly that, which is a good reminder that "two names, one date" is normal in
  // this domain.
  //
  // It still earns its place: it is how gita-jayanti and vaikunta-ekadashi were
  // found both sitting on Margashirsha Shukla Ekadashi. That is NOT a
  // regional-naming case. Gita Jayanti genuinely belongs there -- it is Mokshada
  // Ekadashi -- but Vaikuntha Ekadashi is a Dhanurmasa observance and should not
  // share the slot. Flagged, not auto-fixed: which slot Vaikuntha belongs in is a
  // sourcing question, not something to guess at. Read the list; most entries
  // here are legitimate regional co-naming.
  const slots = new Map<string, string[]>();
  for (const rule of rules as any[]) {
    if (!rule.corrected_lunar_masa_name || rule.lunar_tithi_index === undefined) continue;
    const slot = `${rule.corrected_lunar_masa_name}|${rule.lunar_tithi_index}|${rule.corrected_month_system ?? 'amanta'}`;
    if (!slots.has(slot)) slots.set(slot, []);
    slots.get(slot)!.push(rule.slug);
  }
  for (const [slot, slugs] of slots) {
    const distinct = [...new Set(slugs)];
    if (distinct.length > 1) {
      console.warn(
        `⚠️  same-date slot ${slot}: ${distinct.join(', ')} — verify this is intended ` +
        `(regional co-naming is normal; two unrelated observances is not).`
      );
    }
  }

  console.log(`✅ rules.json is valid against the schema and custom rules. Verified ${rules.length} rules.`);
} catch (err: any) {
  console.error('❌ Error executing rules validation:', err.message || err);
  process.exit(1);
}
