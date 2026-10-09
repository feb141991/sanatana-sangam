import { describe, expect, it } from 'vitest';

import { birthLocalToUTC, generateAstroChart } from './astro-engine';

// The engine is the last line of defence for a birth chart. JavaScript rolls "1991-02-30" over to
// 2 March, so before this guard the engine computed a normal-looking chart for a date the person
// never entered, and nothing failed. A wrong Kundali must be an error, never a quiet substitute.

describe('birthLocalToUTC: real birth dates and times', () => {
  it('converts a valid local birth time to UTC', () => {
    expect(birthLocalToUTC('1991-08-18', '10:30', 'Asia/Kolkata').toISOString()).toBe('1991-08-18T05:00:00.000Z');
    expect(birthLocalToUTC('1991-08-18', '10:30:15', 'Asia/Kolkata').toISOString()).toBe('1991-08-18T05:00:15.000Z');
  });

  it('accepts 29 February in a leap year and a non-padded date', () => {
    expect(birthLocalToUTC('2024-02-29', '12:00', 'Asia/Kolkata').toISOString()).toBe('2024-02-29T06:30:00.000Z');
    expect(birthLocalToUTC('1991-8-18', '10:30', 'Asia/Kolkata').toISOString()).toBe('1991-08-18T05:00:00.000Z');
  });
});

describe('birthLocalToUTC: impossible dates and times are rejected, never rolled over', () => {
  it.each([
    '1991-02-30', '1991-02-31', '2023-02-29', '2100-02-29', '1991-04-31', '1991-13-01', '1991-00-10', '1991-08-00', '1991-08-32',
  ])('rejects the date %s', (date) => {
    expect(() => birthLocalToUTC(date, '10:30', 'Asia/Kolkata')).toThrow(RangeError);
  });

  it.each(['24:00', '25:00', '12:60', '10:30:60', '-1:30'])('rejects the time %s', (time) => {
    expect(() => birthLocalToUTC('1991-08-18', time, 'Asia/Kolkata')).toThrow(RangeError);
  });

  it.each(['18081991', 'abc', '', '1991-08', '--'])('rejects the malformed date %j with a RangeError', (date) => {
    expect(() => birthLocalToUTC(date, '10:30', 'Asia/Kolkata')).toThrow(RangeError);
  });

  it.each(['abc', '', '10', '1030'])('rejects the malformed time %j with a RangeError', (time) => {
    expect(() => birthLocalToUTC('1991-08-18', time, 'Asia/Kolkata')).toThrow(RangeError);
  });

  it('refuses to build a chart from an impossible date', () => {
    const input = { time: '10:30', lat: 28.61, lng: 77.2, timezone: 'Asia/Kolkata', timeUnknown: false };
    expect(() => generateAstroChart({ ...input, date: '1991-02-30' })).toThrow(RangeError);
    expect(() => generateAstroChart({ ...input, date: '1991-13-01' })).toThrow(RangeError);
    expect(() => generateAstroChart({ ...input, date: '1991-08-18' })).not.toThrow();
  });

  it('still rejects the daylight-saving gap and fold as before', () => {
    expect(() => birthLocalToUTC('2021-03-14', '02:30', 'America/New_York')).toThrow(/does not exist/);
    expect(() => birthLocalToUTC('2021-11-07', '01:30', 'America/New_York')).toThrow(/ambiguous/);
  });
});
