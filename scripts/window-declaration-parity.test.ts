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
  'maha-shivaratri::': 'legacy tithi index 28 (Krishna 13) disagrees with its code window, Krishna 14 at nishita; a record fails parity',
  'krishna-janmashtami::gaudiya_iskcon': 'adds a Rohini nakshatra condition the record format cannot express',
  'paryushana-parva-begins::': 'no founder-approved window; council ruled 2027-08-28 and 2028-08-16; disputed',
  'ekadashi::': 'runs in both pakshas; the record format has no way to say so',
  'pradosh-vrat::': 'runs in both pakshas; the record format has no way to say so',
  'purnima-vrat::': 'held on the legacy path (LEGACY_ONLY_PENDING_MUHURTA_EVALUATOR); the code window may not be what runs',
  'amavasya-vrat::': 'held on the legacy path (LEGACY_ONLY_PENDING_MUHURTA_EVALUATOR); the code window may not be what runs',
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
