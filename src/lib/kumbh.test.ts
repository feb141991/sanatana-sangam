import { describe, expect, it } from 'vitest';
import { getKumbhMelas, getAllKumbhDays, getNextKumbhDay } from './kumbh';

describe('Kumbh Mela 2027 Schedule', () => {
  it('loads both 2027 gatherings (Haridwar and Nashik)', () => {
    const melas = getKumbhMelas();
    expect(melas.length).toBe(2);

    const haridwar = melas.find((m) => m.slug === 'haridwar-kumbh-2027');
    expect(haridwar).toBeDefined();
    expect(haridwar?.name).toBe('Haridwar Kumbh 2027');
    expect(haridwar?.days.length).toBeGreaterThan(0);

    const nashik = melas.find((m) => m.slug === 'nashik-trimbakeshwar-simhastha-2027');
    expect(nashik).toBeDefined();
    expect(nashik?.name).toContain('Nashik');
    expect(nashik?.days.length).toBeGreaterThan(0);
  });

  it('filters and sorts confirmed bathing days chronologically', () => {
    const days = getAllKumbhDays();
    expect(days.length).toBeGreaterThan(5);

    // Verify chronological order
    for (let i = 0; i < days.length - 1; i++) {
      expect(days[i].date <= days[i + 1].date).toBe(true);
    }

    // Verify all returned days are confirmed
    for (const day of days) {
      expect(day.status).toBe('confirmed');
    }
  });

  it('determines the next upcoming gathering day relative to a date', () => {
    const testDate = new Date('2026-11-15T00:00:00Z');
    const nextDay = getNextKumbhDay(testDate);
    expect(nextDay).toBeDefined();
    expect(nextDay!.date >= '2026-11-15').toBe(true);
  });
});
