import julian from 'astronomia/julian';
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import nutation from 'astronomia/nutation';
import { Sunrise } from 'astronomia/sunrise';

import type { Panchang, Vrata, Festival } from '../types';

const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];

const MASAS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
  'Shravana', 'Bhadrapada', 'Ashwin', 'Kartik',
  'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

const RITUS = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira'];

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function lahiriAyanamsha(jde: number): number {
  const t = (jde - 2451545.0) / 36525.0;
  return 23.85306 + 1.39722 * t + 0.00018 * t * t - 0.000005 * t * t * t;
}

function getTithiName(tithiNum: number, paksha: 'shukla' | 'krishna'): string {
  const tithiInPaksha = ((tithiNum - 1) % 15) + 1;
  if (tithiInPaksha === 15) {
    return paksha === 'shukla' ? 'Purnima' : 'Amavasya';
  }
  return TITHIS[tithiInPaksha - 1];
}

function getKaranaName(karanaNum: number): string {
  if (karanaNum === 1) return 'Kimstughna';
  if (karanaNum >= 58) {
    return ['Shakuni', 'Chatushpada', 'Naga'][karanaNum - 58] ?? 'Naga';
  }
  return MOVABLE_KARANAS[(karanaNum - 2) % MOVABLE_KARANAS.length];
}

function formatShortTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getApproxSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
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
  const offset = -(date.getTimezoneOffset() / 60);
  const b = (((360 / 365) * (dayOfYear - 81)) * Math.PI) / 180;
  const equationOfTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const solarNoon = 12 + offset - lng / 15 - equationOfTime / 60;
  const riseHour = solarNoon - hourAngle / 15;
  const setHour = solarNoon + hourAngle / 15;
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return {
    sunrise: new Date(startOfDay.getTime() + Math.round(riseHour * 60) * 60_000),
    sunset: new Date(startOfDay.getTime() + Math.round(setHour * 60) * 60_000),
  };
}

function getSunTimes(date: Date, lat: number, lng: number): { sunrise: Date; sunset: Date } {
  try {
    const calendar = new julian.CalendarGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const sun = new Sunrise(calendar, lat, -lng, 0);
    const sunrise = sun.rise()?.toDate();
    const sunset = sun.set()?.toDate();
    if (sunrise && sunset) {
      return { sunrise, sunset };
    }
  } catch {
    // Fall through.
  }

  return getApproxSunTimes(date, lat, lng);
}

export class PanchangCalculator {
  getPanchang(date: Date, latitude = 28.6139, longitude = 77.209): Panchang {
    const jde = julian.DateToJDE(date);
    const t = (jde - 2451545.0) / 36525.0;
    const [deltaPsi] = nutation.nutation(jde);
    const ayanamsha = lahiriAyanamsha(jde);
    const sunLon = normalizeAngle((solar.apparentLongitude(t) * 180) / Math.PI);
    const moonLon = normalizeAngle(((moonposition.position(jde).lon + deltaPsi) * 180) / Math.PI);
    const siderealSun = normalizeAngle(sunLon - ayanamsha);
    const siderealMoon = normalizeAngle(moonLon - ayanamsha);
    const elongation = normalizeAngle(moonLon - sunLon);

    const tithiNum = Math.floor(elongation / 12) + 1;
    const paksha = tithiNum <= 15 ? 'shukla' : 'krishna';
    const tithiName = getTithiName(tithiNum, paksha);
    const nakshatraIndex = Math.floor(siderealMoon / (360 / 27)) % 27;
    const yogaIndex = Math.floor(normalizeAngle(siderealSun + siderealMoon) / (360 / 27)) % 27;
    const karanaNum = Math.floor(elongation / 6) + 1;
    const masaIndex = (Math.floor(siderealSun / 30) + 11) % 12;
    const rituIndex = Math.floor(masaIndex / 2);

    const { sunrise, sunset } = getSunTimes(date, latitude, longitude);
    const vratas = this.detectVratas(tithiNum, paksha);
    const festivals = this.detectFestivals(date, tithiNum, paksha, masaIndex);

    return {
      date: date.toISOString().slice(0, 10),
      tithi: `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiName}`,
      tithi_number: tithiNum,
      paksha,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      yoga: YOGAS[yogaIndex],
      karana: getKaranaName(karanaNum),
      masa: MASAS[masaIndex],
      ritu: RITUS[rituIndex],
      samvatsara: this.samvatsara(date),
      sunrise: formatShortTime(sunrise),
      sunset: formatShortTime(sunset),
      vratas,
      festivals,
    };
  }

  getToday(latitude?: number, longitude?: number): Panchang {
    return this.getPanchang(new Date(), latitude, longitude);
  }

  getRange(start: Date, days: number, lat?: number, lng?: number): Panchang[] {
    const results: Panchang[] = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      results.push(this.getPanchang(d, lat, lng));
    }
    return results;
  }

  private detectVratas(tithiNum: number, paksha: 'shukla' | 'krishna'): Vrata[] {
    const vratas: Vrata[] = [];
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1;

    if (tithiInPaksha === 11) {
      vratas.push({
        name: paksha === 'shukla' ? 'Shukla Ekadashi' : 'Krishna Ekadashi',
        type: 'ekadashi',
        deity: 'Vishnu',
        fasting_rules: 'Nirjala (strict) or Phalahari (fruits only). Break fast next day after sunrise during Dwadashi.',
        special_practice: 'Chant Vishnu Sahasranama or Om Namo Bhagavate Vasudevaya',
      });
    }

    if (tithiInPaksha === 13) {
      vratas.push({
        name: 'Pradosh Vrata',
        type: 'pradosh',
        deity: 'Shiva',
        fasting_rules: 'Fast until evening, break after Shiva puja at pradosh kaal (twilight).',
        special_practice: 'Om Namah Shivaya japa, Shiva abhishekam if possible',
      });
    }

    if (tithiInPaksha === 4 && paksha === 'krishna') {
      vratas.push({
        name: 'Sankashti Chaturthi',
        type: 'chaturthi',
        deity: 'Ganesha',
        fasting_rules: 'Fast during the day, break after moonrise.',
        special_practice: 'Ganesh Atharvashirsha, offer durva grass',
      });
    }

    if (tithiInPaksha === 15 && paksha === 'shukla') {
      vratas.push({
        name: 'Purnima',
        type: 'purnima',
        deity: 'Satyanarayan',
        special_practice: 'Satyanarayan Katha, donate food',
      });
    }

    if (tithiInPaksha === 15 && paksha === 'krishna') {
      vratas.push({
        name: 'Amavasya',
        type: 'amavasya',
        deity: 'Pitru',
        special_practice: 'Pitru tarpan, donate to needy',
      });
    }

    return vratas;
  }

  private detectFestivals(date: Date, tithiNum: number, paksha: 'shukla' | 'krishna', masa: number): Festival[] {
    const festivals: Festival[] = [];
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1;

    if (masa === 0 && paksha === 'shukla' && tithiInPaksha === 9) {
      festivals.push({ name: 'Ram Navami', description: 'Birth of Lord Rama', regional: false });
    }
    if (masa === 0 && paksha === 'shukla' && tithiInPaksha === 15) {
      festivals.push({ name: 'Hanuman Jayanti', description: 'Birth of Lord Hanuman', regional: false });
    }
    if (masa === 5 && paksha === 'krishna' && tithiInPaksha === 8) {
      festivals.push({ name: 'Krishna Janmashtami', description: 'Birth of Lord Krishna', regional: false });
    }
    if (masa === 5 && paksha === 'shukla' && tithiInPaksha === 4) {
      festivals.push({ name: 'Ganesh Chaturthi', description: 'Birth of Lord Ganesha', regional: false });
    }
    if (masa === 6 && paksha === 'shukla' && tithiInPaksha >= 1 && tithiInPaksha <= 9) {
      festivals.push({ name: `Navratri Day ${tithiInPaksha}`, description: 'Nine nights of Devi worship', regional: false });
    }
    if (masa === 6 && paksha === 'shukla' && tithiInPaksha === 10) {
      festivals.push({ name: 'Vijayadashami (Dussehra)', description: 'Victory of good over evil', regional: false });
    }
    if (masa === 7 && paksha === 'krishna' && tithiInPaksha === 15) {
      festivals.push({ name: 'Diwali', description: 'Festival of lights', regional: false });
    }
    if ((masa === 10 || masa === 11) && paksha === 'krishna' && tithiInPaksha === 14) {
      festivals.push({ name: 'Maha Shivaratri', description: 'Great night of Shiva', regional: false });
    }
    if (masa === 11 && paksha === 'shukla' && tithiInPaksha === 15) {
      festivals.push({ name: 'Holi', description: 'Festival of colours', regional: false });
    }

    return festivals;
  }

  private samvatsara(date: Date): string {
    const samvatsaras = ['Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa'];
    const year = date.getFullYear();
    return samvatsaras[((year - 2000) % samvatsaras.length + samvatsaras.length) % samvatsaras.length];
  }
}
