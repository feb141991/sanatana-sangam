export const RELIGIOUS_PROFILE_CONSENT = {
  status: 'pending_approval',
  purposeVersion: null,
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

export const LEGAL_DOCUMENTS = {
  status: 'pending_approval',
  termsVersion: null,
  privacyNoticeVersion: null,
  reacceptanceRule: null,
} as const;

export function assertAgePolicyApproved(): never {
  throw new Error('AGE_POLICY_NOT_APPROVED');
}
