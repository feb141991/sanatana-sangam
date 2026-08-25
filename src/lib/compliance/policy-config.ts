import { TERMS_VERSION } from '@/lib/terms-content';
import { PRIVACY_VERSION } from '@/lib/privacy-content';

// Enforcement (suppress-only, not deletion) is live in the two highest-value
// personalization surfaces -- src/app/api/home/personalise/route.ts and
// src/app/api/ai/chat/route.ts both fall back to tradition-neutral defaults
// when consent_religious_data is false, instead of using the stored fields.
// What's still pending: an approved lawful basis / Article 9 condition and
// purpose-specific consent copy (this is a mechanism, not a legal opinion on
// sufficiency), and a downstream rule for what withdrawal does to fields not
// covered by any personalization surface (e.g. gotra/kul_devata, which are
// stored but not read by either gated route today).
export const RELIGIOUS_PROFILE_CONSENT = {
  status: 'suppress_enforced_lawful_basis_pending',
  purposeVersion: null,
  withdrawalBehavior: 'suppress_from_personalization_not_deleted',
  enforcedSurfaces: [
    'src/app/api/home/personalise/route.ts',
    'src/app/api/ai/chat/route.ts',
  ],
  coveredFields: [
    'tradition',
    'sampradaya',
    'gotra',
    'kul_devata',
    'ishta_devata',
    'rashi',
    'nakshatra',
    'spiritual_level',
  ],
} as const;

export const AGE_POLICY = {
  status: 'founder_approved_pending_legal_review',
  version: '2026-08-25.parental-guidance-v1',
  targetMarkets: ['global'],
  minimumAccountHolderAge: null,
  parentalConsentMode: 'soft_parental_guidance_notice',
  unknownRegionBehavior: 'allow_with_parental_guidance_notice',
  blocksAccountCreation: false,
  verifiedParentalConsentImplemented: false,
} as const;

// The acceptance-recording MECHANISM is implemented and enforced (versioned
// receipts stored in legal_acceptances, recorded at every web signup path --
// email, Google, Apple). What's still pending is legal review of the
// document TEXT itself (controller entity/address, per-purpose lawful
// basis, concrete retention periods -- see LEGAL_RISK_ASSESSMENT.md L-07)
// and building the UI that prompts an *existing* user to re-accept when the
// version they're on falls behind TERMS_VERSION/PRIVACY_VERSION.
export const LEGAL_DOCUMENTS = {
  status: 'mechanism_implemented_content_pending_legal_review',
  termsVersion: TERMS_VERSION,
  privacyNoticeVersion: PRIVACY_VERSION,
  reacceptanceRule: 'material_change',
  reacceptancePromptImplemented: false,
} as const;

export function assertAgePolicyApproved(): never {
  throw new Error('AGE_POLICY_NOT_APPROVED');
}
