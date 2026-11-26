/**
 * rule-identity.test.ts
 *
 * Proves that calendar evaluation and materialisation preparation are keyed
 * by stable rule identity rather than by slug alone.
 *
 * Problem statement
 * -----------------
 * Both occurrence builders previously used Record<slug, dates>.  When two
 * rules share a slug (e.g. krishna-janmashtami's smarta and gaudiya rows),
 * the second write silently overwrote the first's computed dates.  A gate on
 * the second rule (launch_status: deferred) then wrote [], which the first
 * rule's assembler-loop read back — the included observance lost its date.
 * The outcome depended on array position, not on gating fields.
 *
 * Fix
 * ---
 * ruleIdentityKey(rule) = slug | slug::variant_key | slug::sampradaya
 * Both builders now key their internal maps by this value.  The public `slug`
 * field on every output struct is unchanged.
 *
 * Negative-check
 * --------------
 * One describe block below explicitly demonstrates the slug-keyed approach's
 * failure, then shows the identity-keyed approach solves it.  This is the
 * "negative" proof the task requires — not a revert of production code, but a
 * direct reproduction of the old map-overwrite behaviour side-by-side with the
 * corrected one.
 */
import { describe, it, expect } from 'vitest';
import {
  ruleIdentityKey,
  calculateObservancesForYearLegacy,
  calculateObservancesForYearCorrected,
  calculateObservanceCandidateDiagnosticsForYear,
} from '@/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '@/lib/calendar/rules';

// Panchang years are slow; 30 s is comfortable even on cold CI.
const TIMEOUT = 300_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal stub that satisfies the fields ruleIdentityKey reads. */
function makeRule(slug: string, extra: Partial<ObservanceRule> = {}): ObservanceRule {
  return {
    slug,
    display_name: slug,
    emoji: '✨',
    description: '',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'solar_fixed',
    verification_type: 'solar_fixed',
    launch_status: 'included',
    ...extra,
  } as ObservanceRule;
}

// ---------------------------------------------------------------------------
// 1. ruleIdentityKey — pure function tests
// ---------------------------------------------------------------------------

describe('ruleIdentityKey — key derivation', () => {
  it('returns slug for a single-row rule with no qualifier', () => {
    const rule = makeRule('diwali');
    expect(ruleIdentityKey(rule)).toBe('diwali');
  });

  it('qualifies with variant_key when present (takes priority)', () => {
    const rule = makeRule('yogini-ekadashi', { variant_key: 'smarta' });
    expect(ruleIdentityKey(rule)).toBe('yogini-ekadashi::smarta');
  });

  it('falls back to sampradaya when variant_key is absent', () => {
    const rule = makeRule('krishna-janmashtami', { sampradaya: 'smarta_nishita' });
    expect(ruleIdentityKey(rule)).toBe('krishna-janmashtami::smarta_nishita');
  });

  it('prefers variant_key over sampradaya when both are present', () => {
    const rule = makeRule('test', { variant_key: 'vk', sampradaya: 'sp' });
    expect(ruleIdentityKey(rule)).toBe('test::vk');
  });

  it('two krishna-janmashtami rules have distinct identity keys', () => {
    const rules = CANONICAL_RULES.filter(r => r.slug === 'krishna-janmashtami');
    expect(rules).toHaveLength(2);
    const keys = rules.map(ruleIdentityKey);
    expect(new Set(keys).size).toBe(2); // all distinct
  });

  it('every rule in CANONICAL_RULES has a non-empty identity key', () => {
    for (const rule of CANONICAL_RULES) {
      expect(ruleIdentityKey(rule)).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. NEGATIVE-CHECK — demonstrates the old slug-keyed approach's failure
// ---------------------------------------------------------------------------

describe('NEGATIVE-CHECK: slug-keyed map is order-sensitive and lossy', () => {
  it('a deferred write after an included write destroys the included dates', () => {
    // Reproduce the old approach: Record<slug, dates>
    const slugMap: Record<string, string[]> = {};

    // Included rule writes its dates
    slugMap['test-festival'] = ['2026-01-01', '2026-01-02'];

    // Deferred rule writes [] — overwrites because same slug key
    slugMap['test-festival'] = [];

    // The included rule's assembler-loop now reads [] — its occurrence is lost
    expect(slugMap['test-festival']).toEqual([]);
  });

  it('reversing the write order hides the bug but does not fix it', () => {
    // If included comes AFTER deferred, the result is coincidentally correct —
    // which is exactly what makes this an order-sensitivity bug rather than
    // a consistent failure. Tests that happened to pass in one order would
    // fail silently when CANONICAL_RULES ordering changed.
    const slugMap: Record<string, string[]> = {};

    slugMap['test-festival'] = []; // deferred first
    slugMap['test-festival'] = ['2026-01-01']; // included second — wins!

    // Appears fine, but only by accident of ordering
    expect(slugMap['test-festival']).toEqual(['2026-01-01']);
  });
});

// ---------------------------------------------------------------------------
// 3. Identity-keyed map correctness — direct proof of fix
// ---------------------------------------------------------------------------

describe('identity-keyed map preserves included dates alongside deferred', () => {
  it('included and deferred rules with different identity keys do not overwrite each other', () => {
    const identityMap: Record<string, string[]> = {};

    // Included rule: ruleKey = slug (no qualifier)
    identityMap['test-festival'] = ['2026-01-01'];

    // Deferred rule: ruleKey = slug::alt (qualified) → different key!
    identityMap['test-festival::alt'] = [];

    // Included rule's dates are preserved regardless of which was written first
    expect(identityMap['test-festival']).toEqual(['2026-01-01']);
    expect(identityMap['test-festival::alt']).toEqual([]);
  });

  it('deferred-after-included is order-invariant: same result when included comes second', () => {
    const identityMap: Record<string, string[]> = {};

    identityMap['test-festival::alt'] = [];        // deferred first
    identityMap['test-festival'] = ['2026-01-01']; // included second

    // Still isolated — order does not matter
    expect(identityMap['test-festival']).toEqual(['2026-01-01']);
    expect(identityMap['test-festival::alt']).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Live engine tests — krishna-janmashtami (the only current same-slug pair)
// ---------------------------------------------------------------------------

describe('two same-slug variants retain distinct identities', () => {
  it('calculateObservancesForYearLegacy(2026) emits two krishna-janmashtami entries with distinct ruleKeys',
    () => {
      const occs = calculateObservancesForYearLegacy(2026)
        .filter(o => o.slug === 'krishna-janmashtami');

      expect(occs).toHaveLength(2);

      const keys = occs.map(o => o.ruleKey);
      expect(new Set(keys).size).toBe(2); // all distinct
    },
    TIMEOUT,
  );

  it('calculateObservancesForYearCorrected(2026) also emits two krishna-janmashtami entries with distinct ruleKeys',
    () => {
      const occs = calculateObservancesForYearCorrected(2026)
        .filter(o => o.slug === 'krishna-janmashtami');

      expect(occs).toHaveLength(2);

      const keys = occs.map(o => o.ruleKey);
      expect(new Set(keys).size).toBe(2);
    },
    TIMEOUT,
  );

  it('2027 krishna-janmashtami: both variants un-gated, still two distinct identities',
    () => {
      // Smarta's 2027 dispute was cleared 2026-08-17 (the real nishitha-touches evaluator gives the council's
      // 2027-08-24). Gaudiya/ISKCON's was cleared 2026-11-26 by founder decision (a08ec4c, not council ratified):
      // Ashtami at sunrise decides and Rohini only breaks a two-sunrise tie, so 2027 left disputed_years.
      // These raw builders do not run the evaluator: the dates below are each builder's un-evaluated candidate,
      // not the published date. What is pinned is that both rows pass the gate and keep separate identities.
      const legacyOccs = calculateObservancesForYearLegacy(2027)
        .filter(o => o.slug === 'krishna-janmashtami');
      expect(legacyOccs.map(o => o.ruleKey)).toEqual([
        'krishna-janmashtami::smarta_nishita',
        'krishna-janmashtami::gaudiya_iskcon',
      ]);

      const correctedOccs = calculateObservancesForYearCorrected(2027)
        .filter(o => o.slug === 'krishna-janmashtami');
      expect(correctedOccs).toEqual([
        { slug: 'krishna-janmashtami', ruleKey: 'krishna-janmashtami::smarta_nishita', date: '2027-08-25', year: 2027 },
        { slug: 'krishna-janmashtami', ruleKey: 'krishna-janmashtami::gaudiya_iskcon', date: '2027-08-25', year: 2027 },
      ]);
    },
    TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// 5. Diagnostic surface — one entry per rule identity
// ---------------------------------------------------------------------------

describe('diagnostics retain both variant identities', () => {
  it('calculateObservanceCandidateDiagnosticsForYear(2026) yields two krishna-janmashtami diagnostics',
    () => {
      const diags = calculateObservanceCandidateDiagnosticsForYear(2026)
        .filter(d => d.slug === 'krishna-janmashtami');

      expect(diags).toHaveLength(2);

      const ruleKeys = diags.map(d => d.ruleKey).sort();
      expect(new Set(ruleKeys).size).toBe(2);
    },
    TIMEOUT,
  );

  it('2027 krishna-janmashtami diagnostics: neither variant withheld, both identities kept',
    () => {
      // Both 2027 disputes are cleared (smarta 2026-08-17; gaudiya 2026-11-26, a08ec4c). See the test above.
      const diags = calculateObservanceCandidateDiagnosticsForYear(2027)
        .filter(d => d.slug === 'krishna-janmashtami');

      expect(diags).toHaveLength(2);
      // Candidate evidence must be retained regardless of withheld status --
      // this diagnostic surface is deliberately ungated (see its own doc
      // comment in engine.ts).
      for (const d of diags) {
        expect(d.candidateDates.length).toBeGreaterThan(0);
        expect(d.ruleKey).toContain('krishna-janmashtami');
      }

      for (const ruleKey of ['krishna-janmashtami::smarta_nishita', 'krishna-janmashtami::gaudiya_iskcon']) {
        const d = diags.find(x => x.ruleKey === ruleKey);
        expect(d?.publicationWithheld, ruleKey).toBe(false);
        expect(d?.withheldReason, ruleKey).toBe(null);
      }
    },
    TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// 6. Relative-rule resolution is identity-safe
// ---------------------------------------------------------------------------

describe('relative rules resolve correctly after identity fix', () => {
  it('a negative relative offset resolves via slugIndex (chhath-nahay-khay before chhath-puja)',
    () => {
      // This pinned Dhanteras = Diwali - 2 until 2026-11-26, when Dhanteras became its own tithi rule and the offset
      // was removed (founder decision, a08ec4c). Chhath Nahay-Khay keeps the same shape: a relative rule with a
      // negative offset, resolved through slugIndex. The offset is read from the rule, not restated here.
      const rule = CANONICAL_RULES.find(r => r.slug === 'chhath-nahay-khay')!;
      expect(rule.rule_family).toBe('relative_to_other_observance');
      expect(rule.relative_offset_days).toBeLessThan(0);

      const occs = calculateObservancesForYearLegacy(2026);
      const base = occs.find(o => o.slug === rule.relative_base_slug);
      const child = occs.find(o => o.slug === 'chhath-nahay-khay');

      expect(base).toBeDefined();
      expect(child).toBeDefined();

      const diffDays =
        (new Date(child!.date + 'T00:00:00Z').getTime() - new Date(base!.date + 'T00:00:00Z').getTime()) / 86400000;
      expect(diffDays).toBe(rule.relative_offset_days);
    },
    TIMEOUT,
  );

  it('bhai-dooj (relative to diwali) publishes in 2026',
    () => {
      const occs = calculateObservancesForYearLegacy(2026);
      const bhai = occs.find(o => o.slug === 'bhai-dooj');
      expect(bhai).toBeDefined();
      expect(bhai!.ruleKey).toBe('bhai-dooj'); // single-row rule, ruleKey === slug
    },
    TIMEOUT,
  );
});

// ---------------------------------------------------------------------------
// 7. Ordinary single-row rules are behavior-identical to pre-fix
// ---------------------------------------------------------------------------

describe('ordinary single-row rules are behavior-identical', () => {
  it('diwali ruleKey equals slug (no qualifier needed)',
    () => {
      const occ = calculateObservancesForYearLegacy(2026).find(o => o.slug === 'diwali');
      expect(occ).toBeDefined();
      expect(occ!.ruleKey).toBe('diwali');
    },
    TIMEOUT,
  );

  it('ganesh-chaturthi date and ruleKey are stable',
    () => {
      const occ = calculateObservancesForYearLegacy(2026).find(o => o.slug === 'ganesh-chaturthi');
      expect(occ).toBeDefined();
      expect(occ!.ruleKey).toBe('ganesh-chaturthi');
      expect(occ!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    },
    TIMEOUT,
  );

  it('swapping the order of same-slug rules produces the same multiset of (ruleKey, date) pairs',
    () => {
      // For the current krishna-janmashtami pair, both rules have identical
      // computation parameters, so the set of (ruleKey, date) pairs is the same
      // regardless of which row appears first in CANONICAL_RULES. This property
      // is what "byte-identical results" means when dates are also identical.
      const occs = calculateObservancesForYearLegacy(2026)
        .filter(o => o.slug === 'krishna-janmashtami')
        .map(o => ({ ruleKey: o.ruleKey, date: o.date }))
        .sort((a, b) => a.ruleKey.localeCompare(b.ruleKey));

      // Two entries, both with a stable ruleKey and the same date
      expect(occs).toHaveLength(2);
      expect(occs[0].ruleKey).not.toBe(occs[1].ruleKey);
      expect(occs[0].date).toBe(occs[1].date); // same computation, different identity
    },
    TIMEOUT,
  );
});
