'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type AppLang, type TranslationKey, t as translateFn } from './translations';

interface LangContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: {
    (key: TranslationKey, overrideLang?: AppLang): string;
    (lang: AppLang, key: TranslationKey): string;
  };
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (arg1: any, arg2?: any) => {
    if (arg2) {
      // Two arguments provided: could be (key, lang) or (lang, key)
      const VALID_LANGS: AppLang[] = ['en', 'hi', 'pa'];
      if (VALID_LANGS.includes(arg1)) return translateFn(arg1, arg2);
      return translateFn(arg2, arg1);
    }
    return translateFn('en', arg1);
  },
});

const LANG_STORAGE_KEY = 'shoonaya-app-lang';
const VALID_LANGS: AppLang[] = ['en', 'hi', 'pa'];

export function LanguageProvider({
  lang: serverLang,
  children,
}: {
  lang: AppLang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<AppLang>(serverLang);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as AppLang | null;
      if (stored && VALID_LANGS.includes(stored)) {
        setLangState(stored);
        return;
      }
    } catch { /* ignore */ }
    setLangState(serverLang);
  }, [serverLang]);

  const setLang = (newLang: AppLang) => {
    setLangState(newLang);
    try { localStorage.setItem(LANG_STORAGE_KEY, newLang); } catch { /* ignore */ }
  };

  const tValue = (arg1: any, arg2?: any) => {
    if (arg2) {
      if (VALID_LANGS.includes(arg1)) return translateFn(arg1, arg2);
      return translateFn(arg2, arg1);
    }
    return translateFn(lang, arg1);
  };

  const value: LangContextValue = {
    lang,
    setLang,
    t: tValue as any,
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Use inside any client component to get translations and change language. */
export function useLanguage() {
  return useContext(LangContext);
}
