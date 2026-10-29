/**
 * Dharma Mitra answers must survive being asked twice.
 *
 * A language model asked the same question twice can answer differently, and people act on this guidance (a wedding,
 * a purchase, a practice). Three things made the chat vary, and this file is the third fix:
 *
 *   1. Sampling: the provider default (temperature 0.3) let the wording drift. Chat now asks for temperature 0.
 *   2. Decision questions ("which day should we marry?") are answered by a fixed policy text, not generated
 *      (decision-intent.ts).
 *   3. Even at temperature 0 a hosted model is not guaranteed to repeat itself word for word, so the first answer to a
 *      question is remembered and given again for the same person, the same question and the same context.
 *
 * Privacy: the question and context are represented in storage by a SHA-256 cache key, not retained as plaintext.
 * The answer text is stored per person and may repeat details they supplied. Rows are deleted with the account
 * (ON DELETE CASCADE) and after CHAT_ANSWER_TTL_MS.
 */
import { createHash } from 'node:crypto';

export const CHAT_TEMPERATURE = 0;
export const CHAT_ANSWER_TTL_MS = 14 * 24 * 60 * 60 * 1000;
/**
 * Bump when a grounding corpus is re-indexed or its approved content changes, so answers built on the old text are not
 * repeated. (The prompt wording and the model are part of the key automatically.) The 14-day expiry is the backstop.
 */
export const GROUNDING_CORPUS_VERSION = '2026-10-29';

const TABLE = 'ai_chat_answer_cache';

/** Case, spacing and trailing punctuation do not make a different question. */
export function normalizeQuestionText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s'"“”‘’]+/u, '')
    .replace(/[\s?!.।॥,;:'"“”‘’]+$/u, '')
    .trim();
}

/**
 * A question whose answer depends on today ("when is the next ekadashi", "aaj kya hai") is remembered only for the
 * same day; a timeless one ("what does Om mean") is remembered across days so it does not change on Tuesday.
 */
export function isDateRelative(text: string): boolean {
  const t = normalizeQuestionText(text);
  return (
    /\b(today|tonight|tomorrow|yesterday|now|currently|current|this (?:week|month|year|season|evening|morning)|next|upcoming|coming|soon|ahead|when|date|aaj|kal|abhi)\b/.test(t) ||
    /(आज|कल|अभी|इस (?:सप्ताह|महीने|साल)|आने वाले|अगला|अगली|कब|तिथि|ਅੱਜ|ਕੱਲ੍ਹ|ਹੁਣ|ਆਉਣ ਵਾਲੇ|ਕਦੋਂ|ਤਾਰੀਖ਼)/u.test(t)
  );
}

export interface AnswerKeyInput {
  userId: string;
  /** The whole conversation as the model sees it: recent turns plus the new message. */
  conversation: string;
  language: string | null;
  meaningLanguage: string | null;
  transliterationLanguage: string | null;
  tradition: string | null;
  rank: string | null;
  sampradaya: string | null;
  city: string | null;
  country: string | null;
  seeking: readonly string[];
  spiritualDate: string;
  /** A hash of the system prompt wording with fixed inputs: changes when the prompt text changes. */
  promptFingerprint: string;
  corpusVersion: string;
  model: string;
}

const clean = (v: string | null | undefined): string | null => (v ? v.normalize('NFKC').trim().toLowerCase() || null : null);

/** The same person, question and context give the same key; any change to what shapes the answer changes it. */
export function buildAnswerCacheKey(input: AnswerKeyInput): string {
  const canonical = JSON.stringify({
    v: 1,
    user: input.userId,
    q: normalizeQuestionText(input.conversation),
    lang: clean(input.language) ?? 'en',
    meaning: clean(input.meaningLanguage) ?? 'en',
    translit: clean(input.transliterationLanguage) ?? 'en',
    tradition: clean(input.tradition),
    rank: clean(input.rank),
    sampradaya: clean(input.sampradaya),
    city: clean(input.city),
    country: clean(input.country),
    seeking: [...input.seeking].map((s) => clean(s) ?? '').filter(Boolean).sort(),
    date: isDateRelative(input.conversation) ? input.spiritualDate : null,
    prompt: input.promptFingerprint,
    corpus: input.corpusVersion,
    model: input.model,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export function fingerprintText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/** The few database calls used here; a Supabase client satisfies it, and so does a test double. */
export type AnswerCacheDb = { from(table: string): any };
export interface CachedAnswer { answer: string; provider: string | null; model: string | null }

/** Reads a remembered answer. Any failure is a miss: the chat must still answer when the memory is unavailable. */
export async function readCachedAnswer(db: AnswerCacheDb, userId: string, key: string, now: Date = new Date()): Promise<CachedAnswer | null> {
  try {
    const { data, error } = await db
      .from(TABLE)
      .select('answer, provider, model')
      .eq('user_id', userId)
      .eq('cache_key', key)
      .gt('expires_at', now.toISOString())
      .maybeSingle();
    if (error) {
      console.warn('[ai/chat] answer cache read failed', error.code);
      return null;
    }
    return data && typeof data.answer === 'string' && data.answer.length > 0
      ? { answer: data.answer, provider: data.provider ?? null, model: data.model ?? null }
      : null;
  } catch (err) {
    console.warn('[ai/chat] answer cache read failed', err instanceof Error ? err.name : typeof err);
    return null;
  }
}

/**
 * Remembers an answer and returns the one that is remembered. The first writer wins: if two identical requests race,
 * both end up giving the same text, the stored one.
 */
export async function rememberAnswer(
  db: AnswerCacheDb,
  input: { userId: string; key: string; answer: string; provider: string | null; model: string | null; promptFingerprint: string; corpusVersion: string },
  now: Date = new Date(),
): Promise<CachedAnswer> {
  const generated: CachedAnswer = { answer: input.answer, provider: input.provider, model: input.model };
  if (!input.answer.trim() || input.answer.length > 8000) return generated;
  try {
    // Expired rows would otherwise hold the key and keep a fresh answer from being stored.
    await db.from(TABLE).delete().eq('user_id', input.userId).lt('expires_at', now.toISOString());
    const { error } = await db.from(TABLE).upsert(
      {
        user_id: input.userId,
        cache_key: input.key,
        answer: input.answer,
        provider: input.provider,
        model: input.model,
        prompt_fingerprint: input.promptFingerprint,
        corpus_version: input.corpusVersion,
        created_at: now.toISOString(),
        expires_at: new Date(now.getTime() + CHAT_ANSWER_TTL_MS).toISOString(),
      },
      { onConflict: 'user_id,cache_key', ignoreDuplicates: true },
    );
    if (error) {
      console.warn('[ai/chat] answer cache write failed', error.code);
      return generated;
    }
    return (await readCachedAnswer(db, input.userId, input.key, now)) ?? generated;
  } catch (err) {
    console.warn('[ai/chat] answer cache write failed', err instanceof Error ? err.name : typeof err);
    return generated;
  }
}
