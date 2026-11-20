import { describe, expect, it } from 'vitest';
import {
  FESTIVAL_DATE_LOCATION,
  formatCityCoordinates,
  resolveFestivalSeoCity,
} from './festival-city-facts';

describe('festival city facts', () => {
  it('resolves curated cities without falling back to Ujjain', () => {
    expect(resolveFestivalSeoCity('london')?.tz).toBe('Europe/London');
    expect(resolveFestivalSeoCity('delhi')?.id).toBe('new-delhi');
    expect(resolveFestivalSeoCity('not-a-real-city')).toBeNull();
  });

  it('keeps the location context explicit', () => {
    const city = resolveFestivalSeoCity('san-francisco');
    expect(city).not.toBeNull();
    expect(formatCityCoordinates(city!)).toBe('37.7749° N, 122.4194° W');
  });

  it('keeps the published festival date on the Ujjain reference set', () => {
    expect(FESTIVAL_DATE_LOCATION).toMatchObject({
      lat: 23.1765,
      lon: 75.7885,
      tz: 'Asia/Kolkata',
    });
  });
});
