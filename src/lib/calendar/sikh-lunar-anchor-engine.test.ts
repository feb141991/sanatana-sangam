import { describe, expect, it } from 'vitest';
import { calculateObservancesForYearCorrected } from './engine';

const amritsar = { lat: 31.634, lon: 74.872, tz: 'Asia/Kolkata' };

function dateFor(year: number, slug: string) {
  return calculateObservancesForYearCorrected(year, amritsar).find(result => result.slug === slug)?.date ?? null;
}

describe('Sikh lunar anchors through the corrected engine', () => {
  it('does not let the relative pass overwrite anchor dates', () => {
    expect(dateFor(2028, 'guru-nanak-gurpurab')).toBe('2028-11-02');
    expect(dateFor(2029, 'guru-nanak-gurpurab')).toBe('2029-11-20');
    expect(dateFor(2028, 'guru-tegh-bahadur-martyrdom')).toBe('2028-11-21');
    expect(dateFor(2029, 'guru-tegh-bahadur-martyrdom')).toBe('2029-12-10');
    expect(dateFor(2028, 'guru-gobind-singh-gurpurab')).toBe('2028-01-04');
    expect(dateFor(2030, 'guru-gobind-singh-gurpurab')).toBe('2030-01-10');
  }, 120_000);
});
