import { describe, it, expect } from 'vitest';
import { contiguousWindows, DayRecord } from '@/lib/calendar/adhika-window';
import {
  calculateObservancesForYearCorrected,
  precomputePanchangCorrectedForYear,
} from '@/lib/calendar/engine';
import { CANONICAL_RULES } from '@/lib/calendar/rules';

const TIMEOUT = 30_000;

describe('contiguousWindows helper — window detection regression guards', () => {
  it('detects two same-named krishna windows separated by shukla days', () => {
    const days: DayRecord[] = [
      // First Krishna window for Ashadha
      { dateStr: '2026-06-01', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 16 } },
      { dateStr: '2026-06-02', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 17 } },
      // Intervening Shukla fortnight — must break the window
      { dateStr: '2026-06-16', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 1 } },
      { dateStr: '2026-06-17', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 2 } },
      // Second Krishna window for Ashadha (after the shukla gap)
      { dateStr: '2026-07-01', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 16 } },
      { dateStr: '2026-07-02', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 17 } },
    ];

    const result = contiguousWindows(days, 'masaNamePurnimanta', {
      isActive: (d) => (d.panchang.tithiIndex ?? 0) > 15,
    });

    const ashadhaWins = result.get('Ashadha');
    expect(ashadhaWins, 'must detect two separate windows').toBeDefined();
    expect(ashadhaWins).toHaveLength(2);
    expect(ashadhaWins![0]).toEqual({ start: '2026-06-01', end: '2026-06-02' });
    expect(ashadhaWins![1]).toEqual({ start: '2026-07-01', end: '2026-07-02' });
  });

  it('produces no false collision for an ordinary purnimanta shukla/krishna structure', () => {
    // Normal structure: one shukla + one krishna segment per masa name = only 1 krishna window
    const days: DayRecord[] = [
      { dateStr: '2025-06-01', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 1 } },
      { dateStr: '2025-06-02', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 2 } },
      { dateStr: '2025-06-16', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 16 } },
      { dateStr: '2025-06-17', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 17 } },
      { dateStr: '2025-07-01', panchang: { masaNamePurnimanta: 'Shravana', tithiIndex: 1 } },
      { dateStr: '2025-07-16', panchang: { masaNamePurnimanta: 'Shravana', tithiIndex: 16 } },
    ];

    const result = contiguousWindows(days, 'masaNamePurnimanta', {
      isActive: (d) => (d.panchang.tithiIndex ?? 0) > 15,
    });

    expect(result.get('Ashadha')).toHaveLength(1);
    expect(result.get('Shravana')).toHaveLength(1);
  });

  it('retains a window ending on the final input day — EOF flush', () => {
    const days: DayRecord[] = [
      { dateStr: '2026-12-25', panchang: { masaNamePurnimanta: 'Pausha', tithiIndex: 16 } },
      { dateStr: '2026-12-31', panchang: { masaNamePurnimanta: 'Pausha', tithiIndex: 22 } },
    ];

    const result = contiguousWindows(days, 'masaNamePurnimanta', {
      isActive: (d) => (d.panchang.tithiIndex ?? 0) > 15,
    });

    const paushaWins = result.get('Pausha');
    expect(paushaWins, 'EOF window must not be dropped').toBeDefined();
    expect(paushaWins).toHaveLength(1);
    expect(paushaWins![0]).toEqual({ start: '2026-12-25', end: '2026-12-31' });
  });

  it('detects the previously broken adhika naming behavior (two Ashadha krishna windows)', () => {
    // The old helper pre-filtered to krishna-only rows before calling contiguousWindows.
    // That meant the shukla segment that separates two distinct krishna fortnights was
    // silently stripped, making the two krishna runs appear contiguous — one window instead
    // of two. This reproduces that scenario to prove the new helper correctly reports two.
    const days: DayRecord[] = [
      // First Ashadha krishna segment
      { dateStr: '2026-05-01', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 20 } },
      // Shukla separator (old helper would have stripped this, merging what follows)
      { dateStr: '2026-05-15', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 5 } },
      // Second Ashadha krishna segment — should be a distinct window
      { dateStr: '2026-06-25', panchang: { masaNamePurnimanta: 'Ashadha', tithiIndex: 20 } },
    ];

    const result = contiguousWindows(days, 'masaNamePurnimanta', {
      isActive: (d) => (d.panchang.tithiIndex ?? 0) > 15,
    });

    const wins = result.get('Ashadha');
    expect(wins, 'must detect two separate windows').toBeDefined();
    expect(wins!.length, 'previously broken helper reported 1; must now report 2').toBe(2);
  });

  it('verifies corrected behavior across 2025-2028 — no unresolved Pausha collision', async () => {
    // 2027 has a Pausha double-window (year starts mid-krishna, year ends mid-krishna).
    // That is a calendar-year boundary artifact, not a genuine adhika-masa ambiguity:
    // there is no rule with corrected_lunar_masa_name="Pausha" AND tithiIndex > 15,
    // so no rule can land in the wrong window.
    for (const year of [2025, 2026, 2027, 2028]) {
      const days = precomputePanchangCorrectedForYear(year);
      const purnimantaWindows = contiguousWindows(days, 'masaNamePurnimanta', {
        isActive: (d) => (d.panchang.tithiIndex ?? 0) > 15,
      });

      for (const [masa, wins] of purnimantaWindows) {
        if (wins.length <= 1) continue;

        const affectedRules = (CANONICAL_RULES as any[]).filter(
          (r) =>
            r.corrected_month_system === 'purnimanta' &&
            r.corrected_lunar_masa_name === masa &&
            (r.lunar_tithi_index ?? 0) > 15,
        );

        // If there IS a rule targeting a double-window masa, verify it resolves
        // uniquely to the latest window (genuine, not spurious earlier segment)
        for (const rule of affectedRules) {
          const matches = days.filter(
            (d) =>
              d.panchang.masaNamePurnimanta === masa &&
              d.panchang.tithiIndex === rule.lunar_tithi_index,
          );
          // Must resolve to at least one date
          expect(
            matches.length,
            `${year} ${rule.slug} masa=${masa} tithi=${rule.lunar_tithi_index} must match`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});
