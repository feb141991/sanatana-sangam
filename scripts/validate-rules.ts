import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';

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
    const key = `${rule.slug}|${rule.calendar_profile || ''}|${rule.sampradaya || ''}`;
    if (seenKeys.has(key)) {
      console.error(`❌ Duplicate rule entry for key "${key}" at index ${i}. Rules with same slug must differ by calendar_profile or sampradaya.`);
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
  const KRISHNA = (r: any) => Number(r.lunar_tithi_index) > 15;

  // Guard 1: a krishna-paksha rule that names a corrected month MUST state its
  // system explicitly. Inheriting a default is what produced D32.
  for (const rule of rules as any[]) {
    if (rule.corrected_lunar_masa_name && KRISHNA(rule) && !rule.corrected_month_system) {
      console.error(
        `❌ "${rule.slug}" is krishna-paksha (tithi ${rule.lunar_tithi_index}) and names ` +
        `corrected month "${rule.corrected_lunar_masa_name}", but does not declare ` +
        `corrected_month_system. Amanta and purnimanta name this fortnight differently, ` +
        `so the date is ambiguous by exactly one month. Declare it explicitly.`
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
