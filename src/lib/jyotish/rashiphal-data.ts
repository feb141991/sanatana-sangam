// ─── Rashiphal (Daily Horoscope) Generator ──────────────────────────────────
// Transit-led daily guidance using sidereal graha positions referenced to the
// selected Chandra rashi. This is intentionally a light guidance layer and
// should not be presented as a full personal Jyotish reading without Kundali.
// ─────────────────────────────────────────────────────────────────────────────

import { detectSadeSati, getTransitsForDate, type GrahaPosition } from './astro-engine';
import { localSpiritualDate } from '@/lib/sacred-time';

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
  
  // Guidance features
  shloka:            string;
  shlokaTranslation: string;
  panditAiOracle:    string; // Backward-compatible field; now deterministic guidance summary
  beejaMantra:       string; // Planet sound resonance mantra
  beejaFrequency:    number; // Legacy field; UI should not frame this as a scientific claim
  gocharSummary:     string;
  moonTransit:       string;
  transitHighlights: Array<{ title: string; detail: string; tone: 'support' | 'discipline' | 'neutral' }>;
  sadhanaPlan:       Array<{ label: string; action: string }>;
  accuracyNote:      string;
}

export const RASHI_LIST = [
  { key: 'aries',       en: 'Aries',       sa: 'Mesha',      symbol: '🐏', lord: 'Mars (Mangal)',    index: 0 },
  { key: 'taurus',      en: 'Taurus',      sa: 'Vrishabha',  symbol: '🐂', lord: 'Venus (Shukra)',   index: 1 },
  { key: 'gemini',      en: 'Gemini',      sa: 'Mithuna',    symbol: '👥', lord: 'Mercury (Budha)',  index: 2 },
  { key: 'cancer',      en: 'Cancer',      sa: 'Karka',      symbol: '🦀', lord: 'Moon (Chandra)',   index: 3 },
  { key: 'leo',         en: 'Leo',         sa: 'Simha',      symbol: '🦁', lord: 'Sun (Surya)',      index: 4 },
  { key: 'virgo',       en: 'Virgo',       sa: 'Kanya',      symbol: '🌾', lord: 'Mercury (Budha)',  index: 5 },
  { key: 'libra',       en: 'Libra',       sa: 'Tula',       symbol: '⚖️', lord: 'Venus (Shukra)',   index: 6 },
  { key: 'scorpio',     en: 'Scorpio',     sa: 'Vrishchika', symbol: '🦂', lord: 'Mars (Mangal)',    index: 7 },
  { key: 'sagittarius', en: 'Sagittarius', sa: 'Dhanu',      symbol: '🏹', lord: 'Jupiter (Guru)',   index: 8 },
  { key: 'capricorn',   en: 'Capricorn',   sa: 'Makara',     symbol: '🐊', lord: 'Saturn (Shani)',   index: 9 },
  { key: 'aquarius',    en: 'Aquarius',    sa: 'Kumbha',     symbol: '🏺', lord: 'Saturn (Shani)',   index: 10 },
  { key: 'pisces',      en: 'Pisces',      sa: 'Meena',      symbol: '🐟', lord: 'Jupiter (Guru)',   index: 11 },
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

const COLORS_BY_TONE: Record<'support' | 'discipline' | 'neutral', string> = {
  support: 'Tulsi Green',
  discipline: 'Saffron Gold',
  neutral: 'Ivory White',
};

const TIME_WINDOWS: Record<number, string> = {
  1: 'Sunrise window',
  4: 'Morning grounding',
  5: 'Mid-morning study',
  7: 'Relationship hour',
  9: 'Guru time',
  10: 'Work peak',
  12: 'Quiet evening',
};

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'self, vitality, confidence, and body',
  2: 'speech, food, family, and savings',
  3: 'courage, effort, siblings, and communication',
  4: 'home, mother, emotional peace, and property',
  5: 'study, mantra, children, creativity, and purva punya',
  6: 'health discipline, service, debts, and obstacles',
  7: 'partnerships, public dealings, and agreements',
  8: 'transformation, secrecy, research, and vulnerability',
  9: 'guru, dharma, blessings, father, and higher learning',
  10: 'karma, profession, reputation, and public duty',
  11: 'gains, network, elder siblings, and fulfilment',
  12: 'rest, expenditure, moksha, sleep, and foreign links',
};

function houseFromRashi(transitRashiIndex: number, referenceRashiIndex: number): number {
  return ((transitRashiIndex - referenceRashiIndex + 12) % 12) + 1;
}

function ordinal(house: number): string {
  return `${house}${house === 1 ? 'st' : house === 2 ? 'nd' : house === 3 ? 'rd' : 'th'}`;
}

function grahaTone(planet: string, house: number): 'support' | 'discipline' | 'neutral' {
  if (planet === 'Guru' && [1, 2, 5, 7, 9, 11].includes(house)) return 'support';
  if (planet === 'Shukra' && [1, 4, 5, 7, 9, 11].includes(house)) return 'support';
  if (planet === 'Shani' && [3, 6, 10, 11].includes(house)) return 'support';
  if (planet === 'Shani' && [1, 2, 4, 8, 12].includes(house)) return 'discipline';
  if (['Mangal', 'Rahu', 'Ketu'].includes(planet) && [1, 4, 7, 8, 12].includes(house)) return 'discipline';
  return 'neutral';
}

function buildTransitHighlights(
  rashiIndex: number,
  transits: Record<string, GrahaPosition>,
): RashiHoroscope['transitHighlights'] {
  const selected = ['Chandra', 'Guru', 'Shani', 'Mangal', 'Rahu', 'Ketu'];
  return selected
    .filter(p => transits[p])
    .map(planet => {
      const pos = transits[planet];
      const house = houseFromRashi(pos.rashiIndex, rashiIndex);
      const tone = grahaTone(planet, house);
      return {
        title: `${planet} in ${ordinal(house)} from ${RASHI_LIST[rashiIndex].sa}`,
        detail: `${planet} activates ${HOUSE_MEANINGS[house]}. ${tone === 'support' ? 'Use this for constructive action.' : tone === 'discipline' ? 'Move slowly and keep discipline.' : 'Keep the day balanced and observational.'}`,
        tone,
      };
    });
}

function buildLifeGuidance(
  rashiIndex: number,
  transits: Record<string, GrahaPosition>,
): Pick<RashiHoroscope, 'karma' | 'health' | 'love' | 'sadhanaFocus' | 'luckyColor' | 'luckyNumber' | 'luckyTime'> {
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashiIndex);
  const guruHouse = houseFromRashi(transits.Guru.rashiIndex, rashiIndex);
  const shaniHouse = houseFromRashi(transits.Shani.rashiIndex, rashiIndex);
  const shukraHouse = houseFromRashi(transits.Shukra.rashiIndex, rashiIndex);
  const mangalHouse = houseFromRashi(transits.Mangal.rashiIndex, rashiIndex);

  const primaryTone = grahaTone('Shani', shaniHouse);
  const supportTone = grahaTone('Guru', guruHouse);

  let karma = 'Keep work practical and measured. Finish what is already in motion before widening commitments.';
  if ([10, 11].includes(shaniHouse) || [9, 10, 11].includes(guruHouse)) {
    karma = 'Duty and output are better supported today. Prioritise one meaningful task and complete it cleanly.';
  } else if ([6, 8, 12].includes(shaniHouse) || [8, 12].includes(moonHouse)) {
    karma = 'Do not over-interpret delays. Use the day for maintenance, documentation, and disciplined follow-through.';
  }

  let health = 'Preserve steadiness in food, sleep, and breath. A modest routine will help more than intensity.';
  if ([6, 8, 12].includes(moonHouse) || [6, 8].includes(mangalHouse)) {
    health = 'The chart points to lower resilience today. Reduce overstimulation, eat warm food, and protect sleep quality.';
  } else if ([1, 5, 9].includes(moonHouse) && [3, 6, 11].includes(mangalHouse)) {
    health = 'Energy is responsive today. Light movement, pranayama, and hydration will land well.';
  }

  let love = 'Keep communication gentle and unhurried. Clarity matters more than emotional volume.';
  if ([5, 7, 11].includes(shukraHouse) && [1, 5, 9].includes(moonHouse)) {
    love = 'Relationships are more receptive today. Appreciation, softness, and deliberate presence will be well received.';
  } else if ([6, 8, 12].includes(shukraHouse) || [8, 12].includes(moonHouse)) {
    love = 'Avoid forcing emotional closure today. Listen first and let sensitive conversations breathe.';
  }

  let sadhanaFocus = 'Keep practice simple: one clear sankalpa, a short japa round, and a little silence.';
  if ([5, 9].includes(moonHouse) || [9, 11].includes(guruHouse)) {
    sadhanaFocus = 'The devotional and study current is stronger today. Give time to mantra, svadhyaya, or gratitude journaling.';
  } else if ([8, 12].includes(moonHouse) || [1, 2, 12].includes(shaniHouse)) {
    sadhanaFocus = 'The day favours quieter sadhana. Reduce noise, take fewer inputs, and return to breath and mantra.';
  } else if ([3, 6, 10, 11].includes(shaniHouse)) {
    sadhanaFocus = 'Make discipline itself the practice today. Complete one neglected duty as an offering rather than a burden.';
  }

  return {
    karma,
    health,
    love,
    sadhanaFocus,
    luckyColor: COLORS_BY_TONE[supportTone === 'support' ? 'support' : primaryTone],
    luckyNumber: moonHouse,
    luckyTime: TIME_WINDOWS[guruHouse] ?? 'Steady daytime routine',
  };
}

function buildSadhanaPlan(rashiKey: string, transits: Record<string, GrahaPosition>, rashiIndex: number): RashiHoroscope['sadhanaPlan'] {
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashiIndex);
  const saturnHouse = houseFromRashi(transits.Shani.rashiIndex, rashiIndex);
  const shlokaKey = SHLOKA_MAP[rashiKey] ?? 'surya';
  const beejaData = BEEJA_MANTRAS[shlokaKey] ?? BEEJA_MANTRAS.surya;
  return [
    {
      label: 'Moon practice',
      action: moonHouse === 5 || moonHouse === 9
        ? 'Prioritise mantra, study, and a short gratitude note.'
        : moonHouse === 8 || moonHouse === 12
          ? 'Keep practice quiet: breath, journaling, and early rest.'
          : 'Do 9 minutes of steady japa before starting work.',
    },
    {
      label: 'Discipline',
      action: [6, 10, 11].includes(saturnHouse)
        ? 'Shani supports effort today. Finish one pending duty without distraction.'
        : 'Avoid overloading the schedule. Keep one clear sankalpa.',
    },
    {
      label: 'Beeja anchor',
      action: `Chant ${beejaData.mantra} 11 or 27 times if it fits your tradition and comfort.`,
    },
  ];
}

export function getDailyHoroscope(
  rashiKey: string,
  date: Date = new Date(),
  timeZone: string = 'Asia/Kolkata',
): RashiHoroscope {
  const rashi = RASHI_LIST.find(r => r.key === rashiKey) ?? RASHI_LIST[0];
  const transits = getTransitsForDate(date);
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashi.index);
  const moonTransit = `Chandra is transiting ${transits.Chandra.rashiName}, ${ordinal(moonHouse)} from ${rashi.sa}.`;
  const highlights = buildTransitHighlights(rashi.index, transits);
  const sadeSati = detectSadeSati(rashi.index, transits.Shani.rashiIndex);
  const { luckyColor, luckyNumber, luckyTime, sadhanaFocus, karma, health, love } = buildLifeGuidance(rashi.index, transits);

  // Resolve Shloka
  const shlokaKey = SHLOKA_MAP[rashi.key] ?? 'surya';
  const shlokaData = SHLOKAS[shlokaKey];

  // Resolve Pandit AI Channeled Oracle
  const primary = highlights[0];
  const guruHouse = houseFromRashi(transits.Guru.rashiIndex, rashi.index);
  const shaniHouse = houseFromRashi(transits.Shani.rashiIndex, rashi.index);
  const spiritualDate = localSpiritualDate(timeZone, 4, date);
  const baseInsight = `For ${spiritualDate}, Moon emphasizes ${HOUSE_MEANINGS[moonHouse]}, Guru works through the ${ordinal(guruHouse)} house, and Shani presses through the ${ordinal(shaniHouse)} house from your Chandra rashi.`;
  const panditAiOracle = `${baseInsight} ${primary?.detail ?? ''} ${sadeSati.isActive ? `Sade Sati remains active in the ${sadeSati.phase} phase, so patience and duty matter more than speed.` : 'Saturn is not triggering Sade Sati from the current transit position.'}`;

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
    beejaFrequency: beejaData.freq,
    gocharSummary: `This daily read is derived from live sidereal graha transits, with ${rashi.sa} treated as the reference Chandra rashi. Guidance is general until connected to a saved Kundali.`,
    moonTransit,
    transitHighlights: highlights,
    sadhanaPlan: buildSadhanaPlan(rashi.key, transits, rashi.index),
    accuracyNote: 'This is a Chandra-rashi transit layer, not a personal chart reading. For precise guidance, combine it with the user’s saved Kundali, dasha, and exact Moon/Lagna.',
  };
}
