import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';

describe('Observance Rules JSON Schema Validation', () => {
  it('validates rules.json against rules.schema.json successfully', () => {
    const rulesPath = join(__dirname, '../../festivals/rules.json');
    const schemaPath = join(__dirname, '../../festivals/rules.schema.json');

    const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(rules);

    if (!valid && validate.errors) {
      console.error(validate.errors);
    }

    expect(valid).toBe(true);
  });
});
