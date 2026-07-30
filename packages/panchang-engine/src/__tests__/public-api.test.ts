import { describe, it, expect } from 'vitest';
import * as PanchangEngineExports from '../index.js';
import {
  calculatePanchang,
  getPanchangTimes,
  getTithiReminder,
  getTodayPanchang,
  getTodaySpiritualPulses,
  isInWindow,
  createPanchangEngine,
  getLunarMonth,
  findNewMoonBefore,
  findNewMoonAfter,
  findFullMoonBefore,
  findFullMoonAfter,
  findSankrantisBetween,
  PANCHANG_TRUST_META,
} from '../index.js';

// These compile-time assertions fail if helper-only types leak from the package root.
// @ts-expect-error -- MonthClassificationInput is intentionally internal.
export type RootMustNotExportMonthClassificationInput = import('../index.js').MonthClassificationInput;
// @ts-expect-error -- MonthClassificationResult is intentionally internal.
export type RootMustNotExportMonthClassificationResult = import('../index.js').MonthClassificationResult;

describe('Panchang Engine — Public API Runtime Contract', () => {
  const testDate = new Date('2026-05-22T12:00:00Z');

  describe('calculatePanchang positional API', () => {
    it('executes without throwing for Bedford, UK (52.1356, -0.4685, Europe/London)', () => {
      expect(() => {
        calculatePanchang(testDate, 52.1356, -0.4685, 'Europe/London');
      }).not.toThrow();
    });

    it('executes without throwing for Ujjain, India (23.1765, 75.7885, Asia/Kolkata)', () => {
      expect(() => {
        calculatePanchang(testDate, 23.1765, 75.7885, 'Asia/Kolkata');
      }).not.toThrow();
    });

    it('returns a fully populated PanchangData object with valid structural invariants', () => {
      const p = calculatePanchang(testDate, 23.1765, 75.7885, 'Asia/Kolkata');

      // 1. Required string fields exist and are non-empty
      expect(typeof p.tithi).toBe('string');
      expect(p.tithi.length).toBeGreaterThan(0);

      expect(typeof p.paksha).toBe('string');
      expect(['Shukla', 'Krishna']).toContain(p.paksha);

      expect(typeof p.tithiUpto).toBe('string');
      expect(p.tithiUpto.length).toBeGreaterThan(0);

      expect(typeof p.nakshatra).toBe('string');
      expect(p.nakshatra.length).toBeGreaterThan(0);

      expect(typeof p.nakshatraUpto).toBe('string');
      expect(p.nakshatraUpto.length).toBeGreaterThan(0);

      expect(typeof p.yoga).toBe('string');
      expect(p.yoga.length).toBeGreaterThan(0);

      expect(typeof p.yogaUpto).toBe('string');
      expect(p.yogaUpto.length).toBeGreaterThan(0);

      expect(typeof p.karana).toBe('string');
      expect(p.karana.length).toBeGreaterThan(0);

      expect(typeof p.karanaUpto).toBe('string');
      expect(p.karanaUpto.length).toBeGreaterThan(0);

      expect(typeof p.vara).toBe('string');
      expect(p.vara.length).toBeGreaterThan(0);

      expect(typeof p.rahuKaal).toBe('string');
      expect(p.rahuKaal.length).toBeGreaterThan(0);

      expect(typeof p.abhijitMuhurat).toBe('string');
      expect(p.abhijitMuhurat.length).toBeGreaterThan(0);

      expect(typeof p.brahmaMuhurta).toBe('string');
      expect(p.brahmaMuhurta.length).toBeGreaterThan(0);

      expect(typeof p.date).toBe('string');
      expect(p.date.length).toBeGreaterThan(0);

      expect(typeof p.masaName).toBe('string');
      expect(p.masaName.length).toBeGreaterThan(0);

      expect(typeof p.samvatName).toBe('string');

      // 2. Numeric indices are finite and bounded
      expect(Number.isFinite(p.tithiIndex)).toBe(true);
      expect(p.tithiIndex).toBeGreaterThanOrEqual(1);
      expect(p.tithiIndex).toBeLessThanOrEqual(30);

      expect(Number.isFinite(p.samvatYear)).toBe(true);
      expect(p.samvatYear).toBeGreaterThan(2000);

      // 3. Sunrise and Sunset are valid time strings formatted like HH:MM AM/PM
      expect(typeof p.sunrise).toBe('string');
      expect(p.sunrise).toMatch(/^\d{2}:\d{2}\s+(AM|PM)$/);

      expect(typeof p.sunset).toBe('string');
      expect(p.sunset).toMatch(/^\d{2}:\d{2}\s+(AM|PM)$/);

      // 4. Every top-level field must be populated, and every number must be finite.
      for (const [key, value] of Object.entries(p)) {
        expect(value, `${key} must not be undefined`).not.toBeUndefined();
        expect(value, `${key} must not be null`).not.toBeNull();
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} must be finite`).toBe(true);
        }
        if (typeof value === 'string') {
          expect(value, `${key} must not contain an invalid date`).not.toContain('Invalid Date');
        }
      }
    });
  });

  describe('Lightweight Panchang Digest Helpers', () => {
    it('getTodayPanchang returns valid PanchangInfo', () => {
      const info = getTodayPanchang(testDate, 'Asia/Kolkata');
      expect(info).toBeDefined();
      expect(Number.isFinite(info.tithi)).toBe(true);
      expect(info.tithi).toBeGreaterThanOrEqual(1);
      expect(info.tithi).toBeLessThanOrEqual(30);
      expect(typeof info.tithiName).toBe('string');
      expect(['Shukla', 'Krishna']).toContain(info.paksha);
      expect(typeof info.weekday).toBe('string');
      expect(typeof info.weekdayDeity).toBe('string');
    });

    it('getTodaySpiritualPulses returns pulse array', () => {
      const pulses = getTodaySpiritualPulses(11, 'all', testDate);
      expect(Array.isArray(pulses)).toBe(true);
      expect(pulses.length).toBeGreaterThan(0);
      expect(pulses[0].label).toContain('Ekadashi');
    });
  });

  describe('Root Export Contract Governance', () => {
    it('exports all established public functions from the package root', () => {
      expect(typeof calculatePanchang).toBe('function');
      expect(typeof getPanchangTimes).toBe('function');
      expect(typeof getTithiReminder).toBe('function');
      expect(typeof getTodayPanchang).toBe('function');
      expect(typeof getTodaySpiritualPulses).toBe('function');
      expect(typeof isInWindow).toBe('function');
      expect(typeof createPanchangEngine).toBe('function');
      expect(typeof getLunarMonth).toBe('function');
      expect(typeof findNewMoonBefore).toBe('function');
      expect(typeof findNewMoonAfter).toBe('function');
      expect(typeof findFullMoonBefore).toBe('function');
      expect(typeof findFullMoonAfter).toBe('function');
      expect(typeof findSankrantisBetween).toBe('function');
      expect(PANCHANG_TRUST_META).toBeDefined();
    });

    it('does NOT export internal/helper-only lunar classification functions or types from package root', () => {
      const rootObject = PanchangEngineExports as Record<string, unknown>;
      expect(rootObject['classifyLunarMonth']).toBeUndefined();
      expect(rootObject['classifyLunarMonthFromBoundaries']).toBeUndefined();
    });
  });
});
