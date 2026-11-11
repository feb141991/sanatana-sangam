import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isFinalCalendarDate,
  parseCalendarProvenance,
  regionalCalendarProvenanceFor,
} from './regional-calendar-provenance';
import { CALENDAR_FINAL_DATE_CONSUMERS } from './calendar-provenance-consumer-registry';

const sikh = (overrides: Record<string, unknown> = {}) => ({
  date: '2027-01-15',
  spiritual_tradition: 'sikh',
  calendar_profile: 'nanakshahi',
  observance_definitions: { verification_type: 'regional_calendar' },
  ...overrides,
});

describe('regional calendar provenance', () => {
  it('marks only a printed SGPC 558 date inside the edition range final', () => {
    expect(isFinalCalendarDate(sikh({ source_provenance: regionalCalendarProvenanceFor('guru-gobind-singh-gurpurab', '2027-01-15') }))).toBe(true);
    expect(isFinalCalendarDate(sikh({ date: '2027-01-05', source_provenance: regionalCalendarProvenanceFor('guru-gobind-singh-gurpurab', '2027-01-05') }))).toBe(false);
    expect(isFinalCalendarDate(sikh({ date: '2026-01-15', source_provenance: { calendar_provenance: { provenance: 'sgpc_edition', edition: 558 } } }))).toBe(false);
  });

  it('fails closed for missing and non-final provenance', () => {
    expect(isFinalCalendarDate(sikh())).toBe(false);
    expect(isFinalCalendarDate(sikh({ source_provenance: { calendar_provenance: { provenance: 'computed_expected', edition: null, reason: 'pending' } } }))).toBe(false);
    expect(parseCalendarProvenance({ calendar_provenance: { provenance: 'approximate', edition: null, reason: 'pending' } })?.provenance).toBe('approximate');
  });

  it('preserves existing non-regional behaviour', () => {
    expect(isFinalCalendarDate({ date: '2027-01-15', observance_definitions: { verification_type: 'lunar_tithi' } })).toBe(true);
  });

  it('keeps the consumer registry honest', () => {
    for (const consumer of CALENDAR_FINAL_DATE_CONSUMERS) {
      const contents = readFileSync(resolve(process.cwd(), consumer.path), 'utf8');
      expect(contents, consumer.path).toContain(consumer.symbol);
    }
  });
});
