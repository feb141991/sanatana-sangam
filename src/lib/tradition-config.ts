/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanatana Sangam — Tradition Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Central config that maps each tradition to all UI/content metadata.
 * Everything tradition-aware in the app imports from here.
 *
 * Usage:
 *   import { getTraditionMeta } from '@/lib/tradition-config';
 *   const meta = getTraditionMeta(profile.tradition);
 *   // meta.sacredTextLabel → "Today's Shabad" for Sikh, "Today's Shloka" for Hindu etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TraditionKey } from './traditions';

export interface TraditionMeta {
  /** Unicode symbol — 🕉️ ☬ ☸️ 🤲 ✨ */
  symbol:           string;
  /** Full label shown to the user */
  label:            string;
  /** Short label for tight UI spaces */
  shortLabel:       string;
  /** Primary brand hex colour for this tradition */
  accentColour:     string;
  /** Light tint for card backgrounds */
  accentLight:      string;
  /** Default Pathshala section id to land on */
  librarySection:   string;
  /** Label for the daily sacred text card */
  sacredTextLabel:  string;
  /** Icon shown on the daily sacred text card */
  sacredTextIcon:   string;
  /** How to share the daily text: e.g. "Aaj Ka Shloka" / "Aaj Ka Shabad" */
  sacredTextShareLabel: string;
  /** Calendar system used by this tradition */
  calendarType:     'vedic' | 'nanakshahi' | 'buddhist_lunar' | 'jain' | 'gregorian';
  /** Bottom-nav Pathshala tab label */
  navLibraryLabel:  string;
  /** Dharma Mitra AI opening message */
  aiGreeting:       string;
  /** Label for the sampradaya / panth / school / sect field */
  sampradayaLabel:  string;
  /** Label for the ishta devata / simran / bodhisattva / tirthankar field */
  devataLabel:      string;
  /** Which tradition's festivals to prioritise on the home screen */
  festivalPriority: TraditionKey;
}

export const TRADITION_CONFIG: Record<TraditionKey, TraditionMeta> = {

  hindu: {
    symbol:               '🕉️',
    label:                'Hindu / Sanatani',
    shortLabel:           'Hindu',
    accentColour:         '#D4740F',   // saffron — matches app gold palette
    accentLight:          '#fff4e6',
    librarySection:       'gita',
    sacredTextLabel:      "Aaj Ka Shloka",
    sacredTextIcon:       '🕉️',
    sacredTextShareLabel: 'Aaj Ka Shloka',
    calendarType:         'vedic',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Hari Om 🕉️ I am Dharma Mitra — your guide on the Sanatana path. Ask me anything about dharma, scripture, your sampradaya, or spiritual practice.',
    sampradayaLabel:      'Sampradaya',
    devataLabel:          'Ishta Devata',
    festivalPriority:     'hindu',
  },

  sikh: {
    symbol:               '☬',
    label:                'Sikh',
    shortLabel:           'Sikh',
    accentColour:         '#2E6FA8',   // steel blue — traditional Sikh navy, lightened for readability
    accentLight:          '#eef5ff',
    librarySection:       'gurbani',
    sacredTextLabel:      "Aaj Ka Shabad",
    sacredTextIcon:       '☬',
    sacredTextShareLabel: 'Aaj Ka Shabad',
    calendarType:         'nanakshahi',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Sat Sri Akal ☬ I am Dharma Mitra — here to explore the Guru\'s wisdom with you. Ask me about Gurbani, Sikh history, Gurmat, or your spiritual journey.',
    sampradayaLabel:      'Sikh Panth',
    devataLabel:          'Simran Focus',
    festivalPriority:     'sikh',
  },

  buddhist: {
    symbol:               '☸️',
    label:                'Buddhist',
    shortLabel:           'Buddhist',
    accentColour:         '#B07D3A',   // Buddhist saffron-amber
    accentLight:          '#fdf5e8',
    librarySection:       'dhammapada',
    sacredTextLabel:      "Aaj Ka Dhamma Verse",
    sacredTextIcon:       '☸️',
    sacredTextShareLabel: 'Dhamma Verse',
    calendarType:         'buddhist_lunar',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Namo Buddhaya ☸️ I am Dharma Mitra — walking the Eightfold Path with you. Ask me about the Dhamma, meditation, mindfulness, or the Buddha\'s teachings.',
    sampradayaLabel:      'Buddhist School',
    devataLabel:          'Bodhisattva / Buddha',
    festivalPriority:     'buddhist',
  },

  jain: {
    symbol:               '🤲',
    label:                'Jain',
    shortLabel:           'Jain',
    accentColour:         '#A07830',   // Jain gold-amber
    accentLight:          '#fffbf0',
    librarySection:       'jain',
    sacredTextLabel:      "Aaj Ka Sutra",
    sacredTextIcon:       '🤲',
    sacredTextShareLabel: 'Aaj Ka Sutra',
    calendarType:         'jain',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Jai Jinendra 🤲 I am Dharma Mitra — exploring the Jain path of Ahimsa with you. Ask me about the Agamas, Mahavir\'s teachings, Anekantavada, or Jain philosophy.',
    sampradayaLabel:      'Jain Sect',
    devataLabel:          'Tirthankar Devotion',
    festivalPriority:     'jain',
  },

  other: {
    symbol:               '✨',
    label:                'Other / Exploring',
    shortLabel:           'Exploring',
    accentColour:         '#7B5EA7',   // spiritual violet
    accentLight:          '#f5f0ff',
    librarySection:       'gita',
    sacredTextLabel:      "Today's Wisdom",
    sacredTextIcon:       '✨',
    sacredTextShareLabel: 'Daily Wisdom',
    calendarType:         'gregorian',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Pranam ✨ I am Dharma Mitra — here to explore all dharmic traditions with you. Ask me anything about Hindu, Sikh, Buddhist, or Jain wisdom and philosophy.',
    sampradayaLabel:      'Tradition / Path',
    devataLabel:          'Spiritual Guide',
    festivalPriority:     'hindu',
  },

};

/**
 * Get tradition metadata for a given tradition key.
 * Defaults to Hindu if tradition is null, undefined, or unrecognised.
 */
export function getTraditionMeta(tradition?: string | null): TraditionMeta {
  return TRADITION_CONFIG[(tradition as TraditionKey)] ?? TRADITION_CONFIG.hindu;
}
