import { beforeAll, describe, expect, it } from 'vitest';
import type { RuleCondition } from '@sangam/dharma-rules';
import { calculateOccurrencesWithEvaluator, selectEvaluatorMatch } from '../materialize';

// Founder decisions 2026-11-26 (not council ratified):
// - Dhanteras: when Ashwin Krishna Trayodashi touches neither day's pradosha, the day it is at sunrise (Day 2).
// - Vaishnava (Gaudiya/ISKCON) Janmashtami: Ashtami at sunrise decides; Rohini only breaks a two-sunrise tie.
const day = (date: string, diagnostics: string[] = []) => ({ date, reasoning: [], diagnostics });
const PRIMARY_FAIL = { qualified: false as const, reasoning: [], diagnostics: [] };
const FALLBACK: RuleCondition[] = [{ type: 'tithi_presence', tithi: 13, period: 'sunrise', mode: 'at' }];
const PREFERENCE: RuleCondition[] = [{ type: 'nakshatra_presence', nakshatra: 'rohini', period: 'sunrise', mode: 'touches' }];
const evaluateOn = (hitDates: string[], extra: string[] = []) =>
  (_c: RuleCondition[], date: string) => (hitDates.includes(date) ? { qualified: true as const, reasoning: [], diagnostics: extra } : PRIMARY_FAIL);
const WINDOW = ['2028-10-14', '2028-10-15', '2028-10-16', '2028-10-17'];

describe('selectEvaluatorMatch', () => {
  it('keeps a single primary day and ignores the fallback', () => {
    expect(selectEvaluatorMatch({ qualified: [day('2026-11-06')], vrddhiDates: [], fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-10-16']) }))
      .toEqual(day('2026-11-06'));
  });

  it('uses the fallback only when no day passes the primary rule, and marks it', () => {
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-10-16']) }))
      .toEqual(day('2028-10-16', ['fallback_conditions']));
  });

  it('never chooses between two fallback days, or a vrddhi fallback day', () => {
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-10-15', '2028-10-16']) })).toBeNull();
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-10-16'], ['vrddhi_tithi']) })).toBeNull();
  });

  it('leaves a no-date year unresolved when the rule has no fallback', () => {
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], windowDates: WINDOW, evaluate: evaluateOn(['2028-10-16']) })).toBeNull();
  });

  it('breaks a two-sunrise tie only when exactly one candidate meets the preference', () => {
    const vrddhi = [day('2030-08-21', ['vrddhi_tithi']), day('2030-08-22', ['vrddhi_tithi'])];
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, vrddhiPreference: PREFERENCE, windowDates: [], evaluate: evaluateOn(['2030-08-22']) }))
      .toEqual(day('2030-08-22', ['vrddhi_tithi', 'vrddhi_preference']));
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, vrddhiPreference: PREFERENCE, windowDates: [], evaluate: evaluateOn([]) })).toBeNull();
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, vrddhiPreference: PREFERENCE, windowDates: [], evaluate: evaluateOn(['2030-08-21', '2030-08-22']) })).toBeNull();
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, windowDates: [], evaluate: evaluateOn(['2030-08-22']) })).toBeNull();
  });

  it('does not use the fallback to settle a vrddhi year', () => {
    const vrddhi = [day('2028-10-15', ['vrddhi_tithi']), day('2028-10-16', ['vrddhi_tithi'])];
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-10-16']) })).toBeNull();
  });
});

describe('2028 at Ujjain on the production evaluator path', () => {
  let rows: ReturnType<typeof calculateOccurrencesWithEvaluator>;
  beforeAll(() => { rows = calculateOccurrencesWithEvaluator(2028); }, 600_000);

  it('Dhanteras is 16 Oct by the sunrise fallback (Trayodashi starts 3 minutes after Day 1 pradosha ends)', () => {
    const dhanteras = rows.resolved.filter(r => r.slug === 'dhanteras');
    expect(dhanteras.map(r => r.date)).toEqual(['2028-10-16']);
    expect(dhanteras[0].diagnostics).toContain('fallback_conditions');
    expect(rows.unresolved.some(u => u.slug === 'dhanteras')).toBe(false);
  });

  it('Vaishnava Janmashtami is 13 Aug (Ashtami at sunrise); Smarta is unchanged', () => {
    const janmashtami = rows.resolved.filter(r => r.slug === 'krishna-janmashtami');
    expect(janmashtami.find(r => r.variant_key === 'vaishnava')?.date).toBe('2028-08-13');
    expect(janmashtami.find(r => r.variant_key === 'smarta')?.date).toBe('2028-08-13');
    expect(rows.unresolved.some(u => u.slug === 'krishna-janmashtami')).toBe(false);
  });
});
