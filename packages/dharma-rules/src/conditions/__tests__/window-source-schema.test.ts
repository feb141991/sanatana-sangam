import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('explicit ritual-window provenance', () => {
  function validator() {
    const schemaPath = join(__dirname, '../../festivals/rules.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const ajv = new Ajv({ allErrors: true });
    return ajv.compile(schema);
  }

  const baseRule = {
    slug: 'synthetic-window-rule',
    display_name: 'Synthetic Window Rule',
    emoji: '◌',
    description: 'Schema-only test rule',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    launch_status: 'deferred',
    date_assignment: {
      status: 'proposed',
      basis: 'lunar_tithi',
      tithi: 11,
      paksha: 'shukla',
      lunar_month: 'Chaitra',
      month_system: 'amanta',
      period: 'sunrise',
      mode: 'at',
      skipped_tithi: 'first_qualifying_date',
      tie_break: 'human_review',
    },
  };

  it('rejects a declared window without a window_source object', () => {
    const validate = validator();
    expect(validate([baseRule])).toBe(false);
    expect(validate.errors?.map((error) => error.message).join(' ')).toMatch(/(should|must) have required property 'window_source'/);
  });

  it('accepts the deliberate source shape without using legacy citation', () => {
    const validate = validator();
    expect(validate([{
      ...baseRule,
      window_source: {
        tier: 1,
        source_name: 'Synthetic authority record',
        location_in_source: 'Section 1',
        read_by_human: true,
        status: 'proposed',
      },
    }])).toBe(true);
  });
});
