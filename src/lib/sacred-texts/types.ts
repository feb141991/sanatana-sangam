/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Sacred Texts Types & Contracts
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SacredText {
  id: number;
  tradition: string;
  /** Script text — Gurmukhi / Devanagari (Pali/Sanskrit) / Ardhamagadhi */
  original: string;
  /** Romanized IAST transliteration with accurate diacritics */
  transliteration: string;
  /** Sourced / verified English meaning */
  meaning: string;
  /** Exact canonical citation */
  source: string;
  /** Optional Hindi translation if available */
  meaning_hi?: string;
  /** Optional Punjabi translation if available */
  meaning_pa?: string;
}

export interface DailySacredText {
  original: string;
  transliteration: string;
  meaning: string;
  source: string;
}
