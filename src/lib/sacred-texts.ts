/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Tradition-Aware Daily Sacred Texts
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Shabads for Sikh · Dhamma verses for Buddhist · Sutras for Jain
 * Hindu shlokas live in shlokas.ts and are handled separately.
 *
 * Usage:
 *   import { getDailySacredText } from '@/lib/sacred-texts';
 *   const text = getDailySacredText('sikh', dayOfYear);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BUDDHIST_VERSES } from './sacred-texts/buddhist';
import { JAIN_SUTRAS as FULL_JAIN_SUTRAS } from './sacred-texts/jain';
import { SIKH_SHABADS as FULL_SIKH_SHABADS } from './sacred-texts/sikh';
import { UNIVERSAL_VERSES } from './sacred-texts/universal';

export interface SacredText {
  id:              number;
  tradition:       string;
  /** Script text — Gurmukhi / Devanagari (Pali) / Ardhamagadhi */
  original:        string;
  transliteration: string;
  meaning:         string;
  source:          string;
}

// ─── Sikh Shabads ─────────────────────────────────────────────────────────────

export const SHABADS: SacredText[] = FULL_SIKH_SHABADS;

// ─── Buddhist Dhamma Verses (365 Days of Dhammapada) ─────────────────────────

export const DHAMMA_VERSES: SacredText[] = BUDDHIST_VERSES;

// ─── Jain Sutras ──────────────────────────────────────────────────────────────

export const JAIN_SUTRAS: SacredText[] = FULL_JAIN_SUTRAS;

// ─── Exploring / neutral daily wisdom ─────────────────────────────────────────

export const DAILY_WISDOM_TEXTS: SacredText[] = UNIVERSAL_VERSES;

// ─── Unified daily text picker ────────────────────────────────────────────────

export interface DailySacredText {
  original:        string;
  transliteration: string;
  meaning:         string;
  source:          string;
}

/**
 * Pick the daily sacred text for non-Hindu and exploring paths.
 * Uses dayIndex (0-based day of year) for daily rotation.
 * Returns null only for explicit Hindu (uses SHLOKAS from shlokas.ts instead).
 */
export function getDailySacredText(
  tradition: string | null,
  dayIndex: number,
): DailySacredText | null {
  switch (tradition) {
    case 'sikh': {
      const e = SHABADS[dayIndex % SHABADS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'buddhist': {
      const e = DHAMMA_VERSES[dayIndex % DHAMMA_VERSES.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'jain': {
      const e = JAIN_SUTRAS[dayIndex % JAIN_SUTRAS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    case 'other':
    case null: {
      const e = DAILY_WISDOM_TEXTS[dayIndex % DAILY_WISDOM_TEXTS.length];
      return { original: e.original, transliteration: e.transliteration, meaning: e.meaning, source: e.source };
    }
    default:
      return null; // Explicit Hindu uses shlokas.ts
  }
}

/** Get 0-based day-of-year for daily rotation */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff  = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}
