// 2026 Hindu Festival Calendar (hardcoded)
// Dates are approximate and based on traditional Hindu panchang

export interface Festival {
  name: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  description: string;
  type: 'major' | 'vrat' | 'regional';
}

export const FESTIVALS_2026: Festival[] = [
  { name: 'Makar Sankranti',      date: '2026-01-14', emoji: '🪁', description: 'Harvest festival marking the sun\'s transition into Capricorn', type: 'major' },
  { name: 'Vasant Panchami',      date: '2026-01-23', emoji: '🌼', description: 'Festival of Goddess Saraswati, marks arrival of spring', type: 'major' },
  { name: 'Maha Shivaratri',      date: '2026-02-17', emoji: '🕉️', description: 'The great night of Shiva — night-long vigil and worship', type: 'major' },
  { name: 'Holi',                 date: '2026-03-03', emoji: '🎨', description: 'Festival of colours celebrating victory of good over evil', type: 'major' },
  { name: 'Gudi Padwa',           date: '2026-03-19', emoji: '🏮', description: 'Hindu New Year according to the Shalivahana calendar', type: 'major' },
  { name: 'Ugadi',                date: '2026-03-19', emoji: '🌿', description: 'New Year for Telugu and Kannada communities', type: 'major' },
  { name: 'Ram Navami',           date: '2026-03-27', emoji: '🏹', description: 'Celebration of the birth of Lord Rama', type: 'major' },
  { name: 'Hanuman Jayanti',      date: '2026-04-11', emoji: '🐒', description: 'Celebration of the birth of Lord Hanuman', type: 'major' },
  { name: 'Akshaya Tritiya',      date: '2026-04-21', emoji: '💛', description: 'Auspicious day for new beginnings and gold purchases', type: 'major' },
  { name: 'Narasimha Jayanti',    date: '2026-05-05', emoji: '🦁', description: 'Celebration of Vishnu\'s Narasimha avatar', type: 'regional' },
  { name: 'Buddha Purnima',       date: '2026-05-11', emoji: '🪷', description: 'Full moon marking the birth, enlightenment, and death of Gautama Buddha', type: 'major' },
  { name: 'Vat Savitri Vrat',     date: '2026-05-22', emoji: '🌳', description: 'Vrat observed by married women for the well-being of their husbands', type: 'vrat' },
  { name: 'Jagannath Rath Yatra', date: '2026-06-23', emoji: '🛕', description: 'Grand chariot procession of Lord Jagannath at Puri', type: 'major' },
  { name: 'Guru Purnima',         date: '2026-07-10', emoji: '🙏', description: 'Day to honour spiritual teachers and gurus', type: 'major' },
  { name: 'Nag Panchami',         date: '2026-07-28', emoji: '🐍', description: 'Worship of serpent deities for protection from snake bites', type: 'regional' },
  { name: 'Raksha Bandhan',       date: '2026-08-11', emoji: '🧿', description: 'Festival celebrating the bond between brothers and sisters', type: 'major' },
  { name: 'Krishna Janmashtami',  date: '2026-08-19', emoji: '🦚', description: 'Celebration of the birth of Lord Krishna at midnight', type: 'major' },
  { name: 'Ganesh Chaturthi',     date: '2026-08-23', emoji: '🐘', description: '10-day festival celebrating the birth of Lord Ganesha', type: 'major' },
  { name: 'Onam',                 date: '2026-09-05', emoji: '🌺', description: 'Harvest festival of Kerala celebrating King Mahabali\'s return', type: 'regional' },
  { name: 'Mahalaya Amavasya',    date: '2026-09-19', emoji: '☽', description: 'Day to offer prayers to ancestors (Pitru Paksha ends)', type: 'vrat' },
  { name: 'Navratri begins',      date: '2026-09-20', emoji: '🪔', description: 'Nine nights of worship of Goddess Durga, Lakshmi & Saraswati', type: 'major' },
  { name: 'Dussehra',             date: '2026-09-29', emoji: '🎇', description: 'Victory of Rama over Ravana — triumph of good over evil', type: 'major' },
  { name: 'Karva Chauth',         date: '2026-10-15', emoji: '🌙', description: 'Vrat observed by married Hindu women for their husbands', type: 'vrat' },
  { name: 'Dhanteras',            date: '2026-10-27', emoji: '💰', description: 'First day of Diwali festival — worship of Goddess Lakshmi', type: 'major' },
  { name: 'Diwali',               date: '2026-10-29', emoji: '🎆', description: 'Festival of lights — victory of light over darkness', type: 'major' },
  { name: 'Govardhan Puja',       date: '2026-10-30', emoji: '⛰️', description: 'Worship of Govardhan Hill and Lord Krishna', type: 'major' },
  { name: 'Bhai Dooj',            date: '2026-10-31', emoji: '👫', description: 'Celebration of the bond between brothers and sisters', type: 'major' },
  { name: 'Chhath Puja',          date: '2026-11-02', emoji: '☀️', description: 'Worship of the Sun God and Chhathi Maiya', type: 'regional' },
  { name: 'Kartik Purnima',       date: '2026-11-13', emoji: '🪷', description: 'Full moon of Kartik month — extremely auspicious for bathing', type: 'vrat' },
  { name: 'Vivah Panchami',       date: '2026-11-27', emoji: '💍', description: 'Anniversary of the marriage of Rama and Sita', type: 'regional' },
  { name: 'Gita Jayanti',         date: '2026-12-03', emoji: '📖', description: 'Anniversary of the recitation of the Bhagavad Gita by Lord Krishna', type: 'major' },
  { name: 'Hanuman Vijayotsav',   date: '2026-12-10', emoji: '🚩', description: 'Celebration of Hanuman\'s victory', type: 'regional' },
  { name: 'Vaikunta Ekadashi',    date: '2026-12-22', emoji: '🏵️', description: 'Most auspicious Ekadashi — the gates of Vaikunta are open', type: 'major' },
];

/**
 * Get the next upcoming festival from today
 */
export function getNextFestival(today: Date = new Date()): Festival | null {
  const todayStr = today.toISOString().split('T')[0];
  const upcoming = FESTIVALS_2026.filter(f => f.date >= todayStr);
  if (upcoming.length === 0) return FESTIVALS_2026[0]; // wrap to next year
  return upcoming[0];
}

/**
 * Get days until a festival
 */
export function daysUntil(festivalDate: string, today: Date = new Date()): number {
  const fest = new Date(festivalDate + 'T00:00:00');
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = fest.getTime() - todayMidnight.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate sunrise and sunset for a given lat/lon and date.
 * Uses the NOAA solar calculation algorithm (simplified).
 */
export function calcSunriseSunset(lat: number, lon: number, date: Date = new Date()) {
  // Convert to Julian date
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n  = JD - 2451545.0;

  // Mean solar noon
  const J_noon = 2451545.0 + 0.0009 + ((-lon) / 360) + Math.round(n - ((-lon) / 360));

  // Solar mean anomaly
  const M  = (357.5291 + 0.98560028 * (J_noon - 2451545)) % 360;
  const Mrad = M * Math.PI / 180;

  // Equation of centre
  const C  = 1.9148 * Math.sin(Mrad) + 0.0200 * Math.sin(2 * Mrad) + 0.0003 * Math.sin(3 * Mrad);

  // Ecliptic longitude
  const lam = (M + C + 180 + 102.9372) % 360;
  const lamRad = lam * Math.PI / 180;

  // Solar transit
  const J_transit = J_noon + 0.0053 * Math.sin(Mrad) - 0.0069 * Math.sin(2 * lamRad);

  // Declination
  const sinDec = Math.sin(lamRad) * Math.sin(23.4397 * Math.PI / 180);
  const dec    = Math.asin(sinDec);

  // Hour angle
  const latRad  = lat * Math.PI / 180;
  const cosH    = (Math.sin(-0.8333 * Math.PI / 180) - Math.sin(latRad) * sinDec) /
                  (Math.cos(latRad) * Math.cos(dec));

  // No sunrise/sunset near poles
  if (cosH < -1 || cosH > 1) {
    return { sunrise: 'N/A', sunset: 'N/A' };
  }

  const H = Math.acos(cosH) * 180 / Math.PI;

  // Julian dates of sunrise/sunset
  const J_rise = J_transit - H / 360;
  const J_set  = J_transit + H / 360;

  function jdToTime(jd: number): string {
    const ms   = (jd - 2440587.5) * 86400000;
    const d    = new Date(ms);
    let h      = d.getUTCHours();
    const m    = d.getUTCMinutes();
    // Approximate local time from longitude offset
    const lonOffset = Math.round(lon / 15);
    h = ((h + lonOffset) % 24 + 24) % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12   = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  }

  return {
    sunrise: jdToTime(J_rise),
    sunset:  jdToTime(J_set),
  };
}

/**
 * Get today's panchang data.
 * Pass real lat/lon for accurate sunrise/sunset; falls back to approximation.
 */
export function getTodayPanchang(lat?: number, lon?: number) {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

  const tithis = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya',
  ];

  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
    'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
    'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadra',
    'Uttara Bhadra', 'Revati',
  ];

  const yogas = [
    'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana',
    'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda',
    'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
    'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
    'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
    'Indra', 'Vaidhriti',
  ];

  // Rahu Kaal based on day of week
  const day = now.getDay();
  const rahuKaal = [
    '4:30 PM–6:00 PM', // Sun
    '7:30 AM–9:00 AM', // Mon
    '3:00 PM–4:30 PM', // Tue
    '12:00 PM–1:30 PM',// Wed
    '1:30 PM–3:00 PM', // Thu
    '10:30 AM–12:00 PM',// Fri
    '9:00 AM–10:30 AM', // Sat
  ];

  // Sunrise / sunset: use real calculation if coordinates provided
  let sunrise: string;
  let sunset: string;

  if (lat !== undefined && lon !== undefined) {
    const times = calcSunriseSunset(lat, lon, now);
    sunrise = times.sunrise;
    sunset  = times.sunset;
  } else {
    // Fallback: Northern hemisphere approximation by month
    const month = now.getMonth();
    const sunriseFallback = ['6:47 AM','6:30 AM','6:10 AM','5:48 AM','5:30 AM','5:22 AM','5:28 AM','5:45 AM','6:02 AM','6:18 AM','6:38 AM','6:55 AM'];
    const sunsetFallback  = ['5:20 PM','5:45 PM','6:08 PM','6:30 PM','6:52 PM','7:10 PM','7:08 PM','6:45 PM','6:15 PM','5:45 PM','5:20 PM','5:05 PM'];
    sunrise = sunriseFallback[month];
    sunset  = sunsetFallback[month];
  }

  return {
    tithi:    tithis[dayOfYear % tithis.length],
    nakshatra: nakshatras[dayOfYear % nakshatras.length],
    yoga:     yogas[dayOfYear % yogas.length],
    sunrise,
    sunset,
    rahuKaal: rahuKaal[day],
  };
}
