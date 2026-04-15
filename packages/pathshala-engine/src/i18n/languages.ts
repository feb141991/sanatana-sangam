// ============================================================
// Supported languages for Pathshala
// ============================================================

import type { LanguageConfig } from '../types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्',
    script: 'Devanagari', rtl: false,
    scoringDimensions: ['uccharan', 'sandhi', 'visarga', 'laya', 'svara', 'fluency'],
  },
  {
    code: 'hi', name: 'Hindi', nativeName: 'हिंदी',
    script: 'Devanagari', rtl: false,
    scoringDimensions: ['uccharan', 'fluency', 'laya'],
  },
  {
    code: 'awa', name: 'Awadhi', nativeName: 'अवधी',
    script: 'Devanagari', rtl: false,
    scoringDimensions: ['uccharan', 'fluency', 'laya'],
  },
  {
    code: 'ta', name: 'Tamil', nativeName: 'தமிழ்',
    script: 'Tamil', rtl: false,
    scoringDimensions: ['uccharan', 'laya', 'fluency'],
  },
  {
    code: 'bn', name: 'Bengali', nativeName: 'বাংলা',
    script: 'Bengali', rtl: false,
    scoringDimensions: ['uccharan', 'fluency'],
  },
  {
    code: 'te', name: 'Telugu', nativeName: 'తెలుగు',
    script: 'Telugu', rtl: false,
    scoringDimensions: ['uccharan', 'fluency', 'laya'],
  },
  {
    code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ',
    script: 'Kannada', rtl: false,
    scoringDimensions: ['uccharan', 'fluency'],
  },
  {
    code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം',
    script: 'Malayalam', rtl: false,
    scoringDimensions: ['uccharan', 'fluency', 'laya'],
  },
  {
    code: 'mr', name: 'Marathi', nativeName: 'मराठी',
    script: 'Devanagari', rtl: false,
    scoringDimensions: ['uccharan', 'fluency', 'laya'],
  },
  {
    code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી',
    script: 'Gujarati', rtl: false,
    scoringDimensions: ['uccharan', 'fluency'],
  },
  {
    code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia', rtl: false,
    scoringDimensions: ['uccharan', 'fluency'],
  },
  {
    code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi', rtl: false,
    scoringDimensions: ['uccharan', 'fluency'],
  },
  {
    code: 'en', name: 'English', nativeName: 'English',
    script: 'Latin', rtl: false,
    scoringDimensions: ['fluency'],
  },
];

export const LANGUAGE_MAP = new Map(SUPPORTED_LANGUAGES.map(l => [l.code, l]));

export function getLanguage(code: string): LanguageConfig | undefined {
  return LANGUAGE_MAP.get(code);
}

export function getScoringDimensions(languageCode: string): string[] {
  return LANGUAGE_MAP.get(languageCode)?.scoringDimensions ?? ['uccharan', 'fluency'];
}

/** Languages that use Devanagari script */
export const DEVANAGARI_LANGUAGES = ['sa', 'hi', 'awa', 'mr', 'ne'];

/** Languages that have Vedic svara scoring */
export const VEDIC_SVARA_LANGUAGES = ['sa'];

/** Display name for a language code */
export function getLanguageName(code: string, useNative = false): string {
  const lang = LANGUAGE_MAP.get(code);
  if (!lang) return code.toUpperCase();
  return useNative ? lang.nativeName : lang.name;
}
