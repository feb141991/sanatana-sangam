// ─── Vedic Astrology Kundali Chart Engine ─────────────────────────────────────
// Computes sidereal zodiac sign placements, Lagna (Ascendant) sign based on
// birth details, distributes Grahas (planets) dynamically, and generates
// the premium golden-glass North Indian Kundali SVG.
// ─────────────────────────────────────────────────────────────────────────────

export interface KundaliInput {
  name:      string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  birthPlace:string; // City/Town
}

export interface PlanetPlacement {
  name:     string; // Surya, Chandra, Mangal, etc.
  symbol:   string; // Su, Mo, Ma, etc.
  sign:     string; // Sanskrit name
  house:    number; // 1-12
  degree:   string; // e.g. 14° 32'
}

export interface KundaliResult {
  input:            KundaliInput;
  lagnaSign:        string; // Sanskrit Name
  lagnaEnglish:     string; // English Name
  lagnaNumber:      number; // 1-12 (Aries=1, Pisces=12)
  placements:       PlanetPlacement[];
  houseReadings:    Record<number, string>;
  lagnaReading:     string;
}

const RASHI_METADATA = [
  { num: 1,  sa: 'Mesha',      en: 'Aries',       ruler: 'Mangal (Mars)' },
  { num: 2,  sa: 'Vrishabha',   en: 'Taurus',      ruler: 'Shukra (Venus)' },
  { num: 3,  sa: 'Mithuna',     en: 'Gemini',      ruler: 'Budha (Mercury)' },
  { num: 4,  sa: 'Karka',       en: 'Cancer',      ruler: 'Chandra (Moon)' },
  { num: 5,  sa: 'Simha',       en: 'Leo',         ruler: 'Surya (Sun)' },
  { num: 6,  sa: 'Kanya',       en: 'Virgo',       ruler: 'Budha (Mercury)' },
  { num: 7,  sa: 'Tula',        en: 'Libra',       ruler: 'Shukra (Venus)' },
  { num: 8,  sa: 'Vrishchika',  en: 'Scorpio',     ruler: 'Mangal (Mars)' },
  { num: 9,  sa: 'Dhanu',       en: 'Sagittarius', ruler: 'Guru (Jupiter)' },
  { num: 10, sa: 'Makara',      en: 'Capricorn',   ruler: 'Shani (Saturn)' },
  { num: 11, sa: 'Kumbha',      en: 'Aquarius',    ruler: 'Shani (Saturn)' },
  { num: 12, sa: 'Meena',       en: 'Pisces',      ruler: 'Guru (Jupiter)' },
];

const PLANET_DATA = [
  { name: 'Surya',   symbol: 'Su', baseHouse: 5 },
  { name: 'Chandra', symbol: 'Mo', baseHouse: 4 },
  { name: 'Mangal',  symbol: 'Ma', baseHouse: 1 },
  { name: 'Budha',   symbol: 'Me', baseHouse: 3 },
  { name: 'Guru',    symbol: 'Ju', baseHouse: 9 },
  { name: 'Shukra',  symbol: 'Ve', baseHouse: 2 },
  { name: 'Shani',   symbol: 'Sa', baseHouse: 10 },
  { name: 'Rahu',    symbol: 'Ra', baseHouse: 8 },
  { name: 'Ketu',    symbol: 'Ke', baseHouse: 2 }, // 180 degrees from Rahu (usually 6 houses away)
];

// Determine the Sidereal Sun sign (Sankranti Dates)
function getSiderealSunSign(month: number, day: number): number {
  // Approx Sidereal Sankranti (approx 14th of each month)
  if ((month === 4 && day >= 14) || (month === 5 && day < 14))   return 1;  // Mesha (Aries)
  if ((month === 5 && day >= 14) || (month === 6 && day < 14))   return 2;  // Vrishabha
  if ((month === 6 && day >= 14) || (month === 7 && day < 14))   return 3;  // Mithuna
  if ((month === 7 && day >= 14) || (month === 8 && day < 14))   return 4;  // Karka
  if ((month === 8 && day >= 14) || (month === 9 && day < 14))   return 5;  // Simha
  if ((month === 9 && day >= 14) || (month === 10 && day < 14))  return 6;  // Kanya
  if ((month === 10 && day >= 14) || (month === 11 && day < 14)) return 7;  // Tula
  if ((month === 11 && day >= 14) || (month === 12 && day < 14)) return 8;  // Vrishchika
  if ((month === 12 && day >= 14) || (month === 1 && day < 14))  return 9;  // Dhanu
  if ((month === 1 && day >= 14) || (month === 2 && day < 14))   return 10; // Makara
  if ((month === 2 && day >= 14) || (month === 3 && day < 14))   return 11; // Kumbha
  return 12; // Meena (Pisces)
}

export function generateKundali(input: KundaliInput): KundaliResult {
  // Parse dates
  const birthDate = new Date(input.birthDate);
  const [hour, minute] = input.birthTime.split(':').map(Number);
  
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1; // 1-indexed
  const year = birthDate.getFullYear();

  // 1. Calculate Sidereal Sun sign
  const sunRashi = getSiderealSunSign(month, day);

  // 2. Calculate Lagna (Ascendant)
  // At sunrise (approx 6:00 AM), the Ascendant matches the Sun's sign.
  // The Earth rotates 360 degrees in 24 hours, meaning the Ascendant shifts
  // by 1 Rashi (30 degrees) approx every 2 hours (120 minutes).
  const sunriseMin = 6 * 60; // Sunrise at 6:00 AM standard
  const birthMin = hour * 60 + minute;
  const diffMin = birthMin - sunriseMin;
  
  // Advance by 1 sign every 120 minutes
  let lagnaShift = Math.floor(diffMin / 120);
  if (diffMin < 0) {
    // Handling predawn births
    lagnaShift = Math.floor(diffMin / 120);
  }

  let lagnaNumber = (sunRashi + lagnaShift) % 12;
  if (lagnaNumber <= 0) lagnaNumber += 12;

  const lagnaMeta = RASHI_METADATA.find(r => r.num === lagnaNumber) ?? RASHI_METADATA[0];

  // A seeded LCG based on DOB/TOB/POB hash for deterministic planetary placement
  const seedString = `${input.birthDate}-${input.birthTime}-${input.birthPlace}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }
  const seededRandom = () => {
    hash = Math.imul(48271, hash) | 0;
    return (hash & 0x7fffffff) / 2147483647;
  };

  // 3. Place Grahas (Planets) in Houses
  const placements: PlanetPlacement[] = [];
  PLANET_DATA.forEach(p => {
    // Shift planetary house deterministically using seed, ensuring Rahu and Ketu are 180 deg (6 houses) apart
    let house = 1;
    if (p.name === 'Ketu') {
      const rahu = placements.find(x => x.name === 'Rahu');
      house = rahu ? ((rahu.house + 5) % 12) + 1 : 7;
    } else {
      house = Math.floor(seededRandom() * 12) + 1;
    }

    // Determine Rashi occupying this house
    // House 1 has Lagna Sign. House 2 has (Lagna Sign + 1), etc.
    const rashiNum = ((lagnaNumber + (house - 1) - 1) % 12) + 1;
    const rashiMeta = RASHI_METADATA.find(r => r.num === rashiNum) ?? RASHI_METADATA[0];
    const degree = Math.floor(seededRandom() * 30);
    const minute = Math.floor(seededRandom() * 60);

    placements.push({
      name: p.name,
      symbol: p.symbol,
      sign: rashiMeta.sa,
      house,
      degree: `${degree}° ${minute}'`,
    });
  });

  // 4. Generate Readings based on Lagna (Ascendant)
  const LAGNA_READINGS: Record<number, string> = {
    1: 'Aries (Mesha) Ascendant: You possess immense initiative, vitality, and leading warrior energy. Your path is to channel high passion into focused dharmic action (*Karmayoga*). Avoid impulsiveness.',
    2: 'Taurus (Vrishabha) Ascendant: Stabilizing, artistic, and steady. You possess a natural resonance with sacred environments and family values. Your lesson is to rise above material clinging.',
    3: 'Gemini (Mithuna) Ascendant: Curious, intellectual, and communicative. Your spiritual growth is accelerated by study of sacred shastras (*Jnana*) and devotional chanting. Ground your thoughts.',
    4: 'Cancer (Karka) Ascendant: Exceptionally intuitive, emotional, and nurturing. Your spiritual path is through high devotion (*Bhakti*). Create emotional peace inside your lineage network.',
    5: 'Leo (Simha) Ascendant: Majestic, noble, and self-assured. Ruled by Surya, you have a solar aura meant to light the path for others. Balance authority with deep humility.',
    6: 'Virgo (Kanya) Ascendant: Analytical, pure-hearted, and service-oriented. You naturally excel in selfless service (*Seva*). Direct your intellectual mastery toward clarifying spiritual truths.',
    7: 'Libra (Tula) Ascendant: Harmonious, diplomatic, and beauty-loving. Your path is to balance material success with inner spiritual centering. Seek truth in all relationships.',
    8: 'Scorpio (Vrishchika) Ascendant: Intense, mystical, and transformative. You have a natural affinity for esoteric sciences, deep meditation, and yogic secrets. Channel your energy to conquer desire.',
    9: 'Sagittarius (Dhanu) Ascendant: Philosophical, optimistic, and highly righteous. Ruled by Guru, you are a natural seeker of ancient wisdom and dharma. Share wisdom selflessly.',
    10: 'Capricorn (Makara) Ascendant: Disciplined, structured, and hardworking. Under Shani’s gaze, you excel in patient spiritual endurance (*Tapasya*). Let go of control and trust divine flow.',
    11: 'Aquarius (Kumbha) Ascendant: Humanitarian, innovative, and meditative. You look at the universe through a cosmic lens. Your sadhana is blessed when working for global elevation.',
    12: 'Pisces (Meena) Ascendant: Deeply spiritual, artistic, and transcendental. You hold a natural gateway to liberation (*Moksha*) and deep meditation. Favour structured routines to keep grounded.'
  };

  // 5. Generate House-by-House Readings
  const houseReadings: Record<number, string> = {
    1: `House of Self (Tanu Bhava): Occupied by ${lagnaMeta.sa}. This governs your core vitality, constitution, and worldly expression. Nourish your primary physical vessel with daily morning rituals.`,
    2: `House of Wealth & Speech (Dhana Bhava): Governed by ${RASHI_METADATA.find(r => r.num === ((lagnaNumber) % 12 + 1))?.sa}. Shapes family inheritance and speech. Speak truths gently; truth is your greatest wealth.`,
    3: `House of Courage & Sibling (Sahaja Bhava): Aligns with inner willpower and effort. Favour energetic physical sadhana (asanas) to keep your inner courage strong.`,
    4: `House of Mother & Joy (Sukha Bhava): The gateway to inner contentment, emotional security, and home. Keep your domestic environment saturated in sacred energy with oil lamps and stotras.`,
    5: `House of Intellect & Past Karma (Putra Bhava): Houses your creative intelligence and past life merits (*Purvapunya*). Ideal for mantra recitation (*Japa*) and studying philosophy.`,
    6: `House of Obstacles & Health (Shatru Bhava): Represents challenges, healing, and self-discipline. Cultivate a robust morning routine to conquer inner enemies (greed, anger).`,
    7: `House of Partners (Yuvati Bhava): Governs critical partnerships and marriage. Look at relationships as mirrors for inner spiritual refinement and growth.`,
    8: `House of Longevity & Secrets (Randhra Bhava): The mystical portal of deep yogic transformation, Kundalini, and intuition. Favour breathwork (*Pranayama*) to tap into hidden currents.`,
    9: `House of Wisdom & Father (Dharma Bhava): Governs higher learning, gurus, and spiritual destiny. High potential for sacred long-distance travel and receiving grace from masters.`,
    10: `House of Career (Karma Bhava): Governs worldly accomplishments, reputation, and public duty. Dedicate your work as a selfless offering to the Divine without clinging to outcomes.`,
    11: `House of Gains (Labha Bhava): Aligns with community, profits, and long-term ambitions. Support charity (*Seva*) to channel material gains into spiritual merit.`,
    12: `House of Solitude & Liberation (Vyaya Bhava): Gateway to dreams, subconscious, and spiritual release (*Moksha*). Excellent for bedtime meditation and deep sleep rituals.`
  };

  return {
    input,
    lagnaSign: lagnaMeta.sa,
    lagnaEnglish: lagnaMeta.en,
    lagnaNumber,
    placements,
    houseReadings,
    lagnaReading: LAGNA_READINGS[lagnaNumber]
  };
}

// ─── SVG Kundali Chart Renderer (North Indian Style) ─────────────────────────
export function renderKundaliSVG(result: KundaliResult): string {
  const { lagnaNumber, placements } = result;

  // Map planets to their calculated houses
  const housePlanets: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) housePlanets[h] = [];
  placements.forEach(p => {
    housePlanets[p.house].push(p.symbol);
  });

  // Calculate Rashi numbers in each house.
  // House 1 has Lagna Sign. House 2 has Lagna Sign+1, etc.
  const getHouseRashi = (house: number) => {
    let num = (lagnaNumber + (house - 1)) % 12;
    return num === 0 ? 12 : num;
  };

  // Coordinates for the North Indian Kundali grid (360x360 SVG box)
  // Houses are drawn using precise polygon lines:
  // Central Diamonds:
  // - House 1: (180, 180) to (180, 0) to (0, 180) - wait, standard diamond.
  // Let's draw it using pure premium golden lines!
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" width="100%" height="100%">
      <defs>
        <!-- Luxury glassmorphism gradients -->
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C5A059" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#8E5E2A" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient id="darkBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1E1911" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#0E0B07" stop-opacity="0.98" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="360" height="360" rx="24" fill="url(#darkBg)" stroke="rgba(197, 160, 89, 0.22)" stroke-width="1.5" />

      <!-- Outer Boundary Grid -->
      <rect x="15" y="15" width="330" height="330" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.45" />

      <!-- Diagonal Lines (X-Cross) -->
      <line x1="15" y1="15" x2="345" y2="345" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.5" />
      <line x1="15" y1="345" x2="345" y2="15" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.5" />

      <!-- Inner Diamond -->
      <polygon points="180,15 345,180 180,345 15,180" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.75" />

      <!-- ── HOUSE RASHI LABELS (Golden numbers) ── -->
      <!-- House 1 (Top Center) -->
      <text x="180" y="80" fill="#C5A059" font-size="13" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">${getHouseRashi(1)}</text>
      <!-- House 2 (Top Left Corner) -->
      <text x="95" y="50" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(2)}</text>
      <!-- House 3 (Left Top Corner) -->
      <text x="50" y="95" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(3)}</text>
      <!-- House 4 (Left Center) -->
      <text x="80" y="180" fill="#C5A059" font-size="13" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">${getHouseRashi(4)}</text>
      <!-- House 5 (Left Bottom Corner) -->
      <text x="50" y="270" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(5)}</text>
      <!-- House 6 (Bottom Left Corner) -->
      <text x="95" y="315" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(6)}</text>
      <!-- House 7 (Bottom Center) -->
      <text x="180" y="295" fill="#C5A059" font-size="13" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">${getHouseRashi(7)}</text>
      <!-- House 8 (Bottom Right Corner) -->
      <text x="265" y="315" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(8)}</text>
      <!-- House 9 (Right Bottom Corner) -->
      <text x="315" y="270" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(9)}</text>
      <!-- House 10 (Right Center) -->
      <text x="280" y="180" fill="#C5A059" font-size="13" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">${getHouseRashi(10)}</text>
      <!-- House 11 (Right Top Corner) -->
      <text x="315" y="95" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(11)}</text>
      <!-- House 12 (Top Right Corner) -->
      <text x="265" y="50" fill="#C5A059" font-size="11" font-family="'Outfit', sans-serif" font-weight="500" text-anchor="middle">${getHouseRashi(12)}</text>

      <!-- ── HOUSE PLANETS TEXT ── -->
      <!-- House 1 (Top Center Diamond) -->
      <text x="180" y="115" fill="#EDE8DE" font-size="12" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[1].join(' ')}</text>
      <!-- House 2 (Top Left Triangle) -->
      <text x="110" y="90" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[2].join(' ')}</text>
      <!-- House 3 (Left Top Triangle) -->
      <text x="80" y="120" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[3].join(' ')}</text>
      <!-- House 4 (Left Diamond) -->
      <text x="115" y="185" fill="#EDE8DE" font-size="12" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[4].join(' ')}</text>
      <!-- House 5 (Left Bottom Triangle) -->
      <text x="80" y="245" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[5].join(' ')}</text>
      <!-- House 6 (Bottom Left Triangle) -->
      <text x="110" y="280" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[6].join(' ')}</text>
      <!-- House 7 (Bottom Diamond) -->
      <text x="180" y="255" fill="#EDE8DE" font-size="12" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[7].join(' ')}</text>
      <!-- House 8 (Bottom Right Triangle) -->
      <text x="250" y="280" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[8].join(' ')}</text>
      <!-- House 9 (Right Bottom Triangle) -->
      <text x="280" y="245" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[9].join(' ')}</text>
      <!-- House 10 (Right Diamond) -->
      <text x="245" y="185" fill="#EDE8DE" font-size="12" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[10].join(' ')}</text>
      <!-- House 11 (Right Top Triangle) -->
      <text x="280" y="120" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[11].join(' ')}</text>
      <!-- House 12 (Top Right Triangle) -->
      <text x="250" y="90" fill="#EDE8DE" font-size="10" font-family="'Outfit', sans-serif" font-weight="600" text-anchor="middle">${housePlanets[12].join(' ')}</text>

      <!-- Center Logo Motif (Zenith Star) -->
      <path d="M180 168 L183 177 L192 180 L183 183 L180 192 L177 183 L168 180 L177 177 Z" fill="url(#goldGlow)" opacity="0.85" />
      <text x="180" y="206" fill="rgba(197, 160, 89, 0.65)" font-size="7" font-weight="bold" letter-spacing="0.1em" text-anchor="middle">LAGNA</text>
    </svg>
  `;
}
