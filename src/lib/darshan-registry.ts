/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanatana Sangam — Daily Darshan Registry
 * ─────────────────────────────────────────────────────────────────────────────
 * Curated high-quality images and blessings for the Daily Darshan feature.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Darshan {
  id: string;
  deity: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'other' | 'all';
  imageUrl: string;
  blessing: string;
  mantra?: string;
  festivalId?: string;
}

export const DARSHAN_REGISTRY: Darshan[] = [
  {
    id: 'hindu_shiva_meditating',
    deity: 'Lord Shiva',
    tradition: 'hindu',
    imageUrl: '/darshan/shiva.webp',
    blessing: 'May the stillness of Mahadev bring profound peace to your mind and heart.',
    mantra: 'Om Namah Shivaya',
  },
  {
    id: 'hindu_krishna_flute',
    deity: 'Lord Krishna',
    tradition: 'hindu',
    imageUrl: '/darshan/krishna.webp',
    blessing: 'May the divine melody of Krishna\'s flute guide you toward pure love and joy.',
    mantra: 'Om Namo Bhagavate Vasudevaya',
  },
  {
    id: 'hindu_rama_noble',
    deity: 'Lord Rama',
    tradition: 'hindu',
    imageUrl: '/darshan/rama.webp',
    blessing: 'May the righteousness of Maryada Purushottam Rama guide your every action.',
    mantra: 'Sri Ram Jai Ram Jai Jai Ram',
  },
  {
    id: 'sikh_guru_nanak',
    deity: 'Guru Nanak Dev Ji',
    tradition: 'sikh',
    imageUrl: '/darshan/guru_nanak.webp',
    blessing: 'The light of Guru Nanak shines within all; see that light and serve humanity.',
    mantra: 'Waheguru',
  },
  {
    id: 'buddhist_buddha_meditating',
    deity: 'Gautama Buddha',
    tradition: 'buddhist',
    imageUrl: '/darshan/buddha.webp',
    blessing: 'Peace comes from within. Do not seek it without.',
    mantra: 'Om Mani Padme Hum',
  },
  {
    id: 'jain_mahavir_tirthankar',
    deity: 'Lord Mahavir',
    tradition: 'jain',
    imageUrl: '/darshan/mahavir.webp',
    blessing: 'Live and let live. Ahimsa is the highest dharma.',
    mantra: 'Navkar Mantra',
  },
  // Additional entries will be added for Rama, Devi, Hanuman, Ganesha, and Festivals.
];

export function getDailyDarshan(tradition: string | null, festivalId?: string): Darshan {
  // 1. If festival matching exists, prioritse it
  if (festivalId) {
    const fest = DARSHAN_REGISTRY.find(d => d.festivalId === festivalId);
    if (fest) return fest;
  }

  // 2. Filter by tradition
  const tradKey = tradition || 'hindu';
  const tradOptions = DARSHAN_REGISTRY.filter(d => d.tradition === tradKey || d.tradition === 'all');

  if (tradOptions.length === 0) return DARSHAN_REGISTRY[0]; // Fallback

  // 3. Deterministic rotation based on day of month
  const day = new Date().getDate();
  return tradOptions[day % tradOptions.length];
}
