// ─── Vedic Astrology Kundali Chart Engine ─────────────────────────────────────
// Real astronomical calculations via astro-engine.ts (astronomy-engine npm,
// Lahiri ayanamsa, Meeus ascendant, Vimshottari dasha).
// No seeds. No random. Every chart is computed from actual planetary positions.
// ─────────────────────────────────────────────────────────────────────────────

import { generateAstroChart, AstroChart, BirthInput, type GrahaAspect, type YogaResult } from './astro-engine';

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
  key:         string;   // canonical key: Surya, Chandra, Mangal, etc.
  name:        string;   // Surya, Chandra, Mangal, etc.
  symbol:      string;   // Su, Mo, Ma, etc.
  sign:        string;   // Sanskrit rashi name
  house:       number;   // 1-12
  degree:      string;   // e.g. "14° 32'"
  strength:    number;   // Shadbala strength proxy (50-95)
  isRetrograde?: boolean;
}

export interface KundaliInterpretationSection {
  id: string;
  title: string;
  priority: 'foundation' | 'timing' | 'relationship' | 'sadhana' | 'caution';
  summary: string;
  points: string[];
  actions: string[];
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
  interpretationSections: KundaliInterpretationSection[];
  navamshaPlacements: PlanetPlacement[];
  yogaResults: YogaResult[];
  aspectResults: GrahaAspect[];
  precisionNotes: string[];
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

// Shadbala strength proxy — house position + dignity + retrograde
function estimateStrength(
  planetName: string,
  house: number,
  isRetrograde?: boolean,
  dignity?: 'exalted' | 'debilitated' | 'own' | 'neutral',
): number {
  // Natural benefics strong in 1,4,5,7,9,10,11; natural malefics strong in 3,6,10,11
  const benefics = new Set(['Chandra', 'Budha', 'Guru', 'Shukra']);
  const isBenefic = benefics.has(planetName);
  const goodHousesB = new Set([1, 4, 5, 7, 9, 10, 11]);
  const goodHousesM = new Set([3, 6, 10, 11]);
  const isGood = isBenefic ? goodHousesB.has(house) : goodHousesM.has(house);
  const base = isGood ? 72 : 52;

  // Dignity modifier (±15 swing)
  const dignityMod = dignity === 'exalted'     ?  15
                   : dignity === 'own'         ?   8
                   : dignity === 'debilitated' ? -15
                   : 0;

  const retroBonus = isRetrograde ? 8 : 0;
  const lagnaBonus = house === 1  ? 5 : 0;

  // Clamp 50–95
  return Math.max(50, Math.min(95, base + dignityMod + retroBonus + lagnaBonus));
}

function makePlacement(pname: string, graha: AstroChart['planets'][string], lang: 'en' | 'hi' | 'pa'): PlanetPlacement {
  const rashiMeta = RASHI_METADATA[graha.rashiIndex] ?? RASHI_METADATA[0];
  const deg  = Math.floor(graha.degreeInRashi);
  const min  = Math.round((graha.degreeInRashi - deg) * 60);
  return {
    key:         pname,
    name:        PLANET_NAME_LOCAL[lang][pname] ?? pname,
    symbol:      PLANET_SYMBOLS[pname] ?? pname.slice(0, 2),
    sign:        rashiMeta.sa,
    house:       graha.house,
    degree:      `${deg}° ${min}'`,
    strength:    estimateStrength(pname, graha.house, graha.isRetrograde, graha.dignity),
    isRetrograde: graha.isRetrograde,
  };
}

const PLANET_NAME_LOCAL: Record<'en' | 'hi' | 'pa', Record<string, string>> = {
  en: { Surya: 'Surya', Chandra: 'Chandra', Mangal: 'Mangal', Budha: 'Budha', Guru: 'Guru', Shukra: 'Shukra', Shani: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu' },
  hi: { Surya: 'सूर्य', Chandra: 'चंद्र', Mangal: 'मंगल', Budha: 'बुध', Guru: 'गुरु', Shukra: 'शुक्र', Shani: 'शनि', Rahu: 'राहु', Ketu: 'केतु' },
  pa: { Surya: 'ਸੂਰਜ', Chandra: 'ਚੰਦਰ', Mangal: 'ਮੰਗਲ', Budha: 'ਬੁੱਧ', Guru: 'ਗੁਰੂ', Shukra: 'ਸ਼ੁੱਕਰ', Shani: 'ਸ਼ਨੀ', Rahu: 'ਰਾਹੂ', Ketu: 'ਕੇਤੂ' }
};

const HOUSE_PURPOSE_LOCAL: Record<'en' | 'hi' | 'pa', Record<number, string>> = {
  en: {
    1:  'shaping your vital expression and raw identity directly',
    2:  'refining your vocal purity and family legacy structure',
    3:  'infusing courage, writing ability, and creative hands-on execution',
    4:  'anchoring your subconscious joy, emotional mother-connection, and home sanctuary',
    5:  'blessing your creative merits, high intelligence, and past-life karma (Purvapunya)',
    6:  'testing you with daily healing discipline, service (Seva), and conquering obstacles',
    7:  'refining your mirrors of truth in sacred unions and close collaborations',
    8:  'opening mystical pathways of deep yogic breath, intuition, and cellular rebirth',
    9:  'revealing higher wisdom, alignment with spiritual gurus, and your ultimate destiny (Dharma)',
    10: 'manifesting high-quality public duty, worldly achievements, and noble accomplishments',
    11: 'multiplying community gains, wide aspirations, and noble social impact',
    12: 'dissolving the ego in solitude, dream-state illumination, and eventual liberation (Moksha)',
  },
  hi: {
    1: 'आपके मूल व्यक्तित्व और जीवन शक्ति का सीधा निर्माण करता है',
    2: 'आपकी वाणी की पवित्रता और पारिवारिक विरासत की संरचना को निखारता है',
    3: 'साहस, लेखन क्षमता और रचनात्मक कार्यों को प्रेरित करता है',
    4: 'आपके अवचेतन मन की खुशी, माता के साथ भावनात्मक जुड़ाव और घरेलू सुख को स्थापित करता है',
    5: 'आपकी रचनात्मक प्रतिभा, उच्च बुद्धि और पूर्व जन्म के संचित पुण्य (पूर्वपुण्य) को जागृत करता है',
    6: 'दैनिक सेवा भाव, स्वास्थ्य अनुशासन और बाधाओं पर विजय पाने की क्षमता की परीक्षा लेता है',
    7: 'साझेदारी और पवित्र संबंधों में सत्य के दर्पण को निखारता है',
    8: 'गहन योग साधना, अंतर्ज्ञान और आध्यात्मिक पुनर्जन्म के रहस्यमयी मार्ग खोलता है',
    9: 'उच्च ज्ञान, आध्यात्मिक गुरुओं के साथ जुड़ाव और आपके अंतिम धर्म को प्रकट करता है',
    10: 'उच्च गुणवत्ता वाले सार्वजनिक कर्तव्य, सांसारिक उपलब्धियों और महान कार्यों को प्रकट करता है',
    11: 'सामुदायिक लाभ, उच्च आकांक्षाओं और महान सामाजिक प्रभाव को बढ़ाता है',
    12: 'एकांत में अहंकार के विसर्जन, स्वप्न-अवस्था के ज्ञान और मोक्ष का मार्ग प्रशस्त करता है',
  },
  pa: {
    1: 'ਤੁਹਾਡੀ ਅਸਲ ਸ਼ਖਸੀਅਤ ਅਤੇ ਜੀਵਨ ਸ਼ਕਤੀ ਦਾ ਸਿੱਧਾ ਨਿਰਮਾਣ ਕਰਦਾ ਹੈ',
    2: 'ਤੁਹਾਡੀ ਬੋਲੀ ਦੀ ਸ਼ੁੱਧਤਾ ਅਤੇ ਪਰਿਵਾਰਕ ਵਿਰਾਸਤ ਨੂੰ ਨਿਖਾਰਦਾ ਹੈ',
    3: 'ਹਿੰਮਤ, ਲੇਖਣ ਯੋਗਤਾ ਅਤੇ ਰਚਨਾਤਮਕ ਕਾਰਜਾਂ ਨੂੰ ਪ੍ਰੇਰਿਤ ਕਰਦਾ ਹੈ',
    4: 'ਤੁਹਾਡੀ ਅਚੇਤ ਖੁਸ਼ੀ, ਮਾਤਾ ਨਾਲ ਭਾਵਨਾਤਮਕ ਲਗਾਅ ਅਤੇ ਘਰੇਲੂ ਸ਼ਾਂਤੀ ਨੂੰ ਸਥਾਪਿਤ ਕਰਦਾ ਹੈ',
    5: 'ਤੁਹਾਡੀ ਰਚਨਾਤਮਕ ਪ੍ਰਤਿਭਾ, ਉੱਚ ਬੁੱਧੀ ਅਤੇ ਪੂਰਵ ਜਨਮ ਦੇ ਪੁੰਨ (ਪੂਰਵਪੁੰਨ) ਨੂੰ ਜਾਗ੍ਰਿਤ ਕਰਦਾ ਹੈ',
    6: 'ਰੋਜ਼ਾਨਾ ਸੇਵਾ ਭਾਵਨਾ, ਸਿਹਤ ਅਨੁਸ਼ਾਸਨ ਅਤੇ ਰੁਕਾਵਟਾਂ ਤੇ ਜਿੱਤ ਪ੍ਰਾਪਤ ਕਰਨ ਦੀ ਪ੍ਰੀਖਿਆ ਲੈਂਦਾ ਹੈ',
    7: 'ਸਾਂਝੇਦਾਰੀ ਅਤੇ ਪਵਿੱਤਰ ਸਬੰਧਾਂ ਵਿੱਚ ਸੱਚ ਦੇ ਸ਼ੀਸ਼ੇ ਨੂੰ ਨਿਖਾਰਦਾ ਹੈ',
    8: 'ਡੂੰਘੀ ਯੋਗ ਸਾਧਨਾ, ਅੰਤਰਗਿਆਨ ਅਤੇ ਅਧਿਆਤਮਿਕ ਪੁਨਰਜਨਮ ਦੇ ਰਹੱਸਮਈ ਮਾਰਗ ਖੋਲ੍ਹਦਾ ਹੈ',
    9: 'ਉੱਚ ਗਿਆਨ, ਅਧਿਆਤਮਿਕ ਗੁਰੂਆਂ ਨਾਲ ਮੇਲ ਅਤੇ ਤੁਹਾਡੇ ਪਰਮ ਧਰਮ ਨੂੰ ਪ੍ਰਗਟ ਕਰਦਾ ਹੈ',
    10: 'ਉੱਚ ਗੁਣਵੱਤਾ ਵਾਲੇ ਜਨਤਕ ਫਰਜ਼ਾਂ, ਸੰਸਾਰਕ ਪ੍ਰਾਪਤੀਆਂ ਅਤੇ ਮਹਾਨ ਕਾਰਜਾਂ ਨੂੰ ਪ੍ਰਗਟ ਕਰਦਾ ਹੈ',
    11: 'ਭਾਈਚਾਰਕ ਲਾਭ, ਉੱਚੀਆਂ ਇੱਛਾਵਾਂ ਅਤੇ ਮਹਾਨ ਸਮਾਜਿਕ ਪ੍ਰਭਾਵ ਨੂੰ ਵਧਾਉਂਦਾ ਹੈ',
    12: 'ਇਕਾਂਤ ਵਿੱਚ ਅਹੰਕਾਰ ਦੇ ਵਿਸਰਜਨ, ਸੁਪਨ-ਅਵਸਥਾ ਦੇ ਗਿਆਨ ਅਤੇ ਮੋਖ ਦਾ ਮਾਰਗ ਪ੍ਰਸ਼ਸਤ ਕਰਦਾ ਹੈ',
  }
};

const HOUSE_READINGS_LOCAL: Record<'en' | 'hi' | 'pa', Record<number, string>> = {
  en: {
    1: 'House of Self (Tanu Bhava): Occupied by {lagna}. Governs your core vitality, constitution, and worldly expression.',
    2: 'House of Wealth & Speech (Dhana Bhava): Governed by {sign}. Shapes family inheritance and speech.',
    3: 'House of Courage & Sibling (Sahaja Bhava): Aligns with inner willpower and effort. Favour energetic physical sadhana (asanas).',
    4: 'House of Mother & Joy (Sukha Bhava): Gateway to inner contentment, emotional security, and home. Keep your domestic environment sacred.',
    5: 'House of Intellect & Past Karma (Putra Bhava): Houses creative intelligence and past life merits (Purvapunya). Ideal for mantra recitation.',
    6: 'House of Obstacles & Health (Shatru Bhava): Represents challenges, healing, and self-discipline. Cultivate a robust morning routine.',
    7: 'House of Partners (Yuvati Bhava): Governs partnerships and marriage. Look at relationships as mirrors for inner refinement.',
    8: 'House of Longevity & Secrets (Randhra Bhava): Mystical portal of deep yogic transformation. Favour breathwork (Pranayama).',
    9: 'House of Wisdom & Father (Dharma Bhava): Governs higher learning, gurus, and spiritual destiny. High potential for sacred wisdom.',
    10: 'House of Career (Karma Bhava): Governs worldly accomplishments, reputation, and public duty. Dedicate your work selflessly.',
    11: 'House of Gains (Labha Bhava): Aligns with community, profits, and long-term ambitions. Support charity (Seva) for spiritual merit.',
    12: 'House of Solitude & Liberation (Vyaya Bhava): Gateway to dreams, subconscious, and spiritual release (Moksha). Excellent for meditation.',
  },
  hi: {
    1: 'प्रथम भाव - स्वयं का भाव (तनू भाव): लग्न {lagna} द्वारा अधिष्ठित। यह आपके मूल व्यक्तित्व, शारीरिक बनावट और सांसारिक अभिव्यक्ति को नियंत्रित करता है।',
    2: 'द्वितीय भाव - धन और वाणी (धन भाव): {sign} द्वारा शासित। यह पारिवारिक विरासत, संचित धन और वाणी को आकार देता है।',
    3: 'तृतीय भाव - पराक्रम और भाई-बहन (सहज भाव): आंतरिक इच्छाशक्ति और प्रयासों से जुड़ा है। शारीरिक साधना (योगासन) के लिए उत्तम है।',
    4: 'चतुर्थ भाव - माता और सुख (सुख भाव): आंतरिक संतोष, मानसिक शांति और घरेलू सुख का प्रवेश द्वार। अपने गृह वातावरण को पवित्र रखें।',
    5: 'पंचम भाव - बुद्धि और पूर्व कर्म (पुत्र भाव): रचनात्मक बुद्धि और पूर्व जन्म के संचित पुण्य (पूर्वपुण्य) को दर्शाता है। मंत्र जप के लिए आदर्श है।',
    6: 'षष्ठ भाव - रोग, ऋण और शत्रु (शत्रु भाव): चुनौतियों, उपचार और आत्म-अनुशासन का प्रतिनिधित्व करता है। एक मजबूत सुबह की दिनचर्या अपनाएं।',
    7: 'सप्तम भाव - विवाह और साझेदारी (युवती भाव): विवाह और जीवन में सभी साझेदारियों को नियंत्रित करता है। रिश्तों को आत्म-सुधार के दर्पण के रूप में देखें।',
    8: 'अष्टम भाव - आयु और रहस्य (रंध्र भाव): गहरी योग साधना और प्राणायम के लिए एक रहस्यमयी मार्ग। प्राणायाम अभ्यास करें।',
    9: 'नवम भाव - भाग्य, धर्म और पिता (धर्म भाव): उच्च शिक्षा, गुरुओं और आध्यात्मिक भाग्य को नियंत्रित करता है। पवित्र ज्ञान के लिए सर्वोत्तम भाव।',
    10: 'दशम भाव - कर्म और आजीविका (कर्म भाव): सांसारिक उपलब्धियों, मान-सम्मान और सार्वजनिक कर्तव्य को नियंत्रित करता है। निष्काम कर्म करें।',
    11: 'एकादश भाव - लाभ और आय (लाभ भाव): सामाजिक दायरे, लाभ और दीर्घकालिक महत्वाकांक्षाओं से जुड़ा है। आध्यात्मिक प्रगति के लिए निष्काम सेवा (सेवा) का समर्थन करें।',
    12: 'द्वादश भाव - व्यय और मोक्ष (व्यय भाव): स्वप्न, अवचेतन और आध्यात्मिक मुक्ति (मोक्ष) का प्रवेश द्वार। ध्यान के लिए अत्यंत अनुकूल।',
  },
  pa: {
    1: 'ਪਹਿਲਾ ਭਾਵ - ਸਰੀਰ ਅਤੇ ਆਤਮਾ (ਤਨੂ ਭਾਵ): ਲਗਨ {lagna} ਦੁਆਰਾ ਅਧਿਸ਼ਠਿਤ। ਇਹ ਤੁਹਾਡੀ ਮੂਲ ਸ਼ਖਸੀਅਤ, ਸਰੀਰਕ ਬਣਤਰ ਅਤੇ ਸੰਸਾਰਕ ਪ੍ਰਗਟਾਵੇ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦਾ ਹੈ।',
    2: 'ਦੂਜਾ ਭਾਵ - ਧਨ ਅਤੇ ਬੋਲੀ (ਧਨ ਭਾਵ): {sign} ਦੁਆਰਾ ਸ਼ਾਸਿਤ। ਇਹ ਪਰਿਵਾਰਕ ਵਿਰਾਸਤ, ਸੰਚਿਤ ਧਨ ਅਤੇ ਬੋਲੀ ਨੂੰ ਆਕਾਰ ਦਿੰਦਾ ਹੈ।',
    3: 'ਤੀਜਾ ਭਾਵ - ਹਿੰਮਤ ਅਤੇ ਭੈਣ-ਭਰਾ (ਸਹਿਜ ਭਾਵ): ਅੰਦਰੂਨੀ ਇੱਛਾ ਸ਼ਕਤੀ ਅਤੇ ਯਤਨਾਂ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਹੈ। ਸਰੀਰਕ ਸਾਧਨਾ (ਯੋਗਾਸਨ) ਲਈ ਉੱਤਮ ਹੈ।',
    4: 'ਚੌਥਾ ਭਾਵ - ਮਾਤਾ ਅਤੇ ਸੁਖ (ਸੁਖ ਭਾਵ): ਅੰਦਰੂਨੀ ਸੰਤੁਸ਼ਟੀ, ਮਾਨਸਿਕ ਸ਼ਾਂਤੀ ਅਤੇ ਘਰੇਲੂ ਸੁਖ ਦਾ ਪ੍ਰਵੇਸ਼ ਦੁਆਰ। ਆਪਣੇ ਘਰ ਦੇ ਵਾਤਾਵਰਣ ਨੂੰ ਪਵਿੱਤਰ ਰੱਖੋ।',
    5: 'ਪੰਜਵਾਂ ਭਾਵ - ਬੁੱਧੀ ਅਤੇ ਪੂਰਵ ਕਰਮ (ਪੁੱਤਰ ਭਾਵ): ਰਚਨਾਤਮਕ ਬੁੱਧੀ ਅਤੇ ਪੂਰਵ ਜਨਮ ਦੇ ਸੰਚਿਤ ਪੁੰਨ (ਪੂਰਵਪੁੰਨ) ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ। ਮੰਤਰ ਜਾਪ ਲਈ ਆਦਰਸ਼ ਹੈ।',
    6: 'ਛੇਵਾਂ ਭਾਵ - ਰੋਗ ਅਤੇ ਚੁਣੌਤੀਆਂ (ਸ਼ਤਰੂ ਭਾਵ): ਚੁਣੌਤੀਆਂ, ਇਲਾਜ ਅਤੇ ਸਵੈ-ਅਨੁਸ਼ਾਸਨ ਦਾ ਪ੍ਰਤੀਨਿਧਤਾ ਕਰਦਾ ਹੈ। ਇੱਕ ਮਜ਼ਬੂਤ ਸਵੇਰ ਦੀ ਰੁਟੀਨ ਅਪਣਾਓ।',
    7: 'ਸੱਤਵਾਂ ਭਾਵ - ਵਿਆਹ ਅਤੇ ਸਾਂਝੇਦਾਰੀ (ਯੁਵਤੀ ਭਾਵ): ਵਿਆਹ ਅਤੇ ਜੀਵਨ ਵਿੱਚ ਸਾਰੀਆਂ ਸਾਂਝੇਦਾਰੀਆਂ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦਾ ਹੈ। ਰਿਸ਼ਤਿਆਂ ਨੂੰ ਸਵੈ-ਸੁਧਾਰ ਦੇ ਸ਼ੀਸ਼ੇ ਵਜੋਂ ਵੇਖੋ।',
    8: 'ਅੱਠਵਾਂ ਭਾਵ - ਉਮਰ ਅਤੇ ਰਹੱਸ (ਰੰਧਰਾ ਭਾਵ): ਡੂੰਘੀ ਯੋਗ ਸਾਧਨਾ ਅਤੇ ਪ੍ਰਾਣਾਯਾਮ ਲਈ ਇੱਕ ਰਹੱਸਮਈ ਮਾਰਗ। ਪ੍ਰਾਣਾਯਾਮ ਦਾ ਅਭਿਆਸ ਕਰੋ।',
    9: 'ਨੌਵਾਂ ਭਾਵ - ਕਿਸਮਤ, ਧਰਮ ਅਤੇ ਪਿਤਾ (ਧਰਮ ਭਾਵ): ਉੱਤਰੀ ਸਿੱਖਿਆ, ਗੁਰੂਆਂ ਅਤੇ ਅਧਿਆਤਮਿਕ ਕਿਸਮਤ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦਾ ਹੈ। ਪਵਿੱਤਰ ਗਿਆਨ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਭਾਵ।',
    10: 'ਦਸਵਾਂ ਭਾਵ - ਕਰਮ ਅਤੇ ਰੋਜ਼ਗਾਰ (ਕਰਮ ਭਾਵ): ਸੰਸਾਰਕ ਪ੍ਰਾਪਤੀਆਂ, ਮਾਨ-ਸਨਮਾਨ ਅਤੇ ਜਨਤਕ ਫਰਜ਼ਾਂ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦਾ ਹੈ। ਨਿਰਸਵਾਰਥ ਕਰਮ ਕਰੋ।',
    11: 'ਗਿਆਰ੍ਹਵਾਂ ਭਾਵ - ਲਾਭ ਅਤੇ ਆਮਦਨ (लाभ भाव): ਸਮਾਜਿਕ ਦਾਇਰੇ, ਲਾਭ ਅਤੇ ਲੰਬੇ ਸਮੇਂ ਦੀਆਂ ਇੱਛਾਵਾਂ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ ਹੈ। ਅਧਿਆਤਮਿਕ ਤਰੱਕੀ ਲਈ ਨਿਸ਼ਕਾਮ ਸੇਵਾ (ਸੇਵਾ) ਦਾ ਸਮਰਥਨ ਕਰੋ।',
    12: 'ਬਾਰ੍ਹਵਾਂ ਭਾਵ - ਖਰਚ ਅਤੇ ਮੋਖ (ਵਿਯੇ ਭਾਵ): ਸੁਪਨੇ, ਅਚੇਤ ਮਨ ਅਤੇ ਅਧਿਆਤਮਿਕ ਮੁਕਤੀ (ਮੋਖ) ਦਾ ਪ੍ਰਵੇਸ਼ ਦੁਆਰ। ਧਿਆਨ ਲਈ ਬਹੁਤ ਅਨੁਕੂਲ।',
  }
};

function generatePanditAiReading(
  lagnaMeta: { num: number; sa: string; en: string; ruler: string },
  placements: PlanetPlacement[],
  chart: AstroChart,
  lang: 'en' | 'hi' | 'pa' = 'en'
): string {
  if (chart.timeUnknown) {
    if (lang === 'hi') {
      return 'यह रीडिंग सीमित सटीकता के साथ बनाई गई है क्योंकि जन्म समय उपलब्ध नहीं है। इसलिए इसे चंद्र राशि, नक्षत्र और वर्तमान दशा के आधार पर पढ़ें, न कि लग्न और भावों के अंतिम निष्कर्ष के रूप में। यदि सही जन्म समय मिले, तो चार्ट दोबारा बनाना आवश्यक है।';
    }
    if (lang === 'pa') {
      return 'ਇਹ ਪਾਠ ਸੀਮਿਤ ਸਟੀਕਤਾ ਨਾਲ ਤਿਆਰ ਕੀਤਾ ਗਿਆ ਹੈ ਕਿਉਂਕਿ ਜਨਮ ਸਮਾਂ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਸ ਲਈ ਇਸ ਨੂੰ ਚੰਦਰ ਰਾਸ਼ੀ, ਨਕਸ਼ਤਰ ਅਤੇ ਵਰਤਮਾਨ ਦਸ਼ਾ ਦੇ ਆਧਾਰ ਤੇ ਪੜ੍ਹੋ, ਨਾ ਕਿ ਲਗਨ ਅਤੇ ਘਰਾਂ ਦੇ ਅੰਤਿਮ ਨਤੀਜੇ ਵਜੋਂ। ਜੇ ਸਹੀ ਜਨਮ ਸਮਾਂ ਮਿਲੇ, ਤਾਂ ਚਾਰਟ ਮੁੜ ਬਣਾਉਣਾ ਲਾਜ਼ਮੀ ਹੈ।';
    }
    return 'This reading is intentionally limited because birth time is unknown. Read it through Moon sign, Nakshatra, and current Dasha rather than treating ascendant and house conclusions as final. If exact birth time becomes available, regenerate the chart before making deeper judgments.';
  }

  const surya   = placements.find(p => p.name === 'Surya' || p.name === 'सूर्य' || p.name === 'ਸੂਰਜ');
  const chandra = placements.find(p => p.name === 'Chandra' || p.name === 'चंद्र' || p.name === 'ਚੰਦਰ');
  const nakName = chart.nakshatra?.name ?? '';
  const nakLord = chart.nakshatra?.lord ?? '';
  const dashaP  = chart.dasha?.current?.planet ?? '';

  const rulerName = lagnaMeta.ruler.split(' ')[0]; // e.g. "Mangal"
  const localizedRuler = PLANET_NAME_LOCAL[lang][rulerName] ?? rulerName;
  const localizedSurya = PLANET_NAME_LOCAL[lang]['Surya'] ?? 'Surya';
  const localizedChandra = PLANET_NAME_LOCAL[lang]['Chandra'] ?? 'Chandra';
  const localizedDashaP = PLANET_NAME_LOCAL[lang][dashaP] ?? dashaP;

  const housePurpose = HOUSE_PURPOSE_LOCAL[lang];

  if (lang === 'hi') {
    const p1 = `पंडित AI भाग्य फल: आपका जन्म ${lagnaMeta.sa} लग्न में हुआ है, जिसके कारण आपके जीवन के मुख्य ब्रह्मांडीय स्वामी ${localizedRuler} हैं। यह ग्रह स्वामी ${
      lagnaMeta.num % 2 === 0
        ? 'ग्रहणशील, गहरी और चिंतनशील (स्त्रीवाचक) ऊर्जा'
        : 'सक्रिय, गत्यात्मक और अग्रणी (पुरुषवाचक) ऊर्जा'
    } की एक आधारशिला स्थापित करता है जो आपके भाग्य को निरंतर निखारती रहेगी।`;

    const suryaLine = surya
      ? `आपका ${localizedSurya} (आत्मा) भाव ${surya.house} में विराजमान है, जो ${housePurpose[surya.house]}`
      : '';
    const chandraLine = chandra
      ? ` आपका ${localizedChandra} (मन) भाव ${chandra.house} में स्थित है, जो ${housePurpose[chandra.house]}`
      : '';

    const p2 = `ग्रह संरेखण: ${suryaLine}${suryaLine && chandraLine ? ' और' : ''}${chandraLine}।${nakName ? ` आपका जन्म नक्षत्र ${nakName} है, जिसके स्वामी ${PLANET_NAME_LOCAL[lang][nakLord] ?? nakLord} हैं।` : ''}`;

    const p3 = dashaP
      ? `महादशा काल: वर्तमान में आप ${localizedDashaP} की महादशा से गुजर रहे हैं। ग्रहों की ऊर्जा को संतुलित करने के लिए, प्रतिदिन सुबह अपने पूजा स्थल पर ${localizedRuler} से संबंधित बीज मंत्र का 11 बार जप करें।`
      : `ग्रहों की ऊर्जा को संतुलित करने के लिए, प्रतिदिन सुबह अपने पूजा स्थल पर ${localizedRuler} से संबंधित बीज मंत्र का 11 बार जप करें।`;

    return `${p1}\n\n${p2}\n\n${p3}`;
  }

  if (lang === 'pa') {
    const p1 = `ਪੰਡਿਤ AI ਭਾਗ ਫਲ: ਤੁਹਾਡਾ ਜਨਮ ${lagnaMeta.sa} ਲਗਨ ਵਿੱਚ ਹੋਇਆ ਹੈ, ਜਿਸਦੇ ਕਾਰਨ ਤੁਹਾਡੇ ਜੀਵਨ ਦੇ ਮੁੱਖ ਬ੍ਰਹਿਮੰਡੀ ਸੁਆਮੀ ${localizedRuler} ਹਨ। ਇਹ ਗ੍ਰਹਿ ਸੁਆਮੀ ${
      lagnaMeta.num % 2 === 0
        ? 'ਗ੍ਰਹਿਣਸ਼ੀਲ, ਡੂੰਘੀ ਅਤੇ ਚਿੰਤਨਸ਼ੀਲ ਊਰਜਾ'
        : 'ਸਰਗਰਮ, ਗਤੀਸ਼ੀਲ ਅਤੇ ਮੋਹਰੀ ਊਰਜਾ'
    } ਦੀ ਇੱਕ ਨੀਂਹ ਸਥਾਪਿਤ ਕਰਦਾ ਹੈ ਜੋ ਤੁਹਾਡੀ ਕਿਸਮਤ ਨੂੰ ਨਿਰੰਤਰ ਨਿਖਾਰਦੀ ਰਹੇਗੀ।`;

    const suryaLine = surya
      ? `ਤੁਹਾਡਾ ${localizedSurya} (ਆਤਮਾ) ਭਾਵ ${surya.house} ਵਿੱਚ ਬਿਰਾਜਮਾਨ ਹੈ, ਜੋ ${housePurpose[surya.house]}`
      : '';
    const chandraLine = chandra
      ? ` ਤੁਹਾਡਾ ${localizedChandra} (ਮਨ) ਭਾਵ ${chandra.house} ਵਿੱਚ ਸਥਿਤ ਹੈ, ਜੋ ${housePurpose[chandra.house]}`
      : '';

    const p2 = `ਗ੍ਰਹਿ ਸਥਿਤੀ: ${suryaLine}${suryaLine && chandraLine ? ' ਅਤੇ' : ''}${chandraLine}।${nakName ? ` ਤੁਹਾਡਾ ਜਨਮ ਨਕਸ਼ਤਰ ${nakName} ਹੈ, ਜਿਸਦੇ ਸੁਆਮੀ ${PLANET_NAME_LOCAL[lang][nakLord] ?? nakLord} ਹਨ।` : ''}`;

    const p3 = dashaP
      ? `ਮਹਾਦਸ਼ਾ ਕਾਲ: ਵਰਤਮਾਨ ਵਿੱਚ ਤੁਸੀਂ ${localizedDashaP} ਦੀ ਮਹਾਦਸ਼ਾ ਵਿੱਚੋਂ ਲੰਘ ਰਹੇ ਹੋ। ਗ੍ਰਹਿਆਂ ਦੀ ਊਰਜਾ ਨੂੰ ਸੰਤੁਲਿਤ ਕਰਨ ਲਈ, ਹਰ ਸਵੇਰ ਆਪਣੇ ਘਰ ਦੇ ਪੂਜਾ ਸਥਾਨ ਤੇ ${localizedRuler} ਨਾਲ ਸਬੰਧਿਤ ਬੀਜ ਮੰਤਰ ਦਾ 11 ਵਾਰ ਜਾਪ ਕਰੋ।`
      : `ਗ੍ਰਹਿਆਂ ਦੀ ਊਰਜਾ ਨੂੰ ਸੰਤੁਲਿਤ ਕਰਨ ਲਈ, ਹਰ ਸਵੇਰ ਆਪਣੇ ਘਰ ਦੇ ਪੂਜਾ ਸਥਾਨ ਤੇ ${localizedRuler} ਨਾਲ ਸਬੰਧਿਤ ਬੀਜ ਮੰਤਰ ਦਾ 11 ਵਾਰ ਜਾਪ ਕਰੋ।`;

    return `${p1}\n\n${p2}\n\n${p3}`;
  }

  // English default
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

const SECTION_COPY: Record<'en' | 'hi' | 'pa', Record<string, string>> = {
  en: {
    foundationTitle: 'Foundation and svabhava',
    timingTitle: 'Timing and dasha',
    strengthTitle: 'Graha strength and cautions',
    navamshaTitle: 'Navamsha and inner maturity',
    sadhanaTitle: 'Sadhana and upaya',
    noBirthTimeTitle: 'Birth-time confidence',
    noBirthTimeSummary: 'Birth time is unknown, so ascendant, houses, and divisional charts should not be treated as reliable.',
    noBirthTimePoint1: 'Use Moon sign, Nakshatra, and Dasha as the dependable reading layer.',
    noBirthTimePoint2: 'Do not make house-level, marriage, or career timing claims from this chart version.',
    noBirthTimePoint3: 'If an exact birth time becomes available, regenerate the chart before deeper interpretation.',
    noBirthTimeAction1: 'Show only sign-based and dasha-based guidance.',
    noBirthTimeAction2: 'Hide lagna, house, D9, and house-driven yogas from the primary reading.',
  },
  hi: {
    foundationTitle: 'मूल आधार और स्वभाव',
    timingTitle: 'समय और दशा',
    strengthTitle: 'ग्रह बल और सावधानियाँ',
    navamshaTitle: 'नवांश और आंतरिक परिपक्वता',
    sadhanaTitle: 'साधना और उपाय',
    noBirthTimeTitle: 'जन्म समय की विश्वसनीयता',
    noBirthTimeSummary: 'जन्म समय अज्ञात है, इसलिए लग्न, भाव और विभाजित चार्ट को विश्वसनीय नहीं माना जाना चाहिए।',
    noBirthTimePoint1: 'इस स्थिति में चंद्र राशि, नक्षत्र और दशा ही अधिक भरोसेमंद आधार हैं।',
    noBirthTimePoint2: 'इस चार्ट से भाव-आधारित विवाह, करियर या सूक्ष्म भविष्यवाणी नहीं करनी चाहिए।',
    noBirthTimePoint3: 'यदि सही जन्म समय मिल जाए, तो गहरी व्याख्या से पहले चार्ट दोबारा बनाएं।',
    noBirthTimeAction1: 'मुख्य रूप से राशि और दशा आधारित मार्गदर्शन ही दिखाएँ।',
    noBirthTimeAction2: 'प्राथमिक रीडिंग से लग्न, भाव, D9 और भाव-आधारित योग छिपाएँ।',
  },
  pa: {
    foundationTitle: 'ਮੂਲ ਅਧਾਰ ਅਤੇ ਸੁਭਾਵ',
    timingTitle: 'ਸਮਾਂ ਅਤੇ ਦਸ਼ਾ',
    strengthTitle: 'ਗ੍ਰਹਿ ਬਲ ਅਤੇ ਸਾਵਧਾਨੀਆਂ',
    navamshaTitle: 'ਨਵਾਂਸ਼ ਅਤੇ ਅੰਦਰੂਨੀ ਪਰਿਪੱਕਤਾ',
    sadhanaTitle: 'ਸਾਧਨਾ ਅਤੇ ਉਪਾਯ',
    noBirthTimeTitle: 'ਜਨਮ ਸਮੇਂ ਦੀ ਭਰੋਸੇਯੋਗਤਾ',
    noBirthTimeSummary: 'ਜਨਮ ਸਮਾਂ ਅਣਜਾਣ ਹੈ, ਇਸ ਲਈ ਲਗਨ, ਘਰ ਅਤੇ ਵਭਾਜਿਤ ਚਾਰਟ ਨੂੰ ਭਰੋਸੇਯੋਗ ਨਹੀਂ ਮੰਨਣਾ ਚਾਹੀਦਾ।',
    noBirthTimePoint1: 'ਇਸ ਹਾਲਤ ਵਿੱਚ ਚੰਦਰ ਰਾਸ਼ੀ, ਨਕਸ਼ਤਰ ਅਤੇ ਦਸ਼ਾ ਹੀ ਵਧੇਰੇ ਭਰੋਸੇਯੋਗ ਪੱਧਰ ਹਨ।',
    noBirthTimePoint2: 'ਇਸ ਚਾਰਟ ਤੋਂ ਘਰ-ਅਧਾਰਿਤ ਵਿਆਹ, ਕਰੀਅਰ ਜਾਂ ਸੁਖਮ ਭਵਿੱਖਬਾਣੀ ਨਹੀਂ ਕਰਨੀ ਚਾਹੀਦੀ।',
    noBirthTimePoint3: 'ਜੇ ਸਹੀ ਜਨਮ ਸਮਾਂ ਮਿਲ ਜਾਵੇ ਤਾਂ ਡੂੰਘੀ ਵਿਆਖਿਆ ਤੋਂ ਪਹਿਲਾਂ ਚਾਰਟ ਮੁੜ ਬਣਾਓ।',
    noBirthTimeAction1: 'ਮੁੱਖ ਤੌਰ ਤੇ ਰਾਸ਼ੀ ਅਤੇ ਦਸ਼ਾ ਅਧਾਰਿਤ ਮਾਰਗਦਰਸ਼ਨ ਹੀ ਦਿਖਾਓ।',
    noBirthTimeAction2: 'ਪ੍ਰਾਥਮਿਕ ਪਾਠ ਤੋਂ ਲਗਨ, ਘਰ, D9 ਅਤੇ ਘਰ-ਅਧਾਰਿਤ ਯੋਗ ਹਟਾਓ।',
  },
};

function buildInterpretationSections(
  lagnaMeta: { num: number; sa: string; en: string; ruler: string },
  placements: PlanetPlacement[],
  chart: AstroChart,
  lang: 'en' | 'hi' | 'pa',
): KundaliInterpretationSection[] {
  const copy = SECTION_COPY[lang];
  const byKey = Object.fromEntries(placements.map(p => [p.key, p]));
  const moon = byKey.Chandra;
  const sun = byKey.Surya;
  const lagnaLordName = lagnaMeta.ruler.split(' ')[0];
  const lagnaLord = byKey[lagnaLordName];
  const currentDasha = chart.dasha.current;
  const currentAntar = chart.dasha.currentAntardasha;
  const strongPlanets = placements.filter(p => p.strength >= 78).slice(0, 3);
  const weakPlanets = placements.filter(p => p.strength <= 55).slice(0, 3);

  if (chart.timeUnknown) {
    return [
      {
        id: 'confidence',
        title: copy.noBirthTimeTitle,
        priority: 'foundation',
        summary: copy.noBirthTimeSummary,
        points: [
          copy.noBirthTimePoint1,
          copy.noBirthTimePoint2,
          copy.noBirthTimePoint3,
        ],
        actions: [
          copy.noBirthTimeAction1,
          copy.noBirthTimeAction2,
        ],
      },
      {
        id: 'timing',
        title: copy.timingTitle,
        priority: 'timing',
        summary: currentDasha
          ? `${currentDasha.planet} Mahadasha is the active timing container${currentAntar ? `, refined by ${currentAntar.planet} Antardasha` : ''}.`
          : 'Current dasha was not resolved for this chart.',
        points: [
          currentDasha ? `${currentDasha.planet} Mahadasha runs until ${currentDasha.endDate}.` : 'No active Mahadasha found.',
          currentAntar ? `${currentAntar.planet} Antardasha runs ${currentAntar.startDate} to ${currentAntar.endDate}.` : 'No active Antardasha found.',
          chart.nakshatra ? `Janma Nakshatra ${chart.nakshatra.name}, pada ${chart.nakshatra.pada}, starts the Vimshottari sequence through ${chart.nakshatra.lord}.` : 'Nakshatra unavailable.',
        ],
        actions: [
          'Use dasha and nakshatra as the primary interpretive layer until birth time is confirmed.',
        ],
      },
    ];
  }

  return [
    {
      id: 'foundation',
      title: copy.foundationTitle,
      priority: 'foundation',
      summary: `${lagnaMeta.sa} lagna makes ${lagnaLordName} the chart anchor. The first read should combine Lagna, Lagna lord, Chandra and Surya before judging any single planet.`,
      points: [
        lagnaLord ? `Lagna lord ${lagnaLord.name} sits in house ${lagnaLord.house}, giving the life path its strongest practical direction.` : 'Lagna lord could not be resolved.',
        moon ? `Chandra in ${moon.sign}, house ${moon.house}, shows emotional patterning and the mind's default refuge.` : 'Moon placement unavailable.',
        sun ? `Surya in ${sun.sign}, house ${sun.house}, shows self-expression, authority, and soul confidence.` : 'Sun placement unavailable.',
      ],
      actions: [
        'Treat this as the base chart signature before reading dasha or remedies.',
        'Use birth-time confidence before making house-level conclusions.',
      ],
    },
    {
      id: 'timing',
      title: copy.timingTitle,
      priority: 'timing',
      summary: currentDasha
        ? `${currentDasha.planet} Mahadasha is the active timing container${currentAntar ? `, refined by ${currentAntar.planet} Antardasha` : ''}.`
        : 'Current dasha was not resolved for this chart.',
      points: [
        currentDasha ? `${currentDasha.planet} Mahadasha runs until ${currentDasha.endDate}.` : 'No active Mahadasha found.',
        currentAntar ? `${currentAntar.planet} Antardasha runs ${currentAntar.startDate} to ${currentAntar.endDate}.` : 'No active Antardasha found.',
        chart.nakshatra ? `Janma Nakshatra ${chart.nakshatra.name}, pada ${chart.nakshatra.pada}, starts the Vimshottari sequence through ${chart.nakshatra.lord}.` : 'Nakshatra unavailable.',
      ],
      actions: [
        'Use dasha as timing, not as a standalone prediction.',
        'Combine dasha lord condition, house lordship, and gochar for daily guidance.',
      ],
    },
    {
      id: 'strength',
      title: copy.strengthTitle,
      priority: 'caution',
      summary: 'This app shows a Vedic Power Index, not classical full Shadbala. It is useful for product guidance but should be labelled as a proxy.',
      points: [
        strongPlanets.length ? `Stronger grahas now: ${strongPlanets.map(p => `${p.name} ${p.strength}%`).join(', ')}.` : 'No standout strong grahas by current proxy.',
        weakPlanets.length ? `Grahas needing care: ${weakPlanets.map(p => `${p.name} ${p.strength}%`).join(', ')}.` : 'No very weak grahas by current proxy.',
        chart.aspects.length ? `${chart.aspects.length} close drishti/aspect contacts detected within 5 degrees.` : 'No tight drishti contacts detected within current orb.',
      ],
      actions: [
        'Avoid calling this classical Shadbala until full bala calculations are implemented.',
        'Use strong grahas for supportive practice suggestions and weaker grahas for gentle discipline.',
      ],
    },
    {
      id: 'navamsha',
      title: copy.navamshaTitle,
      priority: 'relationship',
      summary: 'D9/Navamsha has been added as a divisional layer. It is especially useful for dharma maturity, marriage themes, and inner refinement.',
      points: [
        chart.navamsha?.Lagna ? `Navamsha Lagna falls in ${chart.navamsha.Lagna.rashiName}.` : 'Navamsha Lagna unavailable.',
        chart.navamsha?.Shukra ? `Shukra Navamsha is ${chart.navamsha.Shukra.rashiName}.` : 'Shukra Navamsha unavailable.',
        chart.navamsha?.Guru ? `Guru Navamsha is ${chart.navamsha.Guru.rashiName}.` : 'Guru Navamsha unavailable.',
      ],
      actions: [
        'Use Navamsha as a supporting layer, not a replacement for Rashi chart.',
        'Show D9 only when birth time confidence is acceptable.',
      ],
    },
    {
      id: 'sadhana',
      title: copy.sadhanaTitle,
      priority: 'sadhana',
      summary: 'Remedies should stay sattvic, low-risk, and practice-oriented unless reviewed by a qualified pandit.',
      points: [
        currentDasha ? `Current dasha lord ${currentDasha.planet} can guide mantra, seva, vrata, and discipline suggestions.` : 'Dasha-specific upaya unavailable.',
        chart.yogas.length ? `Detected yogas: ${chart.yogas.map(y => y.name).join(', ')}.` : 'No major app-level yogas detected yet.',
        'Avoid fear-based predictions; prefer grounding, japa, seva, study, and discipline.',
      ],
      actions: [
        'Recommend one simple practice instead of many remedies.',
        'Keep gemstone, major vrata, and ritual prescriptions behind expert review.',
      ],
    },
  ];
}

const LAGNA_READINGS_LOCAL: Record<'en' | 'hi' | 'pa', Record<number, string>> = {
  en: {
    1:  'Aries (Mesha) Ascendant: You possess immense initiative, vitality, and leading warrior energy. Your path is to channel high passion into focused dharmic action (Karmayoga). Avoid impulsiveness.',
    2:  'Taurus (Vrishabha) Ascendant: Stabilizing, artistic, and steady. You possess a natural resonance with sacred environments and family values. Your lesson is to rise above material clinging.',
    3:  'Gemini (Mithuna) Ascendant: Curious, intellectual, and communicative. Your spiritual growth is accelerated by study of sacred shastras (Jnana) and devotional chanting. Ground your thoughts.',
    4:  'Cancer (Karka) Ascendant: Exceptionally intuitive, emotional, and nurturing. Your spiritual path is through high devotion (Bhakti). Create emotional peace inside your lineage network.',
    5:  'Leo (Simha) Ascendant: Majestic, noble, and self-assured. Ruled by Surya, you have a solar aura meant to light the path for others. Balance authority with deep humility.',
    6:  'Virgo (Kanya) Ascendant: Analytical, pure-hearted, and service-oriented. You naturally excel in selfless service (Seva). Direct your intellectual mastery toward clarifying spiritual truths.',
    7:  'Libra (Tula) Ascendant: Harmonious, diplomatic, and beauty-loving. Your path is to balance material success with inner spiritual centering. Seek truth in all relationships.',
    8:  'Scorpio (Vrishchika) Ascendant: Intense, mystical, and transformative. You have a natural affinity for esoteric sciences, deep meditation, and yogic secrets. Channel your energy to conquer desire.',
    9:  'Sagittarius (Dhanu) Ascendant: Philosophical, optimistic, and highly righteous. Ruled by Guru, you are a natural seeker of ancient wisdom and dharma. Share wisdom selflessly.',
    10: 'Capricorn (Makara) Ascendant: Disciplined, structured, and hardworking. Under Shani\'s gaze, you excel in patient spiritual endurance (Tapasya). Let go of control and trust divine flow.',
    11: 'Aquarius (Kumbha) Ascendant: Humanitarian, innovative, and meditative. You look at the universe through a cosmic lens. Your sadhana is blessed when working for global elevation.',
    12: 'Pisces (Meena) Ascendant: Deeply spiritual, artistic, and transcendental. You hold a natural gateway to liberation (Moksha) and deep meditation. Favour structured routines to keep grounded.',
  },
  hi: {
    1: 'मेष लग्न: आपके भीतर अपार पहल, जीवन शक्ति और योद्धा ऊर्जा है। आपका मार्ग उच्च जुनून को केंद्रित धर्म कार्य (कर्मयोग) में लगाना है। जल्दबाजी से बचें।',
    2: 'वृषभ लग्न: स्थिर, कलात्मक और शांत। आपके पास पवित्र वातावरण और पारिवारिक मूल्यों के साथ एक स्वाभाविक तालमेल है। आपका सबक भौतिक लगाव से ऊपर उठना है।',
    3: 'मिथुन लग्न: जिज्ञासु, बौद्धिक और मिलनसार। आपकी आध्यात्मिक प्रगति पवित्र शास्त्रों (ज्ञान) के अध्ययन और भक्ति भजनों से तेज होती है। विचारों को केंद्रित रखें।',
    4: 'कर्क लग्न: अत्यधिक सहज, संवेदनशील और पोषण करने वाले। आपका आध्यात्मिक मार्ग उच्च भक्ति (भक्ति योग) के माध्यम से है। अपने कुल में भावनात्मक शांति लाएं।',
    5: 'सिंह लग्न: राजसी, महान और आत्मविश्वासी। सूर्य द्वारा शासित, आपके पास दूसरों का मार्गदर्शन करने के लिए एक सौर आभा है। अधिकार को गहरी नम्रता के साथ संतुलित करें।',
    6: 'कन्या लग्न: विश्लेषणात्मक, शुद्ध हृदय और सेवाभावी। आप निष्काम सेवा (सेवा) में स्वाभाविक रूप से कुशल हैं। आध्यात्मिक सत्यों को स्पष्ट करने में अपनी बुद्धि लगाएं।',
    7: 'तुला लग्न: सामंजस्यपूर्ण, कूटनीतिक और कलाप्रिय। आपका मार्ग भौतिक सफलता को आंतरिक आध्यात्मिक केंद्र के साथ संतुलित करना है। सभी रिश्तों में सत्य खोजें।',
    8: 'वृश्चिक लग्न: गहन, रहस्यमयी और परिवर्तनकारी। आपके पास गूढ़ विज्ञान, ध्यान और योग के रहस्यों के लिए एक स्वाभाविक रुचि है। इच्छाओं पर विजय पाने में ऊर्जा लगाएं।',
    9: 'धनु लग्न: दार्शनिक, आशावादी और अत्यधिक धर्मपरायण। गुरु द्वारा शासित, आप प्राचीन ज्ञान और धर्म के साधक हैं। ज्ञान को निःस्वार्थ भाव से साझा करें।',
    10: 'मकर लग्न: अनुशासित, संरचित और परिश्रमी। शनि की दृष्टि में, आप धैर्यवान आध्यात्मिक तप (तपस्या) में कुशल हैं। नियंत्रण छोड़ें और ईश्वरीय प्रवाह पर भरोसा करें।',
    11: 'कुंभ लग्न: मानवीय, अभिनव और ध्यानमग्न। आप ब्रह्मांड को एक व्यापक दृष्टिकोण से देखते हैं। वैश्विक कल्याण के लिए कार्य करते समय आपकी साधना धन्य होती है।',
    12: 'मीन लग्न: गहराई से आध्यात्मिक, कलात्मक और अलौकिक। आप मोक्ष और गहरे ध्यान का स्वाभाविक मार्ग रखते हैं। खुद को जमीन पर रखने के लिए संरचित दिनचर्या अपनाएं।',
  },
  pa: {
    1: 'ਮੇਸ਼ ਲਗਨ: ਤੁਹਾਡੇ ਅੰਦਰ ਅਥਾਹ ਪਹਿਲਕਦਮੀ, ਜੀਵਨ ਸ਼ਕਤੀ ਅਤੇ ਯੋਧਾ ਊਰਜਾ ਹੈ। ਤੁਹਾਡਾ ਮਾਰਗ ਉੱਚ ਜਨੂੰਨ ਨੂੰ ਕੇਂਦਰਿਤ ਧਰਮ ਕਾਰਜ (ਕਰਮਯੋਗ) ਵਿੱਚ ਲਗਾਉਣਾ ਹੈ। ਜਲਦਬਾਜ਼ੀ ਤੋਂ ਬਚੋ।',
    2: 'ਵ੍ਰਿਸ਼ਭ ਲਗਨ: ਸਥਿਰ, ਕਲਾਤਮਕ ਅਤੇ ਸ਼ਾਂਤ। ਤੁਹਾਡੇ ਕੋਲ ਪਵਿੱਤਰ ਵਾਤਾਵਰਣ ਅਤੇ ਪਰਿਵਾਰਕ ਕਦਰਾਂ-ਕੀਮਤਾਂ ਨਾਲ ਇੱਕ ਕੁਦਰਤੀ ਤਾਲਮੇਲ ਹੈ। ਤੁਹਾਡਾ ਸਬਕ ਭੌਤਿਕ ਲਗਾਅ ਤੋਂ ਉੱਪਰ ਉੱਠਣਾ ਹੈ।',
    3: 'ਮਿਥੁਨ ਲਗਨ: ਜਿਗਿਆਸੂ, ਬੌਧਿਕ ਅਤੇ ਮਿਲਣਸਾਰ। ਤੁਹਾਡੀ ਅਧਿਆਤਮਿਕ ਪ੍ਰਗਤੀ ਪਵਿੱਤਰ ਸ਼ਾਸਤਰਾਂ (ਗਿਆਨ) ਦੇ ਅਧਿਐਨ ਅਤੇ ਭਗਤੀ ਭਜਨਾਂ ਨਾਲ ਤੇਜ਼ ਹੁੰਦੀ ਹੈ। ਵਿਚਾਰਾਂ ਨੂੰ ਕੇਂਦਰਿਤ ਰੱਖੋ।',
    4: 'ਕਰਕ ਲਗਨ: ਬਹੁਤ ਹੀ ਸਹਿਜ, ਸੰਵੇਦਨਸ਼ੀਲ ਅਤੇ ਪਾਲਣ ਪੋਸ਼ਣ ਕਰਨ ਵਾਲੇ। ਤੁਹਾਡਾ ਅਧਿਆਤਮਿਕ ਮਾਰਗ ਉੱਚੀ ਭਗਤੀ (ਭਗਤੀ ਯੋਗ) ਦੇ ਜ਼ਰੀਏ ਹੈ। ਆਪਣੇ ਕੁਲ ਵਿੱਚ ਭਾਵਨਾਤਮਕ ਸ਼ਾਂਤੀ ਲਿਆਓ।',
    5: 'ਸਿੰਘ ਲਗਨ: ਰਾਜਸੀ, ਮਹਾਨ ਅਤੇ ਆਤਮ ਵਿਸ਼ਵਾਸੀ। ਸੂਰਜ ਦੁਆਰਾ ਸ਼ਾਸਿਤ, ਤੁਹਾਡੇ ਕੋਲ ਦੂਜਿਆਂ ਦਾ ਮਾਰਗਦਰਸ਼ਨ ਕਰਨ ਲਈ ਇੱਕ ਸੂਰਜੀ ਆਭਾ ਹੈ। ਅਧਿਕਾਰ ਨੂੰ ਡੂੰਘੀ ਨਿਮਰਤਾ ਨਾਲ ਸੰਤੁਲਿਤ ਕਰੋ।',
    6: 'ਕੰਨਿਆ ਲਗਨ: ਵਿਸ਼ਲੇਸ਼ਣਾਤਮਕ, ਸ਼ੁੱਧ ਹਿਰਦੇ ਅਤੇ ਸੇਵਾਭਾਵੀ। ਤੁਸੀਂ ਨਿਸ਼ਕਾਮ ਸੇਵਾ (ਸੇਵਾ) ਵਿੱਚ ਕੁਦਰਤੀ ਤੌਰ ਤੇ ਕੁਸ਼ਲ ਹੋ। ਅਧਿਆਤਮਿਕ ਸੱਚਾਈਆਂ ਨੂੰ ਸਪੱਸ਼ਟ ਕਰਨ ਵਿੱਚ ਆਪਣੀ ਬੁੱਧੀ ਲਗਾਓ।',
    7: 'ਤੁਲਾ ਲਗਨ: ਇਕਸਾਰ, ਕੂਟਨੀਤਕ ਅਤੇ ਕਲਾ ਪ੍ਰੇਮੀ। ਤੁਹਾਡਾ ਮਾਰਗ ਭੌਤਿਕ ਸਫਲਤਾ ਨੂੰ ਅੰਦਰੂਨੀ ਅਧਿਆਤਮਿਕ ਕੇਂਦਰ ਨਾਲ ਸੰਤੁਲਿਤ ਕਰਨਾ ਹੈ। ਸਾਰੇ ਰਿਸ਼ਤਿਆਂ ਵਿੱਚ ਸੱਚ ਦੀ ਭਾਲ ਕਰੋ।',
    8: 'ਵ੍ਰਿਸ਼ਚਿਕ ਲਗਨ: ਤੀਬਰ, ਰਹੱਸਮਈ ਅਤੇ ਪਰਿਵਰਤਨਸ਼ੀਲ। ਤੁਹਾਡੇ ਕੋਲ ਗੂੜ੍ਹੇ ਵਿਗਿਆਨ, ਡੂੰਘੇ ਧਿਆਨ ਅਤੇ ਯੋਗਿਕ ਭੇਦਾਂ ਲਈ ਕੁਦਰਤੀ ਖਿੱਚ ਹੈ। ਇੱਛਾਵਾਂ ਤੇ ਕਾਬੂ ਪਾਉਣ ਲਈ ਊਰਜਾ ਲਗਾਓ।',
    9: 'ਧਨੂ ਲਗਨ: ਦਾਰਸ਼ਨਿਕ, ਆਸ਼ਾਵਾਦੀ ਅਤੇ ਉੱਚੇ ਧਰਮੀ। ਗੁਰੂ ਦੁਆਰਾ ਸ਼ਾਸਿਤ, ਤੁਸੀਂ ਪ੍ਰਾਚੀਨ ਗਿਆਨ ਅਤੇ ਧਰਮ ਦੇ ਖੋਜੀ ਹੋ। ਗਿਆਨ ਨੂੰ ਨਿਰਸਵਾਰਥ ਭਾਵਨਾ ਨਾਲ ਸਾਂਝਾ ਕਰੋ।',
    10: 'ਮਕਰ ਲਗਨ: ਅਨੁਸ਼ਾਸਿਤ, ਵਿਵਸਥਿਤ ਅਤੇ ਮਿਹਨਤੀ। ਸ਼ਨੀ ਦੀ ਨਜ਼ਰ ਹੇਠ, ਤੁਸੀਂ ਸਬਰ ਨਾਲ ਅਧਿਆਤਮਿਕ ਤਪ (ਤਪੱਸਿਆ) ਵਿੱਚ ਨਿਪੁੰਨ ਹੋ। ਕੰਟਰੋਲ ਛੱਡੋ ਅਤੇ ਬ੍ਰਹਮ ਪ੍ਰਵਾਹ ਤੇ ਭਰੋਸਾ ਕਰੋ।',
    11: 'ਕੁੰਭ ਲਗਨ: ਮਾਨਵਤਾਵਾਦੀ, ਨਵੀਨਤਾਕਾਰੀ ਅਤੇ ਧਿਆਨਮਗਨ। ਤੁਸੀਂ ਬ੍ਰਹਿਮੰਡ ਨੂੰ ਇੱਕ ਵਿਆਪਕ ਦ੍ਰਿਸ਼ਟੀਕੋਣ ਤੋਂ ਵੇਖਦੇ ਹੋ। ਜਦੋਂ ਤੁਸੀਂ ਵਿਸ਼ਵ ਕਲਿਆਣ ਲਈ ਕੰਮ ਕਰਦੇ ਹੋ ਤਾਂ ਤੁਹਾਡੀ ਸਾਧਨਾ ਸਫਲ ਹੁੰਦੀ ਹੈ।',
    12: 'ਮੀਨ ਲਗਨ: ਡੂੰਘਾਈ ਨਾਲ ਅਧਿਆਤਮਿਕ, ਕਲਾਤਮਕ ਅਤੇ ਅਲੌਕਿਕ। ਤੁਹਾਡੇ ਕੋਲ ਮੋਖ ਅਤੇ ਡੂੰਘੇ ਧਿਆਨ ਦਾ ਕੁਦਰਤੀ ਮਾਰਗ ਹੈ। ਆਪਣੇ ਆਪ ਨੂੰ ਜ਼ਮੀਨ ਤੇ ਰੱਖਣ ਲਈ ਵਿਵਸਥਿਤ ਰੋਜ਼ਾਨਾ ਦਿਨਚਰਿਆ ਅਪਣਾਓ।',
  }
};

export function generateKundali(input: KundaliInput, lang: 'en' | 'hi' | 'pa' = 'en'): KundaliResult {
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
    placements.push(makePlacement(pname, graha, lang));
  }

  const navamshaPlacements: PlanetPlacement[] = [];
  if (!chart.timeUnknown) {
    for (const pname of ['Lagna', ...PLANET_ORDER]) {
      const graha = chart.navamsha[pname];
      if (!graha) continue;
      navamshaPlacements.push(makePlacement(pname, graha, lang));
    }
  }

  // ── House readings ──────────────────────────────────────────────────────────
  const houseReadings: Record<number, string> = {};
  if (!chart.timeUnknown) {
    for (let house = 1; house <= 12; house++) {
      const tempReading = HOUSE_READINGS_LOCAL[lang][house];
      if (house === 1) {
        houseReadings[1] = tempReading.replace('{lagna}', lagnaMeta.sa);
      } else if (house === 2) {
        const secondRashiName = RASHI_METADATA[(lagnaRashiIndex + 1) % 12].sa;
        houseReadings[2] = tempReading.replace('{sign}', secondRashiName);
      } else {
        houseReadings[house] = tempReading;
      }
    }
  }

  const panditAiDestinyReading = generatePanditAiReading(lagnaMeta, placements, chart, lang);
  const interpretationSections = buildInterpretationSections(lagnaMeta, placements, chart, lang);
  const lagnaReading = chart.timeUnknown
    ? (
      lang === 'hi'
        ? 'जन्म समय अज्ञात है, इसलिए लग्न और भाव-आधारित व्याख्या को अभी अनुमानात्मक मानें। इस चार्ट का भरोसेमंद भाग चंद्र राशि, नक्षत्र और दशा है।'
        : lang === 'pa'
          ? 'ਜਨਮ ਸਮਾਂ ਅਣਜਾਣ ਹੈ, ਇਸ ਲਈ ਲਗਨ ਅਤੇ ਘਰ-ਅਧਾਰਿਤ ਵਿਆਖਿਆ ਨੂੰ ਹਾਲੇ ਅਨੁਮਾਨਾਤਮਕ ਮੰਨੋ। ਇਸ ਚਾਰਟ ਦਾ ਵੱਧ ਭਰੋਸੇਯੋਗ ਹਿੱਸਾ ਚੰਦਰ ਰਾਸ਼ੀ, ਨਕਸ਼ਤਰ ਅਤੇ ਦਸ਼ਾ ਹੈ।'
          : 'Birth time is unknown, so ascendant and house-based interpretation should be treated as provisional. The dependable layer here is Moon sign, Nakshatra, and Dasha.'
    )
    : (LAGNA_READINGS_LOCAL[lang][lagnaNumber] ?? '');

  return {
    input,
    lagnaSign:    lagnaMeta.sa,
    lagnaEnglish: lagnaMeta.en,
    lagnaNumber,
    placements,
    houseReadings,
    lagnaReading,
    panditAiDestinyReading,
    interpretationSections,
    navamshaPlacements,
    yogaResults: chart.timeUnknown ? [] : chart.yogas,
    aspectResults: chart.timeUnknown ? [] : chart.aspects,
    precisionNotes: chart.quality.notes,
    chart,
  };
}

// ── SVG renderer (North Indian Diamond chart) ─────────────────────────────────
// Rahu & Ketu are ALWAYS retrograde in Vedic astrology — no (R) shown for them.
// Other planets use a compact ᴿ superscript to keep labels tidy inside triangles.
// Multi-planet houses are center-stacked; font shrinks for 3+ planets per house.
export function renderKundaliSVG(result: KundaliResult): string {
  const { lagnaNumber, placements } = result;

  // Build per-house label lists
  const housePlanets: Record<number, string[]> = {};
  for (let h = 1; h <= 12; h++) housePlanets[h] = [];
  placements.forEach(p => {
    const alwaysRetro = p.key === 'Rahu' || p.key === 'Ketu';
    const label = (p.isRetrograde && !alwaysRetro) ? `${p.symbol}ᴬ` : p.symbol; // ᴿ = U+1D2C
    housePlanets[p.house].push(label);
  });

  const getHouseRashi = (house: number): string => {
    const num = ((lagnaNumber - 1 + (house - 1)) % 12) + 1;
    return String(RASHI_METADATA[num - 1]?.sa?.slice(0, 3) ?? num);
  };

  // Rashi label corner positions (edge/corner of each triangle)
  const housePos: Record<number, [number, number]> = {
    1: [180, 76],  2: [94, 48],   3: [48, 94],   4: [76, 180],
    5: [48, 268],  6: [94, 315],  7: [180, 296],  8: [268, 315],
    9: [315, 268], 10: [284, 180], 11: [315, 94], 12: [268, 48],
  };

  // Planet area center per house — kept well inside each triangle
  const planetPos: Record<number, [number, number]> = {
    1: [180, 116],  2: [114, 94],  3: [82, 124],  4: [118, 182],
    5: [82, 242],   6: [114, 282], 7: [180, 248],  8: [246, 282],
    9: [278, 242], 10: [242, 182], 11: [278, 124], 12: [246, 94],
  };

  // Safe vertical extent per house (how many lines fit without overflowing)
  const houseMaxLines: Record<number, number> = {
    1: 4, 2: 3, 3: 3, 4: 4, 5: 3, 6: 3,
    7: 4, 8: 3, 9: 3, 10: 4, 11: 3, 12: 3,
  };

  const LINE_H = 12;

  const rashiLabels = Object.entries(housePos).map(([h, [x, y]]) =>
    `<text x="${x}" y="${y}" fill="#C5A059" font-size="10" font-family="'Outfit',sans-serif" font-weight="700" text-anchor="middle">${getHouseRashi(Number(h))}</text>`
  ).join('\n');

  const planetLabels = Object.entries(planetPos).map(([h, [cx, cy]]) => {
    const hNum   = Number(h);
    const all    = housePlanets[hNum];
    if (all.length === 0) return '';

    const maxLines = houseMaxLines[hNum] ?? 3;
    const visible  = all.slice(0, maxLines);
    const overflow = all.length - visible.length;

    // Font shrinks for crowded houses
    const fs = visible.length >= 3 ? 9 : 10;

    // Center-stack: compute topmost y so the group is vertically centered at cy
    const totalH = visible.length * LINE_H;
    const startY = cy - totalH / 2 + LINE_H / 2;

    const rows = visible.map((sym, i) =>
      `<text x="${cx}" y="${startY + i * LINE_H}" fill="#EDE8DE" font-size="${fs}" font-family="'Outfit',sans-serif" font-weight="600" text-anchor="middle">${sym}</text>`
    );

    // Overflow indicator (e.g. "+1" when > maxLines planets in same house)
    if (overflow > 0) {
      rows.push(
        `<text x="${cx}" y="${startY + visible.length * LINE_H}" fill="rgba(237,232,222,0.4)" font-size="8" font-family="'Outfit',sans-serif" text-anchor="middle">+${overflow}</text>`
      );
    }

    return rows.join('\n');
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
  <text x="180" y="206" fill="rgba(197,160,89,0.65)" font-size="7" font-weight="bold" letter-spacing="0.08em" text-anchor="middle">LAGNA</text>
  <text x="348" y="356" fill="rgba(197,160,89,0.35)" font-size="7" font-family="'Outfit',sans-serif" text-anchor="end">ᴬ = retrograde</text>
</svg>
  `.trim();
}
