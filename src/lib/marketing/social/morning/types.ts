/**
 * Morning cards: one verse card per tradition per day, generated in one click and approved in the admin portal.
 * Kept apart from the social publishing pipeline on purpose: that pipeline cannot reserve a post until a platform
 * account is connected, and its post key allows one general post per day, so it cannot carry four.
 */

export const MORNING_TRADITIONS = ["hindu", "sikh", "buddhist", "jain"] as const;
export type MorningTradition = (typeof MORNING_TRADITIONS)[number];

export type MorningCardStatus = "draft" | "approved" | "rejected" | "withheld";

/** The script a verse's original text is written in, which decides the font it needs. */
export type VerseScript = "devanagari" | "gurmukhi";

/**
 * A verse exactly as the corpus holds it, plus what is known about where it comes from. Nothing is rewritten:
 * `original` and `translation` are the corpus strings, and `translation` is null (never filled in) when the corpus
 * has no sourced translation.
 */
export interface MorningVerse {
  tradition: MorningTradition;
  /** Corpus entry id, e.g. "gita-2-47". */
  sourceRef: string;
  /** "Bhagavad Gita 2.47" */
  citation: string;
  script: VerseScript;
  original: string;
  transliteration: string | null;
  translation: string | null;
  /** Who the translation is by, and its rights status. Null whenever translation is null. */
  translationCredit: string | null;
  /** Who the verse is attributed to, e.g. "Guru Nanak Dev Ji". */
  attribution: string | null;
}

export type PickResult =
  | { ok: true; verse: MorningVerse }
  | { ok: false; reason: WithheldReason; detail: string };

export type WithheldReason =
  | "corpus_not_usable"
  | "no_usable_verse"
  | "font_missing"
  | "render_failed";
