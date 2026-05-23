export type AppContentLanguage = 'en' | 'hi' | 'pa';

export function normalizeContentLanguage(value?: string | null): AppContentLanguage {
  return value === 'hi' || value === 'pa' ? value : 'en';
}

export function resolveEffectiveMeaningLanguage(
  appLanguage?: string | null,
  meaningLanguage?: string | null,
): AppContentLanguage {
  const requestedMeaning = normalizeContentLanguage(meaningLanguage);
  if (requestedMeaning !== 'en') return requestedMeaning;
  return normalizeContentLanguage(appLanguage);
}

export function getMeaningLabel(language?: string | null): string {
  switch (normalizeContentLanguage(language)) {
    case 'hi':
      return 'अर्थ';
    case 'pa':
      return 'ਅਰਥ';
    default:
      return 'Meaning';
  }
}

export function getLanguageInstruction(language?: string | null): string {
  switch (normalizeContentLanguage(language)) {
    case 'hi':
      return "Respond entirely in Hindi. Do not use English unless language is 'en'.";
    case 'pa':
      return "Respond entirely in Punjabi. Do not use English unless language is 'en'.";
    default:
      return 'Respond in clear, warm English.';
  }
}
