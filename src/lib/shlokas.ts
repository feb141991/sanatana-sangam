import { localSpiritualDate, resolveTimeZone } from '@/lib/sacred-time';
import { HINDU_SHLOKAS } from './sacred-texts/hindu';

export interface Shloka {
  id: number;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  meaning_hi?: string;
  source: string;
}

/**
 * 365 key Hindu shlokas for daily rotation across the entire year without repetition.
 * Sourced from Bhagavad Gita, Principal Upanishads, Chanakya Niti, and classical Subhashitas.
 */
export const SHLOKAS: Shloka[] = HINDU_SHLOKAS.map((s) => ({
  id: s.id,
  sanskrit: s.original,
  transliteration: s.transliteration,
  meaning: s.meaning,
  meaning_hi: s.meaning_hi,
  source: s.source,
}));

export const CHANAKYA_SHLOKAS: Shloka[] = SHLOKAS.filter((s) =>
  s.source.includes('Chanakya')
);

/**
 * Returns today's shloka for the given timezone, rotating deterministically
 * through the 365 unique verses across the calendar year.
 *
 * @param timezone IANA timezone string. Defaults to local timezone.
 */
export function getTodayShloka(timezone?: string): Shloka {
  const tz = resolveTimeZone(
    timezone ??
      (typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC')
  );
  const spiritualDate = localSpiritualDate(tz, 4); // 'YYYY-MM-DD'
  const [year, month, day] = spiritualDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const startOfYear = new Date(year, 0, 0); // Dec 31 of previous year
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / oneDay);

  return SHLOKAS[dayOfYear % SHLOKAS.length];
}

export function getShlokaByLanguage(shloka: Shloka, language: string): string {
  if (language === 'hi' && shloka.meaning_hi) return shloka.meaning_hi;
  return shloka.meaning; // fallback to English
}
