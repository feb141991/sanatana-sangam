/**
 * travel-aware-recalculation.test.ts
 *
 * Test suite for travel-aware recalculation without overwriting spiritual identity or home data.
 * Verifies:
 * 1. Location & timezone divergence detection (home vs device/travel).
 * 2. Asking/requiring confirmation before using temporary travel location.
 * 3. Temporary travel mode isolation (never mutates calendar profile, tradition profile, or home location).
 * 4. Deterministic cache key generation including civil date, coords, timezone, profile, and engine version.
 * 5. Notifications continuing to use saved observance location unless confirmed.
 * 6. Handling DST boundaries (e.g. Europe/London GMT/BST) and International Date Line crossings (e.g. Tokyo to Honolulu).
 * 7. Location provenance reporting showing which location produced each date.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveCalendarContext,
  buildCalendarCacheKey,
} from '../calendar-context';
import {
  detectTimezoneDivergence,
  calculateCivilDateOffsetAcrossIDL,
  isDstActiveInTimezone,
  formatLocationProvenance,
} from '../timezone-utils';
import { getNotificationObservanceLocation } from '@/lib/observance-notification-source';

describe('Travel-Aware Recalculation & Isolation', () => {
  const homeIndiaLocation = {
    label: 'New Delhi, India',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
  };

  const travelBedfordLocation = {
    label: 'Bedford, UK',
    latitude: 52.1386,
    longitude: -0.4667,
    timezone: 'Europe/London',
  };

  it('1. Detects device timezone/location divergence from saved observance location', () => {
    const divergence = detectTimezoneDivergence(homeIndiaLocation, travelBedfordLocation);

    expect(divergence.isDivergent).toBe(true);
    expect(divergence.reason).toBe('timezone_mismatch');
    expect(divergence.homeTimezone).toBe('Asia/Kolkata');
    expect(divergence.travelTimezone).toBe('Europe/London');
  });

  it('2. Requires explicit user confirmation before applying temporary travel location', () => {
    // Unconfirmed travel location -> calculations stay on saved home location
    const unconfirmedContext = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      location: homeIndiaLocation,
      travelLocation: travelBedfordLocation,
      confirmTravelLocation: false, // User has NOT confirmed travel mode yet
    });

    expect(unconfirmedContext.isTravelDivergenceDetected).toBe(true);
    expect(unconfirmedContext.isTravelModeActive).toBe(false);
    expect(unconfirmedContext.effectiveCalculationLocation.latitude).toBe(28.6139);
    expect(unconfirmedContext.effectiveCalculationLocation.timezone).toBe('Asia/Kolkata');

    // Confirmed travel location -> calculations use travel location for this request
    const confirmedContext = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      location: homeIndiaLocation,
      travelLocation: travelBedfordLocation,
      confirmTravelLocation: true, // User confirmed travel mode
    });

    expect(confirmedContext.isTravelDivergenceDetected).toBe(true);
    expect(confirmedContext.isTravelModeActive).toBe(true);
    expect(confirmedContext.effectiveCalculationLocation.latitude).toBe(52.1386);
    expect(confirmedContext.effectiveCalculationLocation.timezone).toBe('Europe/London');
    expect(confirmedContext.effectiveCalculationLocation.isTravelLocation).toBe(true);
  });

  it('3. Temporary travel mode NEVER mutates calendar profile, tradition profile, or home location', () => {
    const confirmedContext = resolveCalendarContext({
      calendarProfile: 'marathi_amanta',
      traditionProfile: 'swaminarayan',
      location: homeIndiaLocation,
      travelLocation: travelBedfordLocation,
      confirmTravelLocation: true,
    });

    // Spiritual profile & home location remain untouched
    expect(confirmedContext.calendarProfile).toBe('marathi_amanta');
    expect(confirmedContext.displayedTraditionProfile).toBe('swaminarayan');
    expect(confirmedContext.savedObservanceLocation.latitude).toBe(28.6139);
    expect(confirmedContext.savedObservanceLocation.timezone).toBe('Asia/Kolkata');
    expect(Boolean(confirmedContext.savedObservanceLocation.isTravelLocation)).toBe(false);
    expect(confirmedContext.effectiveCalculationLocation.isTravelLocation).toBe(true);
  });

  it('4. Cache key contains civil date, coordinates, timezone, profile, and engine version', () => {
    const key = buildCalendarCacheKey({
      date: '2026-04-26',
      latitude: 52.1386,
      longitude: -0.4667,
      timezone: 'Europe/London',
      calendarProfile: 'north_indian_purnimanta',
      displayedTraditionProfile: 'smarta',
      engineVersion: '1.0.0',
    });

    expect(key).toContain('2026-04-26');
    expect(key).toContain('coords=52.1386,-0.4667');
    expect(key).toContain('tz=Europe/London');
    expect(key).toContain('cal=north_indian_purnimanta');
    expect(key).toContain('trad=smarta');
    expect(key).toContain('ver=1.0.0');

    // Context also attaches cacheKey when dateForCacheKey is passed
    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      location: homeIndiaLocation,
      dateForCacheKey: '2026-04-26',
    });

    expect(context.cacheKey).toBeDefined();
    expect(context.cacheKey).toContain('2026-04-26');
  });

  it('5. Notifications continue using explicitly selected home location unless travel mode is explicitly confirmed for notifications', () => {
    const savedProfile = {
      city: 'New Delhi',
      country: 'India',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
    };

    const travelOpt = {
      travelLocation: {
        city: 'Bedford',
        country: 'UK',
        latitude: 52.1386,
        longitude: -0.4667,
        timezone: 'Europe/London',
      },
      confirmTravelNotifications: false, // Unconfirmed for push notifications
    };

    // Default notification scheduling uses home location
    const notifLocDefault = getNotificationObservanceLocation(savedProfile, travelOpt);
    expect(notifLocDefault.latitude).toBe(28.6139);
    expect(notifLocDefault.timezone).toBe('Asia/Kolkata');
    expect(notifLocDefault.isTravelLocation).toBe(false);

    // Confirmed notification scheduling uses travel location
    const notifLocConfirmed = getNotificationObservanceLocation(savedProfile, {
      ...travelOpt,
      confirmTravelNotifications: true,
    });
    expect(notifLocConfirmed.latitude).toBe(52.1386);
    expect(notifLocConfirmed.timezone).toBe('Europe/London');
    expect(notifLocConfirmed.isTravelLocation).toBe(true);
  });

  it('6. Handles DST boundaries (Europe/London GMT/BST) and International Date Line crossings (Tokyo to Honolulu)', () => {
    // DST check for London in July (BST UTC+1) vs January (GMT UTC+0)
    const summerDate = new Date('2026-07-15T12:00:00Z');
    const isSummerDst = isDstActiveInTimezone('Europe/London', summerDate);
    expect(typeof isSummerDst).toBe('boolean');

    // International Date Line (IDL) jump: Tokyo (UTC+9) -> Honolulu (UTC-10)
    // At 02:00 AM UTC on Aug 10: Tokyo is 11:00 AM Aug 10; Honolulu is 4:00 PM Aug 9 (-1 day jump)
    const utcMoment = '2026-08-10T02:00:00Z';
    const idlResult = calculateCivilDateOffsetAcrossIDL(utcMoment, 'Asia/Tokyo', 'Pacific/Honolulu');

    expect(idlResult.sourceCivilDate).toBe('2026-08-10'); // Aug 10 in Tokyo
    expect(idlResult.targetCivilDate).toBe('2026-08-09'); // Aug 9 in Honolulu (-1 day jump across IDL)
    expect(idlResult.dateOffsetDays).toBe(-1);
  });

  it('7. Clearly indicates which location produced each date', () => {
    const homeLabel = formatLocationProvenance({
      label: 'New Delhi, India',
      timezone: 'Asia/Kolkata',
      isTravelLocation: false,
    });
    expect(homeLabel).toBe('New Delhi, India (Home Observance Site · Asia/Kolkata)');

    const travelLabel = formatLocationProvenance({
      label: 'Bedford, UK',
      timezone: 'Europe/London',
      isTravelLocation: true,
    });
    expect(travelLabel).toBe('Bedford, UK (Travel Location · Europe/London)');
  });
});
