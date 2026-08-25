export const AGE_GUIDANCE_VERSION = '2026-08-25.parental-guidance-v1';

export const AGE_GUIDANCE_POLICY = {
  version: AGE_GUIDANCE_VERSION,
  accountAccess: 'allowed_without_age_block',
  guidanceAge: 18,
  directedToChildrenUnder13: false,
  verifiedParentalConsentImplemented: false,
  legalReviewStatus: 'pending',
  notice: {
    title: 'A note for younger seekers',
    body: 'If you are under 18, please continue with the awareness and guidance of a parent or guardian, especially when adding personal, birth, family, location, or community information.',
    under18Body: 'Because you are under 18, please continue with the awareness and guidance of a parent or guardian, especially when adding personal, birth, family, location, or community information.',
    familyBody: 'When adding birth or family information for someone under 18, do so only with the awareness and guidance of their parent or guardian.',
  },
  terms: [
    'Shoonaya is not directed to children under 13.',
    'If you are under 18, you should use Shoonaya with the awareness and guidance of a parent or guardian, especially when adding personal, birth, family, location, or community information.',
    'A parent or guardian should review the information a younger user chooses to provide and the privacy and community settings available in Shoonaya.',
  ],
  privacy: [
    'Shoonaya is not directed to children under 13. If you believe a child has provided personal data without appropriate authorization, contact us so we can review and remove it.',
    'Users under 18 are asked to use Shoonaya with the awareness and guidance of a parent or guardian, especially before providing birth, family, location, spiritual-profile, mood, reflection, or community information.',
    'Shoonaya currently provides parental-guidance notices rather than a verified parental-consent system. These notices do not establish that consent has been independently verified.',
  ],
} as const;

export function ageOnDate(dateOfBirth: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return null;

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  let age = todayYear - year;
  if (todayMonth < month || (todayMonth === month && todayDay < day)) age -= 1;
  return age >= 0 ? age : null;
}

export function isUnderGuidanceAge(dateOfBirth: string, today = new Date()): boolean {
  const age = ageOnDate(dateOfBirth, today);
  return age !== null && age < AGE_GUIDANCE_POLICY.guidanceAge;
}
