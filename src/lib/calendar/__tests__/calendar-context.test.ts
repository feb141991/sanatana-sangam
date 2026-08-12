/**
 * calendar-context.test.ts
 *
 * Table-driven test suite for resolveCalendarContext.
 * Verifies:
 * - All seeded calendar profiles mapping to month system and era through
 *   definitions loaded from calendar_profiles.
 * - All 7 tradition profiles mapping to displayed profile vs calculation method profile,
 *   Ekadashi method, and Janmashtami method.
 * - Missing/unknown choices remaining 'unknown'.
 * - 'unspecified' tradition using Smarta calculations while remaining labelled 'unspecified'.
 * - Database and auth failure states remaining distinct from guest sessions.
 * - Location and timezone maintaining atomic pair integrity.
 * - GPS/timezone NEVER inferring calendar profile.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveCalendarContext,
  CalendarProfileId,
  MonthSystem,
  CalendarEra,
  TraditionProfileId,
  CalculationMethodProfile,
  EkadashiMethod,
  JanmashtamiMethod,
} from '../calendar-context';

describe('Pure Calendar Context Resolver (resolveCalendarContext)', () => {
  describe('Seeded Calendar Profiles — Table-Driven Tests', () => {
    const calendarProfileCases: Array<{
      inputProfile: string;
      expectedId: CalendarProfileId;
      expectedMonthSystem: MonthSystem;
      expectedEra: CalendarEra;
    }> = [
      {
        inputProfile: 'legacy-ujjain',
        expectedId: 'legacy-ujjain',
        expectedMonthSystem: 'unknown',
        expectedEra: 'vikram_north',
      },
      {
        inputProfile: 'north_indian_purnimanta',
        expectedId: 'north_indian_purnimanta',
        expectedMonthSystem: 'purnimanta',
        expectedEra: 'vikram_north',
      },
      {
        inputProfile: 'gujarati_amanta',
        expectedId: 'gujarati_amanta',
        expectedMonthSystem: 'amanta',
        expectedEra: 'vikram_gujarat',
      },
      {
        inputProfile: 'marathi_amanta',
        expectedId: 'marathi_amanta',
        expectedMonthSystem: 'amanta',
        expectedEra: 'shaka',
      },
      {
        inputProfile: 'kannada_telugu_amanta',
        expectedId: 'kannada_telugu_amanta',
        expectedMonthSystem: 'amanta',
        expectedEra: 'shaka',
      },
      {
        inputProfile: 'tamil_solar',
        expectedId: 'tamil_solar',
        expectedMonthSystem: 'solar',
        expectedEra: 'unknown',
      },
      {
        inputProfile: 'malayalam_solar',
        expectedId: 'malayalam_solar',
        expectedMonthSystem: 'solar',
        expectedEra: 'kollam',
      },
      {
        inputProfile: 'bengali_solar',
        expectedId: 'bengali_solar',
        expectedMonthSystem: 'solar',
        expectedEra: 'bengali_san',
      },
      {
        inputProfile: 'odia',
        expectedId: 'odia',
        expectedMonthSystem: 'amanta',
        expectedEra: 'shaka',
      },
      {
        inputProfile: 'nepali_bikram',
        expectedId: 'nepali_bikram',
        expectedMonthSystem: 'purnimanta',
        expectedEra: 'bikram_sambat',
      },
      {
        inputProfile: 'global_sanatan',
        expectedId: 'global_sanatan',
        expectedMonthSystem: 'amanta',
        expectedEra: 'vikram_north',
      },
      {
        inputProfile: 'kannada_amanta',
        expectedId: 'kannada_amanta',
        expectedMonthSystem: 'amanta',
        expectedEra: 'shaka',
      },
      {
        inputProfile: 'telugu_amanta',
        expectedId: 'telugu_amanta',
        expectedMonthSystem: 'amanta',
        expectedEra: 'shaka',
      },
    ];

    it.each(calendarProfileCases)(
      'resolves calendar profile "$inputProfile" to monthSystem=$expectedMonthSystem and era=$expectedEra',
      ({ inputProfile, expectedId, expectedMonthSystem, expectedEra }) => {
        const ctx = resolveCalendarContext({
          calendarProfile: inputProfile,
          calendarProfileDefinition: {
            slug: inputProfile,
            monthSystem: expectedMonthSystem,
            era: expectedEra,
          },
        });
        expect(ctx.calendarProfile).toBe(expectedId);
        expect(ctx.monthSystem).toBe(expectedMonthSystem);
        expect(ctx.era).toBe(expectedEra);
        expect(ctx.disclosureDiagnostics.calendarProfileKnown).toBe(true);
      }
    );

    it('does not accept an unverified slug without its database definition', () => {
      const context = resolveCalendarContext({ calendarProfile: 'north_indian_purnimanta' });
      expect(context.calendarProfile).toBe('unknown');
      expect(context.monthSystem).toBe('unknown');
      expect(context.disclosureDiagnostics.calendarProfileKnown).toBe(false);
    });
  });

  describe('7 Launch Tradition Profiles — Table-Driven Tests', () => {
    const traditionProfileCases: Array<{
      inputTradition: string;
      expectedDisplayed: TraditionProfileId;
      expectedCalcMethod: CalculationMethodProfile;
      expectedEkadashi: EkadashiMethod;
      expectedJanmashtami: JanmashtamiMethod;
      isUnspecifiedLabel: boolean;
    }> = [
      {
        inputTradition: 'smarta',
        expectedDisplayed: 'smarta',
        expectedCalcMethod: 'smarta',
        expectedEkadashi: 'smarta',
        expectedJanmashtami: 'smarta_nishita',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'gaudiya_iskcon',
        expectedDisplayed: 'gaudiya_iskcon',
        expectedCalcMethod: 'vaishnava_suddha',
        expectedEkadashi: 'vaishnava_suddha',
        expectedJanmashtami: 'vaishnava_rohini',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'sri_vaishnava',
        expectedDisplayed: 'sri_vaishnava',
        expectedCalcMethod: 'vaishnava_suddha',
        expectedEkadashi: 'vaishnava_suddha',
        expectedJanmashtami: 'vaishnava_rohini',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'swaminarayan',
        expectedDisplayed: 'swaminarayan',
        expectedCalcMethod: 'vaishnava_suddha',
        expectedEkadashi: 'vaishnava_suddha',
        expectedJanmashtami: 'vaishnava_rohini',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'shaiva',
        expectedDisplayed: 'shaiva',
        expectedCalcMethod: 'smarta',
        expectedEkadashi: 'smarta',
        expectedJanmashtami: 'smarta_nishita',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'shakta',
        expectedDisplayed: 'shakta',
        expectedCalcMethod: 'smarta',
        expectedEkadashi: 'smarta',
        expectedJanmashtami: 'smarta_nishita',
        isUnspecifiedLabel: false,
      },
      {
        inputTradition: 'unspecified',
        expectedDisplayed: 'unspecified',
        expectedCalcMethod: 'smarta',
        expectedEkadashi: 'smarta',
        expectedJanmashtami: 'smarta_nishita',
        isUnspecifiedLabel: true,
      },
    ];

    it.each(traditionProfileCases)(
      'resolves tradition "$inputTradition" to displayed=$expectedDisplayed, calc=$expectedCalcMethod',
      ({ inputTradition, expectedDisplayed, expectedCalcMethod, expectedEkadashi, expectedJanmashtami, isUnspecifiedLabel }) => {
        const ctx = resolveCalendarContext({
          traditionProfile: inputTradition,
          traditionProfileDefinition: {
            slug: inputTradition,
            ekadashiMethod: expectedEkadashi,
            janmashtamiMethod: expectedJanmashtami,
          },
        });
        expect(ctx.displayedTraditionProfile).toBe(expectedDisplayed);
        expect(ctx.calculationMethodProfile).toBe(expectedCalcMethod);
        expect(ctx.ekadashiMethod).toBe(expectedEkadashi);
        expect(ctx.janmashtamiMethod).toBe(expectedJanmashtami);
        expect(ctx.disclosureDiagnostics.isUnspecifiedLabel).toBe(isUnspecifiedLabel);
        expect(ctx.disclosureDiagnostics.traditionKnown).toBe(true);
      }
    );

    it('"unspecified" uses approved Smarta calculation behavior BUT remains labelled unspecified', () => {
      const ctx = resolveCalendarContext({
        traditionProfile: 'unspecified',
        traditionProfileDefinition: {
          slug: 'unspecified',
          ekadashiMethod: 'smarta',
          janmashtamiMethod: 'smarta_nishita',
        },
      });
      expect(ctx.displayedTraditionProfile).toBe('unspecified');
      expect(ctx.calculationMethodProfile).toBe('smarta');
      expect(ctx.disclosureDiagnostics.isUnspecifiedLabel).toBe(true);
    });
  });

  describe('Missing & Unknown Values', () => {
    it('missing calendar profile resolves to unknown profile, monthSystem, and era', () => {
      const ctx = resolveCalendarContext({ calendarProfile: null });
      expect(ctx.calendarProfile).toBe('unknown');
      expect(ctx.monthSystem).toBe('unknown');
      expect(ctx.era).toBe('unknown');
      expect(ctx.disclosureDiagnostics.calendarProfileKnown).toBe(false);
    });

    it('missing tradition profile resolves to unknown for all tradition methods', () => {
      const ctx = resolveCalendarContext({ traditionProfile: undefined });
      expect(ctx.displayedTraditionProfile).toBe('unknown');
      expect(ctx.calculationMethodProfile).toBe('unknown');
      expect(ctx.ekadashiMethod).toBe('unknown');
      expect(ctx.janmashtamiMethod).toBe('unknown');
      expect(ctx.disclosureDiagnostics.traditionKnown).toBe(false);
    });

    it('invalid or unrecognized calendar profile ID remains unknown', () => {
      const ctx = resolveCalendarContext({ calendarProfile: 'invalid_custom_profile' });
      expect(ctx.calendarProfile).toBe('unknown');
      expect(ctx.monthSystem).toBe('unknown');
      expect(ctx.era).toBe('unknown');
    });
  });

  describe('Session, Auth & Database Failure States', () => {
    it('guest session (unauthenticated) resolves resolutionStatus = guest', () => {
      const ctx = resolveCalendarContext({ isAuthenticated: false });
      expect(ctx.disclosureDiagnostics.resolutionStatus).toBe('guest');
    });

    it('invalid credentials token does NOT collapse to guest or default', () => {
      const ctx = resolveCalendarContext({ invalidCredentials: true });
      expect(ctx.disclosureDiagnostics.resolutionStatus).toBe('invalid_credentials');
      expect(ctx.disclosureDiagnostics.resolutionStatus).not.toBe('guest');
    });

    it('database query failure does NOT collapse to guest or missing row state', () => {
      const dbErr = new Error('Connection timed out');
      const ctx = resolveCalendarContext({ dbError: dbErr });
      expect(ctx.disclosureDiagnostics.resolutionStatus).toBe('database_failure');
      expect(ctx.disclosureDiagnostics.errorMessage).toBe('Connection timed out');
      expect(ctx.disclosureDiagnostics.resolutionStatus).not.toBe('guest');
    });
  });

  describe('Atomic Location and Timezone Pair & GPS Invariance', () => {
    it('calendar profile is NEVER inferred from location coordinates or timezone', () => {
      const ctx = resolveCalendarContext({
        calendarProfile: null,
        location: {
          label: 'Chennai, Tamil Nadu',
          latitude: 13.0827,
          longitude: 80.2707,
          timezone: 'Asia/Kolkata',
        },
      });

      // Must remain unknown — never auto-switched to tamil_solar
      expect(ctx.calendarProfile).toBe('unknown');
      expect(ctx.disclosureDiagnostics.calendarProfileInferredFromGps).toBe(false);
    });

    it('valid atomic location and timezone pair is returned together', () => {
      const ctx = resolveCalendarContext({
        location: {
          label: 'Ujjain, MP, India',
          latitude: 23.1765,
          longitude: 75.7885,
          timezone: 'Asia/Kolkata',
        },
      });

      expect(ctx.observanceLocation).toEqual({
        label: 'Ujjain, MP, India',
        latitude: 23.1765,
        longitude: 75.7885,
        timezone: 'Asia/Kolkata',
      });
      expect(ctx.timezone).toBe('Asia/Kolkata');
      expect(ctx.locationSource).toBe('user_explicit');
      expect(ctx.disclosureDiagnostics.locationKnown).toBe(true);
    });

    it('incomplete location (missing timezone or lat/lon) returns atomic null pair', () => {
      const ctx = resolveCalendarContext({
        location: {
          label: 'Partial Location',
          latitude: 23.1765,
          longitude: 75.7885,
          timezone: null,
        },
      });

      expect(ctx.observanceLocation).toEqual({
        label: null,
        latitude: null,
        longitude: null,
        timezone: null,
      });
      expect(ctx.timezone).toBeNull();
      expect(ctx.locationSource).toBe('unknown');
      expect(ctx.disclosureDiagnostics.locationKnown).toBe(false);
    });
  });
});
