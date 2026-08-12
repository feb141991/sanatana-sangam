/**
 * The disputed-years publication gate — direct regression tests.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * When the gate landed, the only thing "covering" it was the harness SKIPPING
 * the affected snapshots. A skip is the absence of a test. It proves nothing
 * about whether the gate works, and it would stay green if `isPublishableForYear`
 * were deleted tomorrow -- the skipped snapshots would simply remain skipped
 * while the disputed dates flowed straight back into production output.
 *
 * That gap was caught in review, and it is the same class of mistake as the one
 * it was fixing: believing a thing is enforced because something adjacent to it
 * mentions the thing. `ratification_note` was prose that looked like a gate; a
 * skipped snapshot is a hole that looks like coverage.
 *
 * WHAT IS ASSERTED
 * ----------------
 * Both halves, because either alone is passable by a broken implementation:
 *
 *   1. Every disputed (rule, year) pair is ABSENT from both builders.
 *      Alone, `return []` passes this.
 *   2. The SAME rule still publishes in its adjacent, undisputed years.
 *      This is what stops over-suppression -- withholding Janmashtami 2027 must
 *      not cost us 2026 and 2028.
 *
 * Both paths are checked because the gate is applied in two separate builders,
 * and USE_CORRECTED_MASA decides which one ships. A gate on only the active path
 * silently un-fixes itself the day that flag flips.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateObservancesForYearLegacy,
  calculateObservancesForYearCorrected,
  calculateObservanceCandidateDiagnosticsForYear,
} from '@/lib/calendar/engine';
import { CANONICAL_RULES } from '@/lib/calendar/rules';

/** Every disputed (slug, year) pair, read from the rules rather than hardcoded. */
const DISPUTED: Array<{ slug: string; year: number }> = [
  ...new Set(
    CANONICAL_RULES.flatMap(r => (r.disputed_years ?? []).map(y => `${r.slug}|${y}`)),
  ),
].map(k => {
  const [slug, year] = k.split('|');
  return { slug, year: Number(year) };
});

/**
 * Memoised per (path, year).
 *
 * A full corrected-path year costs ~3.5s, so the naive version recomputed 2026
 * three times over and blew vitest's 5s default on any test touching two years.
 * That surfaced as two red tests whose engine behaviour was in fact correct --
 * worth stating plainly, because "the test went red so the code is wrong" is
 * exactly the inference that wastes an afternoon. Caching makes each year cost
 * once for the whole file.
 */
const cache = new Map<string, Array<{ slug: string; date: string }>>();
const occurrences = (path: 'legacy' | 'corrected', year: number) => {
  const key = `${path}|${year}`;
  if (!cache.has(key)) {
    cache.set(key, path === 'legacy'
      ? calculateObservancesForYearLegacy(year)
      : calculateObservancesForYearCorrected(year));
  }
  return cache.get(key)!;
};

const BUILDERS = ['legacy', 'corrected'] as const;

const datesFor = (path: 'legacy' | 'corrected', slug: string, year: number) =>
  occurrences(path, year).filter(o => o.slug === slug).map(o => o.date);

/** Panchanga years are seconds-scale even cached; the default 5s is too tight. */
const TIMEOUT = 300_000;

describe('disputed_years — publication gate', () => {
  it('there is at least one disputed pair to test', () => {
    // Guards against this whole suite silently becoming a no-op if the field is
    // renamed or cleared. A suite that tests nothing must not report success.
    expect(DISPUTED.length).toBeGreaterThan(0);
  });

  describe.each(BUILDERS)('%s builder', (path) => {
    it.each(DISPUTED)('withholds $slug in $year', ({ slug, year }) => {
      expect(datesFor(path, slug, year)).toEqual([]);
    }, TIMEOUT);
  });

  describe.each(BUILDERS)('%s builder — no over-suppression', (path) => {
    it.each(DISPUTED)('$slug still publishes in years adjacent to $year', ({ slug, year }) => {
      const rule = CANONICAL_RULES.find(r => r.slug === slug)!;
      // A launch-deferred rule is withheld in every year by design. The
      // disputed-year gate must not be credited or blamed for its absence.
      if (rule.launch_status === 'deferred') return;
      const undisputed = [year - 1, year + 1].filter(
        y => y >= 2026 && y <= 2028 && !rule.disputed_years?.includes(y),
      );
      // Only meaningful where an undisputed neighbour exists inside the
      // generated range; paryushana is disputed in both 2027 and 2028.
      if (path === 'legacy' && !rule.lunar_masa_name) return;
      if (undisputed.length === 0) return;

      for (const y of undisputed) {
        expect(datesFor(path, slug, y), `${slug} vanished from undisputed ${y}`).not.toEqual([]);
      }
    }, TIMEOUT);
  });
});

describe('disputed_years — suppression is not amnesia', () => {
  it.each(DISPUTED)('still reports candidate dates for $slug $year, labelled as withheld', ({ slug, year }) => {
    // Withholding is a decision about PUBLICATION. The diagnostic surface must
    // keep the evidence, or the dispute becomes unresolvable: a reviewer asking
    // "what date did the engine actually compute?" would get "none", which is
    // both false and useless.
    const diag = calculateObservanceCandidateDiagnosticsForYear(year).find(d => d.slug === slug);
    expect(diag, `no diagnostic emitted for ${slug}`).toBeDefined();
    expect(diag!.publicationWithheld).toBe(true);
    const rule = CANONICAL_RULES.find(r => r.slug === slug)!;
    expect(diag!.withheldReason).toBe(
      rule.launch_status === 'deferred' ? 'deferred' : 'disputed_year',
    );
    expect(diag!.candidateDates.length, 'candidate evidence was destroyed by the gate').toBeGreaterThan(0);
  }, TIMEOUT);
});

describe('disputed_variants — Yogini Ekadashi 2026 structured alternatives', () => {
  it('proves Yogini Ekadashi 2026 is withheld from publication while retaining source-backed alternatives', () => {
    const correctedDates = calculateObservancesForYearCorrected(2026)
      .filter(o => o.slug === 'yogini-ekadashi');
    expect(correctedDates).toEqual([]);

    const diag = calculateObservanceCandidateDiagnosticsForYear(2026)
      .find(d => d.slug === 'yogini-ekadashi');
    expect(diag).toBeDefined();
    expect(diag!.publicationWithheld).toBe(true);
    expect(diag!.withheldReason).toBe('deferred');
    expect(diag!.candidateDates.length).toBeGreaterThan(0);

    const rule = CANONICAL_RULES.find(r => r.slug === 'yogini-ekadashi');
    expect(rule).toBeDefined();
    expect(rule!.disputed_years).toContain(2026);
    expect(rule!.disputed_variants).toBeDefined();
    expect(rule!.disputed_variants).toHaveLength(2);

    const smarta = rule!.disputed_variants!.find(v => v.variant_key === 'smarta');
    expect(smarta).toBeDefined();
    expect(smarta!.civil_date).toBe('2026-07-10');
    expect(smarta!.review_status).toBe('disputed');
    expect(smarta!.source_ref).toContain('Rashtriya Panchang');

    const vaishnava = rule!.disputed_variants!.find(v => v.variant_key === 'vaishnava_vidhava');
    expect(vaishnava).toBeDefined();
    expect(vaishnava!.civil_date).toBe('2026-07-11');
    expect(vaishnava!.review_status).toBe('disputed');
    expect(vaishnava!.source_ref).toContain('Rashtriya Panchang');
  });
});
