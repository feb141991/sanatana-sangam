import { describe, expect, it } from 'vitest';
import { resolveEmbedCity, EMBED_POPULAR_CITIES, DEFAULT_EMBED_CITY } from './cities';

describe('embed city resolution', () => {
  it('resolves preset cities by slug', () => {
    const ny = resolveEmbedCity({ city: 'new-york' });
    expect(ny.id).toBe('new-york');
    expect(ny.name).toContain('New York');
    expect(ny.tz).toBe('America/New_York');

    const london = resolveEmbedCity({ city: 'london' });
    expect(london.id).toBe('london');
    expect(london.tz).toBe('Europe/London');

    const delhi = resolveEmbedCity({ city: 'new-delhi' });
    expect(delhi.id).toBe('new-delhi');
    expect(delhi.tz).toBe('Asia/Kolkata');
  });

  it('resolves case-insensitively and handles spaces as hyphens', () => {
    const sf = resolveEmbedCity({ city: 'San Francisco' });
    expect(sf.id).toBe('san-francisco');
    expect(sf.tz).toBe('America/Los_Angeles');

    const toronto = resolveEmbedCity({ city: 'TORONTO' });
    expect(toronto.id).toBe('toronto');
  });

  it('resolves custom coordinates when lat and lon are provided', () => {
    const custom = resolveEmbedCity({
      lat: 52.52,
      lon: 13.405,
      tz: 'Europe/Berlin',
      city: 'Berlin',
    });
    expect(custom.id).toBe('custom');
    expect(custom.lat).toBe(52.52);
    expect(custom.lon).toBe(13.405);
    expect(custom.tz).toBe('Europe/Berlin');
    expect(custom.name).toBe('Berlin');
  });

  it('falls back to default Ujjain when city is unknown or missing', () => {
    const fallback = resolveEmbedCity({ city: 'unknown-mars-city-xyz' });
    expect(fallback.id).toBe(DEFAULT_EMBED_CITY.id);
    expect(fallback.name).toBe(DEFAULT_EMBED_CITY.name);
  });
});

