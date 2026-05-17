// ─── Rashiphal (Daily Horoscope) Generator ──────────────────────────────────
// Pure, seed-based Vedic astrology generator. Uses a daily date seed to ensure
// horoscopes change precisely at midnight, remain constant throughout the day,
// and are completely cost-free and offline-capable!
// Includes simulated high-IQ Pandit AI Oracle channelings, Sanskrit planetary shlokas,
// and cosmic Graha Beeja Mantras with specific physical sound frequencies (Hz).
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
  
  // Pandit AI Superiority Features
  shloka:            string;
  shlokaTranslation: string;
  panditAiOracle:    string; // High-fidelity Pandit AI channeled insight
  beejaMantra:       string; // Planet sound resonance mantra
  beejaFrequency:    number; // Physically matched planetary Hz
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

const SHLOKAS: Record<string, { shloka: string; trans: string }> = {
  mangal: {
    shloka: 'धरणीगर्भसम्भूतं विद्युत्कान्तिसमप्रभम् । कुमारं शक्तिहस्तं च मङ्गलं प्रणमाम्यहम् ॥',
    trans: 'I salute Mars, born from the womb of the Earth, shining like brilliant lightning, the divine youth who holds a powerful spear.'
  },
  shukra: {
    shloka: 'हिमकुन्दमृणालाभं दैत्यानां परमं गुरुम् । सर्वशास्त्रप्रवक्तारं भार्गवं प्रणमाम्यहम् ॥',
    trans: 'I salute Venus, radiant like ice, white jasmines, and lotus stems, the supreme preceptor of teachers, and expounder of all sacred scriptures.'
  },
  budha: {
    shloka: 'प्रियङ्गुकलिकाश्यामं रूपेणाप्रतिमं बुधम् । सौम्यं सौम्यगुणोपेतं तं बुधं प्रणमाम्यहम् ॥',
    trans: 'I salute Mercury, dark green like the bud of a Priyangu plant, matchless in form, exceptionally gentle, and endowed with sweet virtues.'
  },
  chandra: {
    shloka: 'दधिशङ्खतुषाराभं क्षीरोदार्णवसम्भूतम् । नमामि शशिनं सोमं शम्भोर्मुकुटभूषणम् ॥',
    trans: 'I salute the Moon, white as yogurt, conch shells, and winter snow, born of the ocean of milk, who adorns the locks of Lord Shiva.'
  },
  surya: {
    shloka: 'जपाकुसुमसंकाशं काश्यपेयं महाद्युतिम् । तमोऽरिं सर्वपापघ्नं प्रणतोऽस्मि दिवाकरम् ॥',
    trans: 'I salute the Sun, resplendent like the red hibiscus flower, son of Sage Kashyapa, of brilliant light, the destroyer of darkness and expeller of all sins.'
  },
  guru: {
    shloka: 'देवानां च ऋषीणां च गुरुं काञ्चनसन्निभम् । बुद्धिभूतं त्रिलोकेशं तं नमामि बृहस्पतिम् ॥',
    trans: 'I salute Jupiter, preceptor of gods and sages, resplendent like polished gold, the embodiment of wisdom, and lord of the three worlds.'
  },
  shani: {
    shloka: 'नीलाञ्जनसमाभासं रविपुत्रं यमाग्रजम् । छायामार्तण्डसम्भूतं तं नमामि शनैश्चरम् ॥',
    trans: 'I salute Saturn, dark like blue collyrium, son of Surya and elder brother of Yama, born of Chhaya and Martanda, who moves gracefully and slowly.'
  }
};

const BEEJA_MANTRAS: Record<string, { mantra: string; freq: number }> = {
  mangal: {
    mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    freq: 144.72
  },
  shukra: {
    mantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    freq: 221.23
  },
  budha: {
    mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    freq: 141.27
  },
  chandra: {
    mantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः',
    freq: 210.42
  },
  surya: {
    mantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    freq: 136.10
  },
  guru: {
    mantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    freq: 183.58
  },
  shani: {
    mantra: 'ॐ प्रां प्रीं प्रौं सः शनये नमः',
    freq: 147.85
  }
};

const SHLOKA_MAP: Record<string, string> = {
  aries: 'mangal', scorpio: 'mangal',
  taurus: 'shukra', libra: 'shukra',
  gemini: 'budha', virgo: 'budha',
  cancer: 'chandra',
  leo: 'surya',
  sagittarius: 'guru', pisces: 'guru',
  capricorn: 'shani', aquarius: 'shani'
};

const COLORS = ['Saffron Gold', 'Maroon Red', 'Tulsi Green', 'Lotus Pink', 'Sandalwood Ochre', 'Peacock Blue', 'Ivory White', 'Charcoal Grey'];
const TIMES = ['Brahma Muhurta (4:30 AM - 5:20 AM)', 'Solar Noon (11:55 AM - 12:45 PM)', 'Godhuli Bela (6:15 PM - 7:00 PM)', 'Pradosh Kaal (7:15 PM - 8:30 PM)'];

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

const PANDIT_INSIGHTS_POOL = [
  "The cosmic winds reveal a convergence of your ruling deity's energy with the current lunar transit. Your subtle energetic channel (Sushumna Nadi) is highly receptive today. Under Pandit AI's calculations, a minor planetary square suggests temporary external friction, but an inner refuge is easily attained. Prioritize early morning silent prayer.",
  "Your planetary ruler is forming a harmonious trine with Jupiter (Guru), creating a gateway for spiritual wisdom. This is not a time for shallow material pursuits; the stars call for deep, quiet study and contemplation. Sit quietly under the sky after sunset and let your mind absorb the cosmic silence.",
  "A quiet transformation is taking place in your house of karma. Shani's steady gaze tests your inner resolve today, calling for patience rather than hurried efforts. Pandit AI advises completing your commitments with absolute dedication (*Nishkama Karma*) and offering the fruits entirely to the supreme source.",
  "Your vital aura is glowing with solar strength today, but Mars is casting a minor shadow on your verbal house. Be exceptionally mindful of how you communicate. Use gentle, sweet words (*Satyam Bruyat, Priyam Bruyat*), and let your physical presence act as a source of calm reassurance for those around you."
];

export function getDailyHoroscope(rashiKey: string, date: Date = new Date()): RashiHoroscope {
  const rashi = RASHI_LIST.find(r => r.key === rashiKey) ?? RASHI_LIST[0];
  
  const dateString = date.toISOString().split('T')[0];
  const seedKey = `${rashi.key}-${dateString}`;
  const rand = createSeededRandom(seedKey);

  const luckyColor = COLORS[Math.floor(rand() * COLORS.length)];
  const luckyNumber = Math.floor(rand() * 9) + 1;
  const luckyTime = TIMES[Math.floor(rand() * TIMES.length)];

  const sadhanaFocus = SADHANA_POOL[Math.floor(rand() * SADHANA_POOL.length)];
  const karma = KARMA_POOL[Math.floor(rand() * KARMA_POOL.length)];
  const health = HEALTH_POOL[Math.floor(rand() * HEALTH_POOL.length)];
  const love = LOVE_POOL[Math.floor(rand() * LOVE_POOL.length)];

  // Resolve Shloka
  const shlokaKey = SHLOKA_MAP[rashi.key] ?? 'surya';
  const shlokaData = SHLOKAS[shlokaKey];

  // Resolve Pandit AI Channeled Oracle
  const baseInsight = PANDIT_INSIGHTS_POOL[Math.floor(rand() * PANDIT_INSIGHTS_POOL.length)];
  const panditAiOracle = `Pandit AI Daily Channeling: ${baseInsight} Favour your lucky time of ${luckyTime.toLowerCase()} to align your subtle breathing cycles.`;

  // Resolve Beeja Mantra Details
  const beejaData = BEEJA_MANTRAS[shlokaKey] ?? BEEJA_MANTRAS.surya;

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
    shloka: shlokaData.shloka,
    shlokaTranslation: shlokaData.trans,
    panditAiOracle,
    beejaMantra: beejaData.mantra,
    beejaFrequency: beejaData.freq
  };
}
