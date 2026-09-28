// ─── Rashiphal (Daily Horoscope) Generator ──────────────────────────────────
// Transit-led daily guidance using sidereal graha positions referenced to the
// selected Chandra rashi. This is intentionally a light guidance layer and
// should not be presented as a full personal Jyotish reading without Kundali.
// ─────────────────────────────────────────────────────────────────────────────

import { ASTRO_CHART_SCHEMA_VERSION, DASHA_ORDER, detectSadeSati, getTransitsForDate, type GrahaPosition } from './astro-engine';
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

// `tone` is an editorial display cue only. It is not a classical dignity,
// prediction, or input to lucky-color or other calculations.
export const PLANET_HOUSE_GUIDANCE: Record<GuidancePlanet, Record<HouseNumber, { text: string; tone: 'support' | 'discipline' | 'neutral' }>> = {
  Chandra: {
    1: { text: "The mind sits close to the surface -- your mood shapes how you come across more than usual today. Let feelings pass rather than acting on the first one.", tone: 'neutral' },
    2: { text: "Emotion may colour your words. A gentler tone in close conversations can help you express yourself clearly.", tone: 'neutral' },
    3: { text: "Communication may feel more natural; listening patiently can help a conversation. Courage today can be quiet rather than bold.", tone: 'support' },
    4: { text: "Home and inner comfort may draw more attention than usual. Make room for rest and familiar surroundings if that feels helpful.", tone: 'support' },
    5: { text: "Intuition and devotional feeling may be more noticeable than analysis. A short mantra practice can offer a gentle focus.", tone: 'support' },
    6: { text: "Small irritations may feel larger than they are. A steady routine and quiet service can help you respond without argument.", tone: 'neutral' },
    7: { text: "Emotional exchange with others is heightened -- listen for what's underneath the words in any conversation or agreement today.", tone: 'neutral' },
    8: { text: "The mind turns inward and old feelings may surface unexpectedly. Avoid major emotional decisions; let what comes up settle first.", tone: 'discipline' },
    9: { text: "A natural pull toward meaning and guidance may arise. Time with a teacher or sacred text can offer a grounding perspective.", tone: 'support' },
    10: { text: "Your emotional tone may color how you approach responsibilities. A pause before responding can help keep choices measured.", tone: 'neutral' },
    11: { text: "Emotional warmth in friendships and community brings real fulfilment today. A gathering or shared goal will feel nourishing.", tone: 'support' },
    12: { text: "The mind wants withdrawal, not engagement. Honour the pull toward rest, quiet reflection, or a longer sleep tonight.", tone: 'discipline' },
  },
  Guru: {
    1: { text: "Confidence and optimism expand today -- you carry yourself with unusual faith in your own path. Don't let it tip into overreach.", tone: 'support' },
    2: { text: "Words may carry extra warmth and weight. Honest, encouraging conversation can help you express what matters clearly.", tone: 'support' },
    3: { text: "General transit readings treat Guru here as quieter for initiative. Pace yourself and give steady effort room to develop.", tone: 'neutral' },
    4: { text: "A reflective focus on home and contentment may be welcome. Give a family matter or domestic task patient attention.", tone: 'support' },
    5: { text: "Study, teaching, mantra, and creative learning are traditional themes associated with Guru here. Choose one to explore with care.", tone: 'support' },
    6: { text: "When a task feels complex, avoid assuming that optimism alone will resolve it. Break it into steps and seek sound information.", tone: 'discipline' },
    7: { text: "If a partnership conversation or negotiation is on your mind, clear expectations and fair dealing can support a constructive exchange.", tone: 'support' },
    8: { text: "Guru's expansive symbolism meets a private, sensitive house. Use curiosity to reflect on complex matters without rushing to conclusions.", tone: 'neutral' },
    9: { text: "Jupiter is traditionally associated with dharma and learning here. Study, reflection, or guidance from a trusted teacher may be meaningful.", tone: 'support' },
    10: { text: "Bring fairness and generosity to your responsibilities. Focus on the quality of the work rather than expecting recognition.", tone: 'support' },
    11: { text: "Community and shared aims are traditional themes for this placement. Consider which connections support meaningful, steady goals.", tone: 'support' },
    12: { text: "A generous impulse may be present. Direct it toward time, service, or practice in a way that fits your capacity.", tone: 'discipline' },
  },
  Shani: {
    1: { text: "Saturn presses on self-confidence and energy today -- move at a measured pace and don't judge yourself by today's mood alone.", tone: 'discipline' },
    2: { text: "Watch for clipped or harsh words. A measured tone can help keep close conversations constructive.", tone: 'discipline' },
    3: { text: "Steady, unglamorous effort fits this placement. Value consistency even when results are not immediate.", tone: 'support' },
    4: { text: "Home life may feel heavier or more restrictive than usual. Tend to a practical duty there rather than an emotional one.", tone: 'discipline' },
    5: { text: "Creative and devotional energy feels blocked or effortful today -- persistence in a simple practice matters more than inspiration.", tone: 'discipline' },
    6: { text: "This is traditionally counted among Saturn's more constructive transit positions. Patient, structured effort can help with a persistent responsibility.", tone: 'support' },
    7: { text: "Relationships and negotiations demand patience and realism today -- don't expect warmth, expect fairness.", tone: 'neutral' },
    8: { text: "This placement is often treated as demanding in Jyotish. Give complex changes time, verify important details, and avoid rushing a decision.", tone: 'discipline' },
    9: { text: "Questions of belief, learning, or duty may call for patience. Make room for reflection without treating uncertainty as a verdict.", tone: 'discipline' },
    10: { text: "Consistent work and patience fit this placement. Progress may be gradual, so focus on the next practical step.", tone: 'support' },
    11: { text: "Long-term aims and steady collaboration are useful themes to reflect on. Value dependable connections without assuming a particular outcome.", tone: 'support' },
    12: { text: "A quieter pace may help you review priorities. Give yourself space to reflect before drawing conclusions from a difficult mood.", tone: 'discipline' },
  },
  Mangal: {
    1: { text: "Energy and initiative run high today -- channel it into direct action rather than letting frustration take the lead.", tone: 'discipline' },
    2: { text: "Words can come out more sharply than intended. Pause before replying, especially in close conversations.", tone: 'discipline' },
    3: { text: "This is traditionally counted among Mars's more constructive transit positions. Channel courage and initiative into a clear, manageable task.", tone: 'support' },
    4: { text: "Home projects or practical responsibilities may call for extra patience. Clarify expectations and channel energy into useful tasks.", tone: 'discipline' },
    5: { text: "Restlessness may compete with study or creative focus. A brief pause or change of pace may help you reset.", tone: 'neutral' },
    6: { text: "This is traditionally counted among Mars's more constructive transit positions. Direct effort can help you work through a practical challenge.", tone: 'support' },
    7: { text: "Bring directness to partnership conversations with care. Make room for another perspective before deciding how to proceed.", tone: 'discipline' },
    8: { text: "This placement is often treated as demanding. Pause before reacting, check important details, and keep plans measured.", tone: 'discipline' },
    9: { text: "Energy toward belief or duty may come out as impatience rather than conviction -- temper zeal with respect for tradition.", tone: 'neutral' },
    10: { text: "Drive and initiative in work are well supported -- a good day to push a stalled project forward with direct effort.", tone: 'support' },
    11: { text: "A clear, purposeful approach can help you make progress on a shared goal. Keep collaboration direct and respectful.", tone: 'support' },
    12: { text: "A restless mood can make it harder to settle. A gentle wind-down and fewer late-day demands may feel supportive.", tone: 'discipline' },
  },
  Rahu: {
    1: { text: "An unusual restlessness or hunger for something more colours your self-image today -- question whether the desire is really yours.", tone: 'discipline' },
    2: { text: "A strong urge to persuade may arise. Check details and choose precise words before making a commitment.", tone: 'discipline' },
    3: { text: "Bold, unconventional ideas and outreach are favoured today -- Rahu supports ambition here more than it disturbs it.", tone: 'support' },
    4: { text: "If home plans feel unsettled, give yourself time to distinguish curiosity from urgency before choosing a next step.", tone: 'discipline' },
    5: { text: "Distraction may compete with study or creative focus. An unconventional approach can be worth exploring if you keep it simple.", tone: 'discipline' },
    6: { text: "This is traditionally treated as a more constructive Rahu transit position. Use careful, original thinking to approach a practical challenge.", tone: 'support' },
    7: { text: "Read terms carefully and ask questions when expectations are unclear. Clarity is more useful than assumption.", tone: 'discipline' },
    8: { text: "When a subject feels complex, verify information and avoid drawing conclusions before you have enough context.", tone: 'discipline' },
    9: { text: "Unconventional beliefs or a foreign teacher may attract you today -- stay grounded in your own tradition before adopting a new one.", tone: 'discipline' },
    10: { text: "Ambition for recognition may feel heightened. Choose transparent steps and realistic timelines over shortcuts.", tone: 'discipline' },
    11: { text: "New connections can introduce unfamiliar ideas. Prioritise clear expectations and shared aims over promises of quick results.", tone: 'support' },
    12: { text: "If attention feels scattered, quiet planning or reflection can help channel the urge for novelty.", tone: 'discipline' },
  },
  Ketu: {
    1: { text: "A quieter or more detached mood may arise. Treat it as a prompt for reflection, not as a verdict on your confidence.", tone: 'neutral' },
    2: { text: "Words may be fewer or more direct today. Simplicity in conversation may suit the moment.", tone: 'neutral' },
    3: { text: "Motivation for ordinary effort or outreach feels thin today -- Ketu withdraws energy here rather than fuelling it.", tone: 'discipline' },
    4: { text: "A pull toward solitude may arise, even in familiar surroundings. Treat it as a preference for quiet, not as a conclusion about others.", tone: 'neutral' },
    5: { text: "Quiet practice may feel more appealing than analysis. If it suits your tradition, try a short period of reflection or meditation.", tone: 'support' },
    6: { text: "A reflective approach may help you release attention from a recurring practical concern and focus on what is manageable now.", tone: 'support' },
    7: { text: "A quieter exchange can invite more listening. Avoid assuming you know what another person means without asking.", tone: 'neutral' },
    8: { text: "A reflective approach may help you examine a complex subject. Treat impressions as prompts for thought, not certainty.", tone: 'support' },
    9: { text: "Questions of belief or practice may invite deeper reflection. Explore at your own pace and within the boundaries of your tradition.", tone: 'support' },
    10: { text: "Recognition may feel less important than meaningful effort. Consider which responsibilities deserve your attention today.", tone: 'neutral' },
    11: { text: "Reflect on what feels meaningful beyond outward measures. Let your own priorities guide that reflection.", tone: 'neutral' },
    12: { text: "Withdrawal, rest, and spiritual reflection are traditional themes associated with Ketu here. Choose a quieter practice if it suits you.", tone: 'support' },
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
// House 1 is disputed across conventions. Keep its chip hidden until a
// Jyotish-literate reviewer approves a named source/tradition; do not resolve
// the dispute by choosing Kendra-only or Kendra+Trikona in code.
export function getHouseStructure(house: HouseNumber): Array<'kendra' | 'trikona' | 'upachaya' | 'dusthana'> {
  const tags: Array<'kendra' | 'trikona' | 'upachaya' | 'dusthana'> = [];
  if (house === 4 || house === 7 || house === 10) tags.push('kendra');
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
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  const chart = chartData as { schemaVersion?: unknown; dasha?: { timeline?: unknown } };
  if (chart.schemaVersion !== ASTRO_CHART_SCHEMA_VERSION) return null;
  const timeline = chart.dasha?.timeline;
  if (!Array.isArray(timeline)) return null;

  // AstroChart Dasha ranges are ISO calendar dates (YYYY-MM-DD), so compare
  // normalized UTC date keys rather than mixing dates with timestamps.
  const dateKey = date.toISOString().slice(0, 10);
  const isIsoDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  const matches: Array<{ planet: string; endDate: string }> = [];
  for (const raw of timeline as DashaTimelineEntry[]) {
    const planet = raw?.planet;
    const startDate = raw?.startDate;
    const endDate = raw?.endDate;
    if (typeof planet !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') continue;
    if (!DASHA_ORDER.some((knownPlanet) => knownPlanet === planet)) continue;
    if (!isIsoDate(startDate) || !isIsoDate(endDate) || startDate >= endDate) continue;
    if (startDate <= dateKey && dateKey < endDate) {
      matches.push({ planet, endDate });
    }
  }
  // Overlapping or duplicated ranges are corrupt data; fail closed rather
  // than selecting whichever entry happened to appear first in JSON.
  return matches.length === 1 ? matches[0] : null;
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
): Pick<RashiHoroscope, 'karma' | 'health' | 'love' | 'sadhanaFocus' | 'luckyColor' | 'luckyNumber' | 'luckyTime'> {
  const moonHouse = houseFromRashi(transits.Chandra.rashiIndex, rashiIndex);
  const guruHouse = houseFromRashi(transits.Guru.rashiIndex, rashiIndex);
  const shaniHouse = houseFromRashi(transits.Shani.rashiIndex, rashiIndex);
  const shukraHouse = houseFromRashi(transits.Shukra.rashiIndex, rashiIndex);
  const mangalHouse = houseFromRashi(transits.Mangal.rashiIndex, rashiIndex);

  // Keep this pre-existing decorative value independent from the editorial
  // tone tags in the Native-only content table. Those tags are not a classical
  // dignity calculation and must not silently change a lucky-color result.
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
  const { luckyColor, luckyNumber, luckyTime, sadhanaFocus, karma, health, love } = buildLifeGuidance(rashi.index, transits);

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
    health: useDistinctGuidance
      ? 'This general transit reflection cannot assess health. For medical concerns, rely on a qualified health professional; choose everyday wellbeing practices that are appropriate for you.'
      : health,
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
    accuracyNote: useDistinctGuidance
      ? 'These are general, editorial Jyotish-inspired reflections based on Chandra-rashi transits, not source quotations or certain predictions. The copy is awaiting tradition-specific human review. It is not medical, financial, legal, or safety advice, or a complete personal chart analysis.'
      : 'This is a Chandra-rashi transit layer, not a personal chart reading. For precise guidance, combine it with the user’s saved Kundali, dasha, and exact Moon/Lagna.',
    ...(useDistinctGuidance ? { dashaContext } : {}),
  };
}
