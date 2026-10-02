import { describe, expect, it } from 'vitest';
import { deduplicateObservanceResults, filterObservancesToCalculationLocation } from './response-location';
import type { ClientObservanceResult } from './observance-formatter';

function result(id: string, lat: number, lon: number, tz: string): Pick<ClientObservanceResult, 'location'> & { id: string } {
  return { id, location: { label: id, lat, lon, tz } };
}

function observance(id: string, isPrimary: boolean, profile: string): ClientObservanceResult {
  return {
    id,
    festivalId: 'pitru-paksha-day-5',
    slug: 'pitru-paksha-day-5',
    display_name: 'Pitru Paksha Day 5',
    date: '2026-10-01',
    civilDate: '2026-10-01',
    reviewPlacementDate: '2026-10-01',
    status: 'resolved',
    location: { label: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: profile, tradition: 'standard' },
    isPrimary,
  } as ClientObservanceResult;
}

describe('filterObservancesToCalculationLocation', () => {
  const locations = [
    result('london', 51.5074, -0.1278, 'Europe/London'),
    result('ujjain', 23.1765, 75.7885, 'Asia/Kolkata'),
    result('same-coordinates-wrong-timezone', 23.1765, 75.7885, 'Asia/Calcutta'),
    result('nearby-but-different', 23.17651, 75.7885, 'Asia/Kolkata'),
  ];

  it('keeps only the viewer location, including the timezone as part of the pair', () => {
    const actual = filterObservancesToCalculationLocation(locations, {
      label: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London',
    });
    expect(actual.map((item) => item.id)).toEqual(['london']);
  });

  it('uses the documented Ujjain reference when a request has no atomic location', () => {
    const actual = filterObservancesToCalculationLocation(locations, {
      label: null, latitude: null, longitude: null, timezone: null,
    });
    expect(actual.map((item) => item.id)).toEqual(['ujjain']);
  });

  it('does not round a nearby location into the selected location', () => {
    const actual = filterObservancesToCalculationLocation(locations, {
      label: 'Ujjain', latitude: 23.1765, longitude: 75.7885, timezone: 'Asia/Kolkata',
    });
    expect(actual.map((item) => item.id)).toEqual(['ujjain']);
  });

  it('keeps the primary row when duplicate rows describe one observance on one date', () => {
    const actual = deduplicateObservanceResults([
      observance('duplicate', false, 'legacy-ujjain'),
      observance('canonical', true, 'legacy-ujjain'),
    ], 'legacy-ujjain');
    expect(actual.map((item) => item.id)).toEqual(['canonical']);
  });

  it('does not merge different dates or locations into one observance', () => {
    const original = observance('original', true, 'legacy-ujjain');
    const differentDate = { ...original, id: 'next-instance', date: '2026-10-02', civilDate: '2026-10-02' };
    const differentLocation = {
      ...original,
      id: 'other-location',
      location: { label: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
    };
    expect(deduplicateObservanceResults([original, differentDate, differentLocation], 'legacy-ujjain')).toHaveLength(3);
  });
});
