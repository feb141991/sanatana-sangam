import julian from 'astronomia/julian';
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import nutation from 'astronomia/nutation';
import { Sunrise } from 'astronomia/sunrise';

export interface PanchangData {
  tithi: string;
  tithiIndex: number;
  paksha: 'Shukla' | 'Krishna';
  tithiUpto: string;
  nakshatra: string;
  nakshatraUpto: string;
  yoga: string;
  yogaUpto: string;
  karana: string;
  karanaUpto: string;
  vara: string;
  rahuKaal: string;
  abhijitMuhurat: string;
  sunrise: string;
  sunset: string;
  brahmaMuhurta: string;
  date: string;
  masaName: string;
  samvatYear: number;
  samvatName: string;
}

export interface PanchangTrustMeta {
  methodLabel: string;
  precisionLabel: string;
  guidanceNote: string;
}

export const PANCHANG_TRUST_META: PanchangTrustMeta = {
  methodLabel: 'Astronomy-backed Panchang estimate',
  precisionLabel: 'Higher precision for daily guidance; observance rules still under validation',
  guidanceNote: 'This Panchang now uses astronomy-backed solar and lunar positions plus solved transition windows. It is materially stronger than the older in-app estimate, but temple- or guru-specific observances should still win when exact vrata timing matters.',
};

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const YOGAS = [
  'Vishkamba', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarman', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

const VARAS = ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara'];

const MASA_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

const SAMVAT_NAMES = [
  'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa', 'Shrimukha', 'Bhava',
  'Yuva', 'Dhatri', 'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu',
  'Subhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikrita',
  'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi', 'Hevilambi', 'Vilambi',
  'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhana', 'Krodhi', 'Vishvavasu', 'Parabhava',
  'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadi', 'Ananda',
  'Rakshasa', 'Nala', 'Pingala', 'Kalayukta', 'Siddharthi', 'Raudri', 'Durmati', 'Dundubhi',
  'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
];

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
const RAHU_KAAL_ORDER = [8, 2, 7, 5, 6, 4, 3];
const LOCAL_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});
const LOCAL_DAY_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

type PanchangAstronomy = {
  jde: number;
  sunTropical: number;
  moonTropical: number;
  ayanamsha: number;
  sunSidereal: number;
  moonSidereal: number;
  elongation: number;
};

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function unwrapForward(angle: number, baseAngle: number): number {
  let value = angle;
  while (value < baseAngle) {
    value += 360;
  }
  return value;
}

function lahiriAyanamsha(jde: number): number {
  const t = (jde - 2451545.0) / 36525.0;
  return 23.85306 + 1.39722 * t + 0.00018 * t * t - 0.000005 * t * t * t;
}

function computeAstronomy(date: Date): PanchangAstronomy {
  const jde = julian.DateToJDE(date);
  const t = (jde - 2451545.0) / 36525.0;
  const sunTropical = normalizeAngle((solar.apparentLongitude(t) * 180) / Math.PI);
  const moonBase = moonposition.position(jde).lon;
  const [deltaPsi] = nutation.nutation(jde);
  const moonTropical = normalizeAngle(((moonBase + deltaPsi) * 180) / Math.PI);
  const ayanamsha = lahiriAyanamsha(jde);
  const sunSidereal = normalizeAngle(sunTropical - ayanamsha);
  const moonSidereal = normalizeAngle(moonTropical - ayanamsha);

  return {
    jde,
    sunTropical,
    moonTropical,
    ayanamsha,
    sunSidereal,
    moonSidereal,
    elongation: normalizeAngle(moonTropical - sunTropical),
  };
}

function formatClock(date: Date | null): string {
  if (!date) return 'Unavailable';
  return LOCAL_TIME_FORMAT.format(date);
}

function formatTransition(baseDate: Date, targetDate: Date | null): string {
  if (!targetDate) return 'Unavailable';

  const baseDay = new Date(baseDate);
  baseDay.setHours(0, 0, 0, 0);
  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);

  const timePart = formatClock(targetDate);
  if (baseDay.getTime() === targetDay.getTime()) {
    return timePart;
  }

  return `${timePart}, ${LOCAL_DAY_LABEL_FORMAT.format(targetDate)}`;
}

function subtractMinutes(date: Date | null, minutes: number): Date | null {
  if (!date) return null;
  return new Date(date.getTime() - minutes * 60_000);
}

function addMinutes(date: Date | null, minutes: number): Date | null {
  if (!date) return null;
  return new Date(date.getTime() + minutes * 60_000);
}

function getApproxSunriseSunset(lat: number, lon: number, date: Date): { sunrise: Date; sunset: Date } {
  const localMidday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const dayOfYear = Math.floor((localMidday.getTime() - new Date(localMidday.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const latRad = (lat * Math.PI) / 180;
  const declination = 23.45 * Math.sin((((360 / 365) * (284 + dayOfYear)) * Math.PI) / 180);
  const decRad = (declination * Math.PI) / 180;
  const cosH = (
    Math.cos((90.833 * Math.PI) / 180) / (Math.cos(latRad) * Math.cos(decRad)) -
    Math.tan(latRad) * Math.tan(decRad)
  );
  const hourAngle = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI;
  const timezone = -(date.getTimezoneOffset() / 60);
  const equationOfTime = (() => {
    const b = (((360 / 365) * (dayOfYear - 81)) * Math.PI) / 180;
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  })();

  const solarNoon = 12 + timezone - lon / 15 - equationOfTime / 60;
  const sunriseHour = solarNoon - hourAngle / 15;
  const sunsetHour = solarNoon + hourAngle / 15;
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return {
    sunrise: new Date(startOfDay.getTime() + Math.round(sunriseHour * 60) * 60_000),
    sunset: new Date(startOfDay.getTime() + Math.round(sunsetHour * 60) * 60_000),
  };
}

function getSunriseSunset(lat: number, lon: number, date: Date): { sunrise: Date; sunset: Date; noon: Date } {
  try {
    const calendar = new julian.CalendarGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const sun = new Sunrise(calendar, lat, -lon, 0);
    const sunriseDate = sun.rise()?.toDate() ?? null;
    const sunsetDate = sun.set()?.toDate() ?? null;
    const noonDate = sun.noon().toDate();

    if (sunriseDate && sunsetDate) {
      return {
        sunrise: sunriseDate,
        sunset: sunsetDate,
        noon: noonDate,
      };
    }
  } catch {
    // Fall back to the older approximation for edge locations or library failures.
  }

  const fallback = getApproxSunriseSunset(lat, lon, date);
  const noon = new Date((fallback.sunrise.getTime() + fallback.sunset.getTime()) / 2);
  return { ...fallback, noon };
}

function getTithiName(tithiIndex: number, paksha: 'Shukla' | 'Krishna'): string {
  const tithiInPaksha = ((tithiIndex - 1) % 15) + 1;
  if (tithiInPaksha === 15) {
    return paksha === 'Shukla' ? 'Purnima' : 'Amavasya';
  }
  return TITHIS[tithiInPaksha - 1];
}

function getKaranaName(karanaIndex: number): string {
  if (karanaIndex === 1) return 'Kimstughna';
  if (karanaIndex >= 58) {
    return ['Shakuni', 'Chatushpada', 'Nagava'][karanaIndex - 58] ?? 'Nagava';
  }
  return MOVABLE_KARANAS[(karanaIndex - 2) % MOVABLE_KARANAS.length];
}

function solveNextBoundary(
  startDate: Date,
  startValue: number,
  stepDegrees: number,
  valueAt: (date: Date) => number,
  maxSearchHours = 72
): Date | null {
  let target = Math.ceil(startValue / stepDegrees) * stepDegrees;
  if (Math.abs(target - startValue) < 1e-9) {
    target += stepDegrees;
  }

  let low = startDate.getTime();
  let high = low + 6 * 60 * 60 * 1000;
  const maxHigh = low + maxSearchHours * 60 * 60 * 1000;

  while (high <= maxHigh) {
    const highValue = unwrapForward(valueAt(new Date(high)), startValue);
    if (highValue >= target) {
      break;
    }
    high += 6 * 60 * 60 * 1000;
  }

  if (high > maxHigh) {
    return null;
  }

  for (let i = 0; i < 45; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const midValue = unwrapForward(valueAt(new Date(mid)), startValue);
    if (midValue >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return new Date(high);
}

export function calculatePanchang(
  date: Date = new Date(),
  lat = 51.5074,
  lon = -0.1278
): PanchangData {
  const astro = computeAstronomy(date);

  const tithiIndex = Math.floor(astro.elongation / 12) + 1;
  const paksha: 'Shukla' | 'Krishna' = tithiIndex <= 15 ? 'Shukla' : 'Krishna';
  const tithi = getTithiName(tithiIndex, paksha);

  const nakshatraIndex = Math.floor(astro.moonSidereal / (360 / 27)) % 27;
  const yogaIndex = Math.floor(normalizeAngle(astro.sunSidereal + astro.moonSidereal) / (360 / 27)) % 27;
  const karanaIndex = Math.floor(astro.elongation / 6) + 1;

  const nextTithi = solveNextBoundary(
    date,
    astro.elongation,
    12,
    (candidate) => computeAstronomy(candidate).elongation
  );
  const nextNakshatra = solveNextBoundary(
    date,
    astro.moonSidereal,
    360 / 27,
    (candidate) => computeAstronomy(candidate).moonSidereal
  );
  const nextYoga = solveNextBoundary(
    date,
    normalizeAngle(astro.sunSidereal + astro.moonSidereal),
    360 / 27,
    (candidate) => {
      const candidateAstro = computeAstronomy(candidate);
      return normalizeAngle(candidateAstro.sunSidereal + candidateAstro.moonSidereal);
    }
  );
  const nextKarana = solveNextBoundary(
    date,
    astro.elongation,
    6,
    (candidate) => computeAstronomy(candidate).elongation
  );

  const { sunrise, sunset, noon } = getSunriseSunset(lat, lon, date);
  const brahmaMuhurtaStart = subtractMinutes(sunrise, 96);
  const brahmaMuhurtaEnd = subtractMinutes(sunrise, 48);

  const dayLengthMs = Math.max(0, sunset.getTime() - sunrise.getTime());
  const partLengthMs = dayLengthMs / 8;
  const dow = date.getDay();
  const rahuPartIndex = RAHU_KAAL_ORDER[dow] - 1;
  const rahuStart = new Date(sunrise.getTime() + rahuPartIndex * partLengthMs);
  const rahuEnd = new Date(rahuStart.getTime() + partLengthMs);
  const abhijitStart = addMinutes(noon, -24);
  const abhijitEnd = addMinutes(noon, 24);

  const vara = VARAS[dow];
  const masaIndex = (Math.floor(astro.sunSidereal / 30) + 11) % 12;
  const masaName = MASA_NAMES[masaIndex];

  const gregYear = date.getFullYear();
  const samvatYear = gregYear + 57;
  const samvatName = SAMVAT_NAMES[(samvatYear - 1) % 60] ?? '';

  return {
    tithi,
    tithiIndex,
    paksha,
    tithiUpto: formatTransition(date, nextTithi),
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraUpto: formatTransition(date, nextNakshatra),
    yoga: YOGAS[yogaIndex],
    yogaUpto: formatTransition(date, nextYoga),
    karana: getKaranaName(karanaIndex),
    karanaUpto: formatTransition(date, nextKarana),
    vara,
    rahuKaal: `${formatClock(rahuStart)} – ${formatClock(rahuEnd)}`,
    abhijitMuhurat: `${formatClock(abhijitStart)} – ${formatClock(abhijitEnd)}`,
    sunrise: formatClock(sunrise),
    sunset: formatClock(sunset),
    brahmaMuhurta: `${formatClock(brahmaMuhurtaStart)} – ${formatClock(brahmaMuhurtaEnd)}`,
    date: date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    masaName,
    samvatYear,
    samvatName,
  };
}
