/**
 * Retrieval-side query language handling for Dharma Mitra chat.
 *
 * The scripture indexes, the dharmic-intent gate and the source-family term
 * lists are all English, and the dense embedding model (all-MiniLM-L6-v2) is
 * English-only, so Hindi and Punjabi questions were never grounded. Before
 * retrieval, a Hindi (Devanagari or romanised) or Punjabi (Gurmukhi) question
 * is translated to English with Sarvam. Only the retrieval query changes: the
 * model still receives the user's original message and replies in their
 * language. Any translation failure falls back to the original text, which is
 * the previous behaviour.
 */
import { generateSarvamTranslation, type SarvamTranslateRequest } from './providers/sarvam-translate';

export type QueryLanguage = 'en' | 'hi' | 'hi-latn' | 'pa';

const DEVANAGARI = /[ऀ-ॿ]/g;
const GURMUKHI = /[਀-੿]/g;

// Distinctive romanised-Hindi function words. Words that are also common in
// English ("to", "me", "man", "the") are deliberately excluded.
const ROMANISED_HINDI_MARKERS = new Set([
  'mein', 'mai', 'ka', 'ki', 'ke', 'ko', 'hai', 'hain', 'kya', 'kaise', 'kyun', 'kyon', 'nahi', 'nahin',
  'aur', 'baare', 'karna', 'karne', 'karun', 'karoon', 'kaha', 'gaya', 'gayi', 'apne', 'apna', 'apni',
  'bhi', 'tha', 'thi', 'raha', 'rahe', 'rahi', 'chahiye', 'liye', 'sakta', 'sakte', 'sakti', 'hota',
  'hoti', 'jaata', 'jata', 'kar', 'mujhe', 'humein', 'hamein', 'aap', 'tum', 'kab', 'kahan', 'kaun',
  'anusaar', 'anusar', 'matlab', 'arth', 'batao', 'bataiye', 'samjhao',
]);

const SARVAM_SOURCE: Record<Exclude<QueryLanguage, 'en'>, string> = {
  hi: 'hi-IN',
  'hi-latn': 'hi-IN',
  pa: 'pa-IN',
};

export function detectQueryLanguage(text: string): QueryLanguage {
  const devanagari = text.match(DEVANAGARI)?.length ?? 0;
  const gurmukhi = text.match(GURMUKHI)?.length ?? 0;
  if (gurmukhi > 0 && gurmukhi >= devanagari) return 'pa';
  if (devanagari > 0) return 'hi';

  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length === 0) return 'en';
  const markers = new Set(words.filter((word) => ROMANISED_HINDI_MARKERS.has(word)));
  const markerShare = words.filter((word) => ROMANISED_HINDI_MARKERS.has(word)).length / words.length;
  return markers.size >= 2 && markerShare >= 0.2 ? 'hi-latn' : 'en';
}

export type RetrievalQuery = {
  /** Text to run the intent gate, source routing and retrieval on. */
  text: string;
  language: QueryLanguage;
  translated: boolean;
  /** Set when translation was needed but failed and the original text is used. */
  fallbackReason?: string;
};

type Translate = (apiKey: string, request: SarvamTranslateRequest) => Promise<string>;

const CACHE_LIMIT = 500;
const cache = new Map<string, string>();

function remember(key: string, value: string): void {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  cache.set(key, value);
}

/** Test hook: clear the in-process translation cache. */
export function clearRetrievalQueryCache(): void {
  cache.clear();
}

export async function toRetrievalQuery(
  message: string,
  options: { apiKey: string | undefined; translate?: Translate; timeoutMs?: number },
): Promise<RetrievalQuery> {
  const language = detectQueryLanguage(message);
  if (language === 'en') return { text: message, language, translated: false };
  if (!options.apiKey) return { text: message, language, translated: false, fallbackReason: 'missing_api_key' };

  const cacheKey = `${language}\u0000${message}`;
  const cached = cache.get(cacheKey);
  if (cached) return { text: cached, language, translated: true };

  const translate = options.translate ?? generateSarvamTranslation;
  const timeoutMs = options.timeoutMs ?? 3000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const translated = await Promise.race([
      translate(options.apiKey, { input: message, source_language_code: SARVAM_SOURCE[language], target_language_code: 'en-IN' }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    const text = typeof translated === 'string' ? translated.trim() : '';
    if (!text) return { text: message, language, translated: false, fallbackReason: 'empty_translation' };
    remember(cacheKey, text);
    return { text, language, translated: true };
  } catch (error) {
    const reason = error instanceof Error && error.message === 'timeout' ? 'timeout' : 'translation_error';
    return { text: message, language, translated: false, fallbackReason: reason };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
