import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEdition, parseDayToken, parseEditionRange } from './ingest-sgpc-edition.mjs';

test('supports single and range sidebar dates', () => {
  assert.equal(parseDayToken('21'), '21');
  assert.equal(parseDayToken('21-22'), '21-22');
});

test('parses edition range', () => {
  assert.deepEqual(parseEditionRange('14 March 2026 - 13 March 2027 (558)'), { from: '2026-03-14', to: '2027-03-13' });
});

test('builds an unreviewed edition and checks every month-start row', () => {
  const month_starts = Object.fromEntries(['Chet','Vaisakh','Jeth','Harh','Sawan','Bhadon','Assu','Katak','Maghar','Poh','Magh','Phagun'].map((month, i) => [month, `2026-${String(i + 3).padStart(2, '0')}-01`]));
  const result = buildEdition({ edition: 559, edition_range: { from: '2027-03-14', to: '2028-03-13' }, month_starts, rows: [{ index: 1, day: '21-22', month: 'Assu', name_gurmukhi: 'test', category: 'itihasik' }], source: { tier: 1 }, colour_method: { legend_rgb: {} } });
  assert.equal(result.review.read_by_human, false);
  assert.equal(result.rows[0].read_by_human, false);
  assert.deepEqual(result.cross_check, { checked: 1, passed: 1 });
});
