import { describe, it, expect } from 'vitest';
import { evaluateCondition, evaluateVariant } from '../evaluator.js';
import { resolveHolikaDahan } from '../evaluator.js';
import { getKaranaName, computeAstronomy, offsetCivilDateStr } from '../../../../panchang-engine/src/index.js';

const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const KOLKATA = { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' };
const DELHI = { lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' };
const MIN = 60_000;
const near = (iso: string | null, expected: string, minutes: number) =>
  Math.abs(new Date(iso as string).getTime() - new Date(expected).getTime()) <= minutes * MIN;

describe('Bhadra (Vishti) and Holika Dahan (approved 2026-11-11, puccha length proposed)', () => {
  it('maps Vishti to the first half of Purnima (indices 8, 15, 22, 29, 36, 43, 50, 57)', () => {
    const indices = Array.from({ length: 60 }, (_, i) => i + 1).filter(i => getKaranaName(i).toLowerCase() === 'vishti');
    expect(indices).toEqual([8, 15, 22, 29, 36, 43, 50, 57]);
    expect(getKaranaName(29)).toBe('Vishti'); // elongation 168-174 deg
    expect(getKaranaName(30)).not.toBe('Vishti'); // 174-180 deg, second half of Purnima
  });

  it('reproduces the known 2026 Purnima and Bhadra interval at Ujjain (IST 2026-03-02 17:56 to 2026-03-03 17:07; Bhadra ends about 05:28)', () => {
    const r = resolveHolikaDahan('2026-03-03', UJJAIN);
    expect(near(r.purnimaStartUtc, '2026-03-02T12:26:00Z', 15)).toBe(true);
    expect(near(r.bhadraEndUtc, '2026-03-02T23:58:00Z', 20)).toBe(true);
    expect(near(r.purnimaEndUtc, '2026-03-03T11:37:00Z', 15)).toBe(true);
    const karanaAt = (iso: string) => getKaranaName(Math.floor(computeAstronomy(new Date(iso)).elongation / 6) + 1);
    expect(karanaAt('2026-03-02T16:30:00Z')).toBe('Vishti'); // 22:00 IST, inside Bhadra
    expect(karanaAt('2026-03-03T06:30:00Z')).not.toBe('Vishti'); // 12:00 IST, after Bhadra
  });

  it('resolves the Holika Dahan date and branch for 2026-2030 identically at Ujjain, Kolkata and Delhi', () => {
    const expected: Array<[string, string, 'pradosha_no_bhadra' | 'bhadra_puccha']> = [
      ['2026-03-03', '2026-03-03', 'bhadra_puccha'],
      ['2027-03-22', '2027-03-22', 'bhadra_puccha'],
      ['2028-03-10', '2028-03-10', 'bhadra_puccha'],
      ['2029-02-28', '2029-02-28', 'pradosha_no_bhadra'],
      ['2030-03-19', '2030-03-19', 'pradosha_no_bhadra'],
    ];
    for (const [anchor, date, branch] of expected) {
      for (const [name, loc] of Object.entries({ Ujjain: UJJAIN, Kolkata: KOLKATA, Delhi: DELHI })) {
        const r = resolveHolikaDahan(anchor, loc);
        expect(r.dahanDate, `${anchor} ${name}`).toBe(date);
        expect(r.branch, `${anchor} ${name}`).toBe(branch);
      }
    }
  });

  it('is satisfied on exactly one civil date per year (the Dahan date) and never on its neighbours', () => {
    for (const [anchor, date] of [['2026-03-03', '2026-03-03'], ['2027-03-22', '2027-03-22'], ['2028-03-10', '2028-03-10'], ['2029-02-28', '2029-02-28']]) {
      const hits: string[] = [];
      for (let o = -3; o <= 3; o += 1) {
        const d = offsetCivilDateStr(anchor, o);
        if (evaluateCondition({ type: 'holika_dahan', pucchaMinutes: 72 } as any, d, UJJAIN).satisfied === true) hits.push(d);
      }
      expect(hits, anchor).toEqual([date]);
    }
  });
});

describe('Narasimha Jayanti at sayahna (approved 2026-11-11; majority reading)', () => {
  const conditions = (mode: string) => [
    { type: 'lunar_month', value: 'Vaishakha', monthSystem: 'amanta' },
    { type: 'paksha', value: 'shukla' },
    { type: 'tithi_presence', tithi: 14, period: 'sayahna', mode },
  ] as any;
  const qualifiedDates = (anchor: string, loc: typeof UJJAIN, mode: string) => {
    const out: string[] = [];
    for (let o = -1; o <= 1; o += 1) {
      const d = offsetCivilDateStr(anchor, o);
      if (evaluateVariant({ ruleId: 'x', festivalId: 'narasimha-jayanti', conditions: conditions(mode) }, d, loc).qualified === true) out.push(d);
    }
    return out;
  };

  it('resolves exactly one date per year at Ujjain with the majority reading', () => {
    for (const d of ['2026-04-30', '2027-05-18', '2028-05-07', '2029-05-26', '2030-05-16']) {
      expect(qualifiedDates(d, UJJAIN, 'majority'), d).toEqual([d]);
    }
  });

  it('resolves Kolkata 2027, where the strict reading finds nothing and the touch reading finds two', () => {
    expect(qualifiedDates('2027-05-18', KOLKATA, 'majority')).toEqual(['2027-05-18']);
    expect(qualifiedDates('2027-05-18', KOLKATA, 'prevails')).toEqual([]);
    expect(qualifiedDates('2027-05-18', KOLKATA, 'touches')).toEqual(['2027-05-18', '2027-05-19']);
  });
});
