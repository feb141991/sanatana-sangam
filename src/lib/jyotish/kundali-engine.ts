// ─── Vedic Astrology Kundali Chart Engine ─────────────────────────────────────
// Real astronomical calculations via astro-engine.ts (astronomy-engine npm,
// Lahiri ayanamsa, Meeus ascendant, Vimshottari dasha).
// No seeds. No random. Every chart is computed from actual planetary positions.
// ─────────────────────────────────────────────────────────────────────────────

import { generateAstroChart, AstroChart, BirthInput } from './astro-engine';

export interface KundaliInput {
  name:           string;
  birthDate:      string;    // YYYY-MM-DD
  birthTime:      string;    // HH:MM (24h); pass '12:00' if unknown, set timeUnknown
  birthPlace:     string;    // Display label
  // Real-calc fields (required for accurate chart)
  lat:            number;
  lng:            number;
  timezone:       string;    // IANA e.g. 'Asia/Kolkata'
  timeUnknown?:   boolean;
}

export interface PlanetPlacement {
  name:        string;   // Surya, Chandra, Mangal, etc.
  symbol:      string;   // Su, Mo, Ma, etc.
  sign:        string;   // Sanskrit rashi name
  house:       number;   // 1-12
  degree:      string;   // e.g. "14° 32'"
  strength:    number;   // Shadbala strength proxy (50-95)
  isRetrograde?: boolean;
}

export interface KundaliResult {
  input:          KundaliInput;
  lagnaSign:      string;   // Sanskrit name
  lagnaEnglish:   string;   // English name
  lagnaNumber:    number;   // 1-12 (Mesha=1, Meena=12)
  placements:     PlanetPlacement[];
  houseReadings:  Record<number, string>;
  lagnaReading:   string;
  // Pandit AI reading
  panditAiDestinyReading: string;
  // Full computed chart (for dasha, nakshatra, etc.)
  chart:          AstroChart;
}

const RASHI_METADATA = [
  { num: 1,  sa: 'Mesha',      en: 'Aries',       ruler: 'Mangal (Mars)' },
  { num: 2,  sa: 'Vrishabha',  en: 'Taurus',      ruler: 'Shukra (Venus)' },
  { num: 3,  sa: 'Mithuna',    en: 'Gemini',       ruler: 'Budha (Mercury)' },
  { num: 4,  sa: 'Karka',      en: 'Cancer',       ruler: 'Chandra (Moon)' },
  { num: 5,  sa: 'Simha',      en: 'Leo',          ruler: 'Surya (Sun)' },
  { num: 6,  sa: 'Kanya',      en: 'Virgo',        ruler: 'Budha (Mercury)' },
  { num: 7,  sa: 'Tula',       en: 'Libra',        ruler: 'Shukra (Venus)' },
  { num: 8,  sa: 'Vrishchika', en: 'Scorpio',      ruler: 'Mangal (Mars)' },
  { num: 9,  sa: 'Dhanu',      en: 'Sagittarius',  ruler: 'Guru (Jupiter)' },
  { num: 10, sa: 'Makara',     en: 'Capricorn',    ruler: 'Shani (Saturn)' },
  { num: 11, sa: 'Kumbha',     en: 'Aquarius',     ruler: 'Shani (Saturn)' },
  { num: 12, sa: 'Meena',      en: 'Pisces',       ruler: 'Guru (Jupiter)' },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Surya:   'Su',
  Chandra: 'Mo',
  Mangal:  'Ma',
  Budha:   'Me',
  Guru:    'Ju',
  Shukra:  'Ve',
  Shani:   'Sa',
  Rahu:    'Ra',
  Ketu:    'Ke',
};

// Shadbala strength proxy — based on house position rules (not full Shadbala)
function estimateStrength(planetName: string, house: number, isRetrograde?: boolean): number {
  // Natural benefics strong in 1,4,5,7,9,10,11; natural malefics strong in 3,6,10,11
  const benefics = new Set(['Chandra', 'Budha', 'Guru', 'Shukra']);
  const isBenefic = benefics.has(planetName);
  const goodHousesB = new Set([1, 4, 5, 7, 9, 10, 11]);
  const goodHousesM = new Set([3, 6, 10, 11]);
  const isGood = isBenefic ? goodHousesB.has(house) : goodHousesM.has(house);
  const base = isGood ? 72 : 52;
  const retroBonus = isRetrograde ? 8 : 0;
  // Clamp 50–95
  return Math.max(50, Math.min(95, base + retroBonus + (house === 1 ? 5 : 0)));
}

function generatePanditAiReading(
  lagnaMeta: { num: number; sa: string; en: string; ruler: string },
  placements: PlanetPlacement[],
  chart: AstroChart
): string {
  const surya   = placements.find(p => p.name === 'Surya');
  const chandra = placements.find(p => p.name === 'Chandra');
  const nakName = chart.nakshatra?.name ?? '';
  const nakLord = chart.nakshatra?.lord ?? '';
  const dashaP  = chart.dasha?.current?.planet ?? '';

  const housePurpose: Record<number, string> = {
    1:  'shaping your vital expression and raw identity directly',
    2:  'refining your vocal purity and family legacy structure',
    3:  'infusing courage, writing ability, and creative hands-on execution',
    4:  'anchoring your subconscious joy, emotional mother-connection, and home sanctuary',
    5:  'blessing your creative merits, high intelligence, and past-life karma (*Purvapunya*)',
    6:  'testing you with daily healing discipline, service (*Seva*), and conquering obstacles',
    7:  'refining your mirrors of truth in sacred unions and close collaborations',
    8:  'opening mystical pathways of deep yogic breath, intuition, and cellular rebirth',
    9:  'revealing higher wisdom, alignment with spiritual gurus, and your ultimate destiny (*Dharma*)',
    10: 'manifesting high-quality public duty, worldly achievements, and noble accomplishments',
    11: 'multiplying community gains, wide aspirations, and noble social impact',
    12: 'dissolving the ego in solitude, dream-state illumination, and eventual liberation (*Moksha*)',
  };

  const p1 = `Pandit AI Destiny: As a soul incarnated with a ${lagnaMeta.sa} (${lagnaMeta.en}) Lagna, your lifetime's core cosmic governor is ${lagnaMeta.ruler}. This planetary ruler sets a foundational frequency of ${
    lagnaMeta.num % 2 === 0
      ? 'yin, receptive, deep, and reflective energies'
      : 'yang, dynamic, active, and pioneering energies'
  } that will continuously refine your destiny.`;

  const suryaLine = surya
    ? `Your Surya (Soul) resides in House ${surya.house}, ${housePurpose[surya.house]}.`
    : '';
  const chandraLine = chandra
    ? ` Your Chandra (Mind) is in House ${chandra.house}, ${housePurpose[chandra.house]}.`
    : '';

  const p2 = `Planetary Alignments: ${suryaLine}${chandraLine}${nakName ? ` Your birth Nakshatra is ${nakName}, lorded by ${nakLord}.` : ''}`;

  const p3 = dashaP
    ? `Dasha Period: You are currently in the ${dashaP} Mahadasha. To harmonize planetary energies, practice 11 rounds of the Beeja Mantra aligned to ${lagnaMeta.ruler.split(' ')[0]} at your home altar each morning.`
    : `To harmonize planetary energies, practice 11 rounds of the Beeja Mantra aligned to ${lagnaMeta.ruler.split(' ')[0]} at your home altar each morning.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}

const LAGNA_READINGS: Record<number, string> = {
  1:  'Aries (Mesha) Ascendant: You possess immense initiative, vitality, and leading warrior energy. Your path is to channel high passion into focused dharmic action (*Karmayoga*). Avoid impulsiveness.',
  2:  'Taurus (Vrishabha) Ascendant: Stabilizing, artistic, and steady. You possess a natural resonance with sacred environments and family values. Your lesson is to rise above material clinging.',
  3:  'Gemini (Mithuna) Ascendant: Curious, intellectual, and communicative. Your spiritual growth is accelerated by study of sacred shastras (*Jnana*) and devotional chanting. Ground your thoughts.',
  4:  'Cancer (Karka) Ascendant: Exceptionally intuitive, emotional, and nurturing. Your spiritual path is through high devotion (*Bhakti*). Create emotional peace inside your lineage network.',
  5:  'Leo (Simha) Ascendant: Majestic, noble, and self-assured. Ruled by Surya, you have a solar aura meant to light the path for others. Balance authority with deep humility.',
  6:  'Virgo (Kanya) Ascendant: Analytical, pure-hearted, and service-oriented. You naturally excel in selfless service (*Seva*). Direct your intellectual mastery toward clarifying spiritual truths.',
  7:  'Libra (Tula) Ascendant: Harmonious, diplomatic, and beauty-loving. Your path is to balance material success with inner spiritual centering. Seek truth in all relationships.',
  8:  'Scorpio (Vrishchika) Ascendant: Intense, mystical, and transformative. You have a natural affinity for esoteric sciences, deep meditation, and yogic secrets. Channel your energy to conquer desire.',
  9:  'Sagittarius (Dhanu) Ascendant: Philosophical, optimistic, and highly righteous. Ruled by Guru, you are a natural seeker of ancient wisdom and dharma. Share wisdom selflessly.',
  10: 'Capricorn (Makara) Ascendant: Disciplined, structured, and hardworking. Under Shani\'s gaze, you excel in patient spiritual endurance (*Tapasya*). Let go of control and trust divine flow.',
  11: 'Aquarius (Kumbha) Ascendant: Humanitarian, innovative, and meditative. You look at the universe through a cosmic lens. Your sadhana is blessed when working for global elevation.',
  12: 'Pisces (Meena) Ascendant: Deeply spiritual, artistic, and transcendental. You hold a natural gateway to liberation (*Moksha*) and deep meditation. Favour structured routines to keep grounded.',
};

export function generateKundali(input: KundaliInput): KundaliResult {
  // ── Real astronomical chart ─────────────────────────────────────────────────
  const birthInput: BirthInput = {
    date:        input.birthDate,
    time:        input.birthTime,
    lat:         input.lat,
    lng:         input.lng,
    timezone:    input.timezone,
    timeUnknown: input.timeUnknown,
  };

  const chart = generateAstroChart(birthInput);

  // ── Lagna (ascendant) ───────────────────────────────────────────────────────
  const lagnaRashiIndex = chart.lagna?.rashiIndex ?? 0;  // 0-based
  const lagnaNumber     = lagnaRashiIndex + 1;            // 1-based (Mesha=1)
  const lagnaMeta = RASHI_METADATA[lagnaRashiIndex] ?? RASHI_METADATA[0];

  // ── Planet placements ───────────────────────────────────────────────────────
  const PLANET_ORDER = ['Surya','Chandra','Mangal','Budha','Guru','Shukra','Shani','Rahu','Ketu'];
  const placements: PlanetPlacement[] = [];

  for (const pname of PLANET_ORDER) {
    const graha = chart.planets[pname];
    if (!graha) continue;
    const rashiMeta = RASHI_METADATA[graha.rashiIndex] ?? RASHI_METADATA[0];
    const deg  = Math.floor(graha.degreeInRashi);
    const min  = Math.round((graha.degreeInRashi - deg) * 60);
    placements.push({
      name:        pname,
      symbol:      PLANET_SYMBOLS[pname] ?? pname.slice(0, 2),
      sign:        rashiMeta.sa,
      house:       graha.house,
      degree:      `${deg}° ${min}'`,
      strength:    estimateStrength(pname, graha.house, graha.isRetrograde),
      isRetrograde: graha.isRetrograde,
    });
  }

  // ── House readings ──────────────────────────────────────────────────────────
  const houseReadings: Record<number, string> = {
    1:  `House of Self (Tanu Bhava): Occupied by ${lagnaMeta.sa}. Governs your core vitality, constitution, and worldly expression.`,
    2:  `House of Wealth & Speech (Dhana Bhava): Governed by ${RASHI_METADATA[(lagnaRashiIndex + 1) % 12].sa}. Shapes family inheritance and speech.`,
    3:  'House of Courage & Sibling (Sahaja Bhava): Aligns with inner willpower and effort. Favour energetic physical sadhana (asanas).',
    4:  'House of Mother & Joy (Sukha Bhava): Gateway to inner contentment, emotional security, and home. Keep your domestic environment sacred.',
    5:  'House of Intellect & Past Karma (Putra Bhava): Houses creative intelligence and past life merits (*Purvapunya*). Ideal for mantra recitation.',
    6:  'House of Obstacles & Health (Shatru Bhava): Represents challenges, healing, and self-discipline. Cultivate a robust morning routine.',
    7:  'House of Partners (Yuvati Bhava): Governs partnerships and marriage. Look at relationships as mirrors for inner refinement.',
    8:  'House of Longevity & Secrets (Randhra Bhava): Mystical portal of deep yogic transformation. Favour breathwork (*Pranayama*).',
    9:  'House of Wisdom & Father (Dharma Bhava): Governs higher learning, gurus, and spiritual destiny. High potential for sacred wisdom.',
    10: 'House of Career (Karma Bhava): Governs worldly accomplishments, reputation, and public duty. Dedicate your work selflessly.',
    11: 'House of Gains (Labha Bhava): Aligns with community, profits, and long-term ambitions. Support charity (*Seva*) for spiritual merit.',
    12: 'House of Solitude & Liberation (Vyaya Bhava): Gateway to dreams, subconscious, and spiritual release (*Moksha*). Excellent for meditation.',
  };

  const panditAiDestinyReading = generatePanditAiReading(lagnaMeta, placements, chart);

  return {
    input,
    lagnaSign:    lagnaMeta.sa,
    lagnaEnglish: lagnaMeta.en,
    lagnaNumber,
    placements,
    houseReadings,
    lagnaReading:          LAGNA_READINGS[lagnaNumber] ?? '',
    panditAiDestinyReading,
    chart,
  };
}

// ── SVG renderer (North Indian Diamond chart) ─────────────────────────────────
export function renderKundaliSVG(result: KundaliResult): string {
  const { lagnaNumber, placements } = result;

  const housePlanets: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) housePlanets[h] = [];
  placements.forEach(p => {
    const label = p.isRetrograde ? `${p.symbol}(R)` : p.symbol;
    housePlanets[p.house].push(label);
  });

  const getHouseRashi = (house: number) => {
    const num = ((lagnaNumber - 1 + (house - 1)) % 12) + 1;
    return RASHI_METADATA[num - 1]?.sa?.slice(0, 3) ?? num;
  };

  const housePos: Record<number, [number, number]> = {
    1: [180, 80],   2: [95, 50],   3: [50, 95],   4: [80, 180],
    5: [50, 270],   6: [95, 315],  7: [180, 295],  8: [265, 315],
    9: [315, 270], 10: [280, 180], 11: [315, 95],  12: [265, 50],
  };
  const planetPos: Record<number, [number, number]> = {
    1: [180, 115],  2: [110, 90],   3: [80, 120],  4: [115, 185],
    5: [80, 245],   6: [110, 280],  7: [180, 255],  8: [250, 280],
    9: [280, 245], 10: [245, 185], 11: [280, 120], 12: [250, 90],
  };

  const rashiLabels = Object.entries(housePos).map(([h, [x, y]]) =>
    `<text x="${x}" y="${y}" fill="#C5A059" font-size="11" font-family="'Outfit',sans-serif" font-weight="600" text-anchor="middle">${getHouseRashi(Number(h))}</text>`
  ).join('\n');

  const planetLabels = Object.entries(planetPos).map(([h, [x, y]]) => {
    const symbols = housePlanets[Number(h)];
    if (symbols.length === 0) return '';
    // Stack multiple planets vertically
    return symbols.map((sym, i) =>
      `<text x="${x}" y="${y + i * 12}" fill="#EDE8DE" font-size="10" font-family="'Outfit',sans-serif" font-weight="600" text-anchor="middle">${sym}</text>`
    ).join('\n');
  }).join('\n');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="100%" height="100%">
  <defs>
    <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5A059" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#8E5E2A" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1911" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0E0B07" stop-opacity="0.98" />
    </linearGradient>
  </defs>

  <rect width="360" height="360" rx="24" fill="url(#darkBg)" stroke="rgba(197,160,89,0.22)" stroke-width="1.5" />
  <rect x="15" y="15" width="330" height="330" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.45" />

  <line x1="15" y1="15" x2="345" y2="345" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.5" />
  <line x1="15" y1="345" x2="345" y2="15" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.5" />

  <polygon points="180,15 345,180 180,345 15,180" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.75" />

  ${rashiLabels}
  ${planetLabels}

  <path d="M180 168 L183 177 L192 180 L183 183 L180 192 L177 183 L168 180 L177 177 Z" fill="url(#goldGlow)" opacity="0.85" />
  <text x="180" y="206" fill="rgba(197,160,89,0.65)" font-size="7" font-weight="bold" letter-spacing="0.1em" text-anchor="middle">LAGNA</text>
</svg>
  `.trim();
}
