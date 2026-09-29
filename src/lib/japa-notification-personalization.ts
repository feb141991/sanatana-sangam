/**
 * Builds a short, optional greeting for the Japa reminder template.
 * Personalization is intentionally limited to English Japa reminders; other
 * languages keep the existing generic copy until translated templates exist.
 */
export function buildJapaNotificationGreeting(
  fullName: string | null | undefined,
  appLanguage: string | null | undefined
): string {
  if (appLanguage?.trim().toLowerCase() !== 'en') return '';

  const cleanedName = fullName
    ?.normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  const firstName = cleanedName?.split(' ')[0];

  if (
    !firstName ||
    Array.from(firstName).length > 32 ||
    firstName.includes('@') ||
    !/[\p{L}\p{N}]/u.test(firstName)
  ) {
    return '';
  }

  return `Hi ${firstName}. `;
}
