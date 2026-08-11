/**
 * yogini-variants.test.ts
 *
 * Proves that Yogini Ekadashi 2026 dual-variant modeling functions correctly:
 * 1. Both same-slug rules exist with distinct variant_key ('smarta', 'vaishnava_vidhava').
 * 2. Un-gated evaluation computes:
 *    - Smarta (previous_day policy): selected date 2026-07-10
 *    - Vaishnava & Vidhava (following_day policy): selected date 2026-07-11
 * 3. Hard gate: disputed_years contains 2026 for BOTH variants (publication withheld).
 * 4. Diagnostics retain both candidate dates and mark publicationWithheld = true.
 * 5. Read-time selection (selectEkadashiVariant):
 *    - Smarta profile selects 2026-07-10 (smarta variant).
 *    - Vaishnava profiles select 2026-07-11 (vaishnava_vidhava variant).
 *    - Unspecified profile selects 2026-07-10 (smarta date), labelled "unspecified".
 *    - Unsupported/ambiguous profiles enter review (status: 'needs_review').
 * 6. Neither variant overwrites the other.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateObservanceCandidateDiagnosticsForYear,
  isPublishableForYear,
  ruleIdentityKey,
} from '@/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '@/lib/calendar/rules';
import { selectEkadashiVariant } from '@/lib/calendar/ekadashi-selection';
import { LunarTithiHandler, precomputePanchangCorrectedForYear } from '@/lib/calendar/engine';

const TIMEOUT = 30_000;

describe('Yogini Ekadashi 2026 — Dual Variant Modeling', () => {
  it('CANONICAL_RULES contains two yogini-ekadashi rules with distinct variant_key values', () => {
    const yoginiRules = CANONICAL_RULES.filter(r => r.slug === 'yogini-ekadashi');
    expect(yoginiRules).toHaveLength(2);

    const variantKeys = yoginiRules.map(r => r.variant_key).sort();
    expect(variantKeys).toEqual(['smarta', 'vaishnava_vidhava']);

    const ruleKeys = yoginiRules.map(ruleIdentityKey);
    expect(ruleKeys).toContain('yogini-ekadashi::smarta');
    expect(ruleKeys).toContain('yogini-ekadashi::vaishnava_vidhava');
  });

  it('un-gated engine evaluation computes candidate dates containing 2026-07-10 for Smarta and 2026-07-11 for Vaishnava/Vidhava', () => {
    const days = precomputePanchangCorrectedForYear(2026);

    const smartaRule = CANONICAL_RULES.find(r => r.slug === 'yogini-ekadashi' && r.variant_key === 'smarta')!;
    const vaishnavaRule = CANONICAL_RULES.find(r => r.slug === 'yogini-ekadashi' && r.variant_key === 'vaishnava_vidhava')!;

    // Adapt to corrected rule fields (purnimanta month system)
    const daysPurnimanta = days.map(d => ({
      ...d,
      panchang: { ...d.panchang, masaName: d.panchang.masaNamePurnimanta },
    }));

    const smartaRuleCorrected: ObservanceRule = {
      ...smartaRule,
      lunar_masa_name: smartaRule.corrected_lunar_masa_name ?? smartaRule.lunar_masa_name,
      lunar_tithi_index: smartaRule.corrected_lunar_tithi_index ?? smartaRule.lunar_tithi_index,
      skipped_tithi_policy: smartaRule.corrected_skipped_tithi_policy ?? smartaRule.skipped_tithi_policy,
      prefer_last_match: smartaRule.corrected_prefer_last_match ?? smartaRule.prefer_last_match,
    };

    const vaishnavaRuleCorrected: ObservanceRule = {
      ...vaishnavaRule,
      lunar_masa_name: vaishnavaRule.corrected_lunar_masa_name ?? vaishnavaRule.lunar_masa_name,
      lunar_tithi_index: vaishnavaRule.corrected_lunar_tithi_index ?? vaishnavaRule.lunar_tithi_index,
      skipped_tithi_policy: vaishnavaRule.corrected_skipped_tithi_policy ?? vaishnavaRule.skipped_tithi_policy,
      prefer_last_match: vaishnavaRule.corrected_prefer_last_match ?? vaishnavaRule.prefer_last_match,
    };

    const smartaDates = LunarTithiHandler.evaluate(smartaRuleCorrected, daysPurnimanta);
    const vaishnavaDates = LunarTithiHandler.evaluate(vaishnavaRuleCorrected, daysPurnimanta);

    expect(smartaDates).toContain('2026-07-10');
    expect(vaishnavaDates).toContain('2026-07-11');

    // Prefer last match selects 2026-07-10 for Smarta and 2026-07-11 for Vaishnava
    const selectedSmarta = smartaDates[smartaDates.length - 1];
    const selectedVaishnava = vaishnavaDates[vaishnavaDates.length - 1];

    expect(selectedSmarta).toBe('2026-07-10');
    expect(selectedVaishnava).toBe('2026-07-11');
  }, TIMEOUT);

  it('HARD GATE: both Yogini Ekadashi variants have disputed_years [2026] and publication is withheld', () => {
    const yoginiRules = CANONICAL_RULES.filter(r => r.slug === 'yogini-ekadashi');
    expect(yoginiRules).toHaveLength(2);

    for (const rule of yoginiRules) {
      expect(rule.disputed_years).toContain(2026);
      expect(isPublishableForYear(rule, 2026)).toBe(false);
    }
  });

  it('candidate diagnostics retain both variants with their respective selected dates for 2026', () => {
    const diags = calculateObservanceCandidateDiagnosticsForYear(2026)
      .filter(d => d.slug === 'yogini-ekadashi');

    expect(diags).toHaveLength(2);

    const smartaDiag = diags.find(d => d.ruleKey === 'yogini-ekadashi::smarta');
    const vaishnavaDiag = diags.find(d => d.ruleKey === 'yogini-ekadashi::vaishnava_vidhava');

    expect(smartaDiag).toBeDefined();
    expect(smartaDiag!.publicationWithheld).toBe(true);
    expect(smartaDiag!.withheldReason).toBe('disputed_year');
    expect(smartaDiag!.selectedDate).toBe('2026-07-10');
    expect(smartaDiag!.candidateDates).toContain('2026-07-10');

    expect(vaishnavaDiag).toBeDefined();
    expect(vaishnavaDiag!.publicationWithheld).toBe(true);
    expect(vaishnavaDiag!.withheldReason).toBe('disputed_year');
    expect(vaishnavaDiag!.selectedDate).toBe('2026-07-11');
    expect(vaishnavaDiag!.candidateDates).toContain('2026-07-11');
  }, TIMEOUT);

  it('read-time selection (selectEkadashiVariant) selects primary according to profile', () => {
    const candidates = [
      { variantKey: 'smarta', date: '2026-07-10', displayName: 'Yogini Ekadashi (Smarta)' },
      { variantKey: 'vaishnava_vidhava', date: '2026-07-11', displayName: 'Yogini Ekadashi (Vaishnava & Vidhava)' },
    ];

    // Smarta profile -> 2026-07-10
    const smartaResult = selectEkadashiVariant(candidates, 'smarta');
    expect(smartaResult.status).toBe('resolved');
    expect(smartaResult.selectedDate).toBe('2026-07-10');
    expect(smartaResult.selectedVariant?.variantKey).toBe('smarta');

    // Shaiva / Shakta profiles -> 2026-07-10
    expect(selectEkadashiVariant(candidates, 'shaiva').selectedDate).toBe('2026-07-10');
    expect(selectEkadashiVariant(candidates, 'shakta').selectedDate).toBe('2026-07-10');

    // Vaishnava profiles -> 2026-07-11
    const gaudiyaResult = selectEkadashiVariant(candidates, 'gaudiya_iskcon');
    expect(gaudiyaResult.status).toBe('resolved');
    expect(gaudiyaResult.selectedDate).toBe('2026-07-11');
    expect(gaudiyaResult.selectedVariant?.variantKey).toBe('vaishnava_vidhava');

    expect(selectEkadashiVariant(candidates, 'sri_vaishnava').selectedDate).toBe('2026-07-11');
    expect(selectEkadashiVariant(candidates, 'swaminarayan').selectedDate).toBe('2026-07-11');

    // Unspecified profile -> 2026-07-10, labelled unspecified
    const unspecifiedResult = selectEkadashiVariant(candidates, 'unspecified');
    expect(unspecifiedResult.status).toBe('resolved');
    expect(unspecifiedResult.selectedDate).toBe('2026-07-10');
    expect(unspecifiedResult.selectedVariant?.variantKey).toBe('smarta');
    expect(unspecifiedResult.traditionLabel).toBe('unspecified');

    // Unsupported / ambiguous profile -> enters review (needs_review)
    const unknownResult = selectEkadashiVariant(candidates, 'invalid_profile_x');
    expect(unknownResult.status).toBe('needs_review');
    expect(unknownResult.selectedDate).toBeNull();
  });

  it('neither variant overwrites the other during evaluation or diagnostic generation', () => {
    const diags = calculateObservanceCandidateDiagnosticsForYear(2026)
      .filter(d => d.slug === 'yogini-ekadashi');

    expect(diags).toHaveLength(2);
    expect(diags[0].selectedDate).not.toBeNull();
    expect(diags[1].selectedDate).not.toBeNull();
    expect(diags[0].selectedDate).not.toBe(diags[1].selectedDate);
  }, TIMEOUT);
});
