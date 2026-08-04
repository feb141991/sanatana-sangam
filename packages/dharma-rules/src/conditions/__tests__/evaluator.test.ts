import { describe, it, expect } from 'vitest';
import {
  CONDITION_EVALUATOR_VERSION,
  evaluateCondition,
  evaluateVariant,
  getPeriodWindow,
} from '../index.js';

describe('Observance Condition Evaluator (Tracker 3.2)', () => {
  it('exports CONDITION_EVALUATOR_VERSION constant as 1.0.0', () => {
    expect(CONDITION_EVALUATOR_VERSION).toBe('1.0.0');
  });

  it('evaluates tithi_presence mode prevails at Nishita for Maha Shivaratri condition', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'tithi_presence' as const,
      tithi: 14, // Krishna Chaturdashi
      period: 'nishita' as const,
      mode: 'prevails' as const,
    };

    const res = evaluateCondition(cond, '2026-02-15', location);
    expect(res.conditionType).toBe('tithi_presence');
    expect(res.reasons.length).toBeGreaterThan(0);
    expect(res.reasons[0].text).toContain('Chaturdashi');
    expect(res.window).toBeDefined();
    expect(res.window?.name).toBe('nishita');
  });

  it('evaluates tithi_presence mode at Sunrise for Janmashtami Vaishnava condition', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'tithi_presence' as const,
      tithi: 8, // Krishna Ashtami
      period: 'sunrise' as const,
      mode: 'at' as const,
    };

    const res = evaluateCondition(cond, '2026-09-04', location);
    expect(res.conditionType).toBe('tithi_presence');
    expect(res.reasons[0].text).toContain('tithi_presence_check');
  });

  it('evaluates viddha condition for Dashami piercing Arunodaya', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const cond = {
      type: 'viddha' as const,
      piercedBy: 10,
      atPeriod: 'arunodaya' as const,
      action: 'shift_next' as const,
    };

    const res = evaluateCondition(cond, '2026-11-05', location);
    expect(res.conditionType).toBe('viddha');
    expect(res.reasons[0].code).toBe('viddha_check');
  });

  it('returns indeterminate when moonrise window is absent on a civil date', () => {
    // Probe a date/location edge case if moonrise is absent
    const window = getPeriodWindow('moonrise', '2026-10-29', { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' });
    if (!window) {
      const cond = {
        type: 'tithi_presence' as const,
        tithi: 4,
        period: 'moonrise' as const,
        mode: 'at' as const,
      };
      const res = evaluateCondition(cond, '2026-10-29', { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' });
      expect(res.satisfied).toBe('indeterminate');
      expect(res.diagnostics).toContain('no_event_window');
    }
  });

  it('evaluates complete rule variant and outputs detailed reasons[]', () => {
    const location = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
    const variant = {
      ruleId: 'krishna_janmashtami__smarta',
      festivalId: 'krishna_janmashtami',
      traditionProfile: 'smarta',
      conditions: [
        { type: 'paksha' as const, value: 'krishna' as const },
        { type: 'tithi_presence' as const, tithi: 8, period: 'nishita' as const, mode: 'prevails' as const },
      ],
    };

    const res = evaluateVariant(variant, '2026-09-03', location);
    expect(res.ruleId).toBe('krishna_janmashtami__smarta');
    expect(res.reasons.length).toBe(2);
    expect(res.reasons.some((r) => r.code === 'paksha_check')).toBe(true);
    expect(res.reasons.some((r) => r.code === 'tithi_presence_check')).toBe(true);
  });
});
