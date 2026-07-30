import julian from 'astronomia/julian';
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import nutation from 'astronomia/nutation';
import { Sunrise } from 'astronomia/sunrise';

export type {
  MonthSystem,
  Paksha,
  LunarMonthResult,
  LunarMonthSuccess,
  LunarMonthFailure,
} from './lunar-month/index.js';
export {
  getLunarMonth,
  findNewMoonBefore,
  findNewMoonAfter,
  findFullMoonBefore,
  findFullMoonAfter,
  findSankrantisBetween,
} from './lunar-month/index.js';

export interface PanchangData {
  tithi: string;
  tithiIndex: number;
  paksha: 'Shukla' | 'Krishna';
  nakshatra: string;
  nakshatraIndex: number;
  yoga: string;
  yogaIndex: number;
  karana: string;
  karanaIndex: number;
  rashi: string;
  rashiIndex: number;
  sunriseLocal: string;
  sunsetLocal: string;
  ayanamsa: number;
  isLeapYear: boolean;
  lunarMonth: string;
  lunarMonthIndex: number;
  amantaMonth: string;
}

export type CalculationMode = 'astronomy_engine' | 'astronomia_sweph_agpl';

export interface PanchangOptions {
  latitude: number;
  longitude: number;
  date: Date;
  timezoneOffsetHours: number;
  mode?: CalculationMode;
  licenseMode?: 'undecided' | 'agpl_accepted' | 'commercial';
}

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghat', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipat', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti',
];

const KARANA_NAMES = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti',
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna',
];

const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const LUNAR_MONTH_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function computeLahiriAyanamsa(julianDay: number): number {
  const t = (julianDay - 2451545.0) / 36525.0;
  return 23.85 + 1.39604167 * t;
}

function getJulianDay(date: Date): number {
  return (julian as any).TimeToJD ? (julian as any).TimeToJD(date) : julian.DateToJDE(date);
}

function getSunLongitude(jd: number): number {
  if (typeof (solar as any).apparentVSOP87 === 'function') {
    const earth = (solar as any).apparentVSOP87((solar as any).earth, jd);
    return normalize360(earth.lon * (180 / Math.PI) + 180);
  }
  return normalize360((solar.apparentLongitude((jd - 2451545.0) / 36525.0) * 180) / Math.PI);
}

function getMoonLongitude(jd: number): number {
  const pos = moonposition.position(jd);
  return normalize360(pos.lon * (180 / Math.PI));
}

function computeSunriseSunset(
  date: Date,
  lat: number,
  lon: number,
  tzOffset: number
): { sunrise: string; sunset: string } {
  const jd = getJulianDay(date);
  try {
    const sunriseObj = new (Sunrise as any)(lat, lon, tzOffset);
    const riseSet = sunriseObj.riseSet ? sunriseObj.riseSet(jd) : null;
    if (riseSet && riseSet.rise && riseSet.set) {
      const riseDate = (julian as any).JDToTime ? (julian as any).JDToTime(riseSet.rise) : new Date();
      const setDate = (julian as any).JDToTime ? (julian as any).JDToTime(riseSet.set) : new Date();
      const fmt = (d: Date) =>
        d.toTimeString().split(' ')[0]?.slice(0, 5) ?? '06:00';
      return { sunrise: fmt(riseDate), sunset: fmt(setDate) };
    }
  } catch {
    // Fallback if astronomia fails
  }
  return { sunrise: '06:00', sunset: '18:00' };
}

function computeKaranaIndex(tithiIndex: number, elongation: number): number {
  if (tithiIndex === 0 && elongation < 6) return 10;
  if (tithiIndex === 29) {
    if (elongation >= 348 && elongation < 354) return 7;
    if (elongation >= 354) return 8;
  }
  if (tithiIndex === 28 && elongation >= 342) return 9;

  const movableIndex = Math.floor((elongation - 6) / 6) % 7;
  return Math.max(0, movableIndex);
}

export function calculatePanchang(options: PanchangOptions): PanchangData {
  const { latitude, longitude, date, timezoneOffsetHours, mode, licenseMode } = options;

  if (mode === 'astronomia_sweph_agpl') {
    if (!licenseMode || licenseMode === 'undecided') {
      throw new Error(
        'License guard: astronomia_sweph_agpl mode requires explicit licenseMode acceptance ("agpl_accepted" or "commercial"). mode="astronomy_engine" is recommended for open standard use.'
      );
    }
  }

  const jd = getJulianDay(date);
  const ayanamsa = computeLahiriAyanamsa(jd);

  const sunTropical = getSunLongitude(jd);
  const moonTropical = getMoonLongitude(jd);

  const sunSidereal = normalize360(sunTropical - ayanamsa);
  const moonSidereal = normalize360(moonTropical - ayanamsa);

  const elongation = normalize360(moonTropical - sunTropical);
  const tithiVal = elongation / 12;
  const tithiIndex = Math.floor(tithiVal) % 30;
  const paksha: 'Shukla' | 'Krishna' = tithiIndex < 15 ? 'Shukla' : 'Krishna';

  const nakshatraIndex = Math.floor(moonSidereal / (360 / 27)) % 27;

  const sumSidereal = normalize360(moonSidereal + sunSidereal);
  const yogaIndex = Math.floor(sumSidereal / (360 / 27)) % 27;

  const karanaIndex = computeKaranaIndex(tithiIndex, elongation);

  const rashiIndex = Math.floor(moonSidereal / 30) % 12;

  const sunRashiIndex = Math.floor(sunSidereal / 30) % 12;
  const masaIndex = (sunRashiIndex + 11) % 12;
  const lunarMonth = LUNAR_MONTH_NAMES[masaIndex] ?? 'Chaitra';

  const { sunrise, sunset } = computeSunriseSunset(
    date,
    latitude,
    longitude,
    timezoneOffsetHours
  );

  return {
    tithi: TITHI_NAMES[tithiIndex] ?? 'Pratipada',
    tithiIndex,
    paksha,
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex] ?? 'Ashwini',
    nakshatraIndex,
    yoga: YOGA_NAMES[yogaIndex] ?? 'Vishkambha',
    yogaIndex,
    karana: KARANA_NAMES[karanaIndex] ?? 'Bava',
    karanaIndex,
    rashi: RASHI_NAMES[rashiIndex] ?? 'Mesha',
    rashiIndex,
    sunriseLocal: sunrise,
    sunsetLocal: sunset,
    ayanamsa,
    isLeapYear: (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) || date.getFullYear() % 400 === 0,
    lunarMonth,
    lunarMonthIndex: masaIndex,
    amantaMonth: lunarMonth,
  };
}
