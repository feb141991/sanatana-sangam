import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const mapping: any[] = [];

for (const rule of CANONICAL_RULES) {
  if (rule.lunar_masa_name || rule.corrected_lunar_masa_name) {
    mapping.push({
      slug: rule.slug,
      display_name: rule.display_name,
      legacy_lunar_masa_name: rule.lunar_masa_name || null,
      corrected_lunar_masa_name: rule.corrected_lunar_masa_name || null,
      adhika_policy: rule.adhika_policy || null,
      corrected_month_system: rule.corrected_month_system || null,
    });
  }
}

const dataDir = path.resolve('/Users/Business(C)/Sanatan Sangam/Shoonaya/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'masa-rule-mapping.json'),
  JSON.stringify(mapping, null, 2),
  'utf-8'
);

console.log(`Successfully generated data/masa-rule-mapping.json with ${mapping.length} entries.`);
