import { describe, it, expect } from 'vitest';
import { REFERENCE_LOCATIONS, findNearestReferenceLocation } from '../reference-locations';

describe('REFERENCE_LOCATIONS catalog', () => {
  it('contains 15 Tier-1 reference locations including Ujjain', () => {
    expect(REFERENCE_LOCATIONS.length).toBe(15);
    const ujjain = REFERENCE_LOCATIONS.find((loc) => loc.slug === 'ujjain_india');
    expect(ujjain).toBeDefined();
    expect(ujjain?.lat).toBe(23.1765);
    expect(ujjain?.lon).toBe(75.7885);
  });

  it('maps Bedford location to Bedford reference location when exact timezone match exists', () => {
    const bedfordInput = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };
    const res = findNearestReferenceLocation(bedfordInput);
    expect(res.slug).toBe('bedford_uk');
  });

  it('maps a nearby UK location to closest UK reference city', () => {
    // Luton, UK (near Bedford & London)
    const lutonInput = { lat: 51.8787, lon: -0.4200, tz: 'Europe/London' };
    const res = findNearestReferenceLocation(lutonInput);
    expect(res.country).toBe('GB');
  });

  it('maps a US East Coast location to New York', () => {
    const bostonInput = { lat: 42.3601, lon: -71.0589, tz: 'America/New_York' };
    const res = findNearestReferenceLocation(bostonInput);
    expect(res.slug).toBe('new_york_usa');
  });
});
