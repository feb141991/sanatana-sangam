export const NAME_STORY_TRADITIONS = ['hindu', 'sikh', 'buddhist', 'jain', 'all'] as const;
export type NameStoryTradition = typeof NAME_STORY_TRADITIONS[number];

export const NAME_STORY_TRANSLATION_LANGUAGES = [
  'hi',
  'en',
  'pa',
  'mr',
  'bn',
  'ta',
  'te',
  'gu',
  'kn',
  'ml',
  'or',
  'as',
] as const;
export type NameStoryTranslationLanguage = typeof NAME_STORY_TRANSLATION_LANGUAGES[number];

export const NAME_STORY_INTENTS = [
  'sacred_meaning',
  'scripture_connection',
  'inner_quality',
  'name_mantra',
  'daily_practice',
  'family_lineage',
] as const;
export type NameStoryIntent = typeof NAME_STORY_INTENTS[number];

export const NAME_STORY_SOURCE_CONFIDENCE = ['classical', 'interpretive', 'uncertain'] as const;
export type NameStorySourceConfidence = typeof NAME_STORY_SOURCE_CONFIDENCE[number];

const SURROUNDING_PUNCTUATION = /^[\s"'“”‘’`.,;:!?()[\]{}<>|/\\-]+|[\s"'“”‘’`.,;:!?()[\]{}<>|/\\-]+$/g;

export function normalizeFirstName(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, ' ');
  if (!collapsed) return '';

  const firstToken = collapsed.split(' ').find((token) => token.replace(SURROUNDING_PUNCTUATION, '').length > 0) ?? '';
  return firstToken.replace(SURROUNDING_PUNCTUATION, '');
}

export function isNameStoryTradition(value: unknown): value is NameStoryTradition {
  return typeof value === 'string' && NAME_STORY_TRADITIONS.includes(value as NameStoryTradition);
}

export function isNameStoryTranslationLanguage(value: unknown): value is NameStoryTranslationLanguage {
  return typeof value === 'string' && NAME_STORY_TRANSLATION_LANGUAGES.includes(value as NameStoryTranslationLanguage);
}

export function isNameStoryIntent(value: unknown): value is NameStoryIntent {
  return typeof value === 'string' && NAME_STORY_INTENTS.includes(value as NameStoryIntent);
}

export function isNameStorySourceConfidence(value: unknown): value is NameStorySourceConfidence {
  return typeof value === 'string' && NAME_STORY_SOURCE_CONFIDENCE.includes(value as NameStorySourceConfidence);
}

export function defaultNameStoryTranslationLanguage(
  tradition: NameStoryTradition,
): NameStoryTranslationLanguage {
  if (tradition === 'sikh') return 'pa';
  if (tradition === 'hindu') return 'hi';
  return 'en';
}
