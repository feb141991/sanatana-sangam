/**
 * Shoonaya — Dharm Veer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handcrafted stories of forgotten and underappreciated heroes of Dharma.
 * Covers all four traditions — Hindu, Sikh, Buddhist, Jain — with genuine
 * depth: real trials, real sacrifice, real wisdom.
 *
 * A new hero surfaces on the home card every day via getDharmVeerOfTheDay().
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DharmVeer {
  id: string;
  name: string;
  nameLocal?: string;
  era: string;
  eraLocal?: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'sufi' | 'tribal';
  region: string;
  regionLocal?: string;
  emoji: string;
  tagline: string;
  taglineLocal?: string;
  /** 2–3 paragraph account of their life and mission */
  journey: string;
  journeyLocal?: string;
  /** The defining test, sacrifice, or trial they endured */
  trial: string;
  trialLocal?: string;
  /** Their core teaching in plain language */
  teaching: string;
  teachingLocal?: string;
  /** The moral for a modern seeker */
  moral: string;
  moralLocal?: string;
  /** How their legacy shaped the tradition or society */
  legacy?: string;
  legacyLocal?: string;
  /** Scene description for illustration — evokes their most iconic moment */
  illustrationPrompt?: string;
  quote?: {
    text: string;
    attribution: string;
  };
  quoteLocal?: {
    text: string;
    attribution: string;
  };
  source?: string;
  sourceClass?: 'canonical' | 'historical' | 'curated-tradition' | 'devotional-oral' | 'needs-review';
  reviewStatus?: 'approved' | 'needs_review';
  tags?: string[];
}

import { HINDU_VEERS } from './data/dharm-veers/hindu';
import { SIKH_VEERS } from './data/dharm-veers/sikh';
import { BUDDHIST_VEERS } from './data/dharm-veers/buddhist';
import { JAIN_VEERS } from './data/dharm-veers/jain';

export const DHARM_VEERS: DharmVeer[] = [
  ...HINDU_VEERS,
  ...SIKH_VEERS,
  ...BUDDHIST_VEERS,
  ...JAIN_VEERS,
];

// ── Tradition Metadata ─────────────────────────────────────────────────────

export const TRADITION_META: Record<string, { label: string; labelLocal: string; dharmVeerLocal: string; emoji: string; color: string }> = {
  hindu:    { label: 'Sanatan Dharma', labelLocal: 'सनातन धर्म', dharmVeerLocal: 'धर्म वीर', emoji: '🕉️', color: 'rgba(255, 120, 0, 0.12)' },
  sikh:     { label: 'Sikhi',          labelLocal: 'ਸਿੱਖੀ',     dharmVeerLocal: 'ਧਰਮ ਵੀਰ', emoji: '☬', color: 'rgba(0, 100, 255, 0.12)' },
  buddhist: { label: 'Buddha Dhamma',  labelLocal: 'बुद्ध धम्म', dharmVeerLocal: 'धर्म वीर', emoji: '☸️', color: 'rgba(255, 200, 0, 0.12)' },
  jain:     { label: 'Jain Dharma',    labelLocal: 'जैन धर्म',   dharmVeerLocal: 'धर्म वीर', emoji: '🤲', color: 'rgba(0, 200, 50, 0.12)' },
  sufi:     { label: 'Sufi Path',      labelLocal: 'सूफ़ी मार्ग', dharmVeerLocal: 'धर्म वीर', emoji: '🕊️', color: 'rgba(140, 90, 220, 0.12)' },
  tribal:   { label: 'Adivasi Wisdom', labelLocal: 'आदिवासी ज्ञान', dharmVeerLocal: 'धर्म वीर', emoji: '🌿', color: 'rgba(60, 160, 90, 0.12)' },
};

// ── Client-side Rotation logic ─────────────────────────────────────────────

/**
 * Pure function to select a Dharm Veer for the user based on history and tradition.
 * Implements a no-repeat window (default 14) and tradition-awareness.
 */
export function selectDharmVeer({
  userTradition,
  historyIds,
  roster = DHARM_VEERS,
  festivalTags = [],
  noRepeatWindow = 14,
}: {
  userTradition?: string | null;
  historyIds: string[];
  roster?: DharmVeer[];
  festivalTags?: string[];
  noRepeatWindow?: number;
}): DharmVeer {
  // 1. Separate heroes by tradition
  const sameTradition = roster.filter(h => h.tradition === userTradition);
  const otherTradition = roster.filter(h => h.tradition !== userTradition);

  // 2. Identify recently seen based on window
  const recentIds = new Set(historyIds.slice(-noRepeatWindow));

  // 3. Find candidates not seen recently
  const freshSame = sameTradition.filter(h => !recentIds.has(h.id));
  const freshOther = otherTradition.filter(h => !recentIds.has(h.id));

  // 4. Boost by festival/tags if provided
  if (festivalTags.length > 0) {
    const freshBoosted = [...freshSame, ...freshOther].find(h =>
      festivalTags.some(tag => h.tags?.includes(tag))
    );
    if (freshBoosted) return freshBoosted;
  }

  // 5. Prefer fresh same-tradition heroes
  if (freshSame.length > 0) {
    return freshSame[0]; // Could shuffle deterministically, but first available is fine for a stable roster
  }

  // 6. Occasional cross-tradition (if no fresh same-tradition)
  if (freshOther.length > 0) {
    return freshOther[0];
  }

  // 7. Graceful degradation: roster is exhausted (smaller than no-repeat window).
  // Pick the least recently shown item from their tradition (the one that appeared earliest in history)
  if (sameTradition.length > 0) {
    // Sort sameTradition by index in historyIds (lower index = older)
    // If not in history, index is -1, which shouldn't happen here since freshSame is empty
    const sortedByOldest = [...sameTradition].sort((a, b) => {
      const idxA = historyIds.indexOf(a.id);
      const idxB = historyIds.indexOf(b.id);
      return idxA - idxB;
    });
    return sortedByOldest[0];
  }

  // 8. Absolute fallback
  return roster[0];
}

/**
 * Returns the Dharm Veer for today. Changes every calendar day.
 * Tradition-aware: shuffles same-tradition heroes higher in the rotation.
 * This acts as the SSR deterministic fallback. True per-user rotation
 * happens on the client via selectDharmVeer.
 */
export function getDharmVeerOfTheDay(userTradition?: string | null): DharmVeer {
  const epoch = new Date('2024-01-01').getTime();
  const now   = new Date();
  const ist   = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const dayN  = Math.floor((ist.getTime() - epoch) / (1000 * 60 * 60 * 24));
  const slot  = dayN;

  if (!userTradition) {
    return DHARM_VEERS[slot % DHARM_VEERS.length];
  }

  const same  = DHARM_VEERS.filter(h => h.tradition === userTradition);
  const other = DHARM_VEERS.filter(h => h.tradition !== userTradition);
  const pool  = [...same, ...same, ...other];

  return pool[slot % pool.length];
}
