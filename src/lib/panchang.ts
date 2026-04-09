// ─── Panchang Calculator — Pure JS, no API needed ─────────────────
// Calculates tithi, nakshatra, yoga, rahu kaal and muhurat
// for any date and timezone.

export interface PanchangData {
  tithi:       string;
  tithiIndex:  number;        // 1-30
  paksha:      'Shukla' | 'Krishna';
  nakshatra:   string;
  yoga:        string;
  vara:        string;        // day of week in Sanskrit
  rahuKaal:    string;        // e.g. "09:00 – 10:30"
  abhijitMuhurat: string;
  sunrise:     string;
  sunset:      string;
  date:        string;
  masaName:    string;        // Hindu month name
}

export interface PanchangTrustMeta {
  methodLabel: string;
  precisionLabel: string;
  guidanceNote: string;
}

export const PANCHANG_TRUST_META: PanchangTrustMeta = {
  methodLabel: 'Location-based Panchang estimate',
  precisionLabel: 'Best for daily guidance, not priestly precision',
  guidanceNote: 'This Panchang is calculated in-app from date and location. Use it for daily orientation, and verify temple- or guru-specific observances when exact ritual timing matters.',
};

const TITHIS = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya',
];

const NAKSHATRAS = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
];

const YOGAS = [
  'Vishkamba','Priti','Ayushman','Saubhagya','Shobhana','Atiganda',
  'Sukarman','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata',
  'Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva',
  'Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti',
];

const VARAS = ['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'];

const MASA_NAMES = [
  'Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada',
  'Ashwin','Kartika','Margashirsha','Pausha','Magha','Phalguna',
];

// Rahu Kaal duration is 1.5 hours; position varies by day of week
const RAHU_KAAL_ORDER = [8, 2, 7, 5, 6, 4, 3]; // index into 8 day-parts (Sun=0)

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toJulian(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return 367 * y
    - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
    + Math.floor(275 * m / 9)
    + d + 1721013.5;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function lahiriAyanamsha(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return 23.85675 + (0.01396875 * t);
}

function sunPosition(jd: number): number {
  const n  = jd - 2451545.0;
  const L  = normalizeAngle(280.46 + 0.9856474 * n);
  const g  = normalizeAngle(357.528 + 0.9856003 * n) * DEG;
  return normalizeAngle(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

function moonPosition(jd: number): number {
  const n  = jd - 2451545.0;
  const L  = normalizeAngle(218.316 + 13.176396 * n);
  const M  = normalizeAngle(134.963 + 13.064993 * n) * DEG;
  const F  = normalizeAngle(93.272  + 13.229350 * n) * DEG;
  return normalizeAngle(L + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * F - M) + 0.658 * Math.sin(2 * F));
}

function formatTime(hour: number, minuteOffset = 0): string {
  const totalMins = Math.round(hour * 60) + minuteOffset;
  const h  = Math.floor(totalMins / 60) % 24;
  const m  = totalMins % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${mm} ${ampm}`;
}

function equationOfTime(dayOfYear: number): number {
  const b = DEG * ((360 / 365) * (dayOfYear - 81));
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function getSunriseSunset(lat: number, lon: number, date: Date): { sunrise: number; sunset: number } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const latRad = lat * DEG;
  const declination = 23.45 * Math.sin(DEG * ((360 / 365) * (284 + dayOfYear)));
  const decRad = declination * DEG;

  // 90.833 accounts for the sun's apparent radius and atmospheric refraction.
  const cosH = (
    Math.cos(90.833 * DEG) / (Math.cos(latRad) * Math.cos(decRad)) -
    Math.tan(latRad) * Math.tan(decRad)
  );
  const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * RAD;
  const timezone = -(date.getTimezoneOffset() / 60);
  const solarNoon = 12 + timezone - (lon / 15) - (equationOfTime(dayOfYear) / 60);
  const sunrise  = solarNoon - H / 15;
  const sunset   = solarNoon + H / 15;
  return { sunrise, sunset };
}

export function calculatePanchang(
  date: Date = new Date(),
  lat = 51.5074,
  lon = -0.1278
): PanchangData {
  const jd    = toJulian(date);
  const tropicalSunLon  = sunPosition(jd);
  const tropicalMoonLon = moonPosition(jd);
  const ayanamsha = lahiriAyanamsha(jd);
  const sunLon = normalizeAngle(tropicalSunLon - ayanamsha);
  const moonLon = normalizeAngle(tropicalMoonLon - ayanamsha);

  // Tithi: each tithi = 12° difference between moon and sun
  const elongation = normalizeAngle(tropicalMoonLon - tropicalSunLon);
  const tithiIndex = Math.floor(elongation / 12) + 1;  // 1-30
  const paksha: 'Shukla' | 'Krishna' = tithiIndex <= 15 ? 'Shukla' : 'Krishna';
  const tithiName = TITHIS[(tithiIndex - 1) % 15];
  const tithi     = `${paksha} ${tithiName} (${tithiIndex})`;

  // Nakshatra: 27 divisions of 360° = 13.33° each
  const nakshatraIndex = Math.floor(normalizeAngle(moonLon) / (360 / 27)) % 27;
  const nakshatra      = NAKSHATRAS[nakshatraIndex];

  // Yoga: sidereal sun + sidereal moon
  const yogaIndex = Math.floor(normalizeAngle(sunLon + moonLon) / (360 / 27)) % 27;
  const yoga      = YOGAS[yogaIndex];

  // Vara (weekday)
  const dow  = date.getDay(); // 0=Sun
  const vara = VARAS[dow];

  // Masa (Hindu month — approximate)
  const masaIndex = Math.floor(normalizeAngle(sunLon) / 30) % 12;
  const masaName  = MASA_NAMES[masaIndex];

  // Sunrise / Sunset
  const { sunrise, sunset } = getSunriseSunset(lat, lon, date);
  const sunriseFmt = formatTime(sunrise);
  const sunsetFmt  = formatTime(sunset);

  // Rahu Kaal
  const dayLength  = sunset - sunrise;
  const partLength = dayLength / 8;
  const rahuPart   = RAHU_KAAL_ORDER[dow] - 1;
  const rahuStart  = sunrise + rahuPart * partLength;
  const rahuEnd    = rahuStart + partLength;
  const rahuKaal   = `${formatTime(rahuStart)} – ${formatTime(rahuEnd)}`;

  // Abhijit Muhurat (~midday, auspicious)
  const midday      = (sunrise + sunset) / 2;
  const abhijitMuhurat = `${formatTime(midday, -24)} – ${formatTime(midday, 24)}`;

  const dateStr = date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return {
    tithi, tithiIndex, paksha, nakshatra, yoga, vara,
    rahuKaal, abhijitMuhurat, sunrise: sunriseFmt, sunset: sunsetFmt,
    date: dateStr, masaName,
  };
}
