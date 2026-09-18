import { describe, expect, it } from 'vitest';
import { validateFixtureCorrection } from '../fixture-correction';

const version = '2026-09-15T00:00:00Z';
const valid = {
  expected: { civilDate: '2027-01-15' },
  source: { tier: 1, ref: 'https://sgpc.net/nanakshahi-calendar/', citation: 'Samvat 558 Gurpurab list, 02 Magh' },
  reasoning: 'The printed official edition places this Gurpurab here.',
};

describe('sourced fixture correction guard', () => {
  it('accepts a cross-year civil date without confusing fixture year with civil year', () => {
    expect(validateFixtureCorrection(valid, version)).toBeNull();
  });
  it('rejects impossible dates, unsafe sources and vague citations', () => {
    expect(validateFixtureCorrection({ ...valid, expected: { civilDate: '2027-02-30' } }, version)).toMatch(/real/);
    expect(validateFixtureCorrection({ ...valid, source: { ...valid.source, ref: 'http://example.com' } }, version)).toMatch(/HTTPS/);
    expect(validateFixtureCorrection({ ...valid, source: { ...valid.source, citation: 'calendar' } }, version)).toMatch(/citation/);
  });
  it('requires the current row version and a recognized tier', () => {
    expect(validateFixtureCorrection(valid, null)).toMatch(/version/);
    expect(validateFixtureCorrection({ ...valid, source: { ...valid.source, tier: 9 } }, version)).toMatch(/tier/);
  });
});
