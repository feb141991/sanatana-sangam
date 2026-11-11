import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateOccurrencesWithEvaluator, EVALUATOR_RULES } from '../src/lib/calendar/materialize';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

test('every evaluator variant has canonical declared conditions', () => {
  for (const definition of EVALUATOR_RULES) {
    for (const variant of definition.variants) {
      const candidates = CANONICAL_RULES.filter((rule) => rule.slug === definition.slug);
      const canonical = candidates.find((rule) =>
        (variant.spiritualTradition !== null && rule.sampradaya === variant.spiritualTradition) ||
        rule.variant_key === variant.variantId,
      ) ?? (variant.variantId === 'smarta'
        ? candidates.find((rule) => rule.sampradaya?.startsWith('smarta'))
        : undefined) ?? (candidates.length === 1 ? candidates[0] : undefined);

      assert.ok(canonical, `${definition.slug}/${variant.variantId} has no canonical rule`);
      assert.ok(canonical.evaluator_conditions?.length, `${definition.slug}/${variant.variantId} has no canonical evaluator conditions`);
    }
  }
});

test('evaluator variant output has one row per canonical ruleKey and date', () => {
  for (const year of [2026, 2029]) {
    const { resolved } = calculateOccurrencesWithEvaluator(year, {
      lat: 23.1765,
      lon: 75.7885,
      tz: 'Asia/Kolkata',
    });
    const janmashtami = resolved.filter((row) => row.slug === 'krishna-janmashtami');
    const keys = janmashtami.map((row) =>
      `${row.slug}::${row.variant_key ?? 'standard'}|${row.date}`,
    );
    assert.equal(new Set(keys).size, keys.length, `duplicate evaluator rows for ${year}`);
  }
});
