import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SGPC_558_DATES_BY_SLUG,
  SGPC_558_SLUG_TO_SIDEBAR_ROW,
  SGPC_558_MONTH_STARTS,
  assertSgpcMappingRows,
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

  it('derives the reviewed dates from the committed sidebar mapping', () => {
    assertSgpcMappingRows();
    expect(SGPC_558_DATES_BY_SLUG['guru-nanak-gurpurab']).toBe('2026-11-24');
    expect(SGPC_558_DATES_BY_SLUG['bandhi-chhor-divas']).toBe('2026-11-08');
    expect(SGPC_558_DATES_BY_SLUG['guru-gobind-singh-gurpurab']).toBe('2027-01-15');
    expect(SGPC_558_DATES_BY_SLUG['sahibzade-elder-shaheedi-diwas']).toBe('2026-12-23');
    expect(SGPC_558_DATES_BY_SLUG['sahibzade-younger-shaheedi-diwas']).toBe('2026-12-28');
    expect(SGPC_558_SLUG_TO_SIDEBAR_ROW.baisakhi.month).toBe('Vaisakh');
    expect(SGPC_558_MONTH_STARTS.Poh).toBe('2026-12-16');
  });

  it('keeps cultural Lohri outside the SGPC final-date gate', () => {
    expect(isFinalCalendarDate({
      date: '2027-01-13',
      observance_definitions: { slug: 'lohri', tradition: 'sikh', verification_type: 'solar_fixed' },
    })).toBe(true);
    expect(parseCalendarProvenance({ provenance: 'cultural_convention', edition: null, reason: 'convention' })?.provenance).toBe('cultural_convention');
  });

  it('recognizes every production Sikh definition class and labels unsupported dates honestly', () => {
    for (const verificationType of ['historical_commemoration', 'lunar_tithi', 'solar_fixed']) {
      expect(isFinalCalendarDate({
        date: '2027-01-05',
        spiritual_tradition: null,
        calendar_profile: 'legacy-ujjain',
        observance_definitions: { slug: 'guru-gobind-singh-gurpurab', tradition: 'sikh', verification_type: verificationType },
      })).toBe(false);
    }
    expect(regionalCalendarProvenanceFor('guru-tegh-bahadur-martyrdom', '2027-12-14').calendar_provenance).toMatchObject({
      provenance: 'approximate', edition: null,
    });
    expect(regionalCalendarProvenanceFor('sahibzade-shaheedi-diwas', '2026-12-26').calendar_provenance).toMatchObject({
      provenance: 'unavailable', edition: null,
    });
  });

  it('fails closed for missing and non-final provenance', () => {
    expect(isFinalCalendarDate(sikh())).toBe(false);
    expect(isFinalCalendarDate(sikh({ source_provenance: { calendar_provenance: { provenance: 'computed_expected', edition: null, reason: 'pending' } } }))).toBe(false);
    expect(parseCalendarProvenance({ calendar_provenance: { provenance: 'approximate', edition: null, reason: 'pending' } })?.provenance).toBe('approximate');
  });

  it('fails closed on production-shaped Sikh rows without Nanakshahi fields', () => {
    const productionShape = {
      date: '2027-01-05',
      spiritual_tradition: null,
      calendar_profile: 'legacy-ujjain',
      variant_key: 'legacy-default',
      source_provenance: { source_kind: 'curated', source_name: 'manual_engine_run_v2' },
      observance_definitions: {
        slug: 'guru-gobind-singh-gurpurab',
        tradition: 'sikh',
        verification_type: 'historical_commemoration',
      },
    };
    expect(isFinalCalendarDate(productionShape)).toBe(false);
    expect(isFinalCalendarDate({
      ...productionShape,
      date: '2027-01-15',
      source_provenance: {
        ...productionShape.source_provenance,
        calendar_provenance: { provenance: 'sgpc_edition', edition: 558 },
      },
    })).toBe(true);
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
