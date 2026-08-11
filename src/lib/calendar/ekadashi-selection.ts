/**
 * ekadashi-selection.ts
 *
 * Read-time selection helper for Ekadashi variants based on tradition profile / ekadashi_method.
 *
 * Requirements:
 * - Smarta profile selects 07-10 (smarta variant).
 * - Vaishnava method selects 07-11 (vaishnava_vidhava variant).
 * - unspecified follows the approved product rule for Smarta behavior but remains labelled "unspecified".
 * - unsupported/ambiguous profiles enter review (status: 'needs_review') rather than receiving a silent default.
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

/** Supported tradition profiles and their ekadashi_method mapping */
const KNOWN_PROFILES: Record<string, 'smarta' | 'vaishnava_suddha' | 'unspecified'> = {
  smarta: 'smarta',
  shaiva: 'smarta',
  shakta: 'smarta',
  gaudiya_iskcon: 'vaishnava_suddha',
  sri_vaishnava: 'vaishnava_suddha',
  swaminarayan: 'vaishnava_suddha',
  unspecified: 'unspecified',
};

export function selectEkadashiVariant(
  candidates: EkadashiVariantCandidate[],
  profileOrTradition: string | { tradition?: string; ekadashi_method?: string; sampradaya?: string } | null | undefined
): EkadashiSelectionResult {
  if (!candidates || candidates.length === 0) {
    return {
      selectedVariant: null,
      selectedDate: null,
      traditionLabel: 'unspecified',
      status: 'unsupported',
      reviewReason: 'No candidate variants provided',
    };
  }

  // Single candidate — no selection ambiguity
  if (candidates.length === 1) {
    return {
      selectedVariant: candidates[0],
      selectedDate: candidates[0].date,
      traditionLabel: candidates[0].variantKey,
      status: 'resolved',
    };
  }

  // Resolve method from input
  let method: 'smarta' | 'vaishnava_suddha' | 'unspecified' | 'unsupported' = 'unsupported';
  let inputLabel = 'unspecified';

  if (typeof profileOrTradition === 'string') {
    inputLabel = profileOrTradition;
    if (profileOrTradition in KNOWN_PROFILES) {
      method = KNOWN_PROFILES[profileOrTradition];
    } else if (profileOrTradition === 'smarta' || profileOrTradition === 'vaishnava_suddha') {
      method = profileOrTradition;
    }
  } else if (profileOrTradition && typeof profileOrTradition === 'object') {
    if (profileOrTradition.ekadashi_method === 'smarta' || profileOrTradition.ekadashi_method === 'vaishnava_suddha') {
      method = profileOrTradition.ekadashi_method;
      inputLabel = profileOrTradition.sampradaya || profileOrTradition.tradition || method;
    } else {
      const trad = profileOrTradition.sampradaya || profileOrTradition.tradition || '';
      if (trad in KNOWN_PROFILES) {
        method = KNOWN_PROFILES[trad];
        inputLabel = trad;
      }
    }
  }

  if (method === 'smarta') {
    const smartaCandidate = candidates.find(c => c.variantKey === 'smarta');
    if (smartaCandidate) {
      return {
        selectedVariant: smartaCandidate,
        selectedDate: smartaCandidate.date,
        traditionLabel: inputLabel || 'smarta',
        status: 'resolved',
      };
    }
  } else if (method === 'vaishnava_suddha') {
    const vaishnavaCandidate = candidates.find(c => c.variantKey === 'vaishnava_vidhava' || c.variantKey === 'vaishnava');
    if (vaishnavaCandidate) {
      return {
        selectedVariant: vaishnavaCandidate,
        selectedDate: vaishnavaCandidate.date,
        traditionLabel: inputLabel || 'vaishnava_suddha',
        status: 'resolved',
      };
    }
  } else if (method === 'unspecified') {
    const smartaCandidate = candidates.find(c => c.variantKey === 'smarta') ?? candidates[0];
    return {
      selectedVariant: smartaCandidate,
      selectedDate: smartaCandidate.date,
      traditionLabel: 'unspecified',
      status: 'resolved',
    };
  }

  // Unsupported or ambiguous profile enters review rather than receiving a silent default
  return {
    selectedVariant: null,
    selectedDate: null,
    traditionLabel: inputLabel || 'unknown',
    status: 'needs_review',
    reviewReason: `Unsupported or ambiguous profile "${inputLabel}" for Ekadashi selection`,
  };
}
