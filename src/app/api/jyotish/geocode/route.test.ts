import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { geocodeCity, timezoneFromCoordinates } = vi.hoisted(() => ({
  geocodeCity: vi.fn(),
  timezoneFromCoordinates: vi.fn(),
}));

vi.mock('@/lib/jyotish/geocode', () => ({ geocodeCity, timezoneFromCoordinates }));

import { GET, POST } from './route';

describe('GET /api/jyotish/geocode', () => {
  beforeEach(() => {
    geocodeCity.mockReset();
    timezoneFromCoordinates.mockReset();
  });

  it('resolves timezone from coordinates and keeps location responses private', async () => {
    timezoneFromCoordinates.mockReturnValue('Europe/London');
    const response = await POST(new NextRequest('https://shoonaya.com/api/jyotish/geocode', {
      method: 'POST', body: JSON.stringify({ lat: 51.5074, lng: -0.1278 }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ timezone: 'Europe/London' });
    expect(timezoneFromCoordinates).toHaveBeenCalledWith(51.5074, -0.1278);
    expect(geocodeCity).not.toHaveBeenCalled();
  });

  it('rejects malformed and out-of-range coordinate pairs', async () => {
    for (const body of [null, { lat: 51.5 }, { lat: 'north', lng: 0 }, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }]) {
      const response = await POST(new NextRequest('https://shoonaya.com/api/jyotish/geocode', {
        method: 'POST', body: JSON.stringify(body),
      }));
      expect(response.status).toBe(400);
    }
    expect(timezoneFromCoordinates).not.toHaveBeenCalled();
  });

  it('does not silently return UTC when no timezone covers the coordinates', async () => {
    timezoneFromCoordinates.mockReturnValue(null);
    const response = await POST(new NextRequest('https://shoonaya.com/api/jyotish/geocode', {
      method: 'POST', body: JSON.stringify({ lat: 0, lng: 0 }),
    }));

    expect(response.status).toBe(422);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('preserves the existing city-query response contract', async () => {
    geocodeCity.mockResolvedValue({
      city: 'Toronto', country: 'Canada', countryCode: 'CA',
      lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto',
    });
    const response = await GET(new NextRequest('https://shoonaya.com/api/jyotish/geocode?q=Toronto'));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ city: 'Toronto', timezone: 'America/Toronto' });
    expect(geocodeCity).toHaveBeenCalledWith('Toronto');
  });
});
