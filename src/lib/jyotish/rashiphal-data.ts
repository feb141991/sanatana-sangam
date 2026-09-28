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
  transitHighlights: Array<{ title: string; detail: string; tone: 'support' | 'discipline' | 'neutral'; structure?: Array<'kendra' | 'trikona' | 'upachaya' | 'dusthana'> }>;
  sadhanaPlan:       Array<{ label: string; action: string }>;
  accuracyNote:      string;
  // Only present when the caller opted into useDistinctGuidance (native's
  // REST route). Absent for the PWA's direct getDailyHoroscope() call.
  dashaContext?:       { planet: string; endDate: string; note: string } | null;
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

// ── Distinct planet-in-house content (native-only opt-in) ───────────────────────
// HOUSE_MEANINGS/grahaTone above are left untouched -- the PWA
// (src/app/(main)/rashiphala/RashiphalClient.tsx) calls getDailyHoroscope
// directly and must see byte-identical output, per an explicit standing
// direction to stop PWA development. This table and getHouseStructure below
// are additive: only reached when a caller passes { useDistinctGuidance:
// true } to getDailyHoroscope (currently only
// src/app/api/jyotish/rashiphal/route.ts does).
//
// Fixes the reported bug: the legacy template above reads
// `${planet} activates ${HOUSE_MEANINGS[house]}`, keyed only by house number
// -- two different planets sharing a house (and grahaTone's coarse tone
// buckets) produce near-identical text. This table is keyed by BOTH planet
// and house, so every one of the 72 combinations has its own text.
//
// Content status: first-pass synthesis (not a transcription of a named
// classical source) -- see docs/ link in the PR/commit this ships with.
// Stays draft until a Jyotish-literate reviewer approves it and records
// which tradition it follows. Completeness/distinctness are enforced by the
// type below and by rashiphal-data.test.ts; neither validates astrological
// correctness.
export type GuidancePlanet = 'Chandra' | 'Guru' | 'Shani' | 'Mangal' | 'Rahu' | 'Ketu';
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const PLANET_HOUSE_GUIDANCE: Record<GuidancePlanet, Record<HouseNumber, { text: string; tone: 'support' | 'discipline' | 'neutral' }>> = {
  Chandra: {
    1: { text: "The mind sits close to the surface -- your mood shapes how you come across more than usual today. Let feelings pass rather than acting on the first one.", tone: 'neutral' },
    2: { text: "Emotion colours your words and appetite. A gentler tone at home and mindful eating serve you better than either restraint or indulgence.", tone: 'neutral' },
    3: { text: "Communication flows more easily and a sibling or close friend may need a listening ear. Courage today is quiet rather than bold.", tone: 'support' },
    4: { text: "This is Chandra's own domain -- home, mother, and inner comfort matter more than usual. Protect time for rest and familiar surroundings.", tone: 'support' },
    5: { text: "Intuition and devotional feeling run stronger than analysis. A short mantra practice or time with children will feel unusually rewarding.", tone: 'support' },
    6: { text: "Small irritations may feel larger than they are. Answer them with routine and quiet service rather than argument.", tone: 'support' },
    7: { text: "Emotional exchange with others is heightened -- listen for what's underneath the words in any conversation or agreement today.", tone: 'neutral' },
    8: { text: "The mind turns inward and old feelings may surface unexpectedly. Avoid major emotional decisions; let what comes up settle first.", tone: 'discipline' },
    9: { text: "A natural pull toward meaning and guidance today. Time with a teacher, sacred text, or father figure will feel especially settling.", tone: 'support' },
    10: { text: "How you feel may show more visibly at work than you'd like. Keep responses measured -- your standing is more exposed to mood today.", tone: 'neutral' },
    11: { text: "Emotional warmth in friendships and community brings real fulfilment today. A gathering or shared goal will feel nourishing.", tone: 'support' },
    12: { text: "The mind wants withdrawal, not engagement. Honour the pull toward rest, quiet reflection, or a longer sleep tonight.", tone: 'discipline' },
  },
  Guru: {
    1: { text: "Confidence and optimism expand today -- you carry yourself with unusual faith in your own path. Don't let it tip into overreach.", tone: 'support' },
    2: { text: "Words land with more weight and generosity today; a good day for honest, encouraging conversation and steady saving.", tone: 'support' },
    3: { text: "Effort meets good fortune but Guru is subdued here for initiative -- pace yourself rather than pushing hard.", tone: 'neutral' },
    4: { text: "Domestic life and a sense of contentment at home are supported. A good day to invest in comfort or a family matter.", tone: 'support' },
    5: { text: "One of Guru's strongest placements -- study, teaching, mantra, and matters concerning children are all favoured today.", tone: 'support' },
    6: { text: "Jupiter here can inflate rather than resolve difficulties -- be wary of over-optimism about health, debt, or a dispute.", tone: 'discipline' },
    7: { text: "A genuinely favourable day for partnership, negotiation, and any agreement that needs goodwill and fair dealing.", tone: 'support' },
    8: { text: "Guru's expansiveness meets a private, sensitive house -- insight into deeper matters is available, but keep findings to yourself for now.", tone: 'neutral' },
    9: { text: "Jupiter in its own domain of dharma -- a strong day for guidance, pilgrimage, higher study, or reconnecting with a teacher or father figure.", tone: 'support' },
    10: { text: "Recognition and goodwill in your work are supported today. A fair, generous approach to duty will be noticed.", tone: 'support' },
    11: { text: "One of the most favourable placements for Guru -- gains, useful connections, and a sense of fulfilment are all supported.", tone: 'support' },
    12: { text: "Generosity may run ahead of prudence in spending today. Channel the expansive feeling into charity or practice rather than outlay.", tone: 'discipline' },
  },
  Shani: {
    1: { text: "Saturn presses on self-confidence and energy today -- move at a measured pace and don't judge yourself by today's mood alone.", tone: 'discipline' },
    2: { text: "Watch clipped or harsh words, and keep spending conservative. A restrained day for speech and money both.", tone: 'discipline' },
    3: { text: "Steady, unglamorous effort pays off today -- this is a placement where discipline is actually rewarded.", tone: 'support' },
    4: { text: "Home life may feel heavier or more restrictive than usual. Tend to a practical duty there rather than an emotional one.", tone: 'discipline' },
    5: { text: "Creative and devotional energy feels blocked or effortful today -- persistence in a simple practice matters more than inspiration.", tone: 'discipline' },
    6: { text: "One of Saturn's better placements -- real, durable progress against a health routine, a debt, or a longstanding obstacle is possible today.", tone: 'support' },
    7: { text: "Relationships and negotiations demand patience and realism today -- don't expect warmth, expect fairness.", tone: 'neutral' },
    8: { text: "A genuinely heavy placement -- avoid major decisions involving risk, inheritance, or deep transformation today.", tone: 'discipline' },
    9: { text: "Faith and guidance are tested rather than freely given today. Duty to a father figure or tradition may ask more than usual.", tone: 'discipline' },
    10: { text: "Another of Saturn's strong placements -- sustained, disciplined work builds real standing today, even if progress feels slow.", tone: 'support' },
    11: { text: "Saturn supports gains that come from persistence rather than luck -- an older colleague or long-standing connection may help.", tone: 'support' },
    12: { text: "A heavy, withdrawing placement -- expenses or losses may need careful handling, and solitude will serve you more than socialising.", tone: 'discipline' },
  },
  Mangal: {
    1: { text: "Energy and initiative run high today -- channel it into direct action rather than letting frustration take the lead.", tone: 'discipline' },
    2: { text: "Speech can turn sharp under this transit -- watch tone in family conversations and avoid impulsive spending.", tone: 'neutral' },
    3: { text: "A genuinely strong placement for Mars -- courage, effort, and directness with siblings or colleagues are well supported today.", tone: 'support' },
    4: { text: "Friction at home or over property is more likely today -- address it calmly rather than letting irritation build.", tone: 'discipline' },
    5: { text: "Restlessness may cut into focus for study or creative work -- physical activity first will help concentration follow.", tone: 'neutral' },
    6: { text: "One of Mars's best placements -- real courage and energy to clear a health issue, debt, or obstacle through direct action.", tone: 'support' },
    7: { text: "Conflict or competitiveness in partnerships is more likely -- choose your battles, and let go of the ones that don't matter.", tone: 'discipline' },
    8: { text: "A volatile placement -- avoid risk-taking or arguments, and sharp tools and vehicles need extra care today.", tone: 'discipline' },
    9: { text: "Energy toward belief or duty may come out as impatience rather than conviction -- temper zeal with respect for tradition.", tone: 'neutral' },
    10: { text: "Drive and initiative in work are well supported -- a good day to push a stalled project forward with direct effort.", tone: 'support' },
    11: { text: "Assertive pursuit of a goal pays off today -- a direct approach with an elder sibling or ally works better than a passive one.", tone: 'support' },
    12: { text: "Restlessness disturbs rest and can lead to accidents from impatience -- slow down deliberately before sleep.", tone: 'discipline' },
  },
  Rahu: {
    1: { text: "An unusual restlessness or hunger for something more colours your self-image today -- question whether the desire is really yours.", tone: 'discipline' },
    2: { text: "Exaggeration or overstatement is likely in speech and spending today -- double-check facts and figures before committing to either.", tone: 'discipline' },
    3: { text: "Bold, unconventional ideas and outreach are favoured today -- Rahu supports ambition here more than it disturbs it.", tone: 'support' },
    4: { text: "A pull toward disruption or dissatisfaction at home is possible -- resist the urge to make a big domestic decision today.", tone: 'discipline' },
    5: { text: "Focus and clarity in study or with children can feel clouded by distraction -- an unconventional approach may still work if kept simple.", tone: 'discipline' },
    6: { text: "A supportive placement for Rahu -- sharp, unconventional strategy can genuinely help resolve a debt or obstacle today.", tone: 'support' },
    7: { text: "Read the fine print today -- Rahu here can bring an agreement or relationship that isn't quite what it appears.", tone: 'discipline' },
    8: { text: "Sudden or hidden developments are more likely -- avoid speculation and keep sensitive matters private for now.", tone: 'discipline' },
    9: { text: "Unconventional beliefs or a foreign teacher may attract you today -- stay grounded in your own tradition before adopting a new one.", tone: 'discipline' },
    10: { text: "Ambition for status or a shortcut to recognition is strong today -- pursue it honestly, or the gain may not last.", tone: 'discipline' },
    11: { text: "One of Rahu's genuinely favourable placements -- unconventional networks and sudden gains are supported today.", tone: 'support' },
    12: { text: "A pull toward escapism, foreign travel, or overspending is stronger today -- channel restlessness into planning rather than impulse.", tone: 'discipline' },
  },
  Ketu: {
    1: { text: "A quiet detachment from your usual sense of self is likely today -- don't mistake it for low confidence; it can be clarity in disguise.", tone: 'neutral' },
    2: { text: "Words may come out clipped or minimal today, and appetite for food and material comfort may dip -- simplicity suits the day.", tone: 'neutral' },
    3: { text: "Motivation for ordinary effort or outreach feels thin today -- Ketu withdraws energy here rather than fuelling it.", tone: 'discipline' },
    4: { text: "A pull toward solitude even at home is likely -- don't read this as a problem with family, just a need for quiet.", tone: 'neutral' },
    5: { text: "Subtle spiritual insight is unusually accessible today -- meditation or silent practice will yield more than active study.", tone: 'support' },
    6: { text: "A supportive placement -- Ketu's detachment helps you let go of a health worry, debt, or conflict rather than feed it.", tone: 'support' },
    7: { text: "Emotional distance in relationships or negotiations is more likely today -- don't mistake someone's quiet for disinterest.", tone: 'neutral' },
    8: { text: "A naturally aligned placement for Ketu -- deep insight into hidden or transformative matters is available if you slow down enough to receive it.", tone: 'support' },
    9: { text: "A strong pull toward renunciation, pilgrimage, or the deeper end of your tradition is present today -- follow it if it calls.", tone: 'support' },
    10: { text: "Ambition for recognition feels low today -- this can be a good day to work quietly rather than seek credit.", tone: 'neutral' },
    11: { text: "Material gain may feel less satisfying than usual, even if it comes -- look instead for what feels genuinely meaningful today.", tone: 'neutral' },
    12: { text: "One of Ketu's most natural placements -- withdrawal, rest, and spiritual reflection are strongly supported today.", tone: 'support' },
  },
};

// Parashari structural classification (Kendra/Trikona/Upachaya/Dusthana) --
// the near-universal convention across Jyotish reference works, not pinned to
// a single unverified page/verse citation. Houses genuinely overlap
// categories (10th is both Kendra and Upachaya; 6th is both Upachaya and
// Dusthana), so this returns a list, never a single tag -- and a house
// outside all four groups (2nd) returns an empty list, not "neutral": absence
// of a classification isn't itself a classification.
//
// House 1 is the one disputed case seen across sources during this feature's
// review: one convention treats it as both Kendra and Trikona; a citation of
// Phaladeepika's definitions raised in review calls it Kendra only. Neither
// has been independently verified against the source text. Shipped here as
// Kendra-only (the narrower claim) pending the same human Jyotish-review gate
// as PLANET_HOUSE_GUIDANCE above -- do not resolve this dispute by picking
// the other convention without that review.
export function getHouseStructure(house: HouseNumber): Array<'kendra' | 'trikona' | 'upachaya' | 'dusthana'> {
  const tags: Array<'kendra' | 'trikona' | 'upachaya' | 'dusthana'> = [];
  if (house === 1 || house === 4 || house === 7 || house === 10) tags.push('kendra');
  if (house === 5 || house === 9) tags.push('trikona');
  if (house === 3 || house === 6 || house === 10 || house === 11) tags.push('upachaya');
  if (house === 6 || house === 8 || house === 12) tags.push('dusthana');
  return tags;
}

interface DashaTimelineEntry {
  planet?: unknown;
  startDate?: unknown;
  endDate?: unknown;
}

/**
 * Finds the Dasha entry active as of `date` from a birth_profiles row's
 * stored `chart_data` (the full serialized AstroChart, schemaVersion 2 --
 * see src/lib/jyotish/astro-engine.ts). Never trusts the denormalized
 * current_dasha_planet/current_dasha_end_date columns, which are a snapshot
 * taken when the chart was generated and never advance on their own -- a
 * profile generated years ago can have a "current" Dasha that ended long
 * ago. Returns null (never throws) on any malformed/missing/out-of-range
 * shape, so a bad or legacy chart_data blob degrades to "no personalization"
 * rather than a stale guess or a 500.
 */
export function findActiveDashaEntry(chartData: unknown, date: Date): { planet: string; endDate: string } | null {
  if (!chartData || typeof chartData !== 'object') return null;
  const timeline = (chartData as { dasha?: { timeline?: unknown } }).dasha?.timeline;
  if (!Array.isArray(timeline)) return null;

  const iso = date.toISOString();
  for (const raw of timeline as DashaTimelineEntry[]) {
    const planet = raw?.planet;
    const startDate = raw?.startDate;
    const endDate = raw?.endDate;
    if (typeof planet !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') continue;
    if (startDate <= iso && iso < endDate) {
      return { planet, endDate };
    }
  }
  return null;
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
  useDistinctGuidance: boolean,
): RashiHoroscope['transitHighlights'] {
  const selected = ['Chandra', 'Guru', 'Shani', 'Mangal', 'Rahu', 'Ketu'];
  return selected
    .filter(p => transits[p])
    .map(planet => {
      const pos = transits[planet];
      const house = houseFromRashi(pos.rashiIndex, rashiIndex);
      if (useDistinctGuidance) {
        const entry = PLANET_HOUSE_GUIDANCE[planet as GuidancePlanet][house as HouseNumber];
        return {
          title: `${planet} in ${ordinal(house)} from ${RASHI_LIST[rashiIndex].sa}`,
          detail: entry.text,
          tone: entry.tone,
          structure: getHouseStructure(house as HouseNumber),
        };
      }
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
  useDistinctGuidance: boolean,
): Pick<RashiHoroscope, 'karma' | 'health' | 'love' | 'sadhanaFocus' | 'luckyColor' | 'luckyNumber' | 'luckyTime'> {
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashiIndex);
  const guruHouse = houseFromRashi(transits.Guru.rashiIndex, rashiIndex);
  const shaniHouse = houseFromRashi(transits.Shani.rashiIndex, rashiIndex);
  const shukraHouse = houseFromRashi(transits.Shukra.rashiIndex, rashiIndex);
  const mangalHouse = houseFromRashi(transits.Mangal.rashiIndex, rashiIndex);

  // luckyColor's tone source matches whichever table transitHighlights used
  // for this response, so the swatch never disagrees with the card text.
  const primaryTone = useDistinctGuidance
    ? PLANET_HOUSE_GUIDANCE.Shani[shaniHouse as HouseNumber].tone
    : grahaTone('Shani', shaniHouse);
  const supportTone = useDistinctGuidance
    ? PLANET_HOUSE_GUIDANCE.Guru[guruHouse as HouseNumber].tone
    : grahaTone('Guru', guruHouse);

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
  date: Date,
  timeZone: string,
  // Default {} preserves today's exact output -- the PWA
  // (src/app/(main)/rashiphala/RashiphalClient.tsx) calls this with no 4th
  // argument and must see byte-identical results. Only native's REST route
  // (src/app/api/jyotish/rashiphal/route.ts) passes useDistinctGuidance: true.
  options: { dashaContext?: { planet: string; endDate: string; note: string } | null; useDistinctGuidance?: boolean } = {},
): RashiHoroscope {
  const { dashaContext = null, useDistinctGuidance = false } = options;
  const rashi = RASHI_LIST.find(r => r.key === rashiKey) ?? RASHI_LIST[0];
  const transits = getTransitsForDate(date);
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashi.index);
  const moonTransit = `Chandra is transiting ${transits.Chandra.rashiName}, ${ordinal(moonHouse)} from ${rashi.sa}.`;
  const highlights = buildTransitHighlights(rashi.index, transits, useDistinctGuidance);
  const sadeSati = detectSadeSati(rashi.index, transits.Shani.rashiIndex);
  const { luckyColor, luckyNumber, luckyTime, sadhanaFocus, karma, health, love } = buildLifeGuidance(rashi.index, transits, useDistinctGuidance);

  // Resolve Shloka
  const shlokaKey = SHLOKA_MAP[rashi.key] ?? 'surya';
  const shlokaData = SHLOKAS[shlokaKey];

  // Resolve Pandit AI Channeled Oracle
  const primary = highlights[0];
  const guruHouse = houseFromRashi(transits.Guru.rashiIndex, rashi.index);
  const shaniHouse = houseFromRashi(transits.Shani.rashiIndex, rashi.index);
  const spiritualDate = localSpiritualDate(timeZone, 4, date);
  const moonEmphasis = useDistinctGuidance ? PLANET_HOUSE_GUIDANCE.Chandra[moonHouse as HouseNumber].text : HOUSE_MEANINGS[moonHouse];
  const baseInsight = `For ${spiritualDate}, Moon emphasizes ${moonEmphasis}, Guru works through the ${ordinal(guruHouse)} house, and Shani presses through the ${ordinal(shaniHouse)} house from your Chandra rashi.`;
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
    ...(useDistinctGuidance ? { dashaContext } : {}),
  };
}
