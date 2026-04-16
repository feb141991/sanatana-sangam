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

export function LanguageProvider({
  lang: serverLang,
  children,
}: {
  lang: AppLang;
  children: ReactNode;
}) {
  // Client-side state so language updates are instant without a server round-trip.
  // Initialised from the server-rendered value; syncs whenever the server sends
  // a new value (e.g. after router.refresh()).
  const [lang, setLangState] = useState<AppLang>(serverLang);

  useEffect(() => {
    setLangState(serverLang);
  }, [serverLang]);

  const value: LangContextValue = {
    lang,
    setLang: (newLang: AppLang) => setLangState(newLang),
    t: (key) => translateFn(lang, key),
  };
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Use inside any client component to get translations and change language. */
export function useLanguage() {
  return useContext(LangContext);
}
