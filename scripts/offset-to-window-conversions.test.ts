import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateVariant } from '../packages/dharma-rules/src/conditions/evaluator';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { EVALUATOR_RULES } from '../src/lib/calendar/materialize';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

// Three rules were held by a fixed day offset from another observance. The offset drifts from the real tithi
// (Ganesh Chaturthi + 10, Diwali + 16, Navratri - 1), so on 2026-11-16 the founder decided each one's own window.
const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };

const DECIDED: Record<string, { month: string; paksha: string; tithi: number; period: string; mode: string }> = {
  'anant-chaturdashi-ganesh-visarjan': { month: 'Bhadrapada', paksha: 'shukla', tithi: 14, period: 'purvahna', mode: 'touches' },
  'kartik-purnima': { month: 'Kartika', paksha: 'shukla', tithi: 15, period: 'pradosha', mode: 'touches' },
  'mahalaya-amavasya': { month: 'Bhadrapada', paksha: 'krishna', tithi: 15, period: 'aparahna', mode: 'touches' },
};

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function qualifyingDates(slug: string, from: string, to: string): string[] {
  const conditions = EVALUATOR_RULES.find((rule) => rule.slug === slug)!.variants[0].conditions;
  const dates: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (evaluateVariant({ ruleId: slug, festivalId: slug, conditions }, d, UJJAIN).qualified === true) dates.push(d);
  }
  return dates;
}

test('the three rules are their own lunar-tithi windows, no longer day offsets', () => {
  for (const [slug, w] of Object.entries(DECIDED)) {
    const rule = CANONICAL_RULES.find((candidate) => candidate.slug === slug) as any;
    assert.ok(rule, slug);
    assert.equal(rule.rule_family, 'lunar_tithi', slug);
    assert.equal(rule.relation, undefined, `${slug} still has a relation`);
    assert.equal(rule.relative_base_slug, undefined, `${slug} still has a base`);
    assert.equal(rule.relative_offset_days, undefined, `${slug} still has an offset`);
    assert.deepEqual(
      {
        status: rule.date_assignment?.status,
        lunar_month: rule.date_assignment?.lunar_month,
        paksha: rule.date_assignment?.paksha,
        tithi: rule.date_assignment?.tithi,
        period: rule.date_assignment?.period,
        mode: rule.date_assignment?.mode,
      },
      { status: 'founder_approved', lunar_month: w.month, paksha: w.paksha, tithi: w.tithi, period: w.period, mode: w.mode },
      slug,
    );
    assert.ok(rule.evaluator_conditions?.length, `${slug} has no executable conditions`);
  }
  assert.equal((CANONICAL_RULES.find((r) => r.slug === 'anant-chaturdashi-ganesh-visarjan') as any).launch_status, 'included');
  assert.equal((CANONICAL_RULES.find((r) => r.slug === 'kartik-purnima') as any).launch_status, 'deferred');
  assert.equal((CANONICAL_RULES.find((r) => r.slug === 'mahalaya-amavasya') as any).launch_status, 'deferred');
});

// Every expectation below is a year where the old offset gave a DIFFERENT date, so each fails on the old rule.
// Ujjain 23.1765 / 75.7885, from the engine's own evaluator; the windows themselves are unsourced (tier 6).
test('Anant Chaturdashi follows Chaturdashi at Purvahna, not Ganesh Chaturthi + 10', () => {
  assert.deepEqual(qualifyingDates('anant-chaturdashi-ganesh-visarjan', '2026-09-20', '2026-09-30'), ['2026-09-25']); // old: 09-24
  assert.deepEqual(qualifyingDates('anant-chaturdashi-ganesh-visarjan', '2030-09-05', '2030-09-15'), ['2030-09-10']); // old: 09-11
  assert.deepEqual(qualifyingDates('anant-chaturdashi-ganesh-visarjan', '2031-09-25', '2031-10-05'), ['2031-09-29']); // old: 09-30
});

test('Kartik Purnima follows Purnima at Pradosha, not Diwali + 16', () => {
  assert.deepEqual(qualifyingDates('kartik-purnima', '2027-11-08', '2027-11-18'), ['2027-11-13']); // old: 11-14
  assert.deepEqual(qualifyingDates('kartik-purnima', '2030-11-04', '2030-11-14'), ['2030-11-09']); // old: 11-11
  assert.deepEqual(qualifyingDates('kartik-purnima', '2034-11-20', '2034-11-30'), ['2034-11-25']); // old: none (no Diwali that year)
});

test('Mahalaya Amavasya follows Amavasya at Aparahna, not Navratri - 1', () => {
  assert.deepEqual(qualifyingDates('mahalaya-amavasya', '2027-09-24', '2027-10-04'), ['2027-09-29']); // old: 09-30
  assert.deepEqual(qualifyingDates('mahalaya-amavasya', '2034-10-06', '2034-10-16'), ['2034-10-11']); // old: 10-12
  // adhika-Ashwin year: Navratri begins 18 Oct, so the old offset gave 17 Oct, a month after the real Pitru Paksha Amavasya.
  assert.deepEqual(qualifyingDates('mahalaya-amavasya', '2039-09-12', '2039-09-22'), ['2039-09-17', '2039-09-18']);
});

test('through the production entry point, Anant Chaturdashi 2026 is 25 Sep and the Ganeshotsav days are unchanged', () => {
  const rows = calculateObservancesForYear(2026, UJJAIN);
  const on = (slug: string) => rows.filter((row: any) => row.slug === slug).map((row: any) => row.date);
  assert.deepEqual(on('ganesh-chaturthi'), ['2026-09-14']);
  assert.deepEqual(on('ganeshotsav-day-10'), ['2026-09-23']); // still Ganesh Chaturthi + 9
  assert.deepEqual(on('anant-chaturdashi-ganesh-visarjan'), ['2026-09-25']); // was 2026-09-24 (Ganesh Chaturthi + 10)
});

// Two deferred Jain observances were Diwali offsets. Each now follows the rule whose window is the same tithi:
// Kartik Purnima (Jain) is the same day as Kartik Purnima; Jain New Year (Pratipada) is Kartika Shukla 1, the day
// of Govardhan Puja's founder-approved sunrise window. Diwali + 1 matched that window in only 3 of 8 years (2026-2033).
// These are proposed re-anchors, not approvals, and both stay deferred.
test('the two Jain aliases follow the tithi rule they share a day with, not a Diwali offset', () => {
  const alias = (slug: string) => CANONICAL_RULES.find((rule) => rule.slug === slug) as any;
  for (const [slug, parent] of [['kartik-purnima-jain', 'kartik-purnima'], ['jain-new-year-pratipada', 'govardhan-puja']] as const) {
    const rule = alias(slug);
    assert.ok(rule, slug);
    assert.deepEqual(rule.relation, { kind: 'alias', parent_slug: parent, offset_days: 0, status: 'proposed' }, slug);
    assert.equal(rule.relative_base_slug, parent, slug);
    assert.equal(rule.relative_offset_days, 0, slug);
    assert.equal(rule.launch_status, 'deferred', slug);
    assert.ok(CANONICAL_RULES.some((candidate) => candidate.slug === parent), `${parent} must exist`);
  }
  assert.equal((alias('govardhan-puja').date_assignment as any).tithi, 1);
  assert.equal((alias('govardhan-puja').date_assignment as any).period, 'sunrise');
});
