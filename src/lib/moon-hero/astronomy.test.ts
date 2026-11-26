import { describe, expect, it } from 'vitest';
import {
  illuminatedFraction,
  illustratedFraction,
  isWaxing,
  moonElongationDeg,
  tithiIndexForFraction,
  tithiLabel,
} from './astronomy';

// Reference phases (UTC) from published lunar phase tables.
const FULL_2025_11_05 = new Date('2025-11-05T13:19:00Z');
const NEW_2025_11_20 = new Date('2025-11-20T06:47:00Z');
const FIRST_QUARTER_2025_11_28 = new Date('2025-11-28T06:59:00Z');
const LAST_QUARTER_2025_11_12 = new Date('2025-11-12T05:28:00Z');

describe('moonElongationDeg', () => {
  it('is 180 degrees at a full moon and 0 at a new moon, to within a degree', () => {
    expect(Math.abs(moonElongationDeg(FULL_2025_11_05) - 180)).toBeLessThan(1);
    const atNew = moonElongationDeg(NEW_2025_11_20);
    expect(Math.min(atNew, 360 - atNew)).toBeLessThan(1);
  });

  it('is 90 degrees at first quarter and 270 at last quarter, to within a degree', () => {
    expect(Math.abs(moonElongationDeg(FIRST_QUARTER_2025_11_28) - 90)).toBeLessThan(1);
    expect(Math.abs(moonElongationDeg(LAST_QUARTER_2025_11_12) - 270)).toBeLessThan(1);
  });
});

describe('illuminatedFraction and isWaxing', () => {
  it('lights none of the disc at new moon, half at the quarters and all at full moon', () => {
    expect(illuminatedFraction(0)).toBeCloseTo(0, 6);
    expect(illuminatedFraction(90)).toBeCloseTo(0.5, 6);
    expect(illuminatedFraction(180)).toBeCloseTo(1, 6);
    expect(illuminatedFraction(270)).toBeCloseTo(0.5, 6);
  });

  it('waxes between new and full moon only', () => {
    expect(isWaxing(45)).toBe(true);
    expect(isWaxing(179)).toBe(true);
    expect(isWaxing(181)).toBe(false);
    expect(isWaxing(0)).toBe(false);
    expect(isWaxing(180)).toBe(false);
    expect(isWaxing(-10)).toBe(false);
  });
});

describe('tithiLabel', () => {
  it('names the fortnights, Purnima and Amavasya', () => {
    expect(tithiLabel(0)).toEqual({ name: 'Shukla Pratipada', line: 'the 1st lunar day, waxing' });
    expect(tithiLabel(10)).toEqual({ name: 'Shukla Ekadashi', line: 'the 11th lunar day, waxing' });
    expect(tithiLabel(14)).toEqual({ name: 'Purnima', line: 'the 15th lunar day, waxing' });
    expect(tithiLabel(15)).toEqual({ name: 'Krishna Pratipada', line: 'the 1st lunar day, waning' });
    expect(tithiLabel(25)).toEqual({ name: 'Krishna Ekadashi', line: 'the 11th lunar day, waning' });
    expect(tithiLabel(29)).toEqual({ name: 'Amavasya', line: 'the 15th lunar day, waning' });
  });

  it('uses the right English ordinals, including 2nd, 3rd, 12th and 13th', () => {
    expect(tithiLabel(1).line).toContain('2nd');
    expect(tithiLabel(2).line).toContain('3rd');
    expect(tithiLabel(11).line).toContain('12th');
    expect(tithiLabel(12).line).toContain('13th');
  });

  it('refuses a position outside the month', () => {
    expect(() => tithiLabel(-1)).toThrow(RangeError);
    expect(() => tithiLabel(30)).toThrow(RangeError);
    expect(() => tithiLabel(2.5)).toThrow(RangeError);
  });
});

describe('the illustrated month', () => {
  it('reaches Shukla Ekadashi at two thirds of the scroll and Purnima at the end', () => {
    expect(tithiLabel(tithiIndexForFraction(illustratedFraction(2 / 3))).name).toBe('Shukla Ekadashi');
    expect(tithiLabel(tithiIndexForFraction(illustratedFraction(1))).name).toBe('Purnima');
    expect(illustratedFraction(5)).toBe(illustratedFraction(1));
    expect(illustratedFraction(-1)).toBe(illustratedFraction(0));
  });

  it('wraps fractions into the month', () => {
    expect(tithiIndexForFraction(1.05)).toBe(1);
    expect(tithiIndexForFraction(-0.02)).toBe(29);
  });
});
