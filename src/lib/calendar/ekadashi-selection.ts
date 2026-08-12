/**
 * ekadashi-selection.ts
 *
 * Read-time selection helper for Ekadashi variants based on tradition profile / ekadashi_method.
 *
 * Requirements:
 * - Delete KNOWN_PROFILES and every duplicate tradition-to-method map.
 * - Resolve ekadashi_method from persisted tradition_profiles policy.
 * - Smarta profile selects 07-10 (smarta variant).
 * - Vaishnava method selects 07-11 (vaishnava_vidhava variant).
 * - unspecified follows the approved product rule for Smarta behavior but remains labelled "unspecified".
 * - Single candidate sets check applicability to the user's method (no silent fallback).
 * - Missing required variant or unsupported/ambiguous profile returns needs_review without candidate[0] fallback.
 * - Candidate order in array must not affect selection.
 */

export interface EkadashiVariantCandidate {
  variantKey: string;
  date: string;
  ruleKey?: string;
  displayName?: string;
}

export interface EkadashiSelectionResult {
  selectedVariant: EkadashiVariantCandidate | null;
  selectedDate: string | null;
  traditionLabel: string;
  status: 'resolved' | 'needs_review' | 'unsupported';
  reviewReason?: string;
}

export type TraditionVariantMethod =
  | 'smarta'
  | 'vaishnava_suddha'
  | 'smarta_nishita'
  | 'vaishnava_rohini'
  | 'unknown'
  | string;

/**
 * Resolves a Smarta/Vaishnava variant from a persisted tradition policy.
 * The caller supplies the policy field appropriate to the observance; this is
 * important because Janmashtami is governed by `janmashtami_method`, not by
 * the user's Ekadashi policy.
 */
export function selectTraditionVariant(
  candidates: EkadashiVariantCandidate[],
  methodInput: TraditionVariantMethod,
  displayedLabel?: string,
  observanceLabel = 'observance',
): EkadashiSelectionResult {
  const label = displayedLabel || (typeof methodInput === 'string' ? methodInput : 'unspecified');

  if (!candidates || candidates.length === 0) {
    return {
      selectedVariant: null,
      selectedDate: null,
      traditionLabel: label,
      status: 'unsupported',
      reviewReason: 'No candidate variants provided',
    };
  }

  const usesSmarta = methodInput === 'smarta' || methodInput === 'smarta_nishita';
  const usesVaishnava = methodInput === 'vaishnava_suddha' || methodInput === 'vaishnava_rohini';

  if (usesSmarta) {
    const selectedVariant = candidates.find(candidate => candidate.variantKey === 'smarta');
    return selectedVariant
      ? {
          selectedVariant,
          selectedDate: selectedVariant.date,
          traditionLabel: label,
          status: 'resolved',
        }
      : {
          selectedVariant: null,
          selectedDate: null,
          traditionLabel: label,
          status: 'needs_review',
          reviewReason: `Smarta candidate missing for ${observanceLabel} profile "${label}"`,
        };
  }

  if (usesVaishnava) {
    const selectedVariant = candidates.find(candidate =>
      candidate.variantKey === 'vaishnava_vidhava' ||
      candidate.variantKey === 'vaishnava' ||
      candidate.variantKey === 'gaudiya_iskcon' ||
      candidate.variantKey === 'sri_vaishnava' ||
      candidate.variantKey === 'swaminarayan',
    );
    return selectedVariant
      ? {
          selectedVariant,
          selectedDate: selectedVariant.date,
          traditionLabel: label,
          status: 'resolved',
        }
      : {
          selectedVariant: null,
          selectedDate: null,
          traditionLabel: label,
          status: 'needs_review',
          reviewReason: `Vaishnava candidate missing for ${observanceLabel} profile "${label}"`,
        };
  }

  return {
    selectedVariant: null,
    selectedDate: null,
    traditionLabel: label,
    status: 'needs_review',
    reviewReason: `Unsupported or ambiguous profile "${label}" for ${observanceLabel} selection`,
  };
}

export function selectEkadashiVariant(
  candidates: EkadashiVariantCandidate[],
  methodInput: TraditionVariantMethod,
  displayedLabel?: string,
): EkadashiSelectionResult {
  return selectTraditionVariant(
    candidates,
    methodInput,
    displayedLabel ?? (typeof methodInput === 'string' ? methodInput : 'unspecified'),
    'Ekadashi',
  );
}
