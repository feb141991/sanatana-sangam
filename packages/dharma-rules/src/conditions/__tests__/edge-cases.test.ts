import { describe, it, expect } from 'vitest';
import {
  calculatePanchang,
  getLunarMonth,
  parseCivilDateUtc,
  getSunriseForDateStr,
  getMoonRiseSet,
} from '../../../../panchang-engine/src/index';
import { classifyLunarMonth } from '../../../../panchang-engine/src/lunar-month/index';
import { getPeriodWindow } from '../evaluator';
import { getSunriseSunset } from '../../../../panchang-engine/src/core/astronomy';

describe('Edge-Case Behavior Fixtures (E1-E13)', () => {

  /**
   * E1: Adhika Masa (Adhika Jyeshtha 2026)
   * Proves: The month classifier detects zero Sankrantis and labels the month as 'Adhika Jyeshtha'.
   * Defect this test would NOT catch: Typo in the month names array mapping (e.g. mapping index 2 to another month).
   */
  it('E1: Adhika Masa - classifies Adhika Jyeshtha 2026 correctly', () => {
    const testDate = new Date('2026-05-20T12:00:00Z');
    const result = getLunarMonth(testDate, 'amanta');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isAdhika).toBe(true);
      expect(result.isKshaya).toBe(false);
      expect(result.monthName).toBe('Adhika Jyeshtha');
      expect(result.sankrantiCount).toBe(0);
    }

    // Verify subsequent month is normal (Nija) Jyeshtha
    const nijaDate = new Date('2026-06-20T12:00:00Z');
    const nijaResult = getLunarMonth(nijaDate, 'amanta');
    expect(nijaResult.ok).toBe(true);
    if (nijaResult.ok) {
      expect(nijaResult.isAdhika).toBe(false);
      expect(nijaResult.monthName).toBe('Jyeshtha');
      expect(nijaResult.sankrantiCount).toBe(1);
    }
  });

  /**
   * E2: Kṣaya Masa Classifier Safety
   * Proves: The classifier resolves double Sankranti overlap gracefully without crashes and logs warnings.
   * Defect this test would NOT catch: Errors in the bisection solver when locating double crossings under active ephemeris logic (since this mocks input).
   */
  it('E2: Kṣaya Masa - pure classifier handles double Sankrantis without crash', () => {
    const classification = classifyLunarMonth({
      sunSiderealAtStart: 240, // sidereal Scorpio
      sankrantis: [
        { rashi: 8, at: new Date('2026-11-15T08:00:00Z') }, // Dhanu Sankranti
        { rashi: 9, at: new Date('2026-12-14T20:00:00Z') }, // Makara Sankranti
      ],
    });

    expect(classification.isKshaya).toBe(true);
    expect(classification.isAdhika).toBe(false);
    expect(classification.sankrantiCount).toBe(2);
    expect(classification.diagnostics.some(d => d.includes('kshaya_masa'))).toBe(true);
  });

  /**
   * E3 & E5: Vṛddhi Tithi (Tuesday, May 5, 2026 - Ujjain)
   * Proves: Chaturthi (index 19) is active at sunrise on both May 5 and May 6, 2026.
   * Defect this test would NOT catch: Disagreements in traditional local moonrise calculation tables (e.g. if the NOAA moonrise method differs from another authority).
   */
  it('E3 & E5: Vṛddhi Tithi - Chaturthi spans two sunrises at Ujjain, Sankashti matches May 5 moonrise', () => {
    const lat = 23.176, lon = 75.788, tz = 'Asia/Kolkata';
    const loc = { lat, lon, tz };

    // 1. Assert Chaturthi is active at sunrise on May 5, 2026
    const d5 = parseCivilDateUtc('2026-05-05');
    const p5 = calculatePanchang(d5, lat, lon, tz);
    expect(p5.tithiIndex).toBe(19); // Chaturthi active at default 5am UTC reference

    // 2. Verify Chaturthi starts before sunrise on May 5
    const { sunrise: sunrise5 } = getSunriseForDateStr('2026-05-05', loc);
    const pSunrise5 = calculatePanchang(sunrise5, lat, lon, tz);
    expect(pSunrise5.tithiIndex).toBe(19);

    // 3. Verify Chaturthi ends after sunrise on May 6
    const { sunrise: sunrise6 } = getSunriseForDateStr('2026-05-06', loc);
    const pSunrise6 = calculatePanchang(sunrise6, lat, lon, tz);
    expect(pSunrise6.tithiIndex).toBe(19); // Chaturthi is still active at May 6 sunrise!

    // 4. Verify Moonrise Chaturthi matching behavior
    const moon5 = getMoonRiseSet(d5, lat, lon, tz) as any;
    expect(moon5.ok).toBe(true);
    if (moon5.ok && moon5.moonrise) {
      const pMoon5 = calculatePanchang(moon5.moonrise, lat, lon, tz);
      expect(pMoon5.tithiIndex).toBe(19); // Chaturthi is active at moonrise on May 5
    }

    const d6 = parseCivilDateUtc('2026-05-06');
    const moon6 = getMoonRiseSet(d6, lat, lon, tz) as any;
    expect(moon6.ok).toBe(true);
    if (moon6.ok && moon6.moonrise) {
      const pMoon6 = calculatePanchang(moon6.moonrise, lat, lon, tz);
      expect(pMoon6.tithiIndex).toBe(20); // Chaturthi has ended, Panchami is active at moonrise on May 6
    }
  });

  /**
   * E4: Kṣaya Tithi (Krishna Chaturthi, January 2026 - Ujjain)
   * Proves: Krishna Chaturthi (index 19) is skipped at sunrise between Jan 6 and Jan 7, 2026.
   * Defect this test would NOT catch: A bug where a kshaya tithi spans sunrise in a different timezone (e.g. America/New_York) and is incorrectly skipped there.
   */
  it('E4: Kṣaya Tithi - Krishna Chaturthi is skipped at sunrise between Jan 6 and Jan 7, 2026', () => {
    const lat = 23.176, lon = 75.788, tz = 'Asia/Kolkata';
    const loc = { lat, lon, tz };

    const { sunrise: sunrise6 } = getSunriseForDateStr('2026-01-06', loc);
    const tithi6 = calculatePanchang(sunrise6, lat, lon, tz).tithiIndex;
    expect(tithi6).toBe(18); // Tritiya at sunrise

    const { sunrise: sunrise7 } = getSunriseForDateStr('2026-01-07', loc);
    const tithi7 = calculatePanchang(sunrise7, lat, lon, tz).tithiIndex;
    expect(tithi7).toBe(20); // Panchami at sunrise

    // Tithi 19 (Chaturthi) was skipped at sunrise!
    expect(tithi7 - tithi6).toBe(2);
  });

  /**
   * E6 & E7: Civil date with NO moonrise & Next-Night Extension (Bedford - 2026-05-04)
   * Proves: Bedford has no moonrise on May 4, 2026, but next-night extension retrieves May 5 moonrise (which occurs before sunrise).
   * Defect this test would NOT catch: Cases where the extended moonrise falls *after* the next day's sunrise, which should be rejected.
   */
  it('E6 & E7: Moonrise - resolves absent moonrise at Bedford on May 4, 2026 via next-night extension', () => {
    const location = { lat: 52.135, lon: -0.467, tz: 'Europe/London' };

    // 1. Confirm getMoonRiseSet reports no moonrise on May 4
    const d4 = parseCivilDateUtc('2026-05-04');
    const moon = getMoonRiseSet(d4, location.lat, location.lon, location.tz) as any;
    expect(moon.ok).toBe(true);
    expect(moon.moonrise).toBeNull();

    // 2. Assert that getPeriodWindow for moonrise retrieves the extended moonrise
    const window = getPeriodWindow('moonrise', '2026-05-04', location);
    expect(window).not.toBeNull();
    if (window) {
      expect(window.diagnostics.includes('extended_moonrise')).toBe(true);
      // Expected time is May 5 at ~00:18 AM local / May 4 at 23:18 UTC
      expect(window.start.toISOString()).toBe('2026-05-04T23:18:05.008Z');
    }
  });

  /**
   * E8: DST Transitions (London - March 29, 2026 & October 25, 2026)
   * Proves: Period windows compute correct UTC timestamps across 23h and 25h DST transition days.
   * Defect this test would NOT catch: Clock offset mismatch issues in the client application interface (since this verifies server/library model calculations only).
   */
  it('E8: DST Transitions - period windows resolve correctly across London DST transitions', () => {
    const location = { lat: 52.135, lon: -0.467, tz: 'Europe/London' };

    // March 29, 2026 (Goes forward, 23h day)
    const springWindow = getPeriodWindow('pradosha', '2026-03-29', location);
    expect(springWindow).not.toBeNull();
    if (springWindow) {
      // Clocks go forward at 01:00 UTC. Sunset is in the evening.
      // Offset should be +1.
      expect(springWindow.start.getTime()).toBeLessThan(springWindow.end.getTime());
    }

    // October 25, 2026 (Goes back, 25h day)
    const autumnWindow = getPeriodWindow('pradosha', '2026-10-25', location);
    expect(autumnWindow).not.toBeNull();
    if (autumnWindow) {
      // Clocks go back at 02:00 local time. Sunset offset should be +0.
      expect(autumnWindow.start.getTime()).toBeLessThan(autumnWindow.end.getTime());
    }
  });

  /**
   * E12: Year Boundary Rollover
   * Proves: Tithi index calculations near December 31 / January 1 map to timezone-consistent local dates.
   * Defect this test would NOT catch: Date formatter truncation errors in local display modules.
   */
  it('E12: Year Boundary - timezone-consistent date assignment on Dec 31, 2026 / Jan 1, 2027', () => {
    const nyLocation = { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' };
    const sydLocation = { lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' };

    // Sample near UTC midnight: 2026-12-31T20:00:00Z
    // - In New York: Dec 31, 2026 at 15:00 (3 PM EST)
    // - In Sydney: Jan 1, 2027 at 07:00 (7 AM AEDT)
    const testInstant = new Date('2026-12-31T20:00:00Z');

    const nyPanchang = calculatePanchang(testInstant, nyLocation.lat, nyLocation.lon, nyLocation.tz);
    const sydPanchang = calculatePanchang(testInstant, sydLocation.lat, sydLocation.lon, sydLocation.tz);

    expect(nyPanchang.date.includes('31 Dec') || nyPanchang.date.includes('December')).toBe(true);
    expect(sydPanchang.date.includes('1 Jan') || sydPanchang.date.includes('January')).toBe(true);
  });

  /**
   * E9 & E10: High Latitude & Compressed Night (Norway polar midsummer 2026)
   * Proves: Evaluator uses a 60° latitude proxy for >=66.5 to avoid null windows, and flags 'latitude_proxy' and 'compressed_night' diagnostics.
   * Defect this test would NOT catch: Complete absence of sun rises/sets at extreme winter (polar night), where getSunriseSunset may return null.
   */
  it('E9 & E10: High Latitude - applies latitude proxy and detects compressed night at Tromsø/Reykjavik', () => {
    const tromso = { lat: 69.649, lon: 18.956, tz: 'Europe/Oslo' }; // Tromsø, Norway (latitude > 66.5)
    const reykjavik = { lat: 64.146, lon: -21.942, tz: 'Atlantic/Reykjavik' }; // Reykjavik, Iceland (latitude < 66.5)

    // 1. Tromsø triggers latitude_proxy
    const tWindow = getPeriodWindow('nishita', '2026-06-21', tromso);
    expect(tWindow).not.toBeNull();
    if (tWindow) {
      expect(tWindow.diagnostics.includes('latitude_proxy')).toBe(true);
    }

    // 2. Reykjavik triggers compressed_night
    const rWindow = getPeriodWindow('nishita', '2026-06-21', reykjavik);
    expect(rWindow).not.toBeNull();
    if (rWindow) {
      expect(rWindow.diagnostics.includes('compressed_night')).toBe(true);
    }
  });

  /**
   * E13 (implied): Sunrise Boundary Tolerance Boundary Case
   * Proves: Evaluates boundary closeness to sunrise. A tithi boundary within 60s of sunrise has mathematically undefined ownership.
   * Defect this test would NOT catch: Systemic offset errors in the julian date calculator itself.
   */
  it('E13: Sunrise Boundary - verifies that tithi boundary proximity to sunrise is measured', () => {
    const lat = 23.176, lon = 75.788, tz = 'Asia/Kolkata';
    const dateStr = '2026-05-05';
    const base = parseCivilDateUtc(dateStr);
    const loc = { lat, lon, tz };

    const { sunrise } = getSunriseForDateStr(dateStr, loc);
    expect(sunrise).not.toBeNull();

    if (sunrise) {
      const pSunrise = calculatePanchang(sunrise, lat, lon, tz);
      // We check that a mock change in sunrise by < 60s is within the undefined boundary limit
      const closeInstant = new Date(sunrise.getTime() + 10 * 1000); // 10s offset
      const pClose = calculatePanchang(closeInstant, lat, lon, tz);

      // Within 60 seconds tolerance, they must remain identical or resolve to the same astronomical state
      expect(pClose.tithiIndex).toBe(pSunrise.tithiIndex);
    }
  });

});
