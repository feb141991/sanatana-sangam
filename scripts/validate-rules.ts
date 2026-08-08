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

  console.log(`✅ rules.json is valid against the schema and custom rules. Verified ${rules.length} rules.`);
} catch (err: any) {
  console.error('❌ Error executing rules validation:', err.message || err);
  process.exit(1);
}
