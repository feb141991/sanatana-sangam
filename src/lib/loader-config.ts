/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Tradition-Aware Loader Config
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Maps every tradition to its loader symbol, accent colour, motion preset,
 * and contextual message copy for four loading contexts:
 *   splash  — full-screen on app boot
 *   page    — page-level / section-level data loading
 *   ai      — AI / Dharma Mitra thinking state
 *
 * The SacredLoader component consumes this. Nothing else should import
 * tradition-specific loader values directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TraditionKey } from './traditions';

export interface TraditionLoaderConfig {
  /** Unicode symbol rendered at the heart of every loader */
  symbol: string;
  /** Primary glow / accent colour for this tradition */
  accentColor: string;
  /**
   * breathe — scale + opacity pulse: Jain, Buddhist (still, inward)
   * halo    — radial expansion pulse: Hindu, Sikh (light, emanating)
   */
  motionPreset: 'breathe' | 'halo';
  messages: {
    splash:    string[];
    page:      string[];
    ai:        string[];
  };
}

export const LOADER_CONFIG: Record<TraditionKey, TraditionLoaderConfig> = {
  hindu: {
    symbol:      '\u{1F549}',        // 🕉
    accentColor: '#C5A059',
    motionPreset: 'halo',
    messages: {
      splash: [
        'Preparing your sacred space…',
        'Lighting the inner diya…',
        'Opening the path of dharma…',
      ],
      page: [
        'Drawing from sacred knowledge…',
        'Finding today’s reflection…',
        'Seeking wisdom from the Vedas…',
      ],
      ai: [
        'Dharma Mitra is reflecting…',
        'Contemplating the Vedas for you…',
        'Finding a meaningful shloka…',
      ],
    },
  },

  sikh: {
    symbol:      '☬',           // ☬
    accentColor: '#D4AF6A',
    motionPreset: 'halo',
    messages: {
      splash: [
        'Waheguru ji ka Khalsa…',
        'Opening with Ik Onkar…',
        'Preparing your sacred space…',
      ],
      page: [
        'Drawing from the Guru Granth Sahib…',
        'Finding today’s shabad…',
        'Seeking the Guru’s wisdom…',
      ],
      ai: [
        'Seeking guidance from Gurbani…',
        'Dharma Mitra is reflecting on the Guru’s wisdom…',
        'Finding a meaningful shabad…',
      ],
    },
  },

  buddhist: {
    symbol:      '☸',           // ☸
    accentColor: '#B8A882',
    motionPreset: 'breathe',
    messages: {
      splash: [
        'Opening a calm space…',
        'Breathing into stillness…',
        'Entering the path of Dhamma…',
      ],
      page: [
        'Breathing into the Dhamma…',
        'Finding today’s teaching…',
        'Resting in awareness…',
      ],
      ai: [
        'Reflecting on the Dhamma for you…',
        'Dharma Mitra is contemplating…',
        'Finding a mindful reflection…',
      ],
    },
  },

  jain: {
    symbol:      '🤲',     // 🤲
    accentColor: '#C8A860',
    motionPreset: 'breathe',
    messages: {
      splash: [
        'Jai Jinendra…',
        'Opening in stillness and ahimsa…',
        'Preparing your sacred space…',
      ],
      page: [
        'Contemplating in silence…',
        'Drawing from Mahavir’s wisdom…',
        'Resting in non-attachment…',
      ],
      ai: [
        'Dharma Mitra is reflecting in stillness…',
        'Finding wisdom from the Tirthankaras…',
        'Contemplating ahimsa…',
      ],
    },
  },

  other: {
    symbol:      '✶',           // ✶ (six-pointed star — universal)
    accentColor: '#C5A059',
    motionPreset: 'halo',
    messages: {
      splash: [
        'Finding your infinite…',
        'Opening a calm space…',
        'Preparing your sacred space…',
      ],
      page: [
        'Finding today’s reflection…',
        'Seeking wisdom…',
        'Opening a moment of stillness…',
      ],
      ai: [
        'Dharma Mitra is reflecting for you…',
        'Finding a meaningful reflection…',
        'Seeking your path…',
      ],
    },
  },
};

/** Safe getter — always returns a config, never undefined */
export function getLoaderConfig(tradition?: string | null): TraditionLoaderConfig {
  return LOADER_CONFIG[(tradition as TraditionKey)] ?? LOADER_CONFIG.other;
}

/** Pick a random message from an array. Returns first element during SSR. */
export function pickLoaderMessage(messages: string[]): string {
  if (typeof window === 'undefined' || messages.length === 0) return messages[0] ?? '';
  return messages[Math.floor(Math.random() * messages.length)];
}
