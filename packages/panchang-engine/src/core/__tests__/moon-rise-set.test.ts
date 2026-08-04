import { describe, it, expect } from 'vitest';
import {
  getMoonRiseSet,
  findNextMoonrise,
} from '../moon-rise-set.js';

/**
 * Tier 1/2 Astronomical Authority Golden Fixtures (USNO / HMNAO / PAC).
 * Acceptance criteria per §10 & §1.2: within 2 minutes of Tier 1/2 astronomical reference times.
 */
interface GoldenFixture {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  dateStr: string; // YYYY-MM-DD
  refRiseLocal: string; // HH:MM in local time
  season: string; // Solstice / Equinox / High-Declination / Anchor
  source: string;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  // 1. Anchors verified independently in prompt
  {
    city: 'Bedford',
    lat: 52.1356,
    lon: -0.4685,
    tz: 'Europe/London',
    dateStr: '2026-02-17',
    refRiseLocal: '07:22',
    season: 'Anchor / New Moon',
    source: 'HMNAO / USNO',
  },
  {
    city: 'Ujjain',
    lat: 23.1765,
    lon: 75.7885,
    tz: 'Asia/Kolkata',
    dateStr: '2026-02-17',
    refRiseLocal: '06:48',
    season: 'Anchor / New Moon',
    source: 'USNO / Positional Astronomy Centre',
  },
  {
    city: 'Ujjain',
    lat: 23.1765,
    lon: 75.7885,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-03',
    refRiseLocal: '18:29',
    season: 'Anchor / Full Moon',
    source: 'USNO / Positional Astronomy Centre',
  },

  // 2. §10 City List Coverage across Solstices, Equinoxes & High-Declination
  {
    city: 'Delhi',
    lat: 28.6139,
    lon: 77.2090,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-20',
    refRiseLocal: '06:55',
    season: 'Vernal Equinox',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Varanasi',
    lat: 25.3176,
    lon: 82.9739,
    tz: 'Asia/Kolkata',
    dateStr: '2026-06-21',
    refRiseLocal: '11:24',
    season: 'Summer Solstice',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Mumbai',
    lat: 19.0760,
    lon: 72.8777,
    tz: 'Asia/Kolkata',
    dateStr: '2026-09-22',
    refRiseLocal: '15:47',
    season: 'Autumnal Equinox',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    tz: 'Asia/Kolkata',
    dateStr: '2026-12-21',
    refRiseLocal: '14:58',
    season: 'Winter Solstice',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-03',
    refRiseLocal: '17:37',
    season: 'Full Moon / High-Declination',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Kathmandu',
    lat: 27.7172,
    lon: 85.3240,
    tz: 'Asia/Kathmandu',
    dateStr: '2026-03-20',
    refRiseLocal: '06:37',
    season: 'Vernal Equinox',
    source: 'USNO Ephemeris',
  },
  {
    city: 'London',
    lat: 51.5074,
    lon: -0.1278,
    tz: 'Europe/London',
    dateStr: '2026-06-21',
    refRiseLocal: '12:39',
    season: 'Summer Solstice',
    source: 'HMNAO Ephemeris',
  },
  {
    city: 'New York',
    lat: 40.7128,
    lon: -74.0060,
    tz: 'America/New_York',
    dateStr: '2026-09-22',
    refRiseLocal: '17:01',
    season: 'Autumnal Equinox',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
    tz: 'Australia/Sydney',
    dateStr: '2026-12-21',
    refRiseLocal: '17:04',
    season: 'Solstice (Southern Hemisphere)',
    source: 'USNO Ephemeris',
  },
  {
    city: 'Reykjavík',
    lat: 64.1466,
    lon: -21.9426,
    tz: 'Atlantic/Reykjavik',
    dateStr: '2026-03-20',
    refRiseLocal: '07:12',
    season: 'High Latitude Probe',
    source: 'HMNAO Ephemeris',
  },
];

function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function dateToLocalMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  let h = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  if (h === 24) h = 0;
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  return h * 60 + m;
}

function formatLocalTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

describe('Moonrise Engine Tier 1/2 Golden Accuracy Suite (D23 & §10)', () => {
  it('reproduces all anchor times and §10 city targets within 2 minutes tolerance', () => {
    for (const fixture of GOLDEN_FIXTURES) {
      const [y, m, d] = fixture.dateStr.split('-').map(Number);
      const testDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const res = getMoonRiseSet(testDate, fixture.lat, fixture.lon, fixture.tz);

      expect(res.ok).toBe(true);
      if (res.ok && res.moonrise) {
        const computedLocalStr = formatLocalTime(res.moonrise, fixture.tz);
        const computedMins = dateToLocalMinutes(res.moonrise, fixture.tz);
        const refMins = timeStrToMinutes(fixture.refRiseLocal);
        const diffMins = Math.abs(computedMins - refMins);

        console.log(
          `[§10 City Target] ${fixture.city} (${fixture.dateStr}): Computed ${computedLocalStr} vs Ref ${fixture.refRiseLocal} (Diff: ${diffMins.toFixed(1)} min)`
        );

        expect(
          diffMins,
          `Moonrise for ${fixture.city} on ${fixture.dateStr} (${computedLocalStr}) differed from reference (${fixture.refRiseLocal}) by ${diffMins} min`
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  describe('D20 — DST Civil Day Bounds (London 23h & 25h Transitions)', () => {
    it('handles 23-hour spring-forward DST transition day (London 2026-03-29)', () => {
      const date = new Date('2026-03-29T12:00:00Z');
      const res = getMoonRiseSet(date, 51.5074, -0.1278, 'Europe/London');
      expect(res.ok).toBe(true);
      if (res.ok && res.moonrise) {
        const localTime = formatLocalTime(res.moonrise, 'Europe/London');
        console.log('[DST Spring-Forward 23h] London 2026-03-29 Moonrise:', localTime);
        expect(localTime).toBe('15:20');
      }
    });

    it('handles 25-hour fall-back DST transition day (London 2026-10-25)', () => {
      const date = new Date('2026-10-25T12:00:00Z');
      const res = getMoonRiseSet(date, 51.5074, -0.1278, 'Europe/London');
      expect(res.ok).toBe(true);
      if (res.ok && res.moonrise) {
        const localTime = formatLocalTime(res.moonrise, 'Europe/London');
        console.log('[DST Fall-Back 25h] London 2026-10-25 Moonrise:', localTime);
        expect(localTime).toBe('16:00');
      }
    });
  });

  describe('D21 — High-Latitude Proxy Policy (§8)', () => {
    it('uses proxy latitude 60° and adds latitude_proxy diagnostic for polar latitude', () => {
      // Longyearbyen Svalbard (78.22°N)
      const date = new Date('2026-03-20T12:00:00Z');
      const res = getMoonRiseSet(date, 78.22, 15.63, 'Europe/Oslo');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.diagnostics).toContain('latitude_proxy');
      }
    });
  });

  describe('Preserved Sound Invariants (T4 & T5)', () => {
    it('T4: returns null for moonrise on civil date with no moonrise (Ujjain 2026-02-08)', () => {
      const date = new Date('2026-02-08T12:00:00Z');
      const res = getMoonRiseSet(date, 23.1765, 75.7885, 'Asia/Kolkata');
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.moonrise).toBeNull();
        expect(res.diagnostics).toContain('no_moonrise_on_civil_date');
      }
    });

    it('T5: findNextMoonrise is strictly deterministic and monotonic', () => {
      const start = new Date('2026-02-17T00:00:00Z');
      const next1 = findNextMoonrise(start, 23.1765, 75.7885);
      const next2 = findNextMoonrise(start, 23.1765, 75.7885);

      expect(next1).not.toBeNull();
      expect(next1?.getTime()).toBeGreaterThan(start.getTime());
      expect(next1?.getTime()).toBe(next2?.getTime());
    });
  });
});
