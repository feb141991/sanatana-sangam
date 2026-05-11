// ─── Shoonaya — Traditions, Sampradayas, Ishta Devatas, Greetings ──────
// Covers Hindu, Sikh, Buddhist, Jain — all streams of Sanatan Dharma

export type TraditionKey = 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'other';

export const TRADITIONS: { value: TraditionKey; label: string; emoji: string; desc: string }[] = [
  { value: 'hindu',    label: 'Hindu / Sanatani', emoji: '🕉️', desc: 'Vedic, Puranic and all Hindu sampradayas' },
  { value: 'sikh',     label: 'Sikh',             emoji: '☬',  desc: 'Sikh Dharma — Guru Granth Sahib' },
  { value: 'buddhist', label: 'Buddhist',          emoji: '☸️', desc: 'Dharma of the Buddha — all schools' },
  { value: 'jain',     label: 'Jain',              emoji: '🤲', desc: 'Jain Dharma — path of Mahavir' },
  { value: 'other',    label: 'Other / Exploring', emoji: '✨', desc: 'Curious — exploring Sanatan traditions' },
];

// ─── Sampradayas by tradition ──────────────────────────────────────────────────
export const SAMPRADAYAS_BY_TRADITION: Record<TraditionKey, { value: string; label: string }[]> = {
  hindu: [
    { value: 'vaishnava',    label: 'Vaishnava' },
    { value: 'shaiva',       label: 'Shaiva' },
    { value: 'shakta',       label: 'Shakta' },
    { value: 'smarta',       label: 'Smarta' },
    { value: 'iskcon',       label: 'ISKCON' },
    { value: 'swaminarayan', label: 'Swaminarayan' },
    { value: 'arya_samaj',   label: 'Arya Samaj' },
    { value: 'veerashaiva',  label: 'Veerashaiva / Lingayat' },
    { value: 'other',        label: 'Other / Exploring' },
  ],
  sikh: [
    { value: 'khalsa',       label: 'Khalsa' },
    { value: 'nanakpanthi',  label: 'Nanakpanthi' },
    { value: 'nihang',       label: 'Nihang Singh' },
    { value: 'udasi',        label: 'Udasi' },
    { value: 'other',        label: 'Other / Exploring' },
  ],
  buddhist: [
    { value: 'theravada',    label: 'Theravada' },
    { value: 'mahayana',     label: 'Mahayana' },
    { value: 'vajrayana',    label: 'Vajrayana / Tibetan' },
    { value: 'zen',          label: 'Zen / Chan' },
    { value: 'other',        label: 'Other / Exploring' },
  ],
  jain: [
    { value: 'digambara',    label: 'Digambara' },
    { value: 'shvetambara',  label: 'Shvetambara' },
    { value: 'sthanakvasi',  label: 'Sthanakvasi' },
    { value: 'other',        label: 'Other / Exploring' },
  ],
  other: [
    { value: 'other',        label: 'Exploring / Interfaith' },
  ],
};

// ─── Ishta Devata / Spiritual Guide by tradition ───────────────────────────────
export const ISHTA_DEVATAS_BY_TRADITION: Record<TraditionKey, { value: string; label: string; emoji: string }[]> = {
  hindu: [
    { value: 'krishna',   label: 'Shri Krishna',   emoji: '🦚' },
    { value: 'vishnu',    label: 'Shri Vishnu',    emoji: '🌺' },
    { value: 'rama',      label: 'Shri Rama',      emoji: '🏹' },
    { value: 'shiva',     label: 'Shri Shiva',     emoji: '🔱' },
    { value: 'durga',     label: 'Maa Durga',      emoji: '⚔️' },
    { value: 'lakshmi',   label: 'Maa Lakshmi',    emoji: '🪷' },
    { value: 'saraswati', label: 'Maa Saraswati',  emoji: '🎶' },
    { value: 'ganesha',   label: 'Shri Ganesha',   emoji: '🐘' },
    { value: 'hanuman',   label: 'Shri Hanuman',   emoji: '🙏' },
    { value: 'kartikeya', label: 'Shri Kartikeya', emoji: '🌟' },
    { value: 'other',     label: 'Other',          emoji: '✨' },
  ],
  sikh: [
    { value: 'waheguru',   label: 'Waheguru',       emoji: '☬' },
    { value: 'guru_nanak', label: 'Guru Nanak Dev', emoji: '🙏' },
    { value: 'other',      label: 'Other',          emoji: '✨' },
  ],
  buddhist: [
    { value: 'buddha',           label: 'Shakyamuni Buddha',   emoji: '☸️' },
    { value: 'avalokiteshvara',  label: 'Avalokiteshvara',     emoji: '🪷' },
    { value: 'manjushri',        label: 'Manjushri',           emoji: '📖' },
    { value: 'tara',             label: 'Green Tara',          emoji: '🌿' },
    { value: 'amitabha',         label: 'Amitabha Buddha',     emoji: '🌅' },
    { value: 'other',            label: 'Other',               emoji: '✨' },
  ],
  jain: [
    { value: 'mahavir',     label: 'Bhagwan Mahavir',   emoji: '🤲' },
    { value: 'parshvanath', label: 'Bhagwan Parshvanath', emoji: '🌿' },
    { value: 'rishabhanatha', label: 'Adinath Rishabha', emoji: '✨' },
    { value: 'other',       label: 'Other',             emoji: '✨' },
  ],
  other: [
    { value: 'other', label: 'Exploring', emoji: '✨' },
  ],
};

// ─── Greeting pool — randomised per session, keyed by tradition + sampradaya ──
export const GREETING_POOLS: Record<string, string[]> = {
  // Hindu by sampradaya
  'hindu:vaishnava':    ['Jai Shri Krishna 🦚', 'Radhe Radhe 🌸', 'Hare Krishna 🌺', 'Jai Shri Ram 🙏'],
  'hindu:shaiva':       ['Om Namah Shivaya 🔱', 'Har Har Mahadev 🕉️', 'Jai Bholenath 🙏'],
  'hindu:shakta':       ['Jai Mata Di ⚔️', 'Jai Ambe 🪔', 'Jai Durga Maa 🌺', 'Jai Jagdambe 🙏'],
  'hindu:iskcon':       ['Hare Krishna 🌺', 'Jai Shri Krishna 🦚', 'Radhe Shyam 🌸'],
  'hindu:swaminarayan': ['Jai Swaminarayan 🙏', 'Jai Hari 🌺', 'Jai Akshar Purushottam 🕉️'],
  'hindu:arya_samaj':   ['Om 🕉️', 'Aryabhivadan 🙏', 'Jai Arya 🌟'],
  'hindu:smarta':       ['Om 🕉️', 'Hari Om 🌺', 'Jai Shri Ram 🙏', 'Om Namah Shivaya 🔱'],
  'hindu:other':        ['Jai Shri Ram 🙏', 'Hari Om 🕉️', 'Om Namah Shivaya 🔱'],
  // Sikh
  'sikh:khalsa':        ['Waheguru Ji Ka Khalsa ☬', 'Waheguru Ji Ki Fateh ☬', 'Sat Sri Akal 🙏'],
  'sikh:nanakpanthi':   ['Sat Sri Akal 🙏', 'Waheguru Ji Ka Khalsa ☬', 'Nanak Naam Chardi Kala ☬'],
  'sikh:other':         ['Sat Sri Akal 🙏', 'Waheguru Ji Ka Khalsa ☬'],
  // Buddhist
  'buddhist:theravada': ['Namo Buddhaya ☸️', 'Buddham Sharanam Gacchami 🪷', 'Sādhu Sādhu 🙏'],
  'buddhist:mahayana':  ['Om Mani Padme Hum 🪷', 'Namo Amitabha ☸️', 'Namo Buddhaya 🌸'],
  'buddhist:vajrayana': ['Om Mani Padme Hum 🪷', 'Om Ah Hum 🕉️', 'Namo Buddhaya ☸️'],
  'buddhist:zen':       ['Namo Buddhaya ☸️', 'Gassho 🙏', 'Namu Shakyamuni Butsu ☸️'],
  'buddhist:other':     ['Namo Buddhaya ☸️', 'Om Mani Padme Hum 🪷'],
  // Jain
  'jain:digambara':     ['Jai Jinendra 🤲', 'Namo Arihantanam ✨', 'Jai Mahavir 🙏'],
  'jain:shvetambara':   ['Jai Jinendra 🤲', 'Micchami Dukkadam 🙏', 'Namo Arihantanam ✨'],
  'jain:other':         ['Jai Jinendra 🤲', 'Namo Arihantanam ✨'],
  // Default
  'default':            ['Jai Shri Ram 🙏', 'Om Namah Shivaya 🔱', 'Hari Om 🕉️', 'Pranam 🙏'],
};

/**
 * Get a random greeting for the user based on their tradition + sampradaya.
 * Pass a stable seed (e.g. date string) to get same greeting for the session.
 */
export function getGreeting(
  tradition?: string | null,
  sampradaya?: string | null,
  seed: number = new Date().getDate()
): string {
  const pool = getGreetingPool(tradition, sampradaya);
  return pool[seed % pool.length];
}

export function getGreetingPool(
  tradition?: string | null,
  sampradaya?: string | null,
): string[] {
  const key = tradition && sampradaya ? `${tradition}:${sampradaya}` : 'default';
  return GREETING_POOLS[key] ?? GREETING_POOLS[`${tradition}:other`] ?? GREETING_POOLS.default;
}

export function isGreetingCompatibleWithTradition(
  greeting?: string | null,
  tradition?: string | null,
  sampradaya?: string | null,
): boolean {
  if (!greeting) return true;

  const lower = greeting.toLowerCase();
  if (getGreetingPool(tradition, sampradaya).includes(greeting)) return true;

  switch (tradition) {
    case 'sikh':
      return /waheguru|sat sri akal|nanak|khalsa|fateh|chardi kala/.test(lower);
    case 'buddhist':
      return /buddha|buddhaya|dharma|gassho|mani padme|amitabha|sādhu|sadhu/.test(lower);
    case 'jain':
      return /jinendra|arihant|mahavir|micchami|namo/.test(lower);
    case 'hindu':
      return /om|hari|ram|rama|krishna|radhe|shiva|mahadev|bholenath|mata|ambe|durga|swaminarayan|arya/.test(lower);
    default:
      return true;
  }
}

/**
 * Get the label for Ishta Devata field based on tradition.
 * Different traditions call this concept different things.
 */
export function getIshtaDevataLabel(tradition?: string | null): string {
  switch (tradition) {
    case 'sikh':     return 'Simran Focus';
    case 'buddhist': return 'Bodhisattva / Buddha';
    case 'jain':     return 'Tirthankar Devotion';
    default:         return 'Ishta Devata';
  }
}

/**
 * Get the label for Sampradaya field based on tradition.
 */
export function getSampradayaLabel(tradition?: string | null): string {
  switch (tradition) {
    case 'sikh':     return 'Sikh Panth';
    case 'buddhist': return 'Buddhist School';
    case 'jain':     return 'Jain Sect';
    default:         return 'Sampradaya';
  }
}
