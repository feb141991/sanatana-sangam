import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SGPC_EDITIONS, editionForDate, findMappedSidebarRow, isFinalCalendarDate, mappedDateForEdition, parseCalendarProvenance, regionalCalendarProvenanceFor } from './regional-calendar-provenance';
import { CALENDAR_FINAL_DATE_CONSUMERS } from './calendar-provenance-consumer-registry';

const sikh = (overrides: Record<string, unknown> = {}) => ({
  date: '2027-01-15', spiritual_tradition: 'sikh', calendar_profile: 'nanakshahi',
  observance_definitions: { slug: 'guru-gobind-singh-gurpurab', tradition: 'sikh', verification_type: 'historical_commemoration' }, ...overrides,
});

describe('regional calendar provenance', () => {
  it('marks only a printed date inside its edition range final', () => {
    expect(isFinalCalendarDate(sikh({ source_provenance: regionalCalendarProvenanceFor('guru-gobind-singh-gurpurab', '2027-01-15') }))).toBe(true);
    expect(isFinalCalendarDate(sikh({ date: '2027-01-05', source_provenance: regionalCalendarProvenanceFor('guru-gobind-singh-gurpurab', '2027-01-05') }))).toBe(false);
    expect(isFinalCalendarDate(sikh({ date: '2026-01-15', source_provenance: { calendar_provenance: { provenance: 'sgpc_edition', edition: 558 } } }))).toBe(false);
  });

  it('derives mapped dates from the edition registry and month starts', () => {
    const edition = SGPC_EDITIONS.find(candidate => candidate.edition === 558);
    expect(edition).toBeDefined();
    expect(mappedDateForEdition(edition!, 'guru-nanak-gurpurab', 2026)).toBe('2026-11-24');
    expect(mappedDateForEdition(edition!, 'bandhi-chhor-divas', 2026)).toBe('2026-11-08');
    expect(mappedDateForEdition(edition!, 'guru-gobind-singh-gurpurab', 2026)).toBe('2026-01-15');
    expect(mappedDateForEdition(edition!, 'guru-gobind-singh-gurpurab', 2027)).toBe('2027-01-15');
    expect(findMappedSidebarRow(edition!, 'baisakhi')?.month).toBe('Vaisakh');
  });

  it('selects an edition by date, not by Gregorian year', () => {
    expect(editionForDate('2026-03-14')?.edition).toBe(558);
    expect(editionForDate('2027-01-15')?.edition).toBe(558);
    expect(editionForDate('2027-03-14')).toBeNull();
  });

  it('keeps cultural Lohri outside the SGPC final-date gate', () => {
    expect(isFinalCalendarDate({ date: '2027-01-13', observance_definitions: { slug: 'lohri', tradition: 'sikh', verification_type: 'solar_fixed' } })).toBe(true);
    expect(parseCalendarProvenance({ provenance: 'cultural_convention', edition: null, reason: 'convention' })?.provenance).toBe('cultural_convention');
  });

  it('recognizes production Sikh definition classes and labels unsupported dates honestly', () => {
    for (const verificationType of ['historical_commemoration', 'lunar_tithi', 'solar_fixed']) {
      expect(isFinalCalendarDate({ date: '2027-01-05', spiritual_tradition: null, calendar_profile: 'legacy-ujjain', observance_definitions: { slug: 'guru-gobind-singh-gurpurab', tradition: 'sikh', verification_type: verificationType } })).toBe(false);
    }
    expect(regionalCalendarProvenanceFor('guru-tegh-bahadur-martyrdom', '2027-12-14').calendar_provenance).toMatchObject({ provenance: 'approximate', edition: null });
    expect(regionalCalendarProvenanceFor('sahibzade-shaheedi-diwas', '2026-12-26').calendar_provenance).toMatchObject({ provenance: 'approximate', edition: null });
  });

  it('fails closed for missing and non-final provenance', () => {
    expect(isFinalCalendarDate(sikh())).toBe(false);
    expect(isFinalCalendarDate(sikh({ source_provenance: { calendar_provenance: { provenance: 'computed_expected', edition: null, reason: 'pending' } } }))).toBe(false);
    expect(parseCalendarProvenance({ calendar_provenance: { provenance: 'approximate', edition: null, reason: 'pending' } })?.provenance).toBe('approximate');
  });

  it('fails closed on real production-shaped Sikh rows without Nanakshahi fields', () => {
    const productionShape = { date: '2027-01-05', spiritual_tradition: null, calendar_profile: 'legacy-ujjain', variant_key: 'legacy-default', source_provenance: { source_kind: 'curated', source_name: 'manual_engine_run_v2' }, observance_definitions: { slug: 'guru-gobind-singh-gurpurab', tradition: 'sikh', verification_type: 'historical_commemoration' } };
    expect(isFinalCalendarDate(productionShape)).toBe(false);
    expect(isFinalCalendarDate({ ...productionShape, date: '2027-01-15', source_provenance: { ...productionShape.source_provenance, calendar_provenance: { provenance: 'sgpc_edition', edition: 558 } } })).toBe(true);
  });

  it('preserves existing non-Sikh behaviour', () => {
    expect(isFinalCalendarDate({ date: '2027-01-15', observance_definitions: { verification_type: 'lunar_tithi' } })).toBe(true);
  });

  it('does not hardcode a specific SGPC edition in implementation source', () => {
    for (const path of ['src/lib/calendar/regional-calendar-provenance.ts', 'src/lib/calendar/sgpc-edition-registry.ts', 'src/lib/calendar/engine.ts']) {
      const contents = readFileSync(resolve(process.cwd(), path), 'utf8');
      expect(contents, path).not.toMatch(/\b558\b|2026-03-14|2027-03-13/);
    }
  });

  it('keeps the consumer registry honest', () => {
    for (const consumer of CALENDAR_FINAL_DATE_CONSUMERS) {
      const contents = readFileSync(resolve(process.cwd(), consumer.path), 'utf8');
      expect(contents, consumer.path).toContain(consumer.symbol);
    }
  });
});
