import { describe, expect, it } from 'vitest';

import { isRealCalendarDate, isRealIsoDate, parseClockTime, parseIsoDate } from './iso-date';

const NOW = new Date('2026-10-09T12:00:00Z');
const dob = { minYear: 1900, now: NOW };

describe('isRealCalendarDate', () => {
  it('knows month lengths, leap years and century years', () => {
    expect(isRealCalendarDate(2024, 2, 29)).toBe(true);
    expect(isRealCalendarDate(2023, 2, 29)).toBe(false);
    expect(isRealCalendarDate(2000, 2, 29)).toBe(true);
    expect(isRealCalendarDate(2100, 2, 29)).toBe(false);
    expect(isRealCalendarDate(2025, 4, 31)).toBe(false);
    expect(isRealCalendarDate(2025, 12, 31)).toBe(true);
  });

  it('rejects month 0 and 13, day 0 and non-integers', () => {
    for (const [y, m, d] of [[2025, 0, 10], [2025, 13, 10], [2025, 5, 0], [2025, 5, 32], [2025, 1.5, 10], [Number.NaN, 1, 1]]) {
      expect(isRealCalendarDate(y, m, d), `${y}-${m}-${d}`).toBe(false);
    }
  });

  it('does not read years 0 to 99 as 1900 to 1999', () => {
    // Date.UTC(50, 0, 1) is 1 Jan 1950; the year here must stay 50.
    expect(isRealCalendarDate(50, 1, 1)).toBe(true);
    expect(isRealCalendarDate(4, 2, 29)).toBe(true); // year 4 was a leap year
    expect(isRealCalendarDate(1, 2, 29)).toBe(false);
  });
});

describe('isRealIsoDate', () => {
  it('accepts only YYYY-MM-DD naming a day that exists', () => {
    expect(isRealIsoDate('1991-08-18')).toBe(true);
    expect(isRealIsoDate('2024-02-29')).toBe(true);
    for (const value of ['2025-02-31', '2023-02-29', '2025-04-31', '2025-13-45', '2025-00-10', '18081991', '18/08/1991', '1991-8-18', ' 1991-08-18', '', null, undefined, 19910818]) {
      expect(isRealIsoDate(value), String(value)).toBe(false);
    }
  });
});

describe('parseIsoDate', () => {
  it('accepts a valid date and trims surrounding whitespace', () => {
    expect(parseIsoDate('1991-08-18', dob)).toEqual({ ok: true, iso: '1991-08-18' });
    expect(parseIsoDate('  1991-08-18  ', dob)).toEqual({ ok: true, iso: '1991-08-18' });
  });

  it('names the failure: format, calendar, too_old, future', () => {
    expect(parseIsoDate('18081991', dob)).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoDate(19910818, dob)).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoDate('', dob)).toEqual({ ok: false, reason: 'format' });
    expect(parseIsoDate('2025-02-31', dob)).toEqual({ ok: false, reason: 'calendar' });
    expect(parseIsoDate('2023-02-29', dob)).toEqual({ ok: false, reason: 'calendar' });
    expect(parseIsoDate('1899-12-31', dob)).toEqual({ ok: false, reason: 'too_old' });
    expect(parseIsoDate('0001-01-01', dob)).toEqual({ ok: false, reason: 'too_old' });
    expect(parseIsoDate('2999-01-01', dob)).toEqual({ ok: false, reason: 'future' });
  });

  it('reports a day that does not exist as a calendar failure even in an old year', () => {
    expect(parseIsoDate('1800-02-30', dob)).toEqual({ ok: false, reason: 'calendar' });
  });

  it('accepts today, and tomorrow in UTC for a client ahead of UTC, but not the day after', () => {
    expect(parseIsoDate('2026-10-09', dob).ok).toBe(true);
    expect(parseIsoDate('2026-10-10', dob).ok).toBe(true);
    expect(parseIsoDate('2026-10-11', dob)).toEqual({ ok: false, reason: 'future' });
  });

  it('lets an event date be in the future when asked', () => {
    expect(parseIsoDate('2030-01-01', { ...dob, allowFuture: true }).ok).toBe(true);
  });

  it('has no minimum year unless one is given', () => {
    expect(parseIsoDate('1500-06-01', { now: NOW }).ok).toBe(true);
  });
});

describe('parseClockTime', () => {
  it('normalises HH:MM and HH:MM:SS', () => {
    expect(parseClockTime('06:30')).toEqual({ ok: true, value: '06:30' });
    expect(parseClockTime('6:30')).toEqual({ ok: true, value: '06:30' });
    expect(parseClockTime('23:59:59')).toEqual({ ok: true, value: '23:59:59' });
    expect(parseClockTime(' 00:00 ')).toEqual({ ok: true, value: '00:00' });
  });

  it('rejects impossible and malformed times', () => {
    expect(parseClockTime('24:00')).toEqual({ ok: false, reason: 'range' });
    expect(parseClockTime('12:60')).toEqual({ ok: false, reason: 'range' });
    expect(parseClockTime('12:30:60')).toEqual({ ok: false, reason: 'range' });
    for (const value of ['6', '6:3', 'noon', '6:30pm', '0630', '', null, 630]) {
      expect(parseClockTime(value), String(value)).toEqual({ ok: false, reason: 'format' });
    }
  });
});
