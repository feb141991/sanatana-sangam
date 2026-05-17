// ─── Vedic Astrology Engine ───────────────────────────────────────────────────
// Real astronomical calculations using astronomy-engine (pure JS, Vercel-safe).
// Lahiri ayanamsa, sidereal zodiac, Whole Sign houses, Vimshottari Dasha.
// Handles global birth locations + historical timezones via IANA tz database.
// ─────────────────────────────────────────────────────────────────────────────

import * as Astronomy from 'astronomy-engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BirthInput {
  date:     string;   // 'YYYY-MM-DD'
  time:     string;   // 'HH:MM' local birth time (use '06:00' if unknown)
  lat:      number;   // birth location latitude
  lng:      number;   // birth location longitude
  timezone: string;   // IANA e.g. 'Asia/Kolkata', 'America/New_York'
  timeUnknown?: boolean; // if true, time was not known — Lagna unreliable
}

export interface GrahaPosition {
  tropicalDeg:  number;   // tropical ecliptic longitude (0-360)
  siderealDeg:  number;   // sidereal longitude after Lahiri ayanamsa
  rashiIndex:   number;   // 0=Mesha … 11=Meena
  rashiName:    string;
  degreeInRashi: number;  // 0.00–29.99
  house:        number;   // 1-12 (Whole Sign from Lagna)
  isRetrograde: boolean;
  dignity?:     'exalted' | 'debilitated' | 'own' | 'neutral'; // planetary dignity
  isCombust?:   boolean;  // within combustion threshold of Sun
  nakshatra?:   string;   // filled for Moon (and optionally others)
  pada?:        number;
}

export interface NakshatraInfo {
  name:            string;
  index:           number;   // 0-26
  pada:            number;   // 1-4
  lord:            string;   // Dasha lord planet
  traversedFrac:   number;   // 0.0-1.0 how much of nakshatra is traversed at birth
  remainingFrac:   number;
  devata:          string;
  gana:            string;
  animalSymbol:    string;
}

export interface DashaEntry {
  planet:    string;
  startDate: string; // ISO date
  endDate:   string;
  years:     number;
  isCurrent: boolean;
}

export interface AntardashaEntry {
  planet:    string;   // capitalized Sanskrit name
  startDate: string;   // ISO date
  endDate:   string;
}

export interface DashaInfo {
  timeline:          DashaEntry[];
  current:           DashaEntry | null;
  currentAntardasha: AntardashaEntry | null; // current sub-period with dates
}

export interface SadeSatiStatus {
  isActive:       boolean;
  phase:          'rising' | 'peak' | 'setting' | null;  // which of the 3 rounds
  moonRashi:      string;
  saturnRashi:    string;
}

export interface AstroChart {
  utcBirthTime:  string;          // UTC ISO string for verification
  julianDay:     number;
  ayanamsa:      number;          // Lahiri ayanamsa in degrees
  lagna:         GrahaPosition;   // Ascendant
  planets:       Record<string, GrahaPosition>;
  nakshatra:     NakshatraInfo;
  dasha:         DashaInfo;
  timeUnknown:   boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RASHIS = [
  'Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya',
  'Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena',
];

const NAKSHATRAS: Array<{
  name: string; lord: string; devata: string; gana: string; animal: string;
}> = [
  { name:'Ashwini',           lord:'Ketu',   devata:'Ashwini Kumars', gana:'Deva',    animal:'Horse'     },
  { name:'Bharani',           lord:'Shukra', devata:'Yama',           gana:'Manushya',animal:'Elephant'  },
  { name:'Krittika',          lord:'Surya',  devata:'Agni',           gana:'Rakshasa',animal:'Sheep'     },
  { name:'Rohini',            lord:'Chandra',devata:'Brahma',         gana:'Manushya',animal:'Serpent'   },
  { name:'Mrigashira',        lord:'Mangal', devata:'Soma',           gana:'Deva',    animal:'Serpent'   },
  { name:'Ardra',             lord:'Rahu',   devata:'Rudra',          gana:'Manushya',animal:'Dog'       },
  { name:'Punarvasu',         lord:'Guru',   devata:'Aditi',          gana:'Deva',    animal:'Cat'       },
  { name:'Pushya',            lord:'Shani',  devata:'Brihaspati',     gana:'Deva',    animal:'Sheep'     },
  { name:'Ashlesha',          lord:'Budha',  devata:'Sarpa',          gana:'Rakshasa',animal:'Cat'       },
  { name:'Magha',             lord:'Ketu',   devata:'Pitrs',          gana:'Rakshasa',animal:'Rat'       },
  { name:'Purva Phalguni',    lord:'Shukra', devata:'Bhaga',          gana:'Manushya',animal:'Rat'       },
  { name:'Uttara Phalguni',   lord:'Surya',  devata:'Aryaman',        gana:'Manushya',animal:'Bull'      },
  { name:'Hasta',             lord:'Chandra',devata:'Savita',         gana:'Deva',    animal:'Buffalo'   },
  { name:'Chitra',            lord:'Mangal', devata:'Vishwakarma',    gana:'Rakshasa',animal:'Tiger'     },
  { name:'Swati',             lord:'Rahu',   devata:'Vayu',           gana:'Deva',    animal:'Buffalo'   },
  { name:'Vishakha',          lord:'Guru',   devata:'Indra-Agni',     gana:'Rakshasa',animal:'Tiger'     },
  { name:'Anuradha',          lord:'Shani',  devata:'Mitra',          gana:'Deva',    animal:'Deer'      },
  { name:'Jyeshtha',          lord:'Budha',  devata:'Indra',          gana:'Rakshasa',animal:'Deer'      },
  { name:'Moola',             lord:'Ketu',   devata:'Nirrti',         gana:'Rakshasa',animal:'Dog'       },
  { name:'Purva Ashadha',     lord:'Shukra', devata:'Apah',           gana:'Manushya',animal:'Monkey'    },
  { name:'Uttara Ashadha',    lord:'Surya',  devata:'Vishvadevas',    gana:'Manushya',animal:'Mongoose'  },
  { name:'Shravana',          lord:'Chandra',devata:'Vishnu',         gana:'Deva',    animal:'Monkey'    },
  { name:'Dhanishtha',        lord:'Mangal', devata:'Eight Vasus',    gana:'Rakshasa',animal:'Lion'      },
  { name:'Shatabhisha',       lord:'Rahu',   devata:'Varuna',         gana:'Rakshasa',animal:'Horse'     },
  { name:'Purva Bhadrapada',  lord:'Guru',   devata:'Aja Ekapada',    gana:'Manushya',animal:'Lion'      },
  { name:'Uttara Bhadrapada', lord:'Shani',  devata:'Ahir Budhanya',  gana:'Manushya',animal:'Cow'       },
  { name:'Revati',            lord:'Budha',  devata:'Pushan',         gana:'Deva',    animal:'Elephant'  },
];

// Vimshottari Dasha: 120-year cycle (capitalized Sanskrit names)
const DASHA_ORDER = ['Ketu','Shukra','Surya','Chandra','Mangal','Rahu','Guru','Shani','Budha'];
const DASHA_YEARS: Record<string,number> = {
  Ketu:6, Shukra:20, Surya:6, Chandra:10, Mangal:7, Rahu:18, Guru:16, Shani:19, Budha:17,
};

// ── Planet dignity tables ─────────────────────────────────────────────────────
// rashiIndex (0=Mesha … 11=Meena)
const EXALTATION: Record<string, number> = {
  Surya:   0,  // Mesha
  Chandra: 1,  // Vrishabha
  Mangal:  9,  // Makara
  Budha:   5,  // Kanya
  Guru:    3,  // Karka
  Shukra:  11, // Meena
  Shani:   6,  // Tula
  Rahu:    1,  // Vrishabha (traditional)
  Ketu:    7,  // Vrishchika (traditional)
};
const DEBILITATION: Record<string, number> = {
  Surya:   6,  // Tula
  Chandra: 7,  // Vrishchika
  Mangal:  3,  // Karka
  Budha:   11, // Meena
  Guru:    9,  // Makara
  Shukra:  5,  // Kanya
  Shani:   0,  // Mesha
  Rahu:    7,  // Vrishchika
  Ketu:    1,  // Vrishabha
};
// Own signs (moolatrikona / svakshetra) — include both signs
const OWN_SIGNS: Record<string, number[]> = {
  Surya:   [4],        // Simha
  Chandra: [3],        // Karka
  Mangal:  [0, 7],     // Mesha, Vrishchika
  Budha:   [2, 5],     // Mithuna, Kanya
  Guru:    [8, 11],    // Dhanu, Meena
  Shukra:  [1, 6],     // Vrishabha, Tula
  Shani:   [9, 10],    // Makara, Kumbha
};

// Combustion thresholds in degrees from Sun (traditional Vedic)
const COMBUST_ORB: Record<string, number> = {
  Chandra: 12,  // Moon: 12°
  Mangal:  17,  // Mars: 17°
  Budha:   14,  // Mercury: 14° (when direct); 12° retrograde
  Guru:    11,  // Jupiter: 11°
  Shukra:  10,  // Venus: 10°
  Shani:   15,  // Saturn: 15°
};

// ── Timezone: local birth time → UTC ─────────────────────────────────────────
// Uses Node.js built-in Intl API (V8 IANA tz database, handles historical DST)
function birthLocalToUTC(dateStr: string, timeStr: string, ianaTimezone: string): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi]    = timeStr.split(':').map(Number);

  // Step 1: treat the birth time as if it were UTC (approximate)
  const approxUtc = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));

  // Step 2: ask Intl what the local clock shows at approxUtc in the birth timezone
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(approxUtc);
  const get   = (t: string) => parseInt(parts.find(p => p.type === t)!.value);
  const localH = get('hour') % 24; // handle '24' returned by some implementations
  const localShown = Date.UTC(get('year'), get('month') - 1, get('day'), localH, get('minute'), get('second'));

  // Step 3: offset = localShown - approxUtc → actual UTC = approxUtc - offset
  const offsetMs = localShown - approxUtc.getTime();
  return new Date(approxUtc.getTime() - offsetMs);
}

// ── Julian Day from Date ──────────────────────────────────────────────────────
function toJulianDay(utcDate: Date): number {
  const y  = utcDate.getUTCFullYear();
  const mo = utcDate.getUTCMonth() + 1;
  const d  = utcDate.getUTCDate();
  const h  = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600;

  // Standard Julian Day Number formula
  const A = Math.floor((14 - mo) / 12);
  const yr = y + 4800 - A;
  const m  = mo + 12 * A - 3;
  let jdn  = d + Math.floor((153 * m + 2) / 5) + 365 * yr + Math.floor(yr / 4)
             - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
  return jdn + (h - 12) / 24;
}

// ── Lahiri Ayanamsa ───────────────────────────────────────────────────────────
// Standard formula based on Chitrapaksha (Lahiri) definition.
// Accurate to ~0.1° which is sufficient for consumer Jyotish.
function getLahiriAyanamsa(jd: number): number {
  const T = (jd - 2415020.0) / 36525.0;  // Julian centuries from J1900.0
  // Lahiri: 22.46040° at J1900.0, precessing at 1.3960°/century
  return 22.46040 + 1.3960 * T;
}

// ── Normalize degrees to 0–360 ────────────────────────────────────────────────
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ── Tropical → Sidereal ───────────────────────────────────────────────────────
function toSidereal(tropicalDeg: number, ayanamsa: number): number {
  return norm360(tropicalDeg - ayanamsa);
}

// ── Degree → Rashi info ───────────────────────────────────────────────────────
function rashiFromSidereal(sidDeg: number): { rashiIndex: number; rashiName: string; degreeInRashi: number } {
  const idx = Math.floor(sidDeg / 30) % 12;
  return {
    rashiIndex:   idx,
    rashiName:    RASHIS[idx],
    degreeInRashi: parseFloat((sidDeg % 30).toFixed(4)),
  };
}

// ── Nakshatra from Moon sidereal longitude ────────────────────────────────────
function getNakshatra(moonSidereal: number): NakshatraInfo {
  const nakArc    = 360 / 27;           // 13.333...°
  const padaArc   = nakArc / 4;         // 3.333...°
  const idx       = Math.floor(moonSidereal / nakArc) % 27;
  const degInNak  = moonSidereal % nakArc;
  const pada      = Math.floor(degInNak / padaArc) + 1;
  const traversed = degInNak / nakArc;
  const nak       = NAKSHATRAS[idx];
  return {
    name:          nak.name,
    index:         idx,
    pada:          pada,
    lord:          nak.lord,
    traversedFrac: parseFloat(traversed.toFixed(6)),
    remainingFrac: parseFloat((1 - traversed).toFixed(6)),
    devata:        nak.devata,
    gana:          nak.gana,
    animalSymbol:  nak.animal,
  };
}

// ── Vimshottari Dasha ─────────────────────────────────────────────────────────
function calcDasha(nak: NakshatraInfo, birthUtc: Date): DashaInfo {
  const startLord  = nak.lord; // Already capitalized (e.g. 'Ketu')
  const orderStart = DASHA_ORDER.indexOf(startLord);
  const firstYears = DASHA_YEARS[startLord] * nak.remainingFrac;

  const timeline: DashaEntry[] = [];
  let cursor = new Date(birthUtc);
  const now  = new Date();

  // First dasha (partial — only remaining fraction from birth)
  const firstEnd = new Date(cursor.getTime() + firstYears * 365.25 * 86400000);
  timeline.push({
    planet:    startLord,
    startDate: cursor.toISOString().split('T')[0],
    endDate:   firstEnd.toISOString().split('T')[0],
    years:     parseFloat(firstYears.toFixed(2)),
    isCurrent: cursor <= now && now < firstEnd,
  });
  cursor = firstEnd;

  // Full subsequent dashas (8 more = 9 total, covering up to 120 yrs from birth)
  for (let i = 1; i < 9; i++) {
    const planet = DASHA_ORDER[(orderStart + i) % 9];
    const yrs    = DASHA_YEARS[planet];
    const end    = new Date(cursor.getTime() + yrs * 365.25 * 86400000);
    timeline.push({
      planet,
      startDate: cursor.toISOString().split('T')[0],
      endDate:   end.toISOString().split('T')[0],
      years:     yrs,
      isCurrent: cursor <= now && now < end,
    });
    cursor = end;
  }

  const current = timeline.find(d => d.isCurrent) ?? null;

  // Antardasha (current sub-period) with actual dates
  let currentAntardasha: AntardashaEntry | null = null;
  if (current) {
    const dashaStartMs  = new Date(current.startDate).getTime();
    const dashaEndMs    = new Date(current.endDate).getTime();
    // Use the ACTUAL dasha duration (partial for birth dasha, full otherwise)
    const dashaDurMs    = dashaEndMs - dashaStartMs;
    const antarOrder    = DASHA_ORDER.indexOf(current.planet);
    let antarCursorMs   = dashaStartMs;

    for (let i = 0; i < 9; i++) {
      const sub       = DASHA_ORDER[(antarOrder + i) % 9];
      // Antardasha proportional to actual dasha duration:
      // (sub_years / 120) × actual_dasha_ms  — ensures all 9 sum to exact dasha duration
      const antarDurMs = (DASHA_YEARS[sub] / 120) * dashaDurMs;
      const antarEndMs = antarCursorMs + antarDurMs;

      if (now.getTime() >= antarCursorMs && now.getTime() < antarEndMs) {
        currentAntardasha = {
          planet:    sub,
          startDate: new Date(antarCursorMs).toISOString().split('T')[0],
          endDate:   new Date(Math.min(antarEndMs, dashaEndMs)).toISOString().split('T')[0],
        };
        break;
      }
      antarCursorMs = antarEndMs;
    }
  }

  return { timeline, current, currentAntardasha };
}

// ── Lagna (Ascendant) ─────────────────────────────────────────────────────────
// Standard formula from Meeus "Astronomical Algorithms":
// Converts Local Sidereal Time + geographic latitude to ecliptic ascendant.
function calcLagna(jd: number, lat: number, lng: number, ayanamsa: number): GrahaPosition {
  // Days from J2000.0
  const d = jd - 2451545.0;

  // Obliquity of ecliptic (degrees)
  const obliquity = 23.439291111 - 0.013004167 * (d / 36525);

  // Greenwich Mean Sidereal Time (degrees)
  const GMST = norm360(280.46061837 + 360.98564736629 * d);

  // Local Sidereal Time (degrees)
  const LST = norm360(GMST + lng);

  const rLST = (LST * Math.PI) / 180;
  const rLat = (lat * Math.PI) / 180;
  const rObl = (obliquity * Math.PI) / 180;

  // Tropical ascendant longitude (Meeus formula)
  const num = -Math.cos(rLST);
  const den = Math.sin(rLST) * Math.cos(rObl) + Math.tan(rLat) * Math.sin(rObl);

  let ascTropical = (Math.atan2(num, den) * 180) / Math.PI;
  // Quadrant correction
  if (den < 0) ascTropical += 180;
  ascTropical = norm360(ascTropical);

  // Sidereal ascendant
  const ascSidereal = toSidereal(ascTropical, ayanamsa);
  const rashi = rashiFromSidereal(ascSidereal);

  return {
    tropicalDeg:   parseFloat(ascTropical.toFixed(4)),
    siderealDeg:   parseFloat(ascSidereal.toFixed(4)),
    ...rashi,
    house:         1,
    isRetrograde:  false,
  };
}

// ── Planet positions ──────────────────────────────────────────────────────────
function calcPlanets(
  utcDate: Date,
  jd: number,
  ayanamsa: number,
  lagnaRashiIndex: number,
): Record<string, GrahaPosition> {
  const nextDay = new Date(utcDate.getTime() + 86400000);

  const bodies: Array<{ key: string; body: Astronomy.Body }> = [
    { key: 'Surya',   body: Astronomy.Body.Sun     },
    { key: 'Chandra', body: Astronomy.Body.Moon    },
    { key: 'Mangal',  body: Astronomy.Body.Mars    },
    { key: 'Budha',   body: Astronomy.Body.Mercury },
    { key: 'Guru',    body: Astronomy.Body.Jupiter },
    { key: 'Shukra',  body: Astronomy.Body.Venus   },
    { key: 'Shani',   body: Astronomy.Body.Saturn  },
  ];

  const planets: Record<string, GrahaPosition> = {};

  for (const { key, body } of bodies) {
    const vec  = Astronomy.GeoVector(body, utcDate, false);
    const ecl  = Astronomy.Ecliptic(vec);
    const tropical = ecl.elon;

    // Speed for retrograde detection (compare with next day)
    const vec2 = Astronomy.GeoVector(body, nextDay, false);
    const ecl2 = Astronomy.Ecliptic(vec2);
    let   speed = ecl2.elon - tropical;
    // Handle wrap-around (e.g. 359° → 1°)
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;

    const sidereal = toSidereal(tropical, ayanamsa);
    const rashi    = rashiFromSidereal(sidereal);

    // Whole Sign house: house = (planet_rashi - lagna_rashi + 12) % 12 + 1
    const house = ((rashi.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;

    // Dignity
    let dignity: GrahaPosition['dignity'] = 'neutral';
    if (EXALTATION[key] === rashi.rashiIndex)                   dignity = 'exalted';
    else if (DEBILITATION[key] === rashi.rashiIndex)            dignity = 'debilitated';
    else if (OWN_SIGNS[key]?.includes(rashi.rashiIndex))        dignity = 'own';

    planets[key] = {
      tropicalDeg:   parseFloat(tropical.toFixed(4)),
      siderealDeg:   parseFloat(sidereal.toFixed(4)),
      ...rashi,
      house,
      isRetrograde:  speed < 0,
      dignity,
    };
  }

  // ── Combustion check (Sun–planet angular distance) ─────────────────────────
  const sunTropical = planets['Surya'].tropicalDeg;
  for (const [pname, orb] of Object.entries(COMBUST_ORB)) {
    if (!planets[pname]) continue;
    let diff = Math.abs(planets[pname].tropicalDeg - sunTropical);
    if (diff > 180) diff = 360 - diff;
    planets[pname].isCombust = diff <= orb;
  }

  // ── Rahu (Moon's ascending node) — Meeus formula ──────────────────────────
  // Ω = 125.0445479° − 0.0529539297° × d  (d = days from J2000.0)
  const d = jd - 2451545.0;
  const rahuTropical = norm360(125.0445479 - 0.0529539297 * d);
  const rahuSidereal = toSidereal(rahuTropical, ayanamsa);
  const rahuRashi    = rashiFromSidereal(rahuSidereal);
  const rahuHouse    = ((rahuRashi.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;

  planets['Rahu'] = {
    tropicalDeg:  parseFloat(rahuTropical.toFixed(4)),
    siderealDeg:  parseFloat(rahuSidereal.toFixed(4)),
    ...rahuRashi,
    house:        rahuHouse,
    isRetrograde: true,  // nodes always retrograde in mean-node model
    dignity:      EXALTATION['Rahu'] === rahuRashi.rashiIndex ? 'exalted'
                : DEBILITATION['Rahu'] === rahuRashi.rashiIndex ? 'debilitated' : 'neutral',
  };

  // Ketu = exactly opposite Rahu
  const ketuSidereal = norm360(rahuSidereal + 180);
  const ketuRashi    = rashiFromSidereal(ketuSidereal);
  const ketuHouse    = ((ketuRashi.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;

  planets['Ketu'] = {
    tropicalDeg:  parseFloat(norm360(rahuTropical + 180).toFixed(4)),
    siderealDeg:  parseFloat(ketuSidereal.toFixed(4)),
    ...ketuRashi,
    house:        ketuHouse,
    isRetrograde: true,
    dignity:      EXALTATION['Ketu'] === ketuRashi.rashiIndex ? 'exalted'
                : DEBILITATION['Ketu'] === ketuRashi.rashiIndex ? 'debilitated' : 'neutral',
  };

  // Annotate Moon's nakshatra
  const moonSidereal = planets['Chandra'].siderealDeg;
  const nak = getNakshatra(moonSidereal);
  planets['Chandra'].nakshatra = nak.name;
  planets['Chandra'].pada      = nak.pada;

  return planets;
}

// ── Main export: generate full chart ─────────────────────────────────────────
export function generateAstroChart(input: BirthInput): AstroChart {
  const utcDate  = birthLocalToUTC(input.date, input.time, input.timezone);
  const jd       = toJulianDay(utcDate);
  const ayanamsa = getLahiriAyanamsa(jd);

  // Lagna
  const lagna = calcLagna(jd, input.lat, input.lng, ayanamsa);

  // Planets (Whole Sign houses from Lagna)
  const planets = calcPlanets(utcDate, jd, ayanamsa, lagna.rashiIndex);

  // Nakshatra (from Moon)
  const moonSidereal = planets['Chandra'].siderealDeg;
  const nakshatra    = getNakshatra(moonSidereal);

  // Dasha
  const dasha = calcDasha(nakshatra, utcDate);

  return {
    utcBirthTime: utcDate.toISOString(),
    julianDay:    parseFloat(jd.toFixed(6)),
    ayanamsa:     parseFloat(ayanamsa.toFixed(4)),
    lagna,
    planets,
    nakshatra,
    dasha,
    timeUnknown: input.timeUnknown ?? false,
  };
}

// ── Utility: today's transit positions (shared across all users) ──────────────
export function getTodayTransits(): Record<string, GrahaPosition> {
  const now = new Date();
  const jd  = toJulianDay(now);
  const ay  = getLahiriAyanamsa(jd);
  // Use Aries (rashiIndex=0) as reference for transit house — caller maps to user lagna
  return calcPlanets(now, jd, ay, 0);
}

// ── Utility: remap transit houses relative to natal Lagna ────────────────────
// getTodayTransits() returns houses as if Aries=1; this corrects them
// for a specific user's natal Lagna rashi index (0=Mesha … 11=Meena).
export function remapTransitHouses(
  transits: Record<string, GrahaPosition>,
  natalLagnaRashiIndex: number,
): Record<string, GrahaPosition> {
  const remapped: Record<string, GrahaPosition> = {};
  for (const [planet, pos] of Object.entries(transits)) {
    const house = ((pos.rashiIndex - natalLagnaRashiIndex + 12) % 12) + 1;
    remapped[planet] = { ...pos, house };
  }
  return remapped;
}

// ── Utility: Sade Sati detection ─────────────────────────────────────────────
// Sade Sati = Saturn transiting the rashi before, on, or after natal Moon rashi.
// Phase 'rising'  = Saturn in rashi before Moon (12th from Moon)
// Phase 'peak'    = Saturn in Moon's natal rashi
// Phase 'setting' = Saturn in rashi after Moon (2nd from Moon)
export function detectSadeSati(
  natalMoonRashiIndex: number,
  transitSaturnRashiIndex: number,
): SadeSatiStatus {
  const moonRashi    = RASHIS[natalMoonRashiIndex];
  const saturnRashi  = RASHIS[transitSaturnRashiIndex];

  const risingRashi  = (natalMoonRashiIndex - 1 + 12) % 12;
  const settingRashi = (natalMoonRashiIndex + 1) % 12;

  let phase: SadeSatiStatus['phase'] = null;
  let isActive = false;

  if (transitSaturnRashiIndex === risingRashi) {
    isActive = true;
    phase    = 'rising';
  } else if (transitSaturnRashiIndex === natalMoonRashiIndex) {
    isActive = true;
    phase    = 'peak';
  } else if (transitSaturnRashiIndex === settingRashi) {
    isActive = true;
    phase    = 'setting';
  }

  return { isActive, phase, moonRashi, saturnRashi };
}
