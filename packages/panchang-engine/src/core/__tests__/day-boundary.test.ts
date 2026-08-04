import { describe, it, expect } from 'vitest';
import {
  DAY_BOUNDARY_VERSION,
  resolveVedicDayForInstant,
  resolveVedicDayForInterval,
  formatCivilDateInTz,
  getTzOffsetHours,
} from '../day-boundary.js';

describe('Vedic Day Boundary Resolver (Tracker 2.10 & §4)', () => {
  it('exports DAY_BOUNDARY_VERSION constant as 1.0.0', () => {
    expect(DAY_BOUNDARY_VERSION).toBe('1.0.0');
  });

  it('assigns post-sunrise instant to current civil date (Ujjain 2026-03-04 10:00 IST)', () => {
    // 10:00 IST = 04:30 UTC
    const instant = new Date('2026-03-04T04:30:00Z');
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };

    const res = resolveVedicDayForInstant(instant, location);
    expect(res.owningCivilDate).toBe('2026-03-04');
    expect(res.diagnostics).toEqual([]);
    expect(res.vedicDayStartSunrise.getTime()).toBeLessThan(instant.getTime());
    expect(res.vedicDayEndSunrise.getTime()).toBeGreaterThan(instant.getTime());
  });

  it('assigns pre-dawn instant (00:30 on March 5) to previous civil date (March 4) per §4 Nishita example', () => {
    // 00:30 GMT on 2026-03-05 in London/Bedford
    const preDawnInstant = new Date('2026-03-05T00:30:00Z');
    const location = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

    const res = resolveVedicDayForInstant(preDawnInstant, location);
    expect(res.owningCivilDate).toBe('2026-03-04');
    expect(res.reason).toContain('owning civil date is 2026-03-04');
    expect(res.vedicDayStartSunrise.getTime()).toBeLessThan(preDawnInstant.getTime());
    expect(res.vedicDayEndSunrise.getTime()).toBeGreaterThan(preDawnInstant.getTime());
  });

  it('handles high-latitude polar coordinates by applying proxy latitude 60° and diagnostic flag per §8', () => {
    const instant = new Date('2026-06-21T12:00:00Z');
    const location = { lat: 70.0, lon: 20.0, tz: 'Europe/Oslo' }; // High latitude Tromsø/Norway

    const res = resolveVedicDayForInstant(instant, location);
    expect(res.effectiveLat).toBe(60.0);
    expect(res.diagnostics).toContain('latitude_proxy');
    expect(res.owningCivilDate).toBe('2026-06-21');
  });

  it('resolves interval ownership and relationship correctly', () => {
    // 2-hour interval from 03:00 to 05:00 UTC on 2026-03-04
    const interval = {
      start: new Date('2026-03-04T03:00:00Z'),
      end: new Date('2026-03-04T05:00:00Z'),
    };
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };

    const res = resolveVedicDayForInterval(interval, location);
    expect(res.owningCivilDate).toBe('2026-03-04');
    expect(['within_vedic_day', 'contains_start']).toContain(res.intervalRelationship);
  });

  it('correctly reports timezone offsets across regions', () => {
    const testDate = new Date('2026-06-15T12:00:00Z');
    expect(getTzOffsetHours(testDate, 'Asia/Kolkata')).toBe(5.5);
    expect(getTzOffsetHours(testDate, 'Europe/London')).toBe(1.0); // BST
    expect(getTzOffsetHours(testDate, 'America/New_York')).toBe(-4.0); // EDT
  });
});
