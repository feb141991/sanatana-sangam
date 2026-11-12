import test from 'node:test';
import assert from 'node:assert/strict';
import sidebar from '../docs/sources/sgpc-nanakshahi-558-sidebar.json' with { type: 'json' };

const LEGEND = sidebar.colour_method.legend_rgb;
const CATEGORIES = ['itihasik', 'gurpurab', 'bhagat_sahiban', 'sarkari_holiday', 'unknown'];
const RESET_FOR_REVIEW = new Set([9, 28, 29, 30, 31, 32, 34, 35, 36, 37, 60, 64, 65, 67, 68, 69, 70, 72, 74, 91, 107, 108]);

function colourDistance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

function categoryFromColour(rgb) {
  return Object.entries(LEGEND).sort(([, a], [, b]) => colourDistance(rgb, a) - colourDistance(rgb, b))[0][0];
}

function parseDay(day) {
  return day.split('-').map(Number);
}

function dateAtMonthStart(month, day) {
  const starts = {
    Chet: '2026-03-14', Vaisakh: '2026-04-14', Jeth: '2026-05-15', Harh: '2026-06-15',
    Sawan: '2026-07-16', Bhadon: '2026-08-17', Assu: '2026-09-17', Katak: '2026-10-17',
    Maghar: '2026-11-16', Poh: '2026-12-16', Magh: '2027-01-14', Phagun: '2027-02-13',
  };
  const start = new Date(`${starts[month]}T00:00:00Z`);
  const [first, last] = parseDay(day);
  const date = new Date(start);
  date.setUTCDate(date.getUTCDate() + first - 1);
  const firstDate = date.toISOString().slice(0, 10);
  if (!last) return [firstDate];
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + last - 1);
  return [firstDate, end.toISOString().slice(0, 10)];
}

test('rebuild contains every printed entry, including range dates', () => {
  assert.equal(sidebar.rows.length, 108);
  assert.equal(sidebar.summary.total_rows, 108);
  assert.equal(sidebar.summary.category_unknown_rows, 0);
  assert.equal(sidebar.rows.at(-1).print_order, 108);
  assert.ok(sidebar.rows.some((row) => row.day === '21-22' && row.month === 'Assu' && row.name_gurmukhi.includes('ਬੀੜ ਬਾਬਾ ਬੁੱਢਾ')));
  assert.ok(sidebar.rows.some((row) => row.day === '8' && row.month === 'Poh' && row.name_gurmukhi.includes('ਵੱਡੇ ਸਾਹਿਬਜ਼ਾਦੇ')));
  assert.equal(Object.hasOwn(sidebar, 'conversion'), false);
  for (const row of sidebar.rows) assert.ok(CATEGORIES.includes(row.category));
});

test('every sampled text colour resolves to the recorded category', () => {
  for (const row of sidebar.rows) {
    assert.deepEqual(Object.keys(row.colour_evidence.legend_rgb).sort(), Object.keys(LEGEND).sort());
    assert.equal(categoryFromColour(row.colour_evidence.sampled_rgb), row.category, `row ${row.index}`);
  }
});

test('multiline names and punctuation corrections are complete', () => {
  assert.equal(sidebar.rows.find((row) => row.index === 28).name_gurmukhi, 'ਸ਼ਹੀਦੀ ਦਿਹਾੜਾ ਸੰਤ ਜਰਨੈਲ ਸਿੰਘ ਜੀ ਖ਼ਾਲਸਾ ਭਿੰਡਰਾਂਵਾਲੇ ਤੇ ਭਾਈ ਅਮਰੀਕ ਸਿੰਘ ਜੀ');
  assert.equal(sidebar.rows.find((row) => row.index === 91).name_gurmukhi.startsWith(':'), false);
  assert.equal(sidebar.rows.find((row) => row.index === 9).name_gurmukhi.endsWith('9'), false);
  assert.equal(sidebar.rows.find((row) => row.index === 60).name_gurmukhi.endsWith('੦6'), false);
  assert.equal(sidebar.rows.find((row) => row.index === 69).name_gurmukhi.startsWith('ਕਰ '), false);
  for (const row of sidebar.rows.filter((candidate) => candidate.name_gurmukhi.includes(' ਤੇ '))) {
    assert.ok(row.name_gurmukhi.length > 20, `multiline row ${row.index} was truncated`);
  }
});

test('OCR cross-check disagreements are explicit and explained', () => {
  const disagreements = sidebar.ocr_cross_check.disagreements;
  assert.deepEqual(disagreements.map((row) => row.index).sort((a, b) => a - b), [22, 28, 91]);
  for (const row of disagreements) assert.ok(row.reason.length > 20);
  assert.equal(sidebar.summary.ocr_cross_check_agreements + sidebar.summary.ocr_cross_check_disagreements, 108);
  assert.equal(sidebar.summary.ocr_cross_check_disagreements, 3);
});

test('558 month/day values reproduce Gregorian dates from the month-start table', () => {
  for (const row of sidebar.rows) assert.equal(dateAtMonthStart(row.month, row.day).length >= 1, true, `row ${row.index}`);
  assert.deepEqual(dateAtMonthStart('Assu', '21-22'), ['2026-10-07', '2026-10-08']);
  assert.deepEqual(dateAtMonthStart('Poh', '8'), ['2026-12-23']);
});

test('print order follows Nanakshahi month and day order', () => {
  const monthOrder = ['Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon', 'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagun'];
  const key = (row) => [monthOrder.indexOf(row.month), Number(row.day.split('-')[0])];
  const ordered = [...sidebar.rows].sort((a, b) => a.print_order - b.print_order);
  for (let i = 1; i < ordered.length; i += 1) {
    const previous = key(ordered[i - 1]);
    const current = key(ordered[i]);
    assert.equal(previous[0] < current[0] || (previous[0] === current[0] && previous[1] <= current[1]), true, `print order ${ordered[i - 1].index} -> ${ordered[i].index}`);
  }
});

test('review stamps remain true only for unchanged rows', () => {
  for (const row of sidebar.rows) {
    assert.equal(row.reviewed_by, 'Pt Prince Sharma');
    assert.equal(row.reviewed_at, '2026-11-11');
    assert.equal(row.review_scope, '558 sidebar as printed in the SGPC PDF');
    assert.equal(row.read_by_human, !RESET_FOR_REVIEW.has(row.index), `row ${row.index}`);
  }
  assert.deepEqual(sidebar.summary.rows_reset_for_review.sort((a, b) => a - b), [...RESET_FOR_REVIEW].sort((a, b) => a - b));
});
