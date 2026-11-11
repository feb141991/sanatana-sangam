import test from 'node:test';
import assert from 'node:assert/strict';
import sidebar from '../docs/sources/sgpc-nanakshahi-558-sidebar.json' with { type: 'json' };

function deriveMapping(rows, holdout) {
  const holdoutSet = new Set(holdout);
  const mapping = new Map();
  const ambiguous = new Set();

  for (const row of rows) {
    if (holdoutSet.has(row.index)) continue;
    const legacy = row.name_legacy.split(/\s+/);
    const unicode = row.name_gurmukhi.split(/\s+/);
    if (legacy.length !== unicode.length) continue;

    for (let i = 0; i < legacy.length; i += 1) {
      const key = legacy[i];
      const value = unicode[i];
      if (mapping.has(key) && mapping.get(key) !== value) {
        ambiguous.add(key);
      } else if (!ambiguous.has(key)) {
        mapping.set(key, value);
      }
    }
  }

  return { mapping, ambiguous };
}

function translate(row, mapping) {
  return row.name_legacy.split(/\s+/).map((token) => mapping.get(token) ?? '').join(' ');
}

test('SGPC 558 sidebar has complete human-review metadata', () => {
  assert.equal(sidebar.rows.length, 106);
  assert.equal(sidebar.summary.total_rows, 106);
  assert.equal(sidebar.summary.category_counts.unknown, 0);

  for (const row of sidebar.rows) {
    assert.equal(row.read_by_human, true);
    assert.equal(row.reviewed_by, 'Pt Prince Sharma');
    assert.equal(row.reviewed_at, '2026-11-11');
    assert.equal(row.review_scope, '558 sidebar as printed in the SGPC PDF');
    assert.match(row.category, /^(itihasik|gurpurab|bhagat_sahiban|sarkari_holiday|unknown)$/);
  }
});

test('derived legacy mapping reproduces training rows and reports the holdout separately', () => {
  const { mapping, ambiguous } = deriveMapping(sidebar.rows, sidebar.conversion.holdout_rows);
  const holdout = new Set(sidebar.conversion.holdout_rows);
  const trainingRows = sidebar.rows.filter((row) => !holdout.has(row.index));
  const holdoutRows = sidebar.rows.filter((row) => holdout.has(row.index));
  const trainingPassed = trainingRows.filter((row) => translate(row, mapping) === row.name_gurmukhi);
  const holdoutPassed = holdoutRows.filter((row) => translate(row, mapping) === row.name_gurmukhi);

  assert.equal(trainingPassed.length, 75);
  assert.equal(holdoutPassed.length, 7);
  assert.deepEqual([...ambiguous].sort(), ['AMimRqsr)', 'sRI']);
  assert.equal(sidebar.summary.conversion_tested_rows, 82);
  assert.equal(sidebar.summary.holdout_passed, 7);
  assert.equal(sidebar.summary.holdout_failed, 13);

  for (const row of sidebar.rows) {
    const expected = translate(row, mapping) === row.name_gurmukhi;
    assert.equal(row.conversion_tested, expected);
  }
});

test('recorded OCR corrections and fallback provenance are explicit', () => {
  assert.equal(sidebar.rows.find((row) => row.index === 9).name_gurmukhi.endsWith('9'), false);
  assert.equal(sidebar.rows.find((row) => row.index === 60).name_gurmukhi.endsWith('੦6'), false);
  assert.equal(sidebar.rows.find((row) => row.index === 22).name_source, '557_sidebar_decoded_fallback');
  assert.equal(sidebar.rows.find((row) => row.index === 22).conversion_tested, true);
});
