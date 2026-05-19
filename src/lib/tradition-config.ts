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
  /** Canonical practice type recorded for Mala/Japa sessions */
  japaPracticeType: JapaPracticeType;
  /** Recommended mantra ordering for today's launcher */
  japaRecommendedMantras: JapaMantraId[];
  /** Recommended mala ordering for today's launcher */
  japaRecommendedMalas: JapaMalaId[];
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

export type JapaMalaId = 'sandalwood' | 'rudraksha' | 'rose_quartz' | 'tulsi' | 'crystal';
export type JapaMantraId =
  | 'om_namah_shivaya'
  | 'om_namo_narayanaya'
  | 'gayatri'
  | 'hare_krishna'
  | 'mahamrityunjaya'
  | 'om_mani'
  | 'waheguru'
  | 'namokar';
export type JapaPracticeType = 'hindu_japa' | 'naam_simran' | 'buddhist_mantra' | 'jain_navkar' | 'daily_japa';

export const JAPA_MALAS = [
  {
    id: 'sandalwood',
    name: 'Sandalwood',
    subtitle: 'Calming · all traditions',
    dark:  { thread: 'rgba(120,80,40,0.20)', bead: '#5A3218', counted: '#C8924A', sumeru: '#2E1508', glow: 'rgba(200,146,74,0.55)' },
    light: { thread: 'rgba(80,50,20,0.15)',  bead: '#C8A070', counted: '#7A4A1E', sumeru: '#5A3010', glow: 'rgba(122,74,30,0.45)' },
  },
  {
    id: 'rudraksha',
    name: 'Rudraksha',
    subtitle: 'Sacred · Shaiva',
    dark:  { thread: 'rgba(80,40,20,0.20)', bead: '#3A1A08', counted: '#C8924A', sumeru: '#1A0802', glow: 'rgba(200,100,60,0.55)' },
    light: { thread: 'rgba(60,30,10,0.15)', bead: '#A07050', counted: '#5A2E10', sumeru: '#3A1A02', glow: 'rgba(90,46,16,0.45)' },
  },
  {
    id: 'rose_quartz',
    name: 'Rose quartz',
    subtitle: 'Soft focus · universal',
    dark:  { thread: 'rgba(160,80,100,0.20)', bead: '#5A2A3A', counted: '#D4826A', sumeru: '#3A1828', glow: 'rgba(210,120,140,0.55)' },
    light: { thread: 'rgba(160,80,100,0.15)', bead: '#E8B0C0', counted: '#C07090', sumeru: '#A04870', glow: 'rgba(192,112,144,0.45)' },
  },
  {
    id: 'tulsi',
    name: 'Tulsi',
    subtitle: 'Pure · Vaishnava',
    dark:  { thread: 'rgba(40,100,40,0.20)', bead: '#1E3E1E', counted: '#C8924A', sumeru: '#0E2A0E', glow: 'rgba(60,160,60,0.40)' },
    light: { thread: 'rgba(30,80,30,0.15)',  bead: '#90C090', counted: '#3A7A3A', sumeru: '#1E5A1E', glow: 'rgba(58,122,58,0.40)' },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    subtitle: 'Clarity · breath practice',
    dark:  { thread: 'rgba(180,200,220,0.12)', bead: 'rgba(200,215,235,0.12)', counted: '#C8924A', sumeru: 'rgba(200,220,240,0.22)', glow: 'rgba(180,200,240,0.50)' },
    light: { thread: 'rgba(100,120,160,0.15)',  bead: 'rgba(160,180,210,0.35)', counted: '#6878A8', sumeru: 'rgba(140,160,200,0.55)', glow: 'rgba(104,120,168,0.40)' },
  },
] as const satisfies readonly {
  id: JapaMalaId;
  name: string;
  subtitle: string;
  dark: { thread: string; bead: string; counted: string; sumeru: string; glow: string };
  light: { thread: string; bead: string; counted: string; sumeru: string; glow: string };
}[];

export const JAPA_MANTRAS = [
  {
    id: 'om_namah_shivaya',
    name: 'Om Namah Shivaya',
    devanagari: 'ॐ नमः शिवाय',
    tradition: 'Shaiva',
    description: 'Salutation to Shiva — the five elements',
    full: 'ॐ नमः शिवाय\nॐ नमः शिवाय\nॐ नमः शिवाय',
    tradColor: '#A06888',
  },
  {
    id: 'om_namo_narayanaya',
    name: 'Om Namo Narayanaya',
    devanagari: 'ॐ नमो नारायणाय',
    tradition: 'Vaishnava',
    description: 'Salutation to Lord Narayana',
    full: 'ॐ नमो नारायणाय\nॐ नमो नारायणाय\nॐ नमो नारायणाय',
    tradColor: '#6888C8',
  },
  {
    id: 'gayatri',
    name: 'Gayatri Mantra',
    devanagari: 'ॐ भूर्भुवः स्वः',
    tradition: 'Vedic',
    description: 'Universal mantra of light and wisdom',
    full: 'ॐ भूर्भुवः स्वः\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात् ।।',
    tradColor: '#C8A040',
  },
  {
    id: 'hare_krishna',
    name: 'Hare Krishna Mahamantra',
    devanagari: 'हरे कृष्ण हरे कृष्ण',
    tradition: 'Vaishnava',
    description: 'The great mantra of Krishna and Rama',
    full: 'हरे कृष्ण हरे कृष्ण\nकृष्ण कृष्ण हरे हरे\nहरे राम हरे राम\nराम राम हरे हरे',
    tradColor: '#5888C8',
  },
  {
    id: 'mahamrityunjaya',
    name: 'Mahamrityunjaya',
    devanagari: 'ॐ त्र्यम्बकं यजामहे',
    tradition: 'Vedic',
    description: 'The great death-conquering mantra of Shiva',
    full: 'ॐ त्र्यम्बकं यजामहे\nसुगन्धिं पुष्टिवर्धनम्\nउर्वारुकमिव बन्धनान्\nमृत्योर्मुक्षीय मामृतात् ।।',
    tradColor: '#A86838',
  },
  {
    id: 'om_mani',
    name: 'Om Mani Padme Hum',
    devanagari: 'ॐ मणि पद्मे हूँ',
    tradition: 'Buddhist',
    description: 'Jewel in the lotus — mantra of compassion',
    full: 'ॐ मणि पद्मे हूँ\nॐ मणि पद्मे हूँ\nॐ मणि पद्मे हूँ',
    tradColor: '#6A9888',
  },
  {
    id: 'waheguru',
    name: 'Waheguru Simran',
    devanagari: 'ਵਾਹਿਗੁਰੂ',
    tradition: 'Sikh',
    description: 'The wondrous Guru — sacred naam simran',
    full: 'ਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ\nਵਾਹਿਗੁਰੂ',
    tradColor: '#4A8870',
  },
  {
    id: 'namokar',
    name: 'Namokar Mantra',
    devanagari: 'णमो अरिहंताणं',
    tradition: 'Jain',
    description: 'Navkar remembrance — bowing to liberated beings',
    full: 'णमो अरिहंताणं\nणमो सिद्धाणं\nणमो आयरियाणं\nणमो उवज्झायाणं\nणमो लोए सव्वसाहूणं',
    tradColor: '#A07830',
  },
] as const satisfies readonly {
  id: JapaMantraId;
  name: string;
  devanagari: string;
  tradition: string;
  description: string;
  full: string;
  tradColor: string;
}[];

export function getJapaMantrasForTradition(tradition?: string | null) {
  const meta = getTraditionMeta(tradition);
  const ids = new Set<JapaMantraId>([meta.japaDefaultMantra as JapaMantraId, ...meta.japaRecommendedMantras]);
  return [
    ...Array.from(ids).map(id => JAPA_MANTRAS.find(m => m.id === id)).filter(Boolean),
    ...JAPA_MANTRAS.filter(m => !ids.has(m.id)),
  ] as typeof JAPA_MANTRAS[number][];
}

export function getJapaPracticeType(tradition?: string | null): JapaPracticeType {
  return getTraditionMeta(tradition).japaPracticeType;
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
    navLibraryLabel:      'Scriptures',
    aiGreeting:           'Hari Om 🕉️ I am Dharma Mitra — your guide on the Sanatana path. Ask me anything about dharma, scripture, your sampradaya, or spiritual practice.',
    sampradayaLabel:      'Sampradaya',
    devataLabel:          'Ishta Devata',
    festivalPriority:     'hindu',
    japaDefaultMantra:    'gayatri',
    japaPracticeType:     'hindu_japa',
    japaRecommendedMantras: ['gayatri', 'om_namah_shivaya', 'hare_krishna', 'om_namo_narayanaya', 'mahamrityunjaya'],
    japaRecommendedMalas: ['sandalwood', 'rudraksha', 'tulsi', 'crystal'],
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
    navLibraryLabel:      'Bani',
    aiGreeting:           'Sat Sri Akal ☬ I am Dharma Mitra — here to explore the Guru\'s wisdom with you. Ask me about Gurbani, Sikh history, Gurmat, or your spiritual journey.',
    sampradayaLabel:      'Sikh Panth',
    devataLabel:          'Simran Focus',
    festivalPriority:     'sikh',
    japaDefaultMantra:    'waheguru',
    japaPracticeType:     'naam_simran',
    japaRecommendedMantras: ['waheguru'],
    japaRecommendedMalas: ['sandalwood', 'crystal'],
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
    navLibraryLabel:      'Dhamma',
    aiGreeting:           'Namo Buddhaya ☸️ I am Dharma Mitra — walking the Eightfold Path with you. Ask me about the Dhamma, meditation, mindfulness, or the Buddha\'s teachings.',
    sampradayaLabel:      'Buddhist School',
    devataLabel:          'Bodhisattva / Buddha',
    festivalPriority:     'buddhist',
    japaDefaultMantra:    'om_mani',
    japaPracticeType:     'buddhist_mantra',
    japaRecommendedMantras: ['om_mani'],
    japaRecommendedMalas: ['crystal', 'sandalwood'],
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
    navLibraryLabel:      'Agamas',
    aiGreeting:           'Jai Jinendra 🤲 I am Dharma Mitra — exploring the Jain path of Ahimsa with you. Ask me about the Agamas, Mahavir\'s teachings, Anekantavada, or Jain philosophy.',
    sampradayaLabel:      'Jain Sect',
    devataLabel:          'Tirthankar Devotion',
    festivalPriority:     'jain',
    japaDefaultMantra:    'namokar',
    japaPracticeType:     'jain_navkar',
    japaRecommendedMantras: ['namokar'],
    japaRecommendedMalas: ['sandalwood', 'crystal'],
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
    navLibraryLabel:      'Wisdom',
    aiGreeting:           'Pranam ✨ I am Dharma Mitra — here to explore all dharmic traditions with you. Ask me anything about Hindu, Sikh, Buddhist, or Jain wisdom and philosophy.',
    sampradayaLabel:      'Tradition / Path',
    devataLabel:          'Spiritual Guide',
    festivalPriority:     'hindu',
    japaDefaultMantra:    'gayatri',
    japaPracticeType:     'daily_japa',
    japaRecommendedMantras: ['gayatri', 'waheguru', 'om_mani', 'namokar'],
    japaRecommendedMalas: ['sandalwood', 'crystal'],
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
