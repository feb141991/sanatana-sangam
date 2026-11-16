import assert from 'node:assert/strict';
import test from 'node:test';
import rules from '../packages/dharma-rules/src/festivals/rules.json';
import { validateWindowDeclarationParity } from './window-declaration-parity';

test('every declared window matches the executable tithi/month/window fields', () => {
  assert.deepEqual(validateWindowDeclarationParity(rules as any), []);
});

test('the Buddhist declaration-only batch is recorded without executable rewiring', () => {
  const declarationOnly = (rules as any[]).filter((rule) =>
    ['losar-tibetan-new-year', 'magha-puja', 'vesak-buddha-purnima', 'asalha-puja', 'vassa-begins-rains-retreat', 'ullambana-ancestor-day', 'pavarana-end-of-vassa'].includes(rule.slug),
  );
  assert.equal(declarationOnly.filter((rule) => rule.date_assignment?.status === 'proposed').length, 7);
  assert.equal(declarationOnly.filter((rule) => rule.evaluator_conditions).length, 0);
});

test('the approved calculation batch is wired to executable conditions', () => {
  const wired = (rules as any[]).filter((rule) =>
    rule.slug === 'raksha-bandhan' ||
    rule.slug === 'papmochani-ekadashi' ||
    (rule.slug === 'yogini-ekadashi' && rule.variant_key === 'vaishnava_vidhava') ||
    ['chhath-puja', 'vinayaka-chaturthi', 'vasant-panchami', 'akshaya-tritiya', 'hartalika-teej'].includes(rule.slug),
  );
  assert.equal(wired.filter((rule) => rule.slug !== 'papmochani-ekadashi' && !rule.evaluator_conditions).length, 0);
  assert.equal(wired.find((rule) => rule.slug === 'papmochani-ekadashi')?.corrected_month_system, 'purnimanta');
  assert.equal(wired.find((rule) => rule.slug === 'vinayaka-chaturthi')?.date_assignment?.mode, 'touches');
});

test('window source status and tier are recorded for every declaration', () => {
  for (const rule of rules as any[]) {
    if (!rule.date_assignment) continue;
    assert.equal(rule.window_source?.tier, 6, rule.slug);
    assert.equal(rule.window_source?.status, 'unsourced', rule.slug);
  }
});

// Founder approved these three Jain windows (sunrise / at, the udaya-tithi convention) in chat on 2026-11-13.
// The approval was never recorded in rules.json; mahavir-jayanti was published with no window at all.
// This test fails if any of them loses its record.
test('the three founder-approved Jain windows are recorded', () => {
  const expected: Array<[string, number, string]> = [
    ['mahavir-jayanti', 13, 'Chaitra'],
    ['akshaya-tritiya-jain', 3, 'Vaishakha'],
    ['das-lakshana-dharma-begins', 5, 'Bhadrapada'],
  ];
  for (const [slug, tithi, month] of expected) {
    const rule = (rules as any[]).find((candidate) => candidate.slug === slug);
    assert.ok(rule, slug);
    assert.deepEqual(
      {
        status: rule.date_assignment?.status,
        tithi: rule.date_assignment?.tithi,
        paksha: rule.date_assignment?.paksha,
        lunar_month: rule.date_assignment?.lunar_month,
        month_system: rule.date_assignment?.month_system,
        period: rule.date_assignment?.period,
        mode: rule.date_assignment?.mode,
      },
      { status: 'founder_approved', tithi, paksha: 'shukla', lunar_month: month, month_system: 'amanta', period: 'sunrise', mode: 'at' },
      slug,
    );
  }
});

// Windows that exist only in code were mirrored into rules.json as `proposed` (never approved) on 2026-11-16.
// A record here describes what the engine already does; it does not make the date correct or sourced.
test('the nine mirrored code-only windows are recorded as proposed, not approved', () => {
  const mirrored: Array<[string, string | undefined]> = [
    ['ram-navami', undefined],
    ['ganesh-chaturthi', undefined],
    ['radha-ashtami', undefined],
    ['guru-ravidas-jayanti', undefined],
    ['samvatsari-paryushana-ends', undefined],
    ['karva-chauth', undefined],
    ['diwali', undefined],
    ['naraka-chaturdashi', undefined],
    ['krishna-janmashtami', 'smarta_nishita'],
  ];
  for (const [slug, sampradaya] of mirrored) {
    const rule = (rules as any[]).find((candidate) => candidate.slug === slug && (candidate.sampradaya ?? undefined) === sampradaya);
    assert.ok(rule, slug);
    assert.equal(rule.date_assignment?.status, 'proposed', slug);
  }
});

// SHRINK-ONLY. Lunar-tithi rules that still publish with no recorded window, each with the reason it cannot be
// recorded faithfully yet. A new lunar rule must arrive with a window; remove an entry here when its window is recorded.
const KNOWN_WITHOUT_WINDOW: Record<string, string> = {
  'krishna-janmashtami::gaudiya_iskcon': 'adds a Rohini nakshatra condition the record format cannot express; handled by its own evaluator conditions',
  'paryushana-parva-begins::': 'no founder-approved window; council ruled 2027-08-28 and 2028-08-16; disputed; the engine returns no date for 2027 or 2028',
};

test('every lunar-tithi rule has a recorded window or is on the shrink-only list', () => {
  const families = new Set(['lunar_tithi', 'lunar_tithi_span', 'lunar_tithi_recurring']);
  const without = (rules as any[]).filter(
    (rule) =>
      families.has(rule.rule_family) &&
      !rule.date_assignment &&
      !rule.relation &&
      !rule.relative_base_slug &&
      rule.derivability !== 'externally_curated',
  );
  const keys = without.map((rule) => `${rule.slug}::${rule.variant_key ?? rule.sampradaya ?? ''}`);
  for (const k of keys) assert.ok(k in KNOWN_WITHOUT_WINDOW, `${k} has no recorded window and is not on the known list`);
  for (const k of Object.keys(KNOWN_WITHOUT_WINDOW)) assert.ok(keys.includes(k), `${k} now has a window: remove it from KNOWN_WITHOUT_WINDOW`);
});

// ekadashi and pradosh-vrat run in both pakshas. The record format now says so (`paksha: 'both'`) instead of the rules being
// split into per-paksha rules, which would rename 138 production rows. Parity requires 'both' to match recurring_tithi_indices.
test('ekadashi and pradosh-vrat carry a both-pakshas window recorded as proposed', () => {
  for (const [slug, tithi, period, mode] of [['ekadashi', 11, 'sunrise', 'at'], ['pradosh-vrat', 13, 'pradosha', 'touches']] as const) {
    const rule = (rules as any[]).find((candidate) => candidate.slug === slug);
    assert.ok(rule, slug);
    assert.deepEqual(rule.recurring_tithi_indices, [tithi, tithi + 15], slug);
    assert.equal(rule.date_assignment?.paksha, 'both', slug);
    assert.equal(rule.date_assignment?.status, 'proposed', slug);
    assert.equal(rule.date_assignment?.tithi, tithi, slug);
    assert.equal(rule.date_assignment?.period, period, slug);
    assert.equal(rule.date_assignment?.mode, mode, slug);
  }
});

test("a both-pakshas record on a rule that does not run in both pakshas fails parity", () => {
  const mutated = (rules as any[]).map((rule) =>
    rule.slug === 'purnima-vrat' ? { ...rule, date_assignment: { ...rule.date_assignment, paksha: 'both' } } : rule,
  );
  assert.ok(validateWindowDeclarationParity(mutated as any).some((issue) => issue.startsWith('purnima-vrat')));
});

// purnima-vrat and amavasya-vrat were left off the first list as "held on the legacy path". Measured on the production
// entry point (Ujjain, 2027): purnima-vrat equals its recorded madhyahna/touches window (first day of a two-day cluster,
// and no row where a named Purnima observance owns the day), not the legacy sunrise rule; amavasya-vrat equals sunrise/at
// in all 13 months. So the recorded windows are what runs.
test('purnima-vrat and amavasya-vrat carry the windows they execute, recorded as proposed', () => {
  const purnima = (rules as any[]).find((rule) => rule.slug === 'purnima-vrat');
  const amavasya = (rules as any[]).find((rule) => rule.slug === 'amavasya-vrat');
  assert.deepEqual(
    { s: purnima.date_assignment.status, t: purnima.date_assignment.tithi, k: purnima.date_assignment.paksha, p: purnima.date_assignment.period, m: purnima.date_assignment.mode },
    { s: 'proposed', t: 15, k: 'shukla', p: 'madhyahna', m: 'touches' },
  );
  assert.deepEqual(
    { s: amavasya.date_assignment.status, t: amavasya.date_assignment.tithi, k: amavasya.date_assignment.paksha, p: amavasya.date_assignment.period, m: amavasya.date_assignment.mode },
    { s: 'proposed', t: 15, k: 'krishna', p: 'sunrise', m: 'at' },
  );
});

// maha-shivaratri: the window is Krishna 14 prevailing at nishita (what the evaluator runs). The legacy sunrise index 28
// (Krishna 13) is a proxy and is deliberately NOT changed to 29: on the engine, 29 gives the day after in most years.
test('maha-shivaratri records Krishna 14 at nishita and keeps its legacy sunrise proxy index', () => {
  const rule = (rules as any[]).find((candidate) => candidate.slug === 'maha-shivaratri');
  assert.deepEqual(
    { s: rule.date_assignment.status, t: rule.date_assignment.tithi, k: rule.date_assignment.paksha, p: rule.date_assignment.period, m: rule.date_assignment.mode },
    { s: 'proposed', t: 14, k: 'krishna', p: 'nishita', m: 'prevails' },
  );
  assert.equal(rule.lunar_tithi_index, 28);
  assert.deepEqual(validateWindowDeclarationParity(rules as any), []);
});

test('a nishita proxy exception does not excuse a different gap between the index and the window', () => {
  const mutated = (rules as any[]).map((rule) => (rule.slug === 'maha-shivaratri' ? { ...rule, lunar_tithi_index: 25 } : rule));
  assert.ok(validateWindowDeclarationParity(mutated as any).some((issue) => issue.startsWith('maha-shivaratri')));
});
