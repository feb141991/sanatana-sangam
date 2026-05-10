export const APP_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pa', label: 'Punjabi' },
] as const;

export const SCRIPTURE_SCRIPT_OPTIONS = [
  { value: 'original', label: 'Original script first' },
  { value: 'transliteration', label: 'Transliteration first' },
  { value: 'both', label: 'Show both together' },
] as const;

export const MEANING_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English meaning' },
  { value: 'hi', label: 'Hindi meaning' },
  { value: 'pa', label: 'Punjabi meaning' },
] as const;

export const TRANSLITERATION_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English (Roman)' },
  { value: 'hi', label: 'Hindi (Devanagari)' },
] as const;

export function getLanguageLabel(options: readonly { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label ?? options[0].label;
}
