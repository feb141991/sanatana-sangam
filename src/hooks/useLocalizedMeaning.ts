'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getMeaningLabel,
  normalizeContentLanguage,
  type AppContentLanguage,
} from '@/lib/language-runtime';

type Status = 'idle' | 'loading' | 'localized' | 'fallback' | 'error';

interface UseLocalizedMeaningArgs {
  entryId?: string | null;
  sourceMeaning?: string | null;
  sourceLabel?: string | null;
  targetLanguage?: string | null;
  providedMeaning?: string | null;
  enabled?: boolean;
}

const memoryCache = new Map<string, string>();

function cacheKey(entryId: string, language: AppContentLanguage) {
  return `${language}:${entryId}`;
}

export function useLocalizedMeaning({
  entryId,
  sourceMeaning,
  sourceLabel,
  targetLanguage,
  providedMeaning,
  enabled = true,
}: UseLocalizedMeaningArgs) {
  const language = normalizeContentLanguage(targetLanguage);
  const baseMeaning = sourceMeaning ?? '';
  const directMeaning = language === 'en' ? baseMeaning : providedMeaning;
  const key = entryId ? cacheKey(entryId, language) : null;
  const cachedMeaning = key ? memoryCache.get(key) : undefined;

  const [meaning, setMeaning] = useState(directMeaning ?? cachedMeaning ?? baseMeaning);
  const [status, setStatus] = useState<Status>(() => {
    if (language === 'en') return 'idle';
    if (directMeaning || cachedMeaning) return 'localized';
    return 'idle';
  });

  useEffect(() => {
    if (!enabled || !entryId || !baseMeaning || language === 'en') {
      setMeaning(directMeaning ?? baseMeaning);
      setStatus('idle');
      return;
    }

    if (directMeaning) {
      setMeaning(directMeaning);
      setStatus('localized');
      return;
    }

    const cached = memoryCache.get(cacheKey(entryId, language));
    if (cached) {
      setMeaning(cached);
      setStatus('localized');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setMeaning(baseMeaning);
    setStatus('loading');

    fetch('/api/i18n/meaning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        entryId,
        sourceMeaning: baseMeaning,
        sourceLabel,
        targetLanguage: language,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Meaning localization failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        const localized = typeof data?.meaning === 'string' ? data.meaning.trim() : '';
        if (!cancelled && localized) {
          memoryCache.set(cacheKey(entryId, language), localized);
          setMeaning(localized);
          setStatus(data?.status === 'fallback' ? 'fallback' : 'localized');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMeaning(baseMeaning);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseMeaning, directMeaning, enabled, entryId, language, sourceLabel]);

  return useMemo(() => ({
    meaning,
    language,
    label: getMeaningLabel(language),
    isLoading: status === 'loading',
    status,
  }), [language, meaning, status]);
}
