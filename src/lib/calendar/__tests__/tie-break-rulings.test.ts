import { describe, expect, it } from 'vitest';
import type { RuleCondition } from '@sangam/dharma-rules';
import { selectEvaluatorMatch } from '../materialize';
import { LunarTithiHandler } from '../engine';
import type { ObservanceRule } from '../rules';

// Founder rulings 2026-11-26 (not council ratified): Akshaya Tritiya, Hartalika Teej, Vasant Panchami and
// Sankashti take the first of two qualifying days; Ekadashi present at two sunrises takes the second.
const day = (date: string, diagnostics: string[] = []) => ({ date, reasoning: [], diagnostics });
const FALLBACK: RuleCondition[] = [{ type: 'tithi_presence', tithi: 4, period: 'sunrise', mode: 'at' }];
const evaluateOn = (hitDates: string[]) => (_c: RuleCondition[], date: string) =>
  (hitDates.includes(date)
    ? { qualified: true as const, reasoning: [], diagnostics: [] }
    : { qualified: false as const, reasoning: [], diagnostics: [] });
const WINDOW = ['2028-08-07', '2028-08-08', '2028-08-09', '2028-08-10'];

describe('selectEvaluatorMatch with a tie-break', () => {
  const two = [day('2028-01-31'), day('2028-02-01')];

  it('takes the first or the last of two consecutive qualifying days, and marks it', () => {
    expect(selectEvaluatorMatch({ qualified: two, vrddhiDates: [], tieBreak: 'first_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2028-01-31', ['tie_break_first']));
    expect(selectEvaluatorMatch({ qualified: two, vrddhiDates: [], tieBreak: 'last_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2028-02-01', ['tie_break_last']));
  });

  it('counts a tithi at two sunrises (vrddhi) as the same run', () => {
    const vrddhi = [day('2026-05-27', ['vrddhi_tithi']), day('2026-05-26', ['vrddhi_tithi'])];
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: vrddhi, tieBreak: 'last_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2026-05-27', ['vrddhi_tithi', 'tie_break_last']));
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [day('2026-05-05', ['vrddhi_tithi'])], tieBreak: 'first_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2026-05-05', ['vrddhi_tithi']));
  });

  it('never picks from days that are not consecutive', () => {
    expect(selectEvaluatorMatch({ qualified: [day('2028-01-31'), day('2028-02-02')], vrddhiDates: [], tieBreak: 'first_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toBeNull();
  });

  it('goes to the fallback only when no day qualifies', () => {
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], tieBreak: 'first_qualifying_day', fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-08-09']) }))
      .toEqual(day('2028-08-09', ['fallback_conditions']));
    expect(selectEvaluatorMatch({ qualified: [day('2028-08-08')], vrddhiDates: [], tieBreak: 'first_qualifying_day', fallbackConditions: FALLBACK, windowDates: WINDOW, evaluate: evaluateOn(['2028-08-09']) }))
      .toEqual(day('2028-08-08'));
  });

  it('without a tie-break, two qualifying days still stay unresolved', () => {
    expect(selectEvaluatorMatch({ qualified: two, vrddhiDates: [], windowDates: [], evaluate: evaluateOn([]) })).toBeNull();
  });
});

describe('LunarTithiHandler corrected_vrddhi_day', () => {
  const days = [
    { dateStr: '2029-10-16', panchang: { masaName: 'Ashwin', tithiIndex: 10 } },
    { dateStr: '2029-10-17', panchang: { masaName: 'Ashwin', tithiIndex: 11 } },
    { dateStr: '2029-10-18', panchang: { masaName: 'Ashwin', tithiIndex: 11 } },
    { dateStr: '2029-10-19', panchang: { masaName: 'Ashwin', tithiIndex: 12 } },
  ];
  const rule = { slug: 'papankusha-ekadashi', rule_family: 'lunar_tithi', lunar_masa_name: 'Ashwin', lunar_tithi_index: 11, adhika_policy: 'nija' } as unknown as ObservanceRule;

  it('keeps the second of two sunrises with Ekadashi when the rule asks for it', () => {
    expect(LunarTithiHandler.evaluate({ ...rule, corrected_vrddhi_day: 'second_sunrise' }, days)).toEqual(['2029-10-18']);
  });

  it('keeps both days (first chosen downstream) for a rule that does not ask', () => {
    expect(LunarTithiHandler.evaluate(rule, days)).toEqual(['2029-10-17', '2029-10-18']);
  });
});

describe('Dashami at Arunodaya moves Ekadashi to the next day (founder ruling 2026-11-26)', () => {
  const SHIFT: RuleCondition[] = [{ type: 'tithi_presence', tithi: 10, period: 'arunodaya', mode: 'touches' }];

  it('moves the selected day when it satisfies the shift conditions, and marks it', () => {
    expect(selectEvaluatorMatch({ qualified: [day('2027-10-25')], vrddhiDates: [], shiftConditions: SHIFT, windowDates: [], evaluate: evaluateOn(['2027-10-25']) }))
      .toEqual(day('2027-10-26', ['arunodaya_viddha_shift']));
  });

  it('leaves a day whose dawn is clean, and does nothing without a selected day', () => {
    expect(selectEvaluatorMatch({ qualified: [day('2027-10-25')], vrddhiDates: [], shiftConditions: SHIFT, windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2027-10-25'));
    expect(selectEvaluatorMatch({ qualified: [], vrddhiDates: [], shiftConditions: SHIFT, windowDates: [], evaluate: evaluateOn(['2027-10-25']) }))
      .toBeNull();
  });

  // 2027-10-25 at Ujjain: Ekadashi (26) at sunrise, Dashami (25) at sunrise - 96 min.
  const sunrise = '2027-10-25T00:56:00.000Z';
  const days = [
    { dateStr: '2027-10-24', panchang: { masaName: 'Ashwin', tithiIndex: 25 }, sunriseUtc: '2027-10-24T00:55:00.000Z' },
    { dateStr: '2027-10-25', panchang: { masaName: 'Ashwin', tithiIndex: 26 }, sunriseUtc: sunrise },
    { dateStr: '2027-10-26', panchang: { masaName: 'Ashwin', tithiIndex: 27 }, sunriseUtc: '2027-10-26T00:57:00.000Z' },
  ];
  const rama = { slug: 'rama-ekadashi', rule_family: 'lunar_tithi', lunar_masa_name: 'Ashwin', lunar_tithi_index: 26, adhika_policy: 'nija' } as unknown as ObservanceRule;

  it('the corrected engine moves a named Ekadashi whose dawn holds Dashami', () => {
    expect(LunarTithiHandler.evaluate({ ...rama, corrected_arunodaya_viddha: 'next_day' }, days)).toEqual(['2027-10-26']);
    expect(LunarTithiHandler.evaluate(rama, days)).toEqual(['2027-10-25']);
  });
});

describe('a Tritiya present at no sunrise falls on the day it runs (founder decision 2026-11-27)', () => {
  it('moves a kshaya-chosen day back one civil day, and only a kshaya-chosen day', () => {
    expect(selectEvaluatorMatch({ qualified: [day('2028-08-23', ['kshaya_tithi'])], vrddhiDates: [], kshayaDay: 'previous_day', tieBreak: 'first_qualifying_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2028-08-22', ['kshaya_tithi', 'kshaya_previous_day']));
    expect(selectEvaluatorMatch({ qualified: [day('2027-09-03')], vrddhiDates: [], kshayaDay: 'previous_day', windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2027-09-03'));
    expect(selectEvaluatorMatch({ qualified: [day('2028-08-23', ['kshaya_tithi'])], vrddhiDates: [], windowDates: [], evaluate: evaluateOn([]) }))
      .toEqual(day('2028-08-23', ['kshaya_tithi']));
  });
});
