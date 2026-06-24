export interface ObservanceRule {
  slug: string;
  display_name: string;
  emoji: string;
  description: string;
  kind: 'major' | 'vrat' | 'regional';
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  rule_family: 'solar_fixed' | 'lunar_tithi' | 'lunar_tithi_recurring' | 'weekday_recurring' | 'relative_to_other_observance' | 'nakshatra_based' | 'regional_calendar';
  verification_type: 'solar_fixed' | 'lunar_tithi' | 'nakshatra_based' | 'regional_calendar' | 'historical_commemoration';
  solar_month?: number; // 1-12
  solar_day?: number;   // 1-31
  lunar_tithi_index?: number; // 1-30
  lunar_masa_name?: string;   // IMPORTANT: must match panchang.ts masaName output (shifted 2 months behind traditional)
  nanakshahi_month?: string;  // e.g. 'Vaisakh'
  nanakshahi_day?: number;    // 1-based day within the Nanakshahi month
  relative_base_slug?: string;
  relative_offset_days?: number;
  nakshatra_name?: string;
  /**
   * When a rule matches the same tithi twice in one solar month (dark-half
   * tithi that spans two lunar months), prefer the LAST match instead of the
   * first. Use this for festivals like Janmashtami whose correct occurrence
   * is the later one (Shravana dark half, not the earlier Ashadha dark half).
   */
  prefer_last_match?: boolean;
  /**
   * When the target tithi moves fast enough to be fully contained between two
   * consecutive 5am UTC scans, it appears "skipped" in the engine's day-by-day
   * data (prev day = T-1, next day = T+1). This flag enables detection of such
   * skipped tithis: the day AFTER the skip (where tithiIndex === target+1) is
   * treated as the observance date, which matches the tithi's IST-sunrise
   * prevalence. Use for Shukla tithis 1-14 that can be fast-moving.
   */
  allow_skipped_tithi?: boolean;
  /**
   * Recurring tithi-based vrats that fall in EVERY lunar masa (not a single
   * named festival). The target tithi index/indices are matched across all
   * masas, both pakshas — e.g. Ekadashi = [11, 26], Sankashti Chaturthi = [19].
   * Used only with rule_family 'lunar_tithi_recurring'.
   */
  recurring_tithi_indices?: number[];
  /** Weekday recurring rules. Uses JS/UTC weekday: 0=Sunday, 1=Monday, ... 6=Saturday. */
  recurring_weekday?: number;
  route_kind?: 'vrat' | null;
  route_slug?: string | null;
  region?: string | null;
}

// Tithi index convention (amanta system):
// 1 = Shukla Pratipada ... 15 = Purnima
// 16 = Krishna Pratipada ... 30 = Amavasya (new moon)
//
// IMPORTANT — lunar_masa_name calibration:
// panchang.ts computes masaName from the sun's sidereal rashi with a formula that
// returns names ~2 months BEHIND the traditional chandra-masa name.
// These rules use the ACTUAL panchang output values (verified against 2025 dates).
// Traditional → panchang output: Phalguna→Pausha, Chaitra→Magha, Vaishakha→Phalguna,
// Jyeshtha→Chaitra, Ashadha→Vaishakha, Shravana→Jyeshtha, Bhadrapada→Ashadha,
// Ashwin→Shravana, Kartika→Bhadrapada, Margashirsha→Ashwin, Magha→Margashirsha.

export const CANONICAL_RULES: ObservanceRule[] = [
  // ── Hindu ──────────────────────────────────────────────────────────────────
  {
    slug: 'makar-sankranti',
    display_name: 'Makar Sankranti',
    emoji: '🪁',
    description: 'Harvest festival marking the sun\'s transition into Capricorn',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'solar_fixed',
    verification_type: 'solar_fixed',
    solar_month: 1,
    solar_day: 14,
  },
  {
    slug: 'vasant-panchami',
    display_name: 'Vasant Panchami',
    emoji: '🌼',
    description: 'Festival of Goddess Saraswati, marks arrival of spring',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Margashirsha', // traditional Magha
    lunar_tithi_index: 5,
  },
  {
    slug: 'maha-shivaratri',
    display_name: 'Maha Shivaratri',
    emoji: '🕉️',
    description: 'The great night of Shiva — night-long vigil and worship',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Pausha', // traditional Phalguna (purnimanta) / Magha (amanta)
    lunar_tithi_index: 28,     // Chaturdashi; use 28 since tithi-29 night falls after the 05:00 UTC scan
  },
  {
    slug: 'holi',
    display_name: 'Holi',
    emoji: '🎨',
    description: 'Festival of colours celebrating victory of good over evil',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Pausha', // traditional Phalguna Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'gudi-padwa',
    display_name: 'Gudi Padwa',
    emoji: '🏮',
    description: 'Hindu New Year according to the Shalivahana calendar',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Magha', // traditional Chaitra Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
  },
  {
    slug: 'chaitra-navratri-begins',
    display_name: 'Chaitra Navratri begins',
    emoji: '🪔',
    description: 'Spring Navratri beginning on Chaitra Shukla Pratipada, nine days of Devi worship leading to Ram Navami.',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Magha', // traditional Chaitra Shukla Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'navratri',
  },
  {
    slug: 'ugadi',
    display_name: 'Ugadi',
    emoji: '🌿',
    description: 'New Year for Telugu and Kannada communities',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Magha', // traditional Chaitra Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
  },
  {
    slug: 'ram-navami',
    display_name: 'Ram Navami',
    emoji: '🏹',
    description: 'Celebration of the birth of Lord Rama',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Magha', // traditional Chaitra Shukla Navami
    lunar_tithi_index: 9,
    allow_skipped_tithi: true, // Navami can be fast-moving; 5am UTC scan may land on T-1/T+1
  },
  {
    slug: 'hanuman-jayanti',
    display_name: 'Hanuman Jayanti',
    emoji: '🙏',
    description: 'Celebration of the birth of Lord Hanuman',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Magha', // traditional Chaitra Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'akshaya-tritiya',
    display_name: 'Akshaya Tritiya',
    emoji: '💛',
    description: 'Auspicious day for new beginnings — celebrated by Hindu and Jain',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Phalguna', // traditional Vaishakha Shukla Tritiya
    lunar_tithi_index: 3,
    allow_skipped_tithi: true, // Tritiya can be fast-moving; 5am UTC scan may land on T-1/T+1
  },
  {
    slug: 'narasimha-jayanti',
    display_name: 'Narasimha Jayanti',
    emoji: '🦁',
    description: 'Celebration of Vishnu\'s Narasimha avatar',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Phalguna', // traditional Vaishakha Shukla Chaturdashi
    lunar_tithi_index: 14,
  },
  {
    slug: 'shani-jayanti',
    display_name: 'Shani Jayanti',
    emoji: '⚖️',
    description: 'Birth anniversary of Shani Dev — the lord of karma and justice',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Chaitra', // traditional Jyeshtha Amavasya
    lunar_tithi_index: 30,
  },
  {
    slug: 'vat-savitri-amavasya',
    display_name: 'Vat Savitri Vrat',
    emoji: '🌳',
    description: 'Vrat observed by married women for the well-being of their husbands (Jyeshtha Amavasya — North India)',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Chaitra', // traditional Jyeshtha Amavasya
    lunar_tithi_index: 30,
    route_kind: 'vrat',
    route_slug: 'vat-savitri',
  },
  {
    slug: 'vat-savitri-purnima',
    display_name: 'Vat Savitri Purnima',
    emoji: '🌳',
    description: 'Vrat observed by married women for the well-being of their husbands (Jyeshtha Purnima — Maharashtra, Gujarat, Karnataka)',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Chaitra', // traditional Jyeshtha Purnima
    lunar_tithi_index: 15,
    route_kind: 'vrat',
    route_slug: 'vat-savitri-purnima',
  },
  {
    slug: 'jagannath-rath-yatra',
    display_name: 'Jagannath Rath Yatra',
    emoji: '🛕',
    description: 'Grand chariot procession of Lord Jagannath at Puri',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Vaishakha', // traditional Ashadha Shukla Dwitiya
    lunar_tithi_index: 2,
  },
  {
    slug: 'gupt-navratri-ashadha-begins',
    display_name: 'Ashadha Gupt Navratri begins',
    emoji: '🪔',
    description: 'Gupt Navratri in Ashadha, a quieter Devi sadhana period observed in Shakta and regional traditions.',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Vaishakha', // traditional Ashadha Shukla Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'navratri',
  },
  {
    slug: 'guru-purnima',
    display_name: 'Guru Purnima',
    emoji: '🙏',
    description: 'Day to honour spiritual teachers and gurus — observed by all traditions',
    kind: 'major',
    tradition: 'all',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // engine label for traditional Ashadha Purnima
    lunar_tithi_index: 15,
    route_kind: 'vrat',
    route_slug: 'purnima',
  },
  {
    slug: 'nag-panchami',
    display_name: 'Nag Panchami',
    emoji: '🐍',
    description: 'Worship of serpent deities for protection',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana Shukla Panchami
    lunar_tithi_index: 5,
  },
  {
    slug: 'raksha-bandhan',
    display_name: 'Raksha Bandhan',
    emoji: '🧿',
    description: 'Festival celebrating the bond between brothers and sisters',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'krishna-janmashtami',
    display_name: 'Krishna Janmashtami',
    emoji: '🦚',
    description: 'Celebration of the birth of Lord Krishna at midnight',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana Krishna Ashtami (amanta)
    lunar_tithi_index: 23,
    prefer_last_match: true,    // 'Jyeshtha'/23 fires twice (Ashadha & Shravana dark halves); want the later one
  },
  {
    slug: 'ganesh-chaturthi',
    display_name: 'Ganesh Chaturthi',
    emoji: '🐘',
    description: '10-day festival celebrating the birth of Lord Ganesha',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashadha', // traditional Bhadrapada Shukla Chaturthi
    lunar_tithi_index: 4,
  },
  {
    slug: 'onam',
    display_name: 'Onam',
    emoji: '🌺',
    description: 'Harvest festival of Kerala celebrating King Mahabali\'s return',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'nakshatra_based',
    verification_type: 'nakshatra_based',
    lunar_masa_name: 'Ashadha',  // Chingam = sidereal Leo; panchang gives 'Ashadha' for Leo solar month
    nakshatra_name: 'Shravana',  // Thiruvonam = moon in Shravana nakshatra
  },
  {
    slug: 'hartalika-teej',
    display_name: 'Hartalika Teej',
    emoji: '🌿',
    description: 'Vrat observed by Hindu women for marital bliss — a fast for Shiva and Parvati, welcoming the monsoon',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashadha', // traditional Bhadrapada Shukla Tritiya
    lunar_tithi_index: 3,
    route_kind: 'vrat',
    route_slug: 'hartalika-teej',
  },
  {
    slug: 'mahalaya-amavasya',
    display_name: 'Mahalaya Amavasya',
    emoji: '☽',
    description: 'Day to offer prayers to ancestors (Pitru Paksha ends)',
    kind: 'vrat',
    tradition: 'hindu',
    // Mahalaya Amavasya is definitionally the last day of Pitru Paksha — the day
    // immediately before Navratri (Ashwin Shukla Pratipada). Using a relative rule
    // is more reliable than detecting the Amavasya tithi directly, which wraps from
    // tithi 30 → 1 and is easily missed by the 5am UTC scan in some years.
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'navratri-begins',
    relative_offset_days: -1,
    route_kind: 'vrat',
    route_slug: 'amavasya',
  },
  {
    slug: 'navratri-begins',
    display_name: 'Sharad Navratri begins',
    emoji: '🪔',
    description: 'Nine nights of worship of Goddess Durga, Lakshmi and Saraswati',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Shravana', // traditional Ashwin Shukla Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'navratri',
  },
  {
    slug: 'chintpurni-mata-chaitra-navratri',
    display_name: 'Chintpurni Mata Chaitra Navratri',
    emoji: '🌺',
    description: 'Regional Shakti Peeth observance at Maa Chintpurni, associated with Chaitra Navratri Devi worship.',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'regional_calendar',
    relative_base_slug: 'chaitra-navratri-begins',
    relative_offset_days: 0,
    route_kind: 'vrat',
    route_slug: 'navratri',
    region: 'Himachal Pradesh / Chintpurni Shakti Peeth',
  },
  {
    slug: 'chintpurni-mata-sharad-navratri',
    display_name: 'Chintpurni Mata Sharad Navratri',
    emoji: '🌺',
    description: 'Regional Shakti Peeth observance at Maa Chintpurni, associated with Sharad Navratri Devi worship.',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'regional_calendar',
    relative_base_slug: 'navratri-begins',
    relative_offset_days: 0,
    route_kind: 'vrat',
    route_slug: 'navratri',
    region: 'Himachal Pradesh / Chintpurni Shakti Peeth',
  },
  {
    slug: 'dussehra',
    display_name: 'Dussehra',
    emoji: '🎇',
    description: 'Victory of Rama over Ravana — triumph of good over evil',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'navratri-begins',
    relative_offset_days: 9, // Vijaya Dashami = the 10th tithi, nine calendar days after Pratipada begins
  },
  {
    slug: 'karva-chauth',
    display_name: 'Karva Chauth',
    emoji: '🌙',
    description: 'Vrat observed by married Hindu women for their husbands',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Bhadrapada', // traditional Kartika Krishna Chaturthi
    lunar_tithi_index: 19,
    route_kind: 'vrat',
    route_slug: 'karva-chauth',
  },
  {
    slug: 'dhanteras',
    display_name: 'Dhanteras',
    emoji: '💰',
    description: 'First day of Diwali festival — worship of Goddess Lakshmi',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'diwali',
    relative_offset_days: -2,
  },
  {
    slug: 'diwali',
    display_name: 'Diwali',
    emoji: '🎆',
    description: 'Festival of lights — celebrated by Hindu, Jain and Sikh communities',
    kind: 'major',
    tradition: 'all',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Bhadrapada', // traditional Kartika Amavasya
    lunar_tithi_index: 29,          // Amavasya (30) begins that evening; 5am scan shows 29
  },
  {
    slug: 'govardhan-puja',
    display_name: 'Govardhan Puja',
    emoji: '⛰️',
    description: 'Worship of Govardhan Hill and Lord Krishna',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'diwali',
    relative_offset_days: 1,
  },
  {
    slug: 'bhai-dooj',
    display_name: 'Bhai Dooj',
    emoji: '👫',
    description: 'Celebration of the bond between brothers and sisters',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'diwali',
    relative_offset_days: 2,
  },
  {
    slug: 'chhath-puja',
    display_name: 'Chhath Puja',
    emoji: '☀️',
    description: 'Worship of the Sun God and Chhathi Maiya',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Bhadrapada', // traditional Kartika Shukla Shashthi
    lunar_tithi_index: 6,
  },
  {
    slug: 'kartik-purnima',
    display_name: 'Kartik Purnima',
    emoji: '🪷',
    description: 'Full moon of Kartik month — extremely auspicious for bathing',
    kind: 'vrat',
    tradition: 'hindu',
    // Kartika Purnima = Purnima after Diwali (Kartika Amavasya). The panchang masaName
    // for this Purnima shifts between years (Bhadrapada vs Ashwin), and the tithi can be
    // too short to capture at 5am UTC. Relative rule is more reliable.
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'diwali',
    relative_offset_days: 16, // Kartika Purnima ≈ 16 calendar days after Diwali (Amavasya)
    route_kind: 'vrat',
    route_slug: 'purnima',
  },
  {
    slug: 'vivah-panchami',
    display_name: 'Vivah Panchami',
    emoji: '💍',
    description: 'Anniversary of the marriage of Rama and Sita',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashwin', // traditional Margashirsha Shukla Panchami
    lunar_tithi_index: 5,
  },
  {
    slug: 'gita-jayanti',
    display_name: 'Gita Jayanti',
    emoji: '📖',
    description: 'Anniversary of the recitation of the Bhagavad Gita by Lord Krishna',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashwin', // traditional Margashirsha Shukla Ekadashi
    lunar_tithi_index: 11,
  },
  {
    slug: 'vaikunta-ekadashi',
    display_name: 'Vaikunta Ekadashi',
    emoji: '🏵️',
    description: 'Most auspicious Ekadashi — the gates of Vaikunta are open',
    kind: 'major',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashwin', // traditional Margashirsha Shukla Ekadashi
    lunar_tithi_index: 11,
    route_kind: 'vrat',
    route_slug: 'vaikunta-ekadashi',
  },
  {
    slug: 'gupt-navratri-magha-begins',
    display_name: 'Magha Gupt Navratri begins',
    emoji: '🪔',
    description: 'Gupt Navratri in Magha, a quieter Devi sadhana period observed in Shakta and regional traditions.',
    kind: 'regional',
    tradition: 'hindu',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Margashirsha', // traditional Magha Shukla Pratipada
    lunar_tithi_index: 1,
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'navratri',
  },

  // ── Sikh ───────────────────────────────────────────────────────────────────
  {
    slug: 'guru-gobind-singh-gurpurab',
    display_name: 'Guru Gobind Singh Gurpurab',
    emoji: '☬',
    description: 'Celebration of the birth of Guru Gobind Singh Ji — 10th Sikh Guru and founder of the Khalsa',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'solar_fixed',
    verification_type: 'historical_commemoration',
    solar_month: 1,
    solar_day: 5,
  },
  {
    slug: 'lohri',
    display_name: 'Lohri',
    emoji: '🔥',
    description: 'Punjabi harvest festival celebrated the night before Makar Sankranti — bonfires, folk songs and community',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'relative_to_other_observance',
    verification_type: 'solar_fixed',
    relative_base_slug: 'makar-sankranti',
    relative_offset_days: -1,
  },
  {
    slug: 'guru-ravidas-jayanti',
    display_name: 'Guru Ravidas Jayanti',
    emoji: '☬',
    description: 'Birth anniversary of Guru Ravidas Ji — saint-poet whose verses appear in the Guru Granth Sahib',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Margashirsha', // traditional Magha Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'holla-mohalla',
    display_name: 'Holla Mohalla',
    emoji: '🏹',
    description: 'Sikh martial festival initiated by Guru Gobind Singh Ji — mock battles, poetry, music and langar at Anandpur Sahib',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'holi',
    relative_offset_days: 1, // always the day after Holi (Phalguna Krishna Pratipada)
  },
  {
    slug: 'baisakhi',
    display_name: 'Baisakhi',
    emoji: '🌾',
    description: 'Harvest festival and founding of the Khalsa Panth by Guru Gobind Singh Ji in 1699 — one of the most joyous Sikh celebrations',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'solar_fixed',
    verification_type: 'solar_fixed',
    solar_month: 4,
    solar_day: 14,
  },
  {
    slug: 'guru-amar-das-gurpurab',
    display_name: 'Guru Amar Das Gurpurab',
    emoji: '☬',
    description: 'Birth anniversary of Guru Amar Das Ji — 3rd Sikh Guru who abolished purdah and caste discrimination',
    kind: 'regional',
    tradition: 'sikh',
    rule_family: 'regional_calendar',
    verification_type: 'historical_commemoration',
    nanakshahi_month: 'Jeth',
    nanakshahi_day: 9,
  },
  {
    slug: 'guru-arjan-dev-martyrdom',
    display_name: 'Guru Arjan Dev Martyrdom',
    emoji: '☬',
    description: 'Shaheedi Diwas — remembrance of the martyrdom of Guru Arjan Dev Ji, 5th Guru and compiler of the Adi Granth',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'regional_calendar',
    verification_type: 'historical_commemoration',
    nanakshahi_month: 'Harh',
    nanakshahi_day: 2,
  },
  {
    slug: 'guru-har-krishan-gurpurab',
    display_name: 'Guru Har Krishan Gurpurab',
    emoji: '☬',
    description: 'Birth anniversary of Guru Har Krishan Ji — 8th Sikh Guru who became Guru at age 5',
    kind: 'regional',
    tradition: 'sikh',
    rule_family: 'regional_calendar',
    verification_type: 'historical_commemoration',
    nanakshahi_month: 'Sawan',
    nanakshahi_day: 8,
  },
  {
    slug: 'guru-ram-das-gurpurab',
    display_name: 'Guru Ram Das Gurpurab',
    emoji: '☬',
    description: 'Birth anniversary of Guru Ram Das Ji — 4th Sikh Guru and founder of Amritsar',
    kind: 'regional',
    tradition: 'sikh',
    rule_family: 'regional_calendar',
    verification_type: 'historical_commemoration',
    nanakshahi_month: 'Assu',
    nanakshahi_day: 25,
  },
  {
    slug: 'bandhi-chhor-divas',
    display_name: 'Bandhi Chhor Divas',
    emoji: '☬',
    description: 'Sikh celebration of freedom — marks Guru Hargobind Ji\'s release from Gwalior Fort along with 52 kings. Coincides with Diwali.',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'relative_to_other_observance',
    verification_type: 'historical_commemoration',
    relative_base_slug: 'diwali',
    relative_offset_days: 0,
  },
  {
    slug: 'guru-nanak-gurpurab',
    display_name: 'Guru Nanak Gurpurab',
    emoji: '☬',
    description: 'Prakash Utsav of Guru Nanak Dev Ji — founder of Sikhism. The most important Sikh celebration, marked by Akhand Path, nagar kirtan and langar.',
    kind: 'major',
    tradition: 'sikh',
    // Observed on Kartika Purnima — same day as kartik-purnima. Using relative rule
    // because the Purnima masaName shifts between years and can be missed by the 5am scan.
    rule_family: 'relative_to_other_observance',
    verification_type: 'historical_commemoration',
    relative_base_slug: 'diwali',
    relative_offset_days: 16, // Kartika Purnima = 16 calendar days after Diwali (Kartika Amavasya)
  },
  {
    slug: 'guru-tegh-bahadur-martyrdom',
    display_name: 'Guru Tegh Bahadur Martyrdom',
    emoji: '☬',
    description: 'Shaheedi Diwas — remembrance of the martyrdom of Guru Tegh Bahadur Ji, 9th Guru, who sacrificed his life for religious freedom',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'regional_calendar',
    verification_type: 'historical_commemoration',
    nanakshahi_month: 'Maghar',
    nanakshahi_day: 10,
  },
  {
    slug: 'sahibzade-shaheedi-diwas',
    display_name: 'Sahibzade Shaheedi Diwas',
    emoji: '☬',
    description: 'Remembrance of the four Sahibzade — sons of Guru Gobind Singh Ji who were martyred for their faith in December 1704',
    kind: 'major',
    tradition: 'sikh',
    rule_family: 'solar_fixed',
    verification_type: 'historical_commemoration',
    solar_month: 12,
    solar_day: 26,
  },

  // ── Buddhist ───────────────────────────────────────────────────────────────
  {
    slug: 'parinirvana-day',
    display_name: 'Parinirvana Day',
    emoji: '☸️',
    description: 'Nirvana Day — commemorates the passing of the Buddha into final Nirvana at Kushinagar, aged 80. A day for meditation and reflection on impermanence.',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'solar_fixed',
    verification_type: 'historical_commemoration',
    solar_month: 2,
    solar_day: 15,
  },
  {
    slug: 'losar-tibetan-new-year',
    display_name: 'Losar (Tibetan New Year)',
    emoji: '☸️',
    description: 'Tibetan Buddhist New Year — three days of prayer, ritual dances, offerings and community gatherings to welcome the new lunar year',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'regional_calendar',
    lunar_masa_name: 'Pausha', // traditional Phalguna Pratipada (Tibetan 1st month day 1)
    lunar_tithi_index: 1,
  },
  {
    slug: 'magha-puja',
    display_name: 'Magha Puja',
    emoji: '🪷',
    description: 'Full moon day commemorating the spontaneous gathering of 1,250 enlightened disciples before the Buddha — Fourfold Assembly Day',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Margashirsha', // traditional Magha Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'vesak-buddha-purnima',
    display_name: 'Vesak / Buddha Purnima',
    emoji: '🪷',
    description: 'The most sacred Buddhist observance — marking the birth, enlightenment and Parinirvana of the Buddha on the full moon of Vaisakha',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Phalguna', // traditional Vaishakha Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'asalha-puja',
    display_name: 'Asalha Puja',
    emoji: '☸️',
    description: 'Dharma Day — commemorates the Buddha\'s first turning of the Wheel of Dharma, teaching the Four Noble Truths to five ascetics at Sarnath',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // engine label for traditional Ashadha Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'vassa-begins-rains-retreat',
    display_name: 'Vassa begins (Rains Retreat)',
    emoji: '🌧️',
    description: 'Beginning of the three-month Buddhist Rains Retreat — monks remain in monasteries for intensive meditation, study and teaching',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // engine label for traditional Ashadha Krishna Pratipada (day after Purnima)
    lunar_tithi_index: 16,
  },
  {
    slug: 'ullambana-ancestor-day',
    display_name: 'Ullambana (Ancestor Day)',
    emoji: '🪔',
    description: 'East Asian Buddhist observance for honouring ancestors and transferring merit to departed souls — held on the 15th day of the 7th lunar month',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'pavarana-end-of-vassa',
    display_name: 'Pavarana (End of Vassa)',
    emoji: '☸️',
    description: 'End of the three-month Rains Retreat — monks invite feedback from the community and express gratitude for the retreat period',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Shravana', // traditional Ashwin Purnima
    lunar_tithi_index: 15,
  },
  {
    slug: 'kathina',
    display_name: 'Kathina',
    emoji: '🧡',
    description: 'Merit-making ceremony offering robes and requisites to monks at the end of Vassa — one of the most auspicious Buddhist occasions for lay practitioners',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Shravana', // traditional Ashwin Krishna Pratipada
    lunar_tithi_index: 16,
  },
  {
    slug: 'sangha-day-loy-krathong',
    display_name: 'Sangha Day (Loy Krathong)',
    emoji: '🏮',
    description: 'Buddhist Sangha Day — celebration of the spiritual community. Coincides with Loy Krathong in Thailand, where lotus-shaped lanterns are floated on water.',
    kind: 'major',
    tradition: 'buddhist',
    // Observed on Kartika Purnima — relative rule more reliable across years
    rule_family: 'relative_to_other_observance',
    verification_type: 'lunar_tithi',
    relative_base_slug: 'diwali',
    relative_offset_days: 16,
  },
  {
    slug: 'bodhi-day',
    display_name: 'Bodhi Day',
    emoji: '🌳',
    description: 'Commemorates the night the Buddha attained enlightenment under the Bodhi tree at Bodh Gaya — observed with meditation, chanting and study',
    kind: 'major',
    tradition: 'buddhist',
    rule_family: 'solar_fixed',
    verification_type: 'historical_commemoration',
    solar_month: 12,
    solar_day: 8,
  },

  // ── Jain ───────────────────────────────────────────────────────────────────
  {
    slug: 'mahavir-jayanti',
    display_name: 'Mahavir Jayanti',
    emoji: '🤲',
    description: 'Birth anniversary of Bhagwan Mahavira — the 24th and last Tirthankara of the current cosmic cycle, born in 599 BCE',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'lunar_tithi',
    verification_type: 'historical_commemoration',
    lunar_masa_name: 'Magha', // traditional Chaitra Shukla Trayodashi
    lunar_tithi_index: 13,
  },
  {
    slug: 'akshaya-tritiya-jain',
    display_name: 'Akshaya Tritiya (Jain)',
    emoji: '💛',
    description: 'Akshaya Tritiya — Jains celebrate Bhagwan Rishabhanatha\'s first ahimsa-based food offering (sugarcane juice) after a year of fasting. Breaking of the year-long fast.',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'lunar_tithi',
    verification_type: 'historical_commemoration',
    lunar_masa_name: 'Phalguna', // traditional Vaishakha Shukla Tritiya
    lunar_tithi_index: 3,
    allow_skipped_tithi: true, // Tritiya can be fast-moving; 5am UTC scan may land on T-1/T+1
  },
  {
    slug: 'paryushana-parva-begins',
    display_name: 'Paryushana Parva begins',
    emoji: '🤲',
    description: 'The holiest Jain festival — 8 days (Shvetambara) of intensive fasting, prayer, scripture study and self-purification. The apex of the Jain spiritual year.',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana Krishna Dvadashi / Bhadrapada Shukla 12
    lunar_tithi_index: 27,
  },
  {
    slug: 'samvatsari-paryushana-ends',
    display_name: 'Samvatsari (Paryushana ends)',
    emoji: '🕊️',
    description: 'Samvatsari — the Jain day of universal forgiveness. Micchami Dukkadam: may all wrongdoing be forgiven. Jains seek and grant forgiveness from everyone.',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashadha', // traditional Bhadrapada Shukla Panchami
    lunar_tithi_index: 5,
  },
  {
    slug: 'das-lakshana-dharma-begins',
    display_name: 'Das Lakshana Dharma begins',
    emoji: '🤲',
    description: 'Digambara Jain equivalent of Paryushana — 10 days of meditation on the ten supreme virtues: forgiveness, humility, honesty, purity, truth, restraint, austerity, renunciation, non-attachment and celibacy',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'lunar_tithi',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Ashadha', // traditional Bhadrapada Shukla Panchami
    lunar_tithi_index: 5,
  },
  {
    slug: 'jain-new-year-pratipada',
    display_name: 'Jain New Year (Pratipada)',
    emoji: '🤲',
    description: 'Jain New Year — the day after Diwali marks the beginning of the Jain calendar year, following the Nirvana of Bhagwan Mahavira',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'relative_to_other_observance',
    verification_type: 'historical_commemoration',
    relative_base_slug: 'diwali',
    relative_offset_days: 1,
  },
  {
    slug: 'jain-diwali-nirvana-ladnun',
    display_name: 'Jain Diwali (Nirvana Ladnun)',
    emoji: '🤲',
    description: 'Jain Diwali — marks the Nirvana (liberation) of Bhagwan Mahavira in 527 BCE at Pavapuri. Observed with lamp-lighting, fasting and scripture recitation.',
    kind: 'major',
    tradition: 'jain',
    rule_family: 'relative_to_other_observance',
    verification_type: 'historical_commemoration',
    relative_base_slug: 'diwali',
    relative_offset_days: 0,
  },
  {
    slug: 'kartik-purnima-jain',
    display_name: 'Kartik Purnima (Jain)',
    emoji: '🌕',
    description: 'Sacred full moon — commemorates the Nirvana of Bhagwan Rishabhanatha (Adinath), the first Tirthankara. A day for fasting and pilgrimage.',
    kind: 'major',
    tradition: 'jain',
    // Observed on Kartika Purnima — relative rule more reliable across years
    rule_family: 'relative_to_other_observance',
    verification_type: 'historical_commemoration',
    relative_base_slug: 'diwali',
    relative_offset_days: 16,
  },

  // ── Recurring tithi-based vrats (every lunar masa) ───────────────────────────
  // Emitted across all masas via rule_family 'lunar_tithi_recurring' + the
  // engine's skipped-tithi handling (multiple occurrences per year). The
  // materialize/query layer is responsible for suppressing these on any date
  // already claimed by a named observance (e.g. Vaikunta Ekadashi).
  {
    slug: 'ekadashi',
    display_name: 'Ekadashi',
    emoji: '🌙',
    description: 'Fortnightly Ekadashi vrat — the 11th tithi of both the waxing and waning moon, a day of fasting for Vishnu.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [11, 26],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'ekadashi',
  },
  {
    slug: 'pradosh-vrat',
    display_name: 'Pradosh Vrat',
    emoji: '🪔',
    description: 'Fortnightly Pradosh vrat to Lord Shiva — the 13th tithi of both pakshas, observed in the twilight hour.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [13, 28],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'pradosh',
  },
  {
    slug: 'purnima-vrat',
    display_name: 'Purnima Vrat',
    emoji: '🌕',
    description: 'Monthly full moon observance for Satyanarayan Puja, charity, mantra, and family worship according to tradition.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [15],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'purnima',
  },
  {
    slug: 'amavasya-vrat',
    display_name: 'Amavasya',
    emoji: '🌑',
    description: 'Monthly new moon observance for stillness, ancestor remembrance, charity, and local family practice.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [30],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'amavasya',
  },
  {
    slug: 'vinayaka-chaturthi',
    display_name: 'Vinayaka Chaturthi',
    emoji: '🐘',
    description: 'Monthly Shukla Chaturthi observance for Lord Ganesha, distinct from the Krishna-paksha Sankashti Chaturthi vrat.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [4],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'chaturthi',
  },
  {
    slug: 'sankashti-chaturthi',
    display_name: 'Sankashti Chaturthi',
    emoji: '🐘',
    description: 'Monthly Sankashti Chaturthi vrat to Lord Ganesha — the 4th tithi of the waning moon.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'lunar_tithi_recurring',
    verification_type: 'lunar_tithi',
    recurring_tithi_indices: [19],
    allow_skipped_tithi: true,
    route_kind: 'vrat',
    route_slug: 'sankashti-chaturthi',
  },
  {
    slug: 'shravan-somvar',
    display_name: 'Shravan Somvar',
    emoji: '🕉️',
    description: 'Mondays of the Shravan month, observed with Shiva worship and fasting according to family or sampradaya practice.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'weekday_recurring',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana month in current engine calibration
    recurring_weekday: 1,
    route_kind: 'vrat',
    route_slug: 'somvar',
  },
  {
    slug: 'mangala-gauri-vrat',
    display_name: 'Mangala Gauri Vrat',
    emoji: '🌺',
    description: 'Tuesdays of Shravan, especially observed by married women in several regional traditions for Gauri worship.',
    kind: 'vrat',
    tradition: 'hindu',
    rule_family: 'weekday_recurring',
    verification_type: 'lunar_tithi',
    lunar_masa_name: 'Jyeshtha', // traditional Shravana month in current engine calibration
    recurring_weekday: 2,
    route_kind: 'vrat',
    route_slug: 'mangala-gauri',
  },
];
