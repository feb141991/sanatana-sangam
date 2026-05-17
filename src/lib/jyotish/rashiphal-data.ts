// ─── Rashiphal (Daily Horoscope) Generator ──────────────────────────────────
// Pure, seed-based Vedic astrology generator. Uses a daily date seed to ensure
// horoscopes change precisely at midnight, remain constant throughout the day,
// and are completely cost-free and offline-capable!
// ─────────────────────────────────────────────────────────────────────────────

export interface RashiHoroscope {
  rashi:        string; // English name
  rashiSanskrit: string; // Sanskrit name
  symbol:       string; // Emoji symbol
  lord:         string; // Ruling Graha
  luckyColor:   string;
  luckyNumber:  number;
  luckyTime:    string;
  sadhanaFocus: string; // Shoonaya specific: Spiritual recommendation for the day
  karma:        string; // Work & career
  health:       string; // Vitality
  love:         string; // Connections
}

export const RASHI_LIST = [
  { key: 'aries',       en: 'Aries',       sa: 'Mesha',      symbol: '🐏', lord: 'Mars (Mangal)' },
  { key: 'taurus',      en: 'Taurus',      sa: 'Vrishabha',   symbol: '🐂', lord: 'Venus (Shukra)' },
  { key: 'gemini',      en: 'Gemini',      sa: 'Mithuna',     symbol: '👥', lord: 'Mercury (Budha)' },
  { key: 'cancer',      en: 'Cancer',      sa: 'Karka',       symbol: '🦀', lord: 'Moon (Chandra)' },
  { key: 'leo',         en: 'Leo',         sa: 'Simha',       symbol: '🦁', lord: 'Sun (Surya)' },
  { key: 'virgo',       en: 'Virgo',       sa: 'Kanya',       symbol: '🌾', lord: 'Mercury (Budha)' },
  { key: 'libra',       en: 'Libra',       sa: 'Tula',        symbol: '⚖️', lord: 'Venus (Shukra)' },
  { key: 'scorpio',     en: 'Scorpio',     sa: 'Vrishchika',  symbol: '🦂', lord: 'Mars (Mangal)' },
  { key: 'sagittarius', en: 'Sagittarius', sa: 'Dhanu',       symbol: '🏹', lord: 'Jupiter (Guru)' },
  { key: 'capricorn',   en: 'Capricorn',   sa: 'Makara',      symbol: '🐊', lord: 'Saturn (Shani)' },
  { key: 'aquarius',    en: 'Aquarius',    sa: 'Kumbha',      symbol: '🏺', lord: 'Saturn (Shani)' },
  { key: 'pisces',      en: 'Pisces',      sa: 'Meena',       symbol: '🐟', lord: 'Jupiter (Guru)' },
];

const COLORS = ['Saffron Gold', 'Maroon Red', 'Tulsi Green', 'Lotus Pink', 'Sandalwood Ochre', 'Peacock Blue', 'Ivory White', 'Charcoal Grey'];
const TIMES = ['Brahma Muhurta (4:30 AM - 5:20 AM)', 'Solar Noon (11:55 AM - 12:45 PM)', 'Godhuli Bela (6:15 PM - 7:00 PM)', 'Pradosh Kaal (7:15 PM - 8:30 PM)'];

// A seed-based LCG (Linear Congruential Generator) for reproducible pseudorandom values per sign per day
function createSeededRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(48271, h) | 0;
    return (h & 0x7fffffff) / 2147483647;
  };
}

const SADHANA_POOL = [
  'Perform 108 chants of Om Namah Shivaya to stabilize your scattered planetary alignment.',
  'Observe a brief digital fast for 3 hours starting at sunrise to quiet the mental chatter.',
  'Offer raw milk mixed with water on a Shiva Lingam or recite the Rudrashtakam in the evening.',
  'Chant the Hanuman Chalisa twice today; Mars is transiting your active house, calling for courage.',
  'Offer deep prayers to Sri Suktam or recite the Lakshmi Gayatri to invite abundance and peace.',
  'Sit in complete stillness for 15 minutes facing East. Direct your energy to your third eye.',
  'Recite the Guru Gita or the Nitnem path; your ruling planet favors wisdom acquisition today.',
  'Light an oil lamp (Diya) with sesame oil under a Peepal tree or in your shrine to balance Shani’s gaze.'
];

const KARMA_POOL = [
  'A day of major breakthrough. Trust your gut on long-term creative projects and make that call.',
  'Patience is your highest sadhana at work today. Avoid hasty investments or signing binding contracts.',
  'An old contact will reach out with a promising project. Keep an open mind and listen closely.',
  'Energy is high but direction is key. Consolidate your minor tasks before launching into new ones.',
  'Step back from verbal debates. Let your high-quality work speak for itself; recognition is imminent.',
  'Collaboration is highly blessed today. Seek advice from a senior mentor before committing capital.'
];

const HEALTH_POOL = [
  'Slight digestive sensitivity. Favour freshly cooked warm meals and sip warm ginger tea after sunset.',
  'Pranayama (breathing exercises) will double your physical energy. Keep yourself hydrated.',
  'Physical fatigue from recent overexertion. Rest early tonight and keep your bedroom screen-free.',
  'Joint stiffness or lower back pressure. A gentle evening stretch or walk under moonlight will soothe it.',
  'Mental wellness is pristine today. Your spiritual practices are directly feeding your physical aura.',
  'Avoid cold water and dry snacks. Warm, liquid food will nurture your elements beautifully.'
];

const LOVE_POOL = [
  'Speak from a place of deep listening. A family member needs your silent presence more than your advice.',
  'A beautiful harmony is descending on your relationships. Express your gratitude openly today.',
  'Subtle miscommunication could arise in the afternoon. Clarify details gently rather than assuming.',
  'Your heart is open and radiating warmth. Reach out to an old friend you have not called in months.',
  'Nurture the bond of your lineage. Share a story of an ancestor or elder with a younger relative.',
  'A quiet evening at home with your loved ones will recharge your emotional battery completely.'
];

export function getDailyHoroscope(rashiKey: string, date: Date = new Date()): RashiHoroscope {
  const rashi = RASHI_LIST.find(r => r.key === rashiKey) ?? RASHI_LIST[0];
  
  // Create a daily unique seed: e.g. "aries-2026-05-17"
  const dateString = date.toISOString().split('T')[0];
  const seedKey = `${rashi.key}-${dateString}`;
  const rand = createSeededRandom(seedKey);

  // Pick seeded indices
  const luckyColor = COLORS[Math.floor(rand() * COLORS.length)];
  const luckyNumber = Math.floor(rand() * 9) + 1;
  const luckyTime = TIMES[Math.floor(rand() * TIMES.length)];

  const sadhanaFocus = SADHANA_POOL[Math.floor(rand() * SADHANA_POOL.length)];
  const karma = KARMA_POOL[Math.floor(rand() * KARMA_POOL.length)];
  const health = HEALTH_POOL[Math.floor(rand() * HEALTH_POOL.length)];
  const love = LOVE_POOL[Math.floor(rand() * LOVE_POOL.length)];

  return {
    rashi: rashi.en,
    rashiSanskrit: rashi.sa,
    symbol: rashi.symbol,
    lord: rashi.lord,
    luckyColor,
    luckyNumber,
    luckyTime,
    sadhanaFocus,
    karma,
    health,
    love,
  };
}
