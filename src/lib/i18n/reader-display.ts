'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useReaderLabels } from '@/lib/i18n/reader-labels';
import type { AppContentLanguage } from '@/lib/language-runtime';

export interface ReaderLanguageOption {
  code: AppContentLanguage;
  label: string;
}

export const SUPPORTED_READER_LANGUAGE_CODES: AppContentLanguage[] = ['en', 'hi', 'pa'];

export interface TextSizePreset {
  scale: number;
  label: string;
}

export const READER_FONT_SCALES = [1.0, 1.2, 1.4, 1.6, 1.8];

export function useReaderDisplay(overrideLang?: AppContentLanguage) {
  const { t, lang } = useLanguage();
  const activeLang = overrideLang ?? lang;
  const labels = useReaderLabels(activeLang);

  const languages: ReaderLanguageOption[] = [
    { code: 'en', label: t(activeLang, 'langEn') },
    { code: 'hi', label: t(activeLang, 'langHi') },
    { code: 'pa', label: t(activeLang, 'langPa') }
  ];

  const fontPresets: TextSizePreset[] = [
    { scale: 1.0, label: t(activeLang, 'fontSizeSmall') },
    { scale: 1.2, label: t(activeLang, 'fontSizeNormal') },
    { scale: 1.4, label: t(activeLang, 'fontSizeLarge') },
    { scale: 1.6, label: t(activeLang, 'fontSizeExtraLarge') },
    { scale: 1.8, label: t(activeLang, 'fontSizeHuge') }
  ];

  return {
    labels: {
      ...labels,
      language: t(activeLang, 'language'),
      meaning: t(activeLang, 'meaning'),
      textSize: t(activeLang, 'textSize'),
      zoom: t(activeLang, 'zoom'),
      standardVoice: t(activeLang, 'standardVoice'),
      panditVoice: t(activeLang, 'panditVoice'),
      listen: t(activeLang, 'listen'),
      commentary: t(activeLang, 'commentary'),
      transliteration: t(activeLang, 'transliteration'),
    },
    languages,
    fontPresets,
  };
}

function clampFontStep(step: number, presetCount: number, fallbackStep: number) {
  if (presetCount <= 0) return 0;
  const safeFallback = Math.max(0, Math.min(fallbackStep, presetCount - 1));
  if (!Number.isFinite(step)) return safeFallback;
  return Math.max(0, Math.min(Math.trunc(step), presetCount - 1));
}

interface ReaderDisplayPreferencesOptions {
  resolvedLanguage: AppContentLanguage;
  initialFontStep?: number;
}

export function useReaderDisplayPreferences({
  resolvedLanguage,
  initialFontStep = 2,
}: ReaderDisplayPreferencesOptions) {
  const [language, setLanguageState] = useState<AppContentLanguage>(resolvedLanguage);
  const [hasLanguageOverride, setHasLanguageOverride] = useState(false);
  const { labels, languages, fontPresets } = useReaderDisplay(language);
  const [rawFontStep, setRawFontStep] = useState(initialFontStep);

  useEffect(() => {
    if (!hasLanguageOverride) {
      setLanguageState(resolvedLanguage);
    }
  }, [hasLanguageOverride, resolvedLanguage]);

  const fontStep = clampFontStep(rawFontStep, fontPresets.length, initialFontStep);
  const fontScale = fontPresets[fontStep]?.scale ?? READER_FONT_SCALES[2];

  useEffect(() => {
    if (rawFontStep !== fontStep) {
      setRawFontStep(fontStep);
    }
  }, [fontStep, rawFontStep]);

  const setLanguage = useCallback((nextLanguage: AppContentLanguage) => {
    setHasLanguageOverride(true);
    setLanguageState(nextLanguage);
  }, []);

  const resetLanguage = useCallback(() => {
    setHasLanguageOverride(false);
    setLanguageState(resolvedLanguage);
  }, [resolvedLanguage]);

  const setFontStep = useCallback((nextStep: number | ((current: number) => number)) => {
    setRawFontStep((currentStep) => {
      const resolvedStep = typeof nextStep === 'function' ? nextStep(currentStep) : nextStep;
      return clampFontStep(resolvedStep, fontPresets.length, currentStep);
    });
  }, [fontPresets.length]);

  return {
    language,
    setLanguage,
    resetLanguage,
    hasLanguageOverride,
    labels,
    languages,
    fontPresets,
    fontStep,
    setFontStep,
    fontScale,
  };
}
