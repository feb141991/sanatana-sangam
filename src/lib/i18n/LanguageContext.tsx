'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type AppLang, type TranslationKey, t as translateFn } from './translations';

interface LangContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translateFn('en', key),
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
  // Client-side state initialised from the server-rendered profile value.
  // On hydration we prefer the locally-stored preference so the language
  // survives page reloads without a round-trip to the database.
  const [lang, setLangState] = useState<AppLang>(serverLang);

  // After hydration: read localStorage. Local preference wins over serverLang
  // so the UI stays in the user's chosen language even if the DB hasn't synced.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as AppLang | null;
      if (stored && VALID_LANGS.includes(stored)) {
        setLangState(stored);
        return;
      }
    } catch { /* localStorage unavailable */ }
    // Fall back to whatever the server sent
    setLangState(serverLang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = (newLang: AppLang) => {
    setLangState(newLang);
    try { localStorage.setItem(LANG_STORAGE_KEY, newLang); } catch { /* ignore */ }
  };

  const value: LangContextValue = {
    lang,
    setLang,
    t: (key) => translateFn(lang, key),
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Use inside any client component to get translations and change language. */
export function useLanguage() {
  return useContext(LangContext);
}
