'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { type AppLang, type TranslationKey, t as translateFn } from './translations';

interface LangContextValue {
  lang: AppLang;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  t: (key) => translateFn('en', key),
});

export function LanguageProvider({
  lang,
  children,
}: {
  lang: AppLang;
  children: ReactNode;
}) {
  const value: LangContextValue = {
    lang,
    t: (key) => translateFn(lang, key),
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Use inside any client component to get translations. */
export function useLanguage() {
  return useContext(LangContext);
}
