import { describe, it, expect } from 'vitest';
import { getMuhurtaWindows, isInWindow } from '../muhurta.js';

describe('Variable Muhurta Windows Engine (Tracker 2.5)', () => {
  const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
  const BEDFORD = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

  describe('ACCEPTANCE TEST — Maha Shivaratri 2026', () => {
    // Krishna Chaturdashi span: 15 Feb 2026 11:36 UTC to 16 Feb 2026 12:05 UTC
    const chaturdashiStart = new Date('2026-02-15T11:36:00Z');
    const chaturdashiEnd = new Date('2026-02-16T12:05:00Z');

    it('Ujjain: Nishita for civil date 2026-02-15 falls INSIDE Chaturdashi, 2026-02-16 OUTSIDE', () => {
      const res15 = getMuhurtaWindows(new Date('2026-02-15T12:00:00Z'), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res15.ok).toBe(true);
      if (!res15.ok) return;

      const nishita15 = res15.windows.nishita;
      // Nishita on night of 15 Feb falls inside Chaturdashi
      expect(nishita15.start.getTime()).toBeGreaterThan(chaturdashiStart.getTime());
      expect(nishita15.end.getTime()).toBeLessThan(chaturdashiEnd.getTime());

      const res16 = getMuhurtaWindows(new Date('2026-02-16T12:00:00Z'), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res16.ok).toBe(true);
      if (!res16.ok) return;

      const nishita16 = res16.windows.nishita;
      // Nishita on night of 16 Feb falls after Chaturdashi has ended
      expect(nishita16.start.getTime()).toBeGreaterThan(chaturdashiEnd.getTime());
    });

    it('Bedford: Nishita for civil date 2026-02-15 falls INSIDE Chaturdashi, 2026-02-16 OUTSIDE', () => {
      const res15 = getMuhurtaWindows(new Date('2026-02-15T12:00:00Z'), BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
      expect(res15.ok).toBe(true);
      if (!res15.ok) return;

      const nishita15 = res15.windows.nishita;
      expect(nishita15.start.getTime()).toBeGreaterThan(chaturdashiStart.getTime());
      expect(nishita15.end.getTime()).toBeLessThan(chaturdashiEnd.getTime());

      const res16 = getMuhurtaWindows(new Date('2026-02-16T12:00:00Z'), BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
      expect(res16.ok).toBe(true);
      if (!res16.ok) return;

      const nishita16 = res16.windows.nishita;
      expect(nishita16.start.getTime()).toBeGreaterThan(chaturdashiEnd.getTime());
    });
  });

  describe('Day-Fifths and Night-Muhurtas Geometry Invariants', () => {
    it('day-fifths tile [sunrise, sunset] exactly with no gap or overlap', () => {
      const res = getMuhurtaWindows(new Date('2026-03-21T12:00:00Z'), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const { pratah, sangava, madhyahna, aparahna, sayahna } = res.windows;
      expect(pratah.start.getTime()).toBe(res.sunrise.getTime());
      expect(sangava.start.getTime()).toBe(pratah.end.getTime());
      expect(madhyahna.start.getTime()).toBe(sangava.end.getTime());
      expect(aparahna.start.getTime()).toBe(madhyahna.end.getTime());
      expect(sayahna.start.getTime()).toBe(aparahna.end.getTime());
      expect(sayahna.end.getTime()).toBe(res.sunset.getTime());
    });

    it('Nishita midpoint equals exact midpoint of [sunset, nextSunrise] within 1 sec', () => {
      const res = getMuhurtaWindows(new Date('2026-05-15T12:00:00Z'), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const nishita = res.windows.nishita;
      const nishitaMidpoint = (nishita.start.getTime() + nishita.end.getTime()) / 2;
      const trueNightMidpoint = (res.sunset.getTime() + res.nextSunrise.getTime()) / 2;
      expect(Math.abs(nishitaMidpoint - trueNightMidpoint)).toBeLessThanOrEqual(1000);
    });

    it('Brahma Muhurta ends exactly at nextSunrise - nightMuhurta', () => {
      const res = getMuhurtaWindows(new Date('2026-08-15T12:00:00Z'), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const bm = res.windows.brahmaMuhurta;
      const nightMuhurtaMs = res.nightLengthMs / 15;
      expect(Math.abs(bm.end.getTime() - (res.nextSunrise.getTime() - nightMuhurtaMs))).toBeLessThanOrEqual(1000);
    });
  });

  describe('Bedford in June (Defect D6 Correction Proof)', () => {
    it('Bedford in June: Brahma Muhurta starts ~56-60 min before sunrise, NOT 96 min', () => {
      const juneSolstice = new Date('2026-06-21T12:00:00Z');
      const res = getMuhurtaWindows(juneSolstice, BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const bm = res.windows.brahmaMuhurta;
      const startMinutesBeforeSunrise = (res.nextSunrise.getTime() - bm.start.getTime()) / 60_000;
      const endMinutesBeforeSunrise = (res.nextSunrise.getTime() - bm.end.getTime()) / 60_000;

      // In Bedford in June (night ~7.3 h), nightMuhurta is ~29 min.
      // Brahma Muhurta starts 2*nightMuhurta (~58 min) before sunrise, not 96 min!
      expect(startMinutesBeforeSunrise).toBeGreaterThan(50);
      expect(startMinutesBeforeSunrise).toBeLessThan(65);
      expect(endMinutesBeforeSunrise).toBeGreaterThan(25);
      expect(endMinutesBeforeSunrise).toBeLessThan(35);
    });

    it('flags compressed_night for extremely short night (N < 4h, e.g. Reykjavik in June)', () => {
      const juneSolstice = new Date('2026-06-21T12:00:00Z');
      const res = getMuhurtaWindows(juneSolstice, 64.1466, -21.9426, 'Atlantic/Reykjavik');
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.diagnostics).toContain('compressed_night');
    });

    it('window durations scale dynamically with latitude', () => {
      const date = new Date('2026-06-21T12:00:00Z');
      const resUjjain = getMuhurtaWindows(date, UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
      const resBedford = getMuhurtaWindows(date, BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
      expect(resUjjain.ok && resBedford.ok).toBe(true);
      if (!resUjjain.ok || !resBedford.ok) return;

      // Day length in Bedford in June is significantly longer than in Ujjain
      expect(resBedford.dayLengthMs).toBeGreaterThan(resUjjain.dayLengthMs);
      expect(resBedford.windows.madhyahna.end.getTime() - resBedford.windows.madhyahna.start.getTime())
        .toBeGreaterThan(resUjjain.windows.madhyahna.end.getTime() - resUjjain.windows.madhyahna.start.getTime());
    });
  });

  describe('High Latitude and Edge Cases (§8)', () => {
    it('returns ok: false for polar day/night latitude (70°N in June)', () => {
      const res = getMuhurtaWindows(new Date('2026-06-21T12:00:00Z'), 70.0, 18.0);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.reason).toContain('Polar day/night');
      }
    });
  });

  describe('isInWindow Helper', () => {
    it('returns true when instant is within MuhurtaWindow', () => {
      const window = {
        name: 'Test',
        start: new Date('2026-05-01T10:00:00Z'),
        end: new Date('2026-05-01T11:00:00Z'),
      };
      expect(isInWindow(new Date('2026-05-01T10:30:00Z'), window)).toBe(true);
      expect(isInWindow(new Date('2026-05-01T09:59:00Z'), window)).toBe(false);
      expect(isInWindow(new Date('2026-05-01T11:01:00Z'), window)).toBe(false);
    });
  });
});
