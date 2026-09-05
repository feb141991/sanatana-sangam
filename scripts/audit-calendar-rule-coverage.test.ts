/**
 * Regression coverage for the two pure functions in
 * audit-calendar-rule-coverage.ts that decide what a reader of the Prompt 2
 * rule-coverage report will actually see: which of the 5 categories a
 * definition lands in, and which cross-slug pairs get flagged as possible
 * duplicates/identity overlaps.
 *
 * Run: npx tsx --test scripts/audit-calendar-rule-coverage.test.ts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { categorize, findIdentityFlags, isRealCoverageValue } from './audit-calendar-rule-coverage';

test('isRealCoverageValue: rejects null, empty, and the "unspecified" sentinel; accepts a real value', () => {
  assert.equal(isRealCoverageValue(null), false);
  assert.equal(isRealCoverageValue(undefined), false);
  assert.equal(isRealCoverageValue(''), false);
  assert.equal(isRealCoverageValue('unspecified'), false);
  assert.equal(isRealCoverageValue('Unspecified'), false); // case-insensitive
  assert.equal(isRealCoverageValue('  unspecified  '), false); // whitespace-insensitive
  assert.equal(isRealCoverageValue('north_indian_purnimanta'), true);
  assert.equal(isRealCoverageValue('Ujjain, India'), true);
});

function def(overrides: Partial<{
  slug: string; display_name: string; kind: string; tradition: string;
  has_rule: boolean; launch_statuses: string[]; fixture_total: number;
  fixture_real_citations: number; fixture_years: number[];
  fixture_real_years: number[]; fixture_real_locations: string[];
  fixture_real_profiles: string[];
}> = {}) {
  return {
    slug: 'x', display_name: 'X', kind: 'major', tradition: 'hindu',
    has_rule: true, launch_statuses: ['included'], fixture_total: 0,
    fixture_real_citations: 0, fixture_years: [], fixture_real_years: [],
    fixture_real_locations: [], fixture_real_profiles: [],
    ...overrides,
  };
}

test('category 1 requires the FULL bar: >=2 real years AND >=2 locations AND >=2 profiles -- the real ram-navami shape', () => {
  const { category, next_action } = categorize(def({
    fixture_real_citations: 4, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['Bedford, UK', 'Ujjain, India'],
    fixture_real_profiles: ['north_indian_purnimanta', 'gujarati_amanta'],
  }), undefined);
  assert.equal(category, 1);
  assert.equal(next_action, 'no_action_required');
});

test('>=2 locations but only ONE real profile is category 2, not category 1 -- fixed per review: OR was too weak, the runbook requires locations AND profile/tradition coverage, not either', () => {
  const { category, next_action } = categorize(def({
    fixture_real_citations: 2, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['Bedford, UK', 'Ujjain, India'], fixture_real_profiles: ['north_indian_purnimanta'],
  }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('the mahavir-jayanti shape: 2 real years, 2 real locations, but every fixture row records profile.tradition="unspecified" -- must be category 2, not category 1', () => {
  // "unspecified" is a sentinel meaning no real profile/tradition was
  // recorded -- structurally the same as null, not a second real data
  // point. Confirmed against production: mahavir-jayanti's 4 real fixture
  // rows all carry {"calendar": null, "tradition": "unspecified"}, while
  // ram-navami's real rows carry two genuinely distinct calendar values
  // (north_indian_purnimanta / gujarati_amanta). Before this fix, the
  // "unspecified" string was counted as if it were a real profile value.
  const { category, next_action } = categorize(def({
    fixture_real_citations: 4, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['Bedford, UK', 'Ujjain, India'],
    fixture_real_profiles: [], // caller is expected to have already excluded "unspecified" -- see buildFixtureCoverage test below
  }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('a real citation with only ONE fixture year is category 2, not category 1 -- fixed per review (was previously mislabelled "fixture-covered" while also asking to add a fixture)', () => {
  const { category, next_action } = categorize(def({
    fixture_real_citations: 1, fixture_real_years: [2026], fixture_real_locations: ['Ujjain, India'],
  }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('two real fixture years but only ONE location and ONE profile still fails the bar -- fixed per review (year count alone is not the full declared matrix)', () => {
  const { category, next_action } = categorize(def({
    fixture_real_citations: 2, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['Ujjain, India'], fixture_real_profiles: ['north_indian_purnimanta'],
  }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('placeholder-only years never count toward the bar, even if fixture_years (all rows) shows >=2', () => {
  // fixture_years is the all-rows field (kept for context); fixture_real_years
  // is what categorize() actually checks, and here it's empty because every
  // dated row is a TODO placeholder.
  const { category, next_action } = categorize(def({
    fixture_total: 3, fixture_real_citations: 0, fixture_years: [2026, 2027, 2028], fixture_real_years: [],
  }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('category 2: rule-backed, included, but zero real citations (placeholder-only or none)', () => {
  const { category, next_action } = categorize(def({ fixture_total: 3, fixture_real_citations: 0 }), undefined);
  assert.equal(category, 2);
  assert.equal(next_action, 'add fixture');
});

test('category 3: deferred rule -> leave deferred, regardless of fixture coverage', () => {
  const { category, next_action } = categorize(def({
    launch_statuses: ['deferred'], fixture_real_citations: 5, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['a', 'b'],
  }), undefined);
  assert.equal(category, 3);
  assert.equal(next_action, 'leave deferred');
});

test('category 4: no rule at all -> clarify convention', () => {
  const { category, next_action } = categorize(def({ has_rule: false, launch_statuses: [] }), undefined);
  assert.equal(category, 4);
  assert.equal(next_action, 'clarify convention');
});

test('category 5 overrides the CATEGORY even for a fully fixture-covered included rule, but preserves it as underlying_category', () => {
  const flags = [{ reason: 'slug_is_prefix_of_another_definition' as const, detail: 'x', with_slugs: ['y'] }];
  const fullyCovered = def({
    fixture_real_citations: 5, fixture_real_years: [2026, 2027],
    fixture_real_locations: ['Bedford, UK', 'Ujjain, India'],
    fixture_real_profiles: ['north_indian_purnimanta', 'gujarati_amanta'],
  });
  const result = categorize(fullyCovered, flags, ['hindu']); // same tradition as `x` (default 'hindu')
  assert.equal(result.category, 5);
  assert.equal(result.underlying_category, 1);
  assert.equal(result.underlying_next_action, 'no_action_required');
});

test('identity flag against a DIFFERENT-tradition partner -> "add an explicit profile/region variant", not merge/retirement -- fixed per review (Diwali / Jain Diwali must not be forced toward retirement)', () => {
  const flags = [{ reason: 'compound_name_matches_standalone_definition' as const, detail: 'x', with_slugs: ['jain-diwali-nirvana-ladnun'] }];
  const { category, next_action } = categorize(def({ tradition: 'all' }), flags, ['jain']);
  assert.equal(category, 5);
  assert.equal(next_action, 'add an explicit profile/region variant');
});

test('identity flag against a SAME-tradition partner -> merge/retirement decision, not a variant suggestion', () => {
  const flags = [{ reason: 'slug_is_prefix_of_another_definition' as const, detail: 'x', with_slugs: ['vassa-begins-rains-retreat'] }];
  const { category, next_action } = categorize(def({ tradition: 'buddhist' }), flags, ['buddhist']);
  assert.equal(category, 5);
  assert.equal(next_action, 'submit a merge/retirement decision for human approval');
});

test('identity flag with NO partner (within-slug finding, e.g. krishna-janmashtami) defaults to merge/retirement, not variant', () => {
  const flags = [{ reason: 'confirmed_data_inconsistency_from_phase0_audit' as const, detail: 'x', with_slugs: [] }];
  const { category, next_action } = categorize(def(), flags, []);
  assert.equal(category, 5);
  assert.equal(next_action, 'submit a merge/retirement decision for human approval');
});

test('identity flag with MIXED same- and different-tradition partners defaults to merge/retirement (conservative -- at least one same-tradition redundancy exists)', () => {
  const flags = [{ reason: 'compound_name_matches_standalone_definition' as const, detail: 'x', with_slugs: ['p1', 'p2'] }];
  const { category, next_action } = categorize(def({ tradition: 'hindu' }), flags, ['hindu', 'jain']);
  assert.equal(category, 5);
  assert.equal(next_action, 'submit a merge/retirement decision for human approval');
});

test('findIdentityFlags: a compound "X / Y" name is flagged against BOTH standalone definitions it names', () => {
  const flags = findIdentityFlags([
    { slug: 'gudi-padwa', display_name: 'Gudi Padwa', upcoming_occurrence_date: '2027-04-07' },
    { slug: 'ugadi', display_name: 'Ugadi', upcoming_occurrence_date: '2027-04-07' },
    { slug: 'gudi-padwa-ugadi', display_name: 'Gudi Padwa / Ugadi', upcoming_occurrence_date: '2027-04-07' },
  ]);
  assert.equal(flags.get('gudi-padwa')?.some(f => f.with_slugs.includes('gudi-padwa-ugadi')), true);
  assert.equal(flags.get('ugadi')?.some(f => f.with_slugs.includes('gudi-padwa-ugadi')), true);
  // gudi-padwa also matches via the slug-prefix signal (b), independently of
  // the compound-name signal (a) -- both are real, so >=2 flags is correct,
  // not exactly 2.
  assert.ok((flags.get('gudi-padwa-ugadi')?.length ?? 0) >= 2);
});

test('findIdentityFlags: a compound "X (Y)" name whose X is contained in another active name is flagged', () => {
  const flags = findIdentityFlags([
    { slug: 'diwali', display_name: 'Diwali', upcoming_occurrence_date: '2026-11-08' },
    { slug: 'jain-diwali-nirvana-ladnun', display_name: 'Jain Diwali (Nirvana Ladnun)', upcoming_occurrence_date: '2027-10-28' },
  ]);
  assert.equal(flags.get('diwali')?.some(f => f.with_slugs.includes('jain-diwali-nirvana-ladnun')), true);
});

test('findIdentityFlags: unrelated observances sharing only a calendar day are NOT flagged', () => {
  // Guru Purnima, Asalha Puja, and Raksha Bandhan genuinely share a
  // full-moon date across three traditions -- a real astronomical
  // coincidence, not a duplicate. Same-date alone must never trigger a flag.
  const flags = findIdentityFlags([
    { slug: 'guru-purnima', display_name: 'Guru Purnima', upcoming_occurrence_date: '2027-07-18' },
    { slug: 'asalha-puja', display_name: 'Asalha Puja', upcoming_occurrence_date: '2027-07-18' },
    { slug: 'raksha-bandhan', display_name: 'Raksha Bandhan', upcoming_occurrence_date: '2027-07-18' },
  ]);
  assert.equal(flags.size, 0);
});

test('findIdentityFlags: two named ekadashis sharing "Ekadashi" are NOT flagged (generic ritual word, not identity)', () => {
  const flags = findIdentityFlags([
    { slug: 'aja-ekadashi', display_name: 'Aja Ekadashi', upcoming_occurrence_date: '2026-09-07' },
    { slug: 'rama-ekadashi', display_name: 'Rama Ekadashi', upcoming_occurrence_date: '2026-11-04' },
  ]);
  assert.equal(flags.size, 0);
});

test('findIdentityFlags: slug-prefix chains are flagged (>=2 shared leading tokens)', () => {
  const flags = findIdentityFlags([
    { slug: 'vassa-begins', display_name: 'Vassa Begins', upcoming_occurrence_date: '2027-07-19' },
    { slug: 'vassa-begins-rains-retreat', display_name: 'Vassa begins (Rains Retreat)', upcoming_occurrence_date: '2027-07-19' },
  ]);
  assert.equal(flags.get('vassa-begins')?.some(f => f.reason === 'slug_is_prefix_of_another_definition'), true);
});

test('findIdentityFlags: a single shared leading token does not trigger the prefix signal', () => {
  const flags = findIdentityFlags([
    { slug: 'ekadashi', display_name: 'Ekadashi', upcoming_occurrence_date: '2026-09-07' },
    { slug: 'ekadashi-something-else', display_name: 'Ekadashi Something Else', upcoming_occurrence_date: '2026-09-07' },
  ]);
  assert.equal(flags.has('ekadashi'), false);
});
