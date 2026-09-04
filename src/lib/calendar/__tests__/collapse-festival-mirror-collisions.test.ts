/**
 * The nightly materialize-occurrences cron (vercel.json, 0 2 * * *) runs
 * materializeOccurrencesForYears with USE_CONDITION_EVALUATOR (hardcoded
 * true, engine.ts:74) active. That branch hardcodes calendar_profile:
 * 'legacy-ujjain' for every row, which trg_sync_occurrence_to_festival
 * mirrors into a legacy `festivals` table unique on (name, year) with no
 * variant_key column. Krishna Janmashtami is a single observance_
 * definitions row (kind: 'major') that legitimately produces two
 * variant_key occurrence rows for the same year (smarta_nishita,
 * gaudiya_iskcon) -- both would try to insert their own festivals row under
 * the same (name, year), and the batch/lock accounting in
 * commitOccurrencesWithBatches means the run aborts partway rather than
 * rolling back cleanly. This mirrors resolve-occurrences.test.ts's coverage
 * of the same hazard on the self-heal-on-read path.
 */
import { describe, it, expect } from 'vitest';
import { collapseFestivalMirrorNameCollisionsForEvaluatorOutput } from '../materialize';

const definitionMetaBySlug = new Map<string, { displayName: string; kind: string | null }>([
  ['krishna-janmashtami', { displayName: 'Krishna Janmashtami', kind: 'major' }],
  ['maha-shivaratri', { displayName: 'Maha Shivaratri', kind: 'major' }],
  ['ekadashi', { displayName: 'Ekadashi', kind: 'vrat' }],
]);

describe('collapseFestivalMirrorNameCollisionsForEvaluatorOutput', () => {
  it('keeps one row when one definition produces two same-year variants on different dates, preferring Smarta', () => {
    const result = collapseFestivalMirrorNameCollisionsForEvaluatorOutput(
      [
        { slug: 'krishna-janmashtami', date: '2026-09-04', year: 2026, spiritual_tradition: 'smarta', variant_key: 'smarta_nishita' },
        { slug: 'krishna-janmashtami', date: '2026-09-05', year: 2026, spiritual_tradition: 'gaudiya_iskcon', variant_key: 'gaudiya_iskcon' },
        { slug: 'maha-shivaratri', date: '2026-02-15', year: 2026, spiritual_tradition: 'smarta', variant_key: 'smarta' },
      ],
      definitionMetaBySlug,
    );

    const janmashtami = result.filter((r) => r.slug === 'krishna-janmashtami');
    expect(janmashtami).toHaveLength(1);
    expect(janmashtami[0].spiritual_tradition).toBe('smarta');
    expect(result.some((r) => r.slug === 'maha-shivaratri')).toBe(true);
  });

  it('never collapses a recurring vrat definition\'s many real dates in a year', () => {
    const dates = ['2026-01-10', '2026-01-25', '2026-02-08', '2026-02-24'];
    const result = collapseFestivalMirrorNameCollisionsForEvaluatorOutput(
      dates.map((date) => ({ slug: 'ekadashi', date, year: 2026, spiritual_tradition: null, variant_key: 'legacy-default' })),
      definitionMetaBySlug,
    );
    expect(result).toHaveLength(dates.length);
    expect(new Set(result.map((r) => r.date)).size).toBe(dates.length);
  });

  it('passes through a slug with no colliding sibling unchanged', () => {
    const result = collapseFestivalMirrorNameCollisionsForEvaluatorOutput(
      [{ slug: 'maha-shivaratri', date: '2026-02-15', year: 2026, spiritual_tradition: 'smarta', variant_key: 'smarta' }],
      definitionMetaBySlug,
    );
    expect(result).toHaveLength(1);
  });
});
