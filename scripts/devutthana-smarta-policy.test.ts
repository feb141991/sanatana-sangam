import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LunarTithiHandler,
  calculateObservancesForYear,
  precomputePanchangCorrectedForYear,
  toCorrectedRule,
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

// Devutthana Ekadashi 2026: Ekadashi runs 20 Nov 07:17 to 21 Nov 06:32 IST, so it is at NO sunrise in Ujjain or Delhi.
// The default skipped-tithi policy (following day) gave Saturday 21 Nov, the Vaishnava day. The Smarta convention, and
// the product rule that an unspecified profile behaves as Smarta, is the previous day: Friday 20 Nov.
// A Smarta/Vaishnava pair is not built here: the reader resolves a pair only for rules that cite a printed source.
const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const rule = () => CANONICAL_RULES.find((candidate) => candidate.slug === 'devutthana-ekadashi') as any;

test('devutthana-ekadashi uses the Smarta previous-day skipped-tithi policy, recorded and executable', () => {
  assert.equal(rule().corrected_skipped_tithi_policy, 'previous_day');
  assert.equal(rule().date_assignment.skipped_tithi, 'previous_day');
  assert.equal(rule().date_assignment.period, 'sunrise');
  assert.equal(rule().date_assignment.mode, 'at');
});

test('the handler gives 2026-11-20 for 2026 and leaves non-kshaya years alone', () => {
  const corrected = toCorrectedRule(rule());
  const dates = (year: number) => LunarTithiHandler.evaluate(corrected, precomputePanchangCorrectedForYear(year, UJJAIN));
  assert.deepEqual(dates(2026), ['2026-11-20']); // was 2026-11-21
  assert.deepEqual(dates(2027), ['2027-11-10']); // Ekadashi at sunrise: unchanged
  assert.deepEqual(dates(2028), ['2028-10-28']);
});

test('through the production entry point, Devutthana Ekadashi 2026 is Friday 20 November', () => {
  const dates = calculateObservancesForYear(2026, UJJAIN)
    .filter((row: any) => row.slug === 'devutthana-ekadashi')
    .map((row: any) => row.date);
  assert.deepEqual(dates, ['2026-11-20']);
});
