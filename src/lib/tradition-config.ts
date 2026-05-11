/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Tradition Configuration
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
  /** Default mantra for Japa mala */
  japaDefaultMantra: string;
  /** Title for the Nitya Karma section */
  nityaKarmaTitle:  string;
  /** Vocabulary word for scriptures in Pathshala */
  pathshalaVocabulary: string;
  /** Map pin emoji for Tirtha map */
  mapPinEmoji:      string;
  /** Greeting on the Bhakti dashboard */
  bhaktiGreeting:   string;
  /** Preferred order of deities in Bhakti browse */
  bhaktiDeityOrder: string[];
  /** Theme to use for home screen sacred text */
  homeSacredTextTheme: 'pathshala' | 'bhakti';
  heroFallback: {
    title: string;
    subtitle: string;
    mark: string;
  };
  dailyVersePrompt: {
    verse: string;
    meaning: string;
  };
  defaultRitualTimes: string[];
  placeLabel: string;
  badgeLabel: string;
  visitRhythm: {
    label: string;
    items: string[];
  };
  vocabulary: Record<string, string>;
  morningGreeting: string;
  morningAllDoneMsg: string;
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
    japaDefaultMantra:    'gayatri',
    nityaKarmaTitle:      'Nitya Karma',
    pathshalaVocabulary:  'Scriptures',
    mapPinEmoji:          '🛕',
    bhaktiGreeting:       'Hari Om',
    bhaktiDeityOrder:     ['shiva', 'krishna', 'rama', 'hanuman', 'devi', 'ganesha'],
    homeSacredTextTheme:  'pathshala',
    heroFallback: { title: 'Sanatan Universe', subtitle: 'A calm sacred space', mark: 'ॐ' },
    dailyVersePrompt: {
      verse: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत',
      meaning: 'Bhagavad Gita 4.7 — Whenever there is a decline in righteousness…',
    },
    defaultRitualTimes: ['Mangala Aarti', 'Shringar Aarti', 'Sandhya Aarti', 'Shayan Aarti'],
    placeLabel: 'mandirs',
    badgeLabel: 'Mandir',
    visitRhythm: {
      label: 'Visit rhythm',
      items: ['Darshan', 'Aarti', 'Temple hours'],
    },
    vocabulary: {
      dharma: 'Dharma',
      sangam: 'Sangam',
      mandir: 'Mandir',
      shloka: 'Shloka',
      karma:  'Karma',
      shakti: 'Shakti',
    },
    morningGreeting: 'Suprabhat 🌅',
    morningAllDoneMsg: 'Hari Om! Your morning sadhana is complete. The divine sees your devotion. 🙏',
  },

  sikh: {
    symbol:               '☬',
    label:                'Sikh',
    shortLabel:           'Sikh',
    accentColour:         '#2E6FA8',   // steel blue — traditional Sikh navy, lightened for readability
    accentLight:          '#eef5ff',
    librarySection:       'gurbani',
    sacredTextLabel:      "Aaj Da Shalok",
    sacredTextIcon:       '☬',
    sacredTextShareLabel: 'Aaj Da Shalok',
    calendarType:         'nanakshahi',
    navLibraryLabel:      'Pathshala',
    aiGreeting:           'Sat Sri Akal ☬ I am Dharma Mitra — here to explore the Guru\'s wisdom with you. Ask me about Gurbani, Sikh history, Gurmat, or your spiritual journey.',
    sampradayaLabel:      'Sikh Panth',
    devataLabel:          'Simran Focus',
    festivalPriority:     'sikh',
    japaDefaultMantra:    'waheguru',
    nityaKarmaTitle:      'Nitnem',
    pathshalaVocabulary:  'Gurbani',
    mapPinEmoji:          '☬',
    bhaktiGreeting:       'Sat Sri Akal',
    bhaktiDeityOrder:     ['guru_nanak', 'guru_gobind'],
    homeSacredTextTheme:  'bhakti',
    heroFallback: { title: 'Guru Nanak Dev Ji', subtitle: 'Sat Sri Akal', mark: '☬' },
    dailyVersePrompt: {
      verse: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ',
      meaning: 'The Khalsa belongs to Waheguru, and victory belongs to Waheguru.',
    },
    defaultRitualTimes: ['Amrit Vela', 'Rehras Sahib', 'Sohila Sahib'],
    placeLabel: 'gurudwaras',
    badgeLabel: 'Gurudwara',
    visitRhythm: {
      label: 'Sangat rhythm',
      items: ['Darshan', 'Langar', 'Paath'],
    },
    vocabulary: {
      dharma: 'Gurmat',
      sangam: 'Sangat',
      mandir: 'Gurudwara',
      shloka: 'Shalok',
      karma:  'Karma',
      shakti: 'Shakti',
    },
    morningGreeting: 'Sat Sri Akal ☬',
    morningAllDoneMsg: 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh! Nitnem complete. ☬',
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
    japaDefaultMantra:    'om_mani',
    nityaKarmaTitle:      'Morning Practice',
    pathshalaVocabulary:  'Dhamma',
    mapPinEmoji:          '☸️',
    bhaktiGreeting:       'Namo Buddhaya',
    bhaktiDeityOrder:     ['buddha', 'tara', 'avalokiteshvara'],
    homeSacredTextTheme:  'bhakti',
    heroFallback: { title: 'Dharma refuge', subtitle: 'Namo Buddhaya', mark: '☸' },
    dailyVersePrompt: {
      verse: 'Appamādo amatapadaṃ — Diligence is the path to the deathless.',
      meaning: 'Dhammapada 21 — The Buddha\'s teaching on mindful effort.',
    },
    defaultRitualTimes: ['Morning Chanting', 'Evening Meditation'],
    placeLabel: 'viharas & stupas',
    badgeLabel: 'Vihara',
    visitRhythm: {
      label: 'Dhamma rhythm',
      items: ['Meditation', 'Chanting', 'Mindfulness'],
    },
    vocabulary: {
      dharma: 'Dhamma',
      sangam: 'Sangha',
      mandir: 'Vihara',
      shloka: 'Verse',
      karma:  'Kamma',
      shakti: 'Prajna',
    },
    morningGreeting: 'Namo Buddhaya ☸️',
    morningAllDoneMsg: 'Sadhu sadhu sadhu. Your morning practice is complete. May all beings be happy. ☸️',
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
    japaDefaultMantra:    'gayatri', // Or a Jain specific default like navkar if added later
    nityaKarmaTitle:      'Pratikramana / Sadhana',
    pathshalaVocabulary:  'Agamas',
    mapPinEmoji:          '🤲',
    bhaktiGreeting:       'Jai Jinendra',
    bhaktiDeityOrder:     ['mahavir', 'parshvanath'],
    homeSacredTextTheme:  'bhakti',
    heroFallback: { title: 'Jain dharma', subtitle: 'Jai Jinendra', mark: 'अहिंसा' },
    dailyVersePrompt: {
      verse: 'णमो अरहंताणं',
      meaning: 'Navkar Mantra — I bow to the Arihants (conquerors).',
    },
    defaultRitualTimes: ['Pratikramana', 'Samayika'],
    placeLabel: 'Jain temples',
    badgeLabel: 'Jain derasar',
    visitRhythm: {
      label: 'Sadhana rhythm',
      items: ['Pooja', 'Darshan', 'Meditation'],
    },
    vocabulary: {
      dharma: 'Jain Dharma',
      sangam: 'Sangha',
      mandir: 'Derasar',
      shloka: 'Sutra',
      karma:  'Karma',
      shakti: 'Ananta Virya',
    },
    morningGreeting: 'Jai Jinendra 🤲',
    morningAllDoneMsg: 'Jai Jinendra! Samayika complete. Ahimsa and equanimity guide your day. 🤲',
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
    japaDefaultMantra:    'gayatri',
    nityaKarmaTitle:      'Daily Practice',
    pathshalaVocabulary:  'Wisdom',
    mapPinEmoji:          '✨',
    bhaktiGreeting:       'Pranam',
    bhaktiDeityOrder:     [],
    homeSacredTextTheme:  'pathshala',
    heroFallback: { title: 'Sanatan Universe', subtitle: 'A calm sacred space', mark: 'ॐ' },
    dailyVersePrompt: {
      verse: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत',
      meaning: 'Whenever there is a decline in righteousness…',
    },
    defaultRitualTimes: ['Daily Meditation'],
    placeLabel: 'sacred places',
    badgeLabel: 'Sacred place',
    visitRhythm: {
      label: 'Daily rhythm',
      items: ['Stillness', 'Reflection'],
    },
    vocabulary: {
      dharma: 'Dharma',
      sangam: 'Sangam',
      mandir: 'Sacred place',
      shloka: 'Wisdom',
      karma:  'Karma',
      shakti: 'Power',
    },
    morningGreeting: 'Pranam ✨',
    morningAllDoneMsg: 'Your morning practice is complete. May your day be filled with peace and wisdom. ✨',
  },

};

/**
 * Get tradition metadata for a given tradition key.
 * Defaults to Hindu if tradition is null, undefined, or unrecognised.
 */
export function getTraditionMeta(tradition?: string | null): TraditionMeta {
  return TRADITION_CONFIG[(tradition as TraditionKey)] ?? TRADITION_CONFIG.hindu;
}
