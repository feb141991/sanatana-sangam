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

  console.log(`✅ rules.json is valid against the schema. Verified ${rules.length} rules.`);
} catch (err: any) {
  console.error('❌ Error executing rules validation:', err.message || err);
  process.exit(1);
}
