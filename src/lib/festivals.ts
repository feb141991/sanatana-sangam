/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanatana Sangam — 2026 Festival Calendar
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Covers Hindu · Sikh · Buddhist · Jain festivals.
 * Each festival is tagged with `tradition` so the home screen can
 * prioritise the user's own tradition first.
 *
 * Shared festivals (e.g. Diwali, celebrated by Hindu + Jain) are tagged
 * with the primary tradition but appear for everyone.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Festival {
  name:        string;
  date:        string;   // YYYY-MM-DD
  emoji:       string;
  description: string;
  type:        'major' | 'vrat' | 'regional';
  /** Which tradition this festival belongs to */
  tradition:   'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
}

export type FestivalSourceKind = 'curated' | 'official' | 'partner' | 'community_reviewed';
export type FestivalReviewStatus = 'needs_review' | 'reviewed';

export interface FestivalSourceRow {
  name: string;
  date: string;
  emoji: string | null;
  description: string;
  type: Festival['type'];
  tradition?: Festival['tradition'] | null;
  source_name?: string | null;
  source_kind?: FestivalSourceKind | null;
  review_status?: FestivalReviewStatus | null;
}

export interface FestivalCalendarMeta {
  label: string;
  coverage: string;
  sourceNote: string;
  isFallback: boolean;
}

export const FESTIVALS_2026: Festival[] = [

  // ── Hindu ──────────────────────────────────────────────────────────────────
  { name: 'Makar Sankranti',      date: '2026-01-14', emoji: '🪁', description: 'Harvest festival marking the sun\'s transition into Capricorn', type: 'major',    tradition: 'hindu' },
  { name: 'Vasant Panchami',      date: '2026-01-23', emoji: '🌼', description: 'Festival of Goddess Saraswati, marks arrival of spring',            type: 'major',    tradition: 'hindu' },
  { name: 'Maha Shivaratri',      date: '2026-02-17', emoji: '🕉️', description: 'The great night of Shiva — night-long vigil and worship',            type: 'major',    tradition: 'hindu' },
  { name: 'Holi',                 date: '2026-03-03', emoji: '🎨', description: 'Festival of colours celebrating victory of good over evil',          type: 'major',    tradition: 'hindu' },
  { name: 'Gudi Padwa',           date: '2026-03-19', emoji: '🏮', description: 'Hindu New Year according to the Shalivahana calendar',               type: 'major',    tradition: 'hindu' },
  { name: 'Ugadi',                date: '2026-03-19', emoji: '🌿', description: 'New Year for Telugu and Kannada communities',                         type: 'major',    tradition: 'hindu' },
  { name: 'Ram Navami',           date: '2026-03-27', emoji: '🏹', description: 'Celebration of the birth of Lord Rama',                              type: 'major',    tradition: 'hindu' },
  { name: 'Hanuman Jayanti',      date: '2026-04-11', emoji: '🙏', description: 'Celebration of the birth of Lord Hanuman',                           type: 'major',    tradition: 'hindu' },
  { name: 'Akshaya Tritiya',      date: '2026-04-21', emoji: '💛', description: 'Auspicious day for new beginnings — celebrated by Hindu and Jain',   type: 'major',    tradition: 'hindu' },
  { name: 'Narasimha Jayanti',    date: '2026-05-05', emoji: '🦁', description: 'Celebration of Vishnu\'s Narasimha avatar',                          type: 'regional', tradition: 'hindu' },
  { name: 'Vat Savitri Vrat',     date: '2026-05-22', emoji: '🌳', description: 'Vrat observed by married women for the well-being of their husbands', type: 'vrat',     tradition: 'hindu' },
  { name: 'Jagannath Rath Yatra', date: '2026-06-23', emoji: '🛕', description: 'Grand chariot procession of Lord Jagannath at Puri',                 type: 'major',    tradition: 'hindu' },
  { name: 'Guru Purnima',         date: '2026-07-10', emoji: '🙏', description: 'Day to honour spiritual teachers and gurus — observed by all traditions', type: 'major', tradition: 'all' },
  { name: 'Nag Panchami',         date: '2026-07-28', emoji: '🐍', description: 'Worship of serpent deities for protection',                          type: 'regional', tradition: 'hindu' },
  { name: 'Raksha Bandhan',       date: '2026-08-11', emoji: '🧿', description: 'Festival celebrating the bond between brothers and sisters',          type: 'major',    tradition: 'hindu' },
  { name: 'Krishna Janmashtami',  date: '2026-08-19', emoji: '🦚', description: 'Celebration of the birth of Lord Krishna at midnight',               type: 'major',    tradition: 'hindu' },
  { name: 'Ganesh Chaturthi',     date: '2026-08-23', emoji: '🐘', description: '10-day festival celebrating the birth of Lord Ganesha',              type: 'major',    tradition: 'hindu' },
  { name: 'Onam',                 date: '2026-09-05', emoji: '🌺', description: 'Harvest festival of Kerala celebrating King Mahabali\'s return',      type: 'regional', tradition: 'hindu' },
  { name: 'Hartalika Teej',        date: '2026-09-02', emoji: '🌿', description: 'Vrat observed by Hindu women for marital bliss — a fast for Shiva and Parvati, welcoming the monsoon', type: 'vrat', tradition: 'hindu' },
  { name: 'Mahalaya Amavasya',    date: '2026-09-19', emoji: '☽',  description: 'Day to offer prayers to ancestors (Pitru Paksha ends)',              type: 'vrat',     tradition: 'hindu' },
  { name: 'Navratri begins',      date: '2026-09-20', emoji: '🪔', description: 'Nine nights of worship of Goddess Durga, Lakshmi and Saraswati',     type: 'major',    tradition: 'hindu' },
  { name: 'Dussehra',             date: '2026-09-29', emoji: '🎇', description: 'Victory of Rama over Ravana — triumph of good over evil',            type: 'major',    tradition: 'hindu' },
  { name: 'Karva Chauth',         date: '2026-10-15', emoji: '🌙', description: 'Vrat observed by married Hindu women for their husbands',             type: 'vrat',     tradition: 'hindu' },
  { name: 'Dhanteras',            date: '2026-10-27', emoji: '💰', description: 'First day of Diwali festival — worship of Goddess Lakshmi',          type: 'major',    tradition: 'hindu' },
  { name: 'Diwali',               date: '2026-10-29', emoji: '🎆', description: 'Festival of lights — celebrated by Hindu, Jain and Sikh communities', type: 'major',    tradition: 'all'   },
  { name: 'Govardhan Puja',       date: '2026-10-30', emoji: '⛰️', description: 'Worship of Govardhan Hill and Lord Krishna',                         type: 'major',    tradition: 'hindu' },
  { name: 'Bhai Dooj',            date: '2026-10-31', emoji: '👫', description: 'Celebration of the bond between brothers and sisters',                type: 'major',    tradition: 'hindu' },
  { name: 'Chhath Puja',          date: '2026-11-02', emoji: '☀️', description: 'Worship of the Sun God and Chhathi Maiya',                          type: 'regional', tradition: 'hindu' },
  { name: 'Kartik Purnima',       date: '2026-11-13', emoji: '🪷', description: 'Full moon of Kartik month — extremely auspicious for bathing',       type: 'vrat',     tradition: 'hindu' },
  { name: 'Vivah Panchami',       date: '2026-11-27', emoji: '💍', description: 'Anniversary of the marriage of Rama and Sita',                       type: 'regional', tradition: 'hindu' },
  { name: 'Gita Jayanti',         date: '2026-12-03', emoji: '📖', description: 'Anniversary of the recitation of the Bhagavad Gita by Lord Krishna', type: 'major',    tradition: 'hindu' },
  { name: 'Vaikunta Ekadashi',    date: '2026-12-22', emoji: '🏵️', description: 'Most auspicious Ekadashi — the gates of Vaikunta are open',         type: 'major',    tradition: 'hindu' },

  // ── Sikh ───────────────────────────────────────────────────────────────────
  { name: 'Guru Gobind Singh Gurpurab',      date: '2026-01-05', emoji: '☬',  description: 'Celebration of the birth of Guru Gobind Singh Ji — 10th Sikh Guru and founder of the Khalsa', type: 'major',    tradition: 'sikh' },
  { name: 'Lohri',                           date: '2026-01-13', emoji: '🔥', description: 'Punjabi harvest festival celebrated the night before Makar Sankranti — bonfires, folk songs and community', type: 'major', tradition: 'sikh' },
  { name: 'Guru Ravidas Jayanti',            date: '2026-02-12', emoji: '☬',  description: 'Birth anniversary of Guru Ravidas Ji — saint-poet whose verses appear in the Guru Granth Sahib', type: 'major', tradition: 'sikh' },
  { name: 'Holla Mohalla',                   date: '2026-03-04', emoji: '🏹', description: 'Sikh martial festival initiated by Guru Gobind Singh Ji — mock battles, poetry, music and langar at Anandpur Sahib', type: 'major', tradition: 'sikh' },
  { name: 'Baisakhi',                        date: '2026-04-14', emoji: '🌾', description: 'Harvest festival and founding of the Khalsa Panth by Guru Gobind Singh Ji in 1699 — one of the most joyous Sikh celebrations', type: 'major', tradition: 'sikh' },
  { name: 'Guru Amar Das Gurpurab',          date: '2026-05-23', emoji: '☬',  description: 'Birth anniversary of Guru Amar Das Ji — 3rd Sikh Guru who abolished purdah and caste discrimination', type: 'regional', tradition: 'sikh' },
  { name: 'Guru Arjan Dev Martyrdom',        date: '2026-06-06', emoji: '☬',  description: 'Shaheedi Diwas — remembrance of the martyrdom of Guru Arjan Dev Ji, 5th Guru and compiler of the Adi Granth', type: 'major', tradition: 'sikh' },
  { name: 'Guru Har Krishan Gurpurab',       date: '2026-07-07', emoji: '☬',  description: 'Birth anniversary of Guru Har Krishan Ji — 8th Sikh Guru who became Guru at age 5', type: 'regional', tradition: 'sikh' },
  { name: 'Guru Ram Das Gurpurab',           date: '2026-10-09', emoji: '☬',  description: 'Birth anniversary of Guru Ram Das Ji — 4th Sikh Guru and founder of Amritsar', type: 'regional', tradition: 'sikh' },
  { name: 'Bandhi Chhor Divas',              date: '2026-10-29', emoji: '☬',  description: 'Sikh celebration of freedom — marks Guru Hargobind Ji\'s release from Gwalior Fort along with 52 kings. Coincides with Diwali.', type: 'major', tradition: 'sikh' },
  { name: 'Guru Nanak Gurpurab',             date: '2026-11-23', emoji: '☬',  description: 'Prakash Utsav of Guru Nanak Dev Ji — founder of Sikhism. The most important Sikh celebration, marked by Akhand Path, nagar kirtan and langar.', type: 'major', tradition: 'sikh' },
  { name: 'Guru Tegh Bahadur Martyrdom',     date: '2026-11-24', emoji: '☬',  description: 'Shaheedi Diwas — remembrance of the martyrdom of Guru Tegh Bahadur Ji, 9th Guru, who sacrificed his life for religious freedom', type: 'major', tradition: 'sikh' },
  { name: 'Sahibzade Shaheedi Diwas',        date: '2026-12-26', emoji: '☬',  description: 'Remembrance of the four Sahibzade — sons of Guru Gobind Singh Ji who were martyred for their faith in December 1704', type: 'major', tradition: 'sikh' },

  // ── Buddhist ───────────────────────────────────────────────────────────────
  { name: 'Parinirvana Day',                  date: '2026-02-15', emoji: '☸️', description: 'Nirvana Day — commemorates the passing of the Buddha into final Nirvana at Kushinagar, aged 80. A day for meditation and reflection on impermanence.', type: 'major',    tradition: 'buddhist' },
  { name: 'Losar (Tibetan New Year)',         date: '2026-02-17', emoji: '☸️', description: 'Tibetan Buddhist New Year — three days of prayer, ritual dances, offerings and community gatherings to welcome the new lunar year', type: 'major', tradition: 'buddhist' },
  { name: 'Magha Puja',                       date: '2026-03-03', emoji: '🪷', description: 'Full moon day commemorating the spontaneous gathering of 1,250 enlightened disciples before the Buddha — Fourfold Assembly Day', type: 'major', tradition: 'buddhist' },
  { name: 'Vesak / Buddha Purnima',           date: '2026-05-11', emoji: '🪷', description: 'The most sacred Buddhist observance — marking the birth, enlightenment and Parinirvana of the Buddha on the full moon of Vaisakha', type: 'major', tradition: 'buddhist' },
  { name: 'Asalha Puja',                      date: '2026-07-10', emoji: '☸️', description: 'Dharma Day — commemorates the Buddha\'s first turning of the Wheel of Dharma, teaching the Four Noble Truths to five ascetics at Sarnath', type: 'major', tradition: 'buddhist' },
  { name: 'Vassa begins (Rains Retreat)',      date: '2026-07-11', emoji: '🌧️', description: 'Beginning of the three-month Buddhist Rains Retreat — monks remain in monasteries for intensive meditation, study and teaching', type: 'major', tradition: 'buddhist' },
  { name: 'Ullambana (Ancestor Day)',          date: '2026-08-31', emoji: '🪔', description: 'East Asian Buddhist observance for honouring ancestors and transferring merit to departed souls — held on the 15th day of the 7th lunar month', type: 'major', tradition: 'buddhist' },
  { name: 'Pavarana (End of Vassa)',           date: '2026-10-09', emoji: '☸️', description: 'End of the three-month Rains Retreat — monks invite feedback from the community and express gratitude for the retreat period', type: 'major', tradition: 'buddhist' },
  { name: 'Kathina',                           date: '2026-10-10', emoji: '🧡', description: 'Merit-making ceremony offering robes and requisites to monks at the end of Vassa — one of the most auspicious Buddhist occasions for lay practitioners', type: 'major', tradition: 'buddhist' },
  { name: 'Sangha Day (Loy Krathong)',         date: '2026-11-11', emoji: '🏮', description: 'Buddhist Sangha Day — celebration of the spiritual community. Coincides with Loy Krathong in Thailand, where lotus-shaped lanterns are floated on water.', type: 'major', tradition: 'buddhist' },
  { name: 'Bodhi Day',                         date: '2026-12-08', emoji: '🌳', description: 'Commemorates the night the Buddha attained enlightenment under the Bodhi tree at Bodh Gaya — observed with meditation, chanting and study', type: 'major', tradition: 'buddhist' },

  // ── Jain ───────────────────────────────────────────────────────────────────
  { name: 'Mahavir Jayanti',                  date: '2026-03-27', emoji: '🤲', description: 'Birth anniversary of Bhagwan Mahavira — the 24th and last Tirthankara of the current cosmic cycle, born in 599 BCE', type: 'major',    tradition: 'jain' },
  { name: 'Akshaya Tritiya (Jain)',           date: '2026-04-21', emoji: '💛', description: 'Akshaya Tritiya — Jains celebrate Bhagwan Rishabhanatha\'s first ahimsa-based food offering (sugarcane juice) after a year of fasting. Breaking of the year-long fast.', type: 'major', tradition: 'jain' },
  { name: 'Paryushana Parva begins',          date: '2026-08-28', emoji: '🤲', description: 'The holiest Jain festival — 8 days (Shvetambara) of intensive fasting, prayer, scripture study and self-purification. The apex of the Jain spiritual year.', type: 'major', tradition: 'jain' },
  { name: 'Samvatsari (Paryushana ends)',     date: '2026-09-04', emoji: '🕊️', description: 'Samvatsari — the Jain day of universal forgiveness. Micchami Dukkadam: may all wrongdoing be forgiven. Jains seek and grant forgiveness from everyone.', type: 'major', tradition: 'jain' },
  { name: 'Das Lakshana Dharma begins',       date: '2026-09-05', emoji: '🤲', description: 'Digambara Jain equivalent of Paryushana — 10 days of meditation on the ten supreme virtues: forgiveness, humility, honesty, purity, truth, restraint, austerity, renunciation, non-attachment and celibacy', type: 'major', tradition: 'jain' },
  { name: 'Jain New Year (Pratipada)',        date: '2026-10-30', emoji: '🤲', description: 'Jain New Year — the day after Diwali marks the beginning of the Jain calendar year, following the Nirvana of Bhagwan Mahavira', type: 'major', tradition: 'jain' },
  { name: 'Jain Diwali (Nirvana Ladnun)',     date: '2026-10-29', emoji: '🤲', description: 'Jain Diwali — marks the Nirvana (liberation) of Bhagwan Mahavira in 527 BCE at Pavapuri. Observed with lamp-lighting, fasting and scripture recitation.', type: 'major', tradition: 'jain' },
  { name: 'Kartik Purnima (Jain)',            date: '2026-11-13', emoji: '🌕', description: 'Sacred full moon — commemorates the Nirvana of Bhagwan Rishabhanatha (Adinath), the first Tirthankara. A day for fasting and pilgrimage.', type: 'major', tradition: 'jain' },

];

export const FESTIVAL_CALENDAR_FALLBACK_META: FestivalCalendarMeta = {
  label: 'Curated 2026 festival edition',
  coverage: 'In-app fallback calendar with 2026 coverage only',
  sourceNote: 'Used when the shared festival database is unavailable, so reminders and browsing still work with an explicit coverage boundary.',
  isFallback: true,
};

export function buildFestivalCalendarMeta(
  source: 'database' | 'fallback',
  festivals: Array<Pick<Festival, 'date'> & Partial<Pick<FestivalSourceRow, 'source_name' | 'source_kind' | 'review_status'>>>,
): FestivalCalendarMeta {
  if (source === 'fallback') return FESTIVAL_CALENDAR_FALLBACK_META;

  const years = Array.from(new Set(festivals.map((festival) => new Date(festival.date).getFullYear()))).sort();
  const coverage = years.length > 0
    ? `Shared festival calendar covering ${years.join(', ')}`
    : 'Shared festival calendar';
  const reviewedCount = festivals.filter((festival) => festival.review_status === 'reviewed').length;
  const allReviewed = festivals.length > 0 && reviewedCount === festivals.length;
  const sourceNames = Array.from(new Set(festivals.map((festival) => festival.source_name).filter(Boolean)));
  const sourceLabel = sourceNames.length > 0 ? sourceNames.join(', ') : 'the shared festival table';

  return {
    label: allReviewed ? 'Reviewed shared festival calendar' : 'Shared festival calendar',
    coverage,
    sourceNote: allReviewed
      ? `Home and reminder notifications are reading from ${sourceLabel}, and the current entries are marked as reviewed in the shared festival table.`
      : `Home and reminder notifications are reading from ${sourceLabel}. This keeps countdowns and cron reminders aligned while editorial review is still being completed.`,
    isFallback: false,
  };
}

export function attachFestivalTrust(row: FestivalSourceRow): Festival & Pick<FestivalSourceRow, 'source_name' | 'source_kind' | 'review_status'> {
  const staticMatch = FESTIVALS_2026.find(
    (entry) => entry.name === row.name && entry.date === row.date
  );

  return {
    name: row.name,
    date: row.date,
    emoji: row.emoji ?? '🪔',
    description: row.description,
    type: row.type,
    tradition: row.tradition ?? staticMatch?.tradition ?? 'all',
    source_name: row.source_name ?? null,
    source_kind: row.source_kind ?? null,
    review_status: row.review_status ?? null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the next upcoming festival, prioritising the user's tradition */
export function getNextFestival(
  festivals: Festival[] = FESTIVALS_2026,
  today: Date = new Date(),
  tradition?: string | null,
): Festival | null {
  const todayStr = today.toISOString().split('T')[0];
  const upcoming = festivals.filter(f => f.date >= todayStr);
  if (upcoming.length === 0) return festivals[festivals.length - 1] ?? null;

  // If tradition is provided, prefer tradition-matching or 'all' festivals
  if (tradition && tradition !== 'other') {
    const traditionFirst = upcoming.find(
      f => f.tradition === tradition || f.tradition === 'all'
    );
    if (traditionFirst) return traditionFirst;
  }

  return upcoming[0] ?? null;
}

/** Days until a festival date */
export function daysUntil(dateStr: string, today: Date = new Date()): number {
  const fest = new Date(dateStr + 'T00:00:00');
  const d    = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((fest.getTime() - d.getTime()) / 86_400_000);
}

/** Get a panchang stub for today (minimal implementation for server component) */
export function getTodayPanchang(
  lat?: number,
  lon?: number,
): { tithi: string; nakshatra: string; yoga: string; sunrise: string; sunset: string; rahuKaal: string } {
  // Delegated to the full panchang engine — this stub is used by the server component
  // The full calculation happens client-side in HomeDashboard via calculatePanchang()
  return {
    tithi:     'Loading…',
    nakshatra: 'Loading…',
    yoga:      'Loading…',
    sunrise:   '6:00 AM',
    sunset:    '6:00 PM',
    rahuKaal:  'Loading…',
  };
}
