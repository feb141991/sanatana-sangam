import { type AppLang } from '@/lib/i18n/translations';
import { normalizeContentLanguage, resolveEffectiveMeaningLanguage, type AppContentLanguage } from '@/lib/language-runtime';

export type ReaderDisplayMode = 'en' | 'local';

export interface ReadablePreferencesInput {
  appLanguage?: string | null;
  meaningLanguage?: string | null;
  transliterationLanguage?: string | null;
  showTransliteration?: boolean | null;
  scriptureScript?: string | null;
}

export interface ReadablePreferences {
  appLanguage: AppLang;
  meaningLanguage: AppContentLanguage;
  effectiveMeaningLanguage: AppContentLanguage;
  transliterationLanguage: string;
  showTransliteration: boolean;
  scriptureScript: string;
  preferLocalLanguage: boolean;
}

function normalizeAppLanguage(value?: string | null): AppLang {
  return value === 'hi' || value === 'pa' ? value : 'en';
}

export function resolveReadablePreferences(
  input: ReadablePreferencesInput,
): ReadablePreferences {
  const appLanguage = normalizeAppLanguage(input.appLanguage);
  const meaningLanguage = normalizeContentLanguage(input.meaningLanguage);
  const effectiveMeaningLanguage = resolveEffectiveMeaningLanguage(appLanguage, meaningLanguage);

  return {
    appLanguage,
    meaningLanguage,
    effectiveMeaningLanguage,
    transliterationLanguage: input.transliterationLanguage ?? 'en',
    showTransliteration: input.showTransliteration ?? true,
    scriptureScript: input.scriptureScript ?? 'original',
    preferLocalLanguage: effectiveMeaningLanguage !== 'en',
  };
}

export function getInitialReaderDisplayMode(
  preferences: ReadablePreferences,
  hasLocalContent: boolean,
): ReaderDisplayMode {
  return hasLocalContent && preferences.preferLocalLanguage ? 'local' : 'en';
}

export type LocalContentLanguage = 'hi' | 'pa';

/**
 * Which actual language "local" content should render as, for readers
 * (like Dharm Veer) with genuine Hindi AND Punjabi content available.
 * Deliberately keyed to the VIEWER's own effectiveMeaningLanguage -- the
 * same signal preferLocalLanguage already uses to decide whether to show
 * local content at all -- never to a content item's own tradition/category.
 * (Dharm Veer previously keyed this off hero.tradition === 'sikh', which
 * showed Punjabi UI labels over Hindi data for Sikh heroes regardless of
 * the viewer's actual language, and Hindi regardless of a Punjabi-preferring
 * viewer's choice for every other tradition.)
 */
export function resolveLocalContentLanguage(preferences: ReadablePreferences): LocalContentLanguage {
  return preferences.effectiveMeaningLanguage === 'pa' ? 'pa' : 'hi';
}
