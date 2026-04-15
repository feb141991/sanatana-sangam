// ============================================================
// Panchang Calculator — Hindu calendar from astronomical data
// Uses lunar position to compute tithi, paksha, nakshatra
// No external API needed — pure math
// ============================================================

import type { Panchang, Vrata, Festival } from '../types';

// Tithi names (1-30, split across two pakshas)
const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya',
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

const KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja',
  'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna',
];

const MASAS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
  'Shravana', 'Bhadrapada', 'Ashwin', 'Kartik',
  'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

const RITUS = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira'];

export class PanchangCalculator {

  // Main method — get panchang for a date
  getPanchang(date: Date, latitude = 28.6139, longitude = 77.209): Panchang {
    const jd = this.julianDay(date);
    const sunLong = this.sunLongitude(jd);
    const moonLong = this.moonLongitude(jd);

    // Tithi: each tithi = 12 degrees of moon-sun elongation
    const elongation = this.normalizeDegrees(moonLong - sunLong);
    const tithiNum = Math.floor(elongation / 12) + 1; // 1-30
    const tithiIndex = ((tithiNum - 1) % 15); // 0-14

    const paksha = tithiNum <= 15 ? 'shukla' : 'krishna';
    const tithiName = TITHIS[tithiIndex];

    // Nakshatra: each nakshatra = 13°20' of moon longitude
    const nakshatraIndex = Math.floor(moonLong / (360 / 27)) % 27;

    // Yoga: sun + moon longitude, each yoga = 13°20'
    const yogaLong = this.normalizeDegrees(sunLong + moonLong);
    const yogaIndex = Math.floor(yogaLong / (360 / 27)) % 27;

    // Karana: half-tithi, each karana = 6 degrees
    const karanaIndex = Math.floor(elongation / 6) % 11;

    // Masa: based on sun's position in zodiac
    const masaIndex = Math.floor(sunLong / 30) % 12;
    // Adjust for traditional masa (starts from Chaitra ≈ Pisces/Aries boundary)
    const adjustedMasa = (masaIndex + 11) % 12;

    // Ritu: each ritu = 2 masas
    const rituIndex = Math.floor(adjustedMasa / 2);

    // Sunrise/sunset (approximate for given latitude)
    const { sunrise, sunset } = this.sunTimes(date, latitude, longitude);

    // Detect vratas and festivals
    const vratas = this.detectVratas(tithiNum, tithiName, paksha);
    const festivals = this.detectFestivals(date, tithiNum, paksha, adjustedMasa);

    return {
      date: date.toISOString().slice(0, 10),
      tithi: `${paksha === 'shukla' ? 'Shukla' : 'Krishna'} ${tithiName}`,
      tithi_number: tithiNum,
      paksha,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      yoga: YOGAS[yogaIndex],
      karana: KARANAS[karanaIndex],
      masa: MASAS[adjustedMasa],
      ritu: RITUS[rituIndex],
      samvatsara: this.samvatsara(date),
      sunrise,
      sunset,
      vratas,
      festivals,
    };
  }

  // Get panchang for today
  getToday(latitude?: number, longitude?: number): Panchang {
    return this.getPanchang(new Date(), latitude, longitude);
  }

  // Get panchang for a date range (for calendar view)
  getRange(start: Date, days: number, lat?: number, lng?: number): Panchang[] {
    const results: Panchang[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      results.push(this.getPanchang(d, lat, lng));
    }
    return results;
  }

  // --- Vrata detection ---

  private detectVratas(tithiNum: number, tithiName: string, paksha: 'shukla' | 'krishna'): Vrata[] {
    const vratas: Vrata[] = [];
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1;

    // Ekadashi (11th tithi of each paksha)
    if (tithiInPaksha === 11) {
      vratas.push({
        name: paksha === 'shukla' ? 'Shukla Ekadashi' : 'Krishna Ekadashi',
        type: 'ekadashi',
        deity: 'Vishnu',
        fasting_rules: 'Nirjala (strict) or Phalahari (fruits only). Break fast next day after sunrise during Dwadashi.',
        special_practice: 'Chant Vishnu Sahasranama or Om Namo Bhagavate Vasudevaya',
      });
    }

    // Pradosh (13th tithi)
    if (tithiInPaksha === 13) {
      vratas.push({
        name: 'Pradosh Vrata',
        type: 'pradosh',
        deity: 'Shiva',
        fasting_rules: 'Fast until evening, break after Shiva puja at pradosh kaal (twilight).',
        special_practice: 'Om Namah Shivaya japa, Shiva abhishekam if possible',
      });
    }

    // Sankashti Chaturthi (4th tithi of Krishna paksha)
    if (tithiInPaksha === 4 && paksha === 'krishna') {
      vratas.push({
        name: 'Sankashti Chaturthi',
        type: 'chaturthi',
        deity: 'Ganesha',
        fasting_rules: 'Fast during the day, break after moonrise.',
        special_practice: 'Ganesh Atharvashirsha, offer durva grass',
      });
    }

    // Purnima
    if (tithiInPaksha === 15 && paksha === 'shukla') {
      vratas.push({
        name: 'Purnima',
        type: 'purnima',
        deity: 'Satyanarayan',
        special_practice: 'Satyanarayan Katha, donate food',
      });
    }

    // Amavasya
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

  // --- Festival detection (simplified — major festivals only) ---

  private detectFestivals(date: Date, tithiNum: number, paksha: 'shukla' | 'krishna', masa: number): Festival[] {
    const festivals: Festival[] = [];
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1;

    // Ram Navami — Chaitra Shukla Navami
    if (masa === 0 && paksha === 'shukla' && tithiInPaksha === 9) {
      festivals.push({ name: 'Ram Navami', description: 'Birth of Lord Rama', regional: false });
    }

    // Hanuman Jayanti — Chaitra Purnima
    if (masa === 0 && paksha === 'shukla' && tithiInPaksha === 15) {
      festivals.push({ name: 'Hanuman Jayanti', description: 'Birth of Lord Hanuman', regional: false });
    }

    // Krishna Janmashtami — Bhadrapada Krishna Ashtami
    if (masa === 5 && paksha === 'krishna' && tithiInPaksha === 8) {
      festivals.push({ name: 'Krishna Janmashtami', description: 'Birth of Lord Krishna', regional: false });
    }

    // Ganesh Chaturthi — Bhadrapada Shukla Chaturthi
    if (masa === 5 && paksha === 'shukla' && tithiInPaksha === 4) {
      festivals.push({ name: 'Ganesh Chaturthi', description: 'Birth of Lord Ganesha', regional: false });
    }

    // Navratri — Ashwin Shukla 1-9
    if (masa === 6 && paksha === 'shukla' && tithiInPaksha >= 1 && tithiInPaksha <= 9) {
      festivals.push({ name: `Navratri Day ${tithiInPaksha}`, description: 'Nine nights of Devi worship', regional: false });
    }

    // Dussehra — Ashwin Shukla Dashami
    if (masa === 6 && paksha === 'shukla' && tithiInPaksha === 10) {
      festivals.push({ name: 'Vijayadashami (Dussehra)', description: 'Victory of good over evil', regional: false });
    }

    // Diwali — Kartik Amavasya
    if (masa === 7 && paksha === 'krishna' && tithiInPaksha === 15) {
      festivals.push({ name: 'Diwali', description: 'Festival of lights', regional: false });
    }

    // Maha Shivaratri — Magha/Phalguna Krishna Chaturdashi
    if ((masa === 10 || masa === 11) && paksha === 'krishna' && tithiInPaksha === 14) {
      festivals.push({ name: 'Maha Shivaratri', description: 'Great night of Shiva', regional: false });
    }

    // Holi — Phalguna Purnima
    if (masa === 11 && paksha === 'shukla' && tithiInPaksha === 15) {
      festivals.push({ name: 'Holi', description: 'Festival of colours', regional: false });
    }

    return festivals;
  }

  // --- Astronomical calculations ---

  private julianDay(date: Date): number {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() + date.getUTCHours() / 24;
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  private sunLongitude(jd: number): number {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T;
    const M = 357.52911 + 35999.05029 * T;
    const Mrad = M * Math.PI / 180;
    const C = (1.9146 - 0.004817 * T) * Math.sin(Mrad) +
              0.019993 * Math.sin(2 * Mrad) +
              0.00029 * Math.sin(3 * Mrad);
    return this.normalizeDegrees(L0 + C);
  }

  private moonLongitude(jd: number): number {
    const T = (jd - 2451545.0) / 36525;
    const Lp = 218.3165 + 481267.8813 * T;
    const D = 297.8502 + 445267.1115 * T;
    const M = 357.5291 + 35999.0503 * T;
    const Mp = 134.9634 + 477198.8675 * T;
    const F = 93.2720 + 483202.0175 * T;

    const Drad = D * Math.PI / 180;
    const Mrad = M * Math.PI / 180;
    const Mprad = Mp * Math.PI / 180;
    const Frad = F * Math.PI / 180;

    let lon = Lp;
    lon += 6.289 * Math.sin(Mprad);
    lon += 1.274 * Math.sin(2 * Drad - Mprad);
    lon += 0.658 * Math.sin(2 * Drad);
    lon += 0.214 * Math.sin(2 * Mprad);
    lon -= 0.186 * Math.sin(Mrad);
    lon -= 0.114 * Math.sin(2 * Frad);

    return this.normalizeDegrees(lon);
  }

  private sunTimes(date: Date, lat: number, lng: number): { sunrise: string; sunset: string } {
    const jd = this.julianDay(date);
    const T = (jd - 2451545.0) / 36525;
    const decl = 23.44 * Math.sin((360 / 365.25 * (jd - 2451545 + 284)) * Math.PI / 180);
    const latRad = lat * Math.PI / 180;
    const declRad = decl * Math.PI / 180;

    const cosH = (Math.sin(-0.83 * Math.PI / 180) - Math.sin(latRad) * Math.sin(declRad)) /
                 (Math.cos(latRad) * Math.cos(declRad));

    const H = Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
    const noon = 12 - lng / 15; // approximate solar noon in UTC hours

    const riseHour = noon - H / 15;
    const setHour = noon + H / 15;

    const offset = date.getTimezoneOffset() / -60;
    const localRise = riseHour + offset;
    const localSet = setHour + offset;

    return {
      sunrise: `${Math.floor(localRise)}:${String(Math.round((localRise % 1) * 60)).padStart(2, '0')}`,
      sunset: `${Math.floor(localSet)}:${String(Math.round((localSet % 1) * 60)).padStart(2, '0')}`,
    };
  }

  private samvatsara(date: Date): string {
    // 60-year cycle, simplified
    const samvatsaras = ['Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati', 'Angirasa'];
    const year = date.getFullYear();
    return samvatsaras[(year - 2000) % samvatsaras.length];
  }

  private normalizeDegrees(deg: number): number {
    return ((deg % 360) + 360) % 360;
  }
}
