/**
 * ekadashi-selection.test.ts
 *
 * End-to-end unit test suite for Yogini Ekadashi variant selection, persistence,
 * publication containment, and council review.
 */

import { describe, it, expect } from 'vitest';
import { selectEkadashiVariant } from '../ekadashi-selection';
import { resolveCalendarContext } from '../calendar-context';
import { formatOccurrencesToResults, type ClientObservanceResult } from '../observance-formatter';
import { calculateOccurrencesWithEvaluator, collectDisputedUnresolvedItems } from '../materialize';
import { isPublishableForYear } from '../engine';
import { CANONICAL_RULES } from '../rules';
import { isWithheldOccurrence } from '../withheld';

describe('Prompt 4 End-to-End: Yogini Ekadashi Variant Selection & Governance', () => {
  const candidates = [
    { variantKey: 'smarta', date: '2026-07-10', displayName: 'Yogini Ekadashi (Smarta)' },
    { variantKey: 'vaishnava_vidhava', date: '2026-07-11', displayName: 'Yogini Ekadashi (Vaishnava & Vidhava)' },
  ];

  const reversedCandidates = [
    { variantKey: 'vaishnava_vidhava', date: '2026-07-11', displayName: 'Yogini Ekadashi (Vaishnava & Vidhava)' },
    { variantKey: 'smarta', date: '2026-07-10', displayName: 'Yogini Ekadashi (Smarta)' },
  ];

  it('1. Smarta persisted method selects 2026-07-10', () => {
    const result = selectEkadashiVariant(candidates, 'smarta', 'smarta');
    expect(result.status).toBe('resolved');
    expect(result.selectedDate).toBe('2026-07-10');
    expect(result.selectedVariant?.variantKey).toBe('smarta');
  });

  it('2. Vaishnava persisted method selects 2026-07-11', () => {
    const result = selectEkadashiVariant(candidates, 'vaishnava_suddha', 'gaudiya_iskcon');
    expect(result.status).toBe('resolved');
    expect(result.selectedDate).toBe('2026-07-11');
    expect(result.selectedVariant?.variantKey).toBe('vaishnava_vidhava');
  });

  it('3. Unspecified persisted method selects Smarta but remains labelled unspecified', () => {
    const result = selectEkadashiVariant(candidates, 'smarta', 'unspecified');
    expect(result.status).toBe('resolved');
    expect(result.selectedDate).toBe('2026-07-10');
    expect(result.selectedVariant?.variantKey).toBe('smarta');
    expect(result.traditionLabel).toBe('unspecified');
  });

  it('4. Reversed candidate order produces identical selection', () => {
    const smartaNormal = selectEkadashiVariant(candidates, 'smarta');
    const smartaReversed = selectEkadashiVariant(reversedCandidates, 'smarta');
    expect(smartaNormal.selectedDate).toBe(smartaReversed.selectedDate);
    expect(smartaNormal.selectedVariant?.variantKey).toBe(smartaReversed.selectedVariant?.variantKey);

    const vaishnavaNormal = selectEkadashiVariant(candidates, 'vaishnava_suddha');
    const vaishnavaReversed = selectEkadashiVariant(reversedCandidates, 'vaishnava_suddha');
    expect(vaishnavaNormal.selectedDate).toBe(vaishnavaReversed.selectedDate);
    expect(vaishnavaNormal.selectedVariant?.variantKey).toBe(vaishnavaReversed.selectedVariant?.variantKey);
  });

  it('5. One Vaishnava candidate presented to a Smarta profile -> needs_review', () => {
    const vaishnavaOnly = [{ variantKey: 'vaishnava_vidhava', date: '2026-07-11' }];
    const result = selectEkadashiVariant(vaishnavaOnly, 'smarta', 'smarta');
    expect(result.status).toBe('needs_review');
    expect(result.selectedVariant).toBeNull();
    expect(result.selectedDate).toBeNull();
  });

  it('6. Missing Smarta candidate for unspecified -> needs_review', () => {
    const vaishnavaOnly = [{ variantKey: 'vaishnava_vidhava', date: '2026-07-11' }];
    const result = selectEkadashiVariant(vaishnavaOnly, 'smarta', 'unspecified');
    expect(result.status).toBe('needs_review');
    expect(result.selectedVariant).toBeNull();
    expect(result.selectedDate).toBeNull();
  });

  it('7. Unknown method/profile -> needs_review with no primary', () => {
    const result = selectEkadashiVariant(candidates, 'unknown', 'unknown_profile_xyz');
    expect(result.status).toBe('needs_review');
    expect(result.selectedVariant).toBeNull();
    expect(result.selectedDate).toBeNull();
  });

  it('8. DB profile-method lookup failure -> API error, never guest/default', () => {
    const dbErrContext = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      dbError: new Error('PostgREST RLS Error'),
    });

    expect(dbErrContext.disclosureDiagnostics.resolutionStatus).toBe('database_failure');
    expect(dbErrContext.disclosureDiagnostics.errorMessage).toBe('PostgREST RLS Error');
    expect(dbErrContext.ekadashiMethod).toBe('unknown');
  });

  it('9. Both alternatives remain visible and exactly one isPrimary when supported', () => {
    const rawOccurrences = [
      {
        date: '2026-09-04',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: 'smarta',
        observance_definitions: { slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami (Smarta)', kind: 'major', tradition: 'hindu', active: true },
      },
      {
        date: '2026-09-05',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: 'gaudiya_iskcon',
        observance_definitions: { slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami (Gaudiya)', kind: 'major', tradition: 'hindu', active: true },
      },
    ];

    const smartaContext = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      calendarProfileDefinition: {
        slug: 'north_indian_purnimanta',
        monthSystem: 'purnimanta',
        era: 'vikram_north',
      },
      traditionProfile: 'smarta',
      traditionProfileDefinition: {
        slug: 'smarta',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'smarta_nishita',
      },
    });

    const results = formatOccurrencesToResults(
      rawOccurrences,
      [],
      'all',
      'north_indian_purnimanta',
      'smarta',
      '2026-09-01',
      '2026-09-30',
      smartaContext
    );

    const primaryItems = results.filter((r: ClientObservanceResult) => r.isPrimary);
    expect(primaryItems).toHaveLength(1);
    expect(primaryItems[0].profile.tradition).toBe('smarta');

    expect(results[0].alternatives.length + results[1].alternatives.length).toBeGreaterThan(0);
  });

  it('10. Deferred Yogini variants do not leak into materialized output', () => {
    const engineOutput = calculateOccurrencesWithEvaluator(2026);
    expect(engineOutput.resolved.filter(r => r.slug === 'yogini-ekadashi')).toEqual([]);
  }, 300_000);

  it('11. Pending council status prevents both variants from materializing', () => {
    const yoginiRules = CANONICAL_RULES.filter(r => r.slug === 'yogini-ekadashi');
    expect(yoginiRules).toHaveLength(2);

    for (const rule of yoginiRules) {
      expect(rule.launch_status).toBe('deferred');
      expect(rule.disputed_years).toContain(2026);
      expect(isPublishableForYear(rule, 2026)).toBe(false);
      expect(isPublishableForYear(rule, 2027)).toBe(false);
    }
  });

  it('13. Persisted Janmashtami-shaped rows with variant_key and null spiritual_tradition select correctly', () => {
    // Uses krishna-janmashtami, not Yogini: Yogini is launch_status 'deferred'
    // unconditionally (every year, not just 2026 -- see rules.json), so a real
    // Yogini row can never reach primary/alternative selection to exercise this
    // path. Janmashtami is 'included' and carries the same variant_key + null
    // spiritual_tradition shape, so it is what actually exercises this mechanism
    // today. See test 13b below for what a real Yogini row does at this layer.
    const rawOccurrences = [
      {
        date: '2026-09-04',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'smarta',
        observance_definitions: { slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami', kind: 'major', tradition: 'hindu', active: true },
      },
      {
        date: '2026-09-05',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'vaishnava',
        observance_definitions: { slug: 'krishna-janmashtami', display_name: 'Krishna Janmashtami', kind: 'major', tradition: 'hindu', active: true },
      },
    ];

    const smartaContext = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      traditionProfileDefinition: {
        slug: 'smarta',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'smarta_nishita',
      },
    });

    const results = formatOccurrencesToResults(
      rawOccurrences,
      [],
      'all',
      'north_indian_purnimanta',
      'smarta',
      '2026-09-01',
      '2026-09-30',
      smartaContext,
    );

    const primary = results.find((r: ClientObservanceResult) => r.isPrimary);
    expect(primary).toBeDefined();
    expect(primary!.variantKey).toBe('smarta');
    expect(primary!.civilDate).toBe('2026-09-04');
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].variantKey).toBe('vaishnava');
    expect(primary!.alternatives[0].civilDate).toBe('2026-09-05');
  });

  it('13b. Real Yogini-shaped rows (variant_key, null spiritual_tradition) never reach selection -- withheld end-to-end', () => {
    const rawOccurrences = [
      {
        date: '2026-07-10',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'smarta',
        observance_definitions: { slug: 'yogini-ekadashi', display_name: 'Yogini Ekadashi', kind: 'vrat', tradition: 'hindu', active: true },
      },
      {
        date: '2026-07-11',
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'vaishnava_vidhava',
        observance_definitions: { slug: 'yogini-ekadashi', display_name: 'Yogini Ekadashi', kind: 'vrat', tradition: 'hindu', active: true },
      },
    ];

    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      traditionProfileDefinition: { slug: 'smarta', ekadashiMethod: 'smarta', janmashtamiMethod: 'smarta_nishita' },
    });

    const results = formatOccurrencesToResults(
      rawOccurrences,
      [],
      'all',
      'north_indian_purnimanta',
      'smarta',
      '2026-07-01',
      '2026-07-31',
      context,
    );

    // Same raw shape as test 13, different rule -- the only variable is that
    // this rule is launch_status 'deferred'. filterWithheldJoinedRows must drop
    // both rows before selection logic ever runs on them.
    expect(results.filter((r: ClientObservanceResult) => r.slug === 'yogini-ekadashi')).toEqual([]);
  });

  it('14. Per-variant matching resolves via real sampradaya identity, not the conservative slug-wide fallback', () => {
    // krishna-janmashtami's two rows carry `sampradaya` (smarta_nishita /
    // gaudiya_iskcon), not variant_key -- passing 'smarta'/'vaishnava' (as this
    // test previously did) matches neither row's ruleIdentityKey, so
    // isWithheldOccurrence silently fell through to its conservative
    // slug-wide fallback and returned true/true regardless of what was passed
    // in, which is why the old assertions couldn't have told an asymmetric bug
    // apart from a fully-symmetric one. Passing the REAL sampradaya values
    // exercises the actual per-row match, proven by the diagnostics staying
    // empty (no 'legacy-insufficient-identity'), and by status genuinely
    // differing across years for the SAME identity.
    const diagnostics2026: string[] = [];
    const diagnostics2027: string[] = [];

    const smartaWithheld2026 = isWithheldOccurrence('krishna-janmashtami', '2026-08-15', null, 'smarta_nishita', undefined, diagnostics2026);
    const gaudiyaWithheld2026 = isWithheldOccurrence('krishna-janmashtami', '2026-08-16', null, 'gaudiya_iskcon', undefined, diagnostics2026);
    expect(smartaWithheld2026).toBe(false);
    expect(gaudiyaWithheld2026).toBe(false);
    expect(diagnostics2026).not.toContain('legacy-insufficient-identity');

    // Both rows are disputed for 2027 (real data has no asymmetric pair today --
    // see test 18 for the synthetic case that proves the mechanism CAN
    // discriminate), but the point here is that this year genuinely differs
    // from 2026 above for the identical identity, which the old test's fake
    // variant_key strings could never have shown either.
    const smartaWithheld2027 = isWithheldOccurrence('krishna-janmashtami', '2027-09-04', null, 'smarta_nishita', undefined, diagnostics2027);
    const gaudiyaWithheld2027 = isWithheldOccurrence('krishna-janmashtami', '2027-09-05', null, 'gaudiya_iskcon', undefined, diagnostics2027);
    expect(smartaWithheld2027).toBe(true);
    expect(gaudiyaWithheld2027).toBe(true);
    expect(diagnostics2027).not.toContain('legacy-insufficient-identity');
  });

  it('15. collectDisputedUnresolvedItems produces exactly two Yogini 2026 queue items', () => {
    const queueItems = collectDisputedUnresolvedItems(2026).filter(i => i.slug === 'yogini-ekadashi');

    expect(queueItems).toHaveLength(2);
    const smartaItem = queueItems.find(i => i.variant_key === 'smarta');
    const vaishnavaItem = queueItems.find(i => i.variant_key === 'vaishnava_vidhava');

    expect(smartaItem).toBeDefined();
    expect(smartaItem?.candidate_dates).toEqual(['2026-07-10']);
    expect(smartaItem?.ambiguity_type).toBe('disputed_ratification');

    expect(vaishnavaItem).toBeDefined();
    expect(vaishnavaItem?.candidate_dates).toEqual(['2026-07-11']);
    expect(vaishnavaItem?.ambiguity_type).toBe('disputed_ratification');
  });

  it('16. Cross-year containment: collectDisputedUnresolvedItems for 2025 and 2027 emits ZERO items for Yogini Ekadashi', () => {
    const items2025 = collectDisputedUnresolvedItems(2025).filter(i => i.slug === 'yogini-ekadashi');
    const items2027 = collectDisputedUnresolvedItems(2027).filter(i => i.slug === 'yogini-ekadashi');

    expect(items2025).toHaveLength(0);
    expect(items2027).toHaveLength(0);
  });

  it('17. Read-time selection on unresolved queue items preserves status=under_review and null civilDate', () => {
    const queueRows = [
      {
        id: 'q1',
        year: 2026,
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'smarta',
        candidate_dates: ['2026-07-10'],
        ambiguity_type: 'disputed_ratification',
        reasoning: 'Disputed variant',
        review_status: 'pending_review',
        observance_definitions: { slug: 'yogini-ekadashi', display_name: 'Yogini Ekadashi', kind: 'vrat', tradition: 'hindu', active: true },
      },
      {
        id: 'q2',
        year: 2026,
        calendar_profile: 'north_indian_purnimanta',
        spiritual_tradition: null,
        variant_key: 'vaishnava_vidhava',
        candidate_dates: ['2026-07-11'],
        ambiguity_type: 'disputed_ratification',
        reasoning: 'Disputed variant',
        review_status: 'pending_review',
        observance_definitions: { slug: 'yogini-ekadashi', display_name: 'Yogini Ekadashi', kind: 'vrat', tradition: 'hindu', active: true },
      },
    ];

    const context = resolveCalendarContext({
      calendarProfile: 'north_indian_purnimanta',
      traditionProfile: 'smarta',
      traditionProfileDefinition: {
        slug: 'smarta',
        ekadashiMethod: 'smarta',
        janmashtamiMethod: 'smarta_nishita',
      },
    });

    const formatted = formatOccurrencesToResults(
      [],
      queueRows,
      'all',
      'north_indian_purnimanta',
      'smarta',
      '2026-07-01',
      '2026-07-31',
      context,
    );

    const yoginiResults = formatted.filter(r => r.festivalId === 'yogini-ekadashi');
    expect(yoginiResults.length).toBeGreaterThan(0);

    const primary = yoginiResults.find(r => r.isPrimary);
    expect(primary).toBeDefined();
    expect(primary!.variantKey).toBe('smarta');
    expect(primary!.status).toBe('under_review');
    expect(primary!.civilDate).toBeNull();
    expect(primary!.date).toBe('');

    // Check alternative candidate date disclosure
    expect(primary!.alternatives).toHaveLength(1);
    expect(primary!.alternatives[0].variantKey).toBe('vaishnava_vidhava');
    expect(primary!.alternatives[0].civilDate).toBe('2026-07-11');
    expect(primary!.alternatives[0].note).toBe('Under Review');
  });

  it('18. Asymmetric synthetic rule withholding test in withheld.ts', () => {
    const syntheticRules: any[] = [
      {
        slug: 'test-vrat',
        variant_key: 'smarta',
        launch_status: 'published',
        disputed_years: [],
      },
      {
        slug: 'test-vrat',
        variant_key: 'vaishnava',
        launch_status: 'deferred',
        disputed_years: [2026],
      },
    ];

    const smartaStatus = isWithheldOccurrence('test-vrat', '2026-08-10', 'smarta', null, syntheticRules);
    const vaishnavaStatus = isWithheldOccurrence('test-vrat', '2026-08-11', 'vaishnava', null, syntheticRules);

    expect(smartaStatus).toBe(false);
    expect(vaishnavaStatus).toBe(true);
  });

  it('19. Legacy row lacking variant_key emits legacy-insufficient-identity diagnostic', () => {
    const diagnostics: string[] = [];
    const syntheticRules: any[] = [
      { slug: 'test-vrat', variant_key: 'smarta', launch_status: 'published' },
      { slug: 'test-vrat', variant_key: 'vaishnava', launch_status: 'deferred', disputed_years: [2026] },
    ];

    const withheld = isWithheldOccurrence('test-vrat', '2026-08-10', null, null, syntheticRules, diagnostics);

    expect(withheld).toBe(true);
    expect(diagnostics).toContain('legacy-insufficient-identity');
  });
});
