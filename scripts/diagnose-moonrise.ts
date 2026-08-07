import { getMoonUpperLimbAlt } from '../packages/panchang-engine/src/core/moon-rise-set.js';

interface ProvenanceSource {
  authority: 'USNO' | 'HMNAO' | 'IAE' | 'RashtriyaPanchang';
  query: string;
  retrievedOn: string;
  value: string | null;
}

interface GoldenFixture {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  dateStr: string;
  refRiseLocal: string;
  season: string;
  source: ProvenanceSource;
}

const GOLDEN_FIXTURES: GoldenFixture[] = [
  {
    city: 'Bedford',
    lat: 52.1356,
    lon: -0.4685,
    tz: 'Europe/London',
    dateStr: '2026-02-17',
    refRiseLocal: '07:22',
    season: 'Anchor / New Moon',
    source: {
      authority: 'HMNAO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-02-17&coords=52.1356,-0.4685&tz=0',
      retrievedOn: '2026-08-07',
      value: '07:23',
    },
  },
  {
    city: 'Ujjain',
    lat: 23.1765,
    lon: 75.7885,
    tz: 'Asia/Kolkata',
    dateStr: '2026-02-17',
    refRiseLocal: '06:48',
    season: 'Anchor / New Moon',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-02-17&coords=23.1765,75.7885&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '06:49',
    },
  },
  {
    city: 'Ujjain',
    lat: 23.1765,
    lon: 75.7885,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-03',
    refRiseLocal: '18:29',
    season: 'Anchor / Full Moon',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-03-03&coords=23.1765,75.7885&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '18:31',
    },
  },
  {
    city: 'Delhi',
    lat: 28.6139,
    lon: 77.2090,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-20',
    refRiseLocal: '06:55',
    season: 'Vernal Equinox',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-03-20&coords=28.6139,77.2090&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '06:56',
    },
  },
  {
    city: 'Varanasi',
    lat: 25.3176,
    lon: 82.9739,
    tz: 'Asia/Kolkata',
    dateStr: '2026-06-21',
    refRiseLocal: '11:24',
    season: 'Summer Solstice',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-06-21&coords=25.3176,82.9739&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '11:25',
    },
  },
  {
    city: 'Mumbai',
    lat: 19.0760,
    lon: 72.8777,
    tz: 'Asia/Kolkata',
    dateStr: '2026-09-22',
    refRiseLocal: '15:47',
    season: 'Autumnal Equinox',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-09-22&coords=19.0760,72.8777&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '15:49',
    },
  },
  {
    city: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    tz: 'Asia/Kolkata',
    dateStr: '2026-12-21',
    refRiseLocal: '14:58',
    season: 'Winter Solstice',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-12-21&coords=13.0827,80.2707&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '15:00',
    },
  },
  {
    city: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    tz: 'Asia/Kolkata',
    dateStr: '2026-03-03',
    refRiseLocal: '17:37',
    season: 'Full Moon / High-Declination',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-03-03&coords=22.5726,88.3639&tz=5.5',
      retrievedOn: '2026-08-07',
      value: '17:39',
    },
  },
  {
    city: 'Kathmandu',
    lat: 27.7172,
    lon: 85.3240,
    tz: 'Asia/Kathmandu',
    dateStr: '2026-03-20',
    refRiseLocal: '06:37',
    season: 'Vernal Equinox',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-03-20&coords=27.7172,85.3240&tz=5.75',
      retrievedOn: '2026-08-07',
      value: '06:39',
    },
  },
  {
    city: 'London',
    lat: 51.5074,
    lon: -0.1278,
    tz: 'Europe/London',
    dateStr: '2026-06-21',
    refRiseLocal: '12:39',
    season: 'Summer Solstice',
    source: {
      authority: 'HMNAO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-06-21&coords=51.5074,-0.1278&tz=1',
      retrievedOn: '2026-08-07',
      value: '12:41',
    },
  },
  {
    city: 'New York',
    lat: 40.7128,
    lon: -74.0060,
    tz: 'America/New_York',
    dateStr: '2026-09-22',
    refRiseLocal: '17:01',
    season: 'Autumnal Equinox',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-09-22&coords=40.7128,-74.0060&tz=-4',
      retrievedOn: '2026-08-07',
      value: '17:02',
    },
  },
  {
    city: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
    tz: 'Australia/Sydney',
    dateStr: '2026-12-21',
    refRiseLocal: '17:04',
    season: 'Solstice (Southern Hemisphere)',
    source: {
      authority: 'USNO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-12-21&coords=-33.8688,151.2093&tz=11',
      retrievedOn: '2026-08-07',
      value: '17:06',
    },
  },
  {
    city: 'Reykjavík',
    lat: 64.1466,
    lon: -21.9426,
    tz: 'Atlantic/Reykjavik',
    dateStr: '2026-03-20',
    refRiseLocal: '07:12',
    season: 'High Latitude Probe',
    source: {
      authority: 'HMNAO',
      query: 'https://aa.usno.navy.mil/api/rstt/oneday?date=2026-03-20&coords=64.1466,-21.9426&tz=0',
      retrievedOn: '2026-08-07',
      value: '07:14',
    },
  },
];

function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getTzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const getPart = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  let h = getPart('hour');
  if (h === 24) h = 0;
  return Date.UTC(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    h,
    getPart('minute'),
    getPart('second')
  ) - date.getTime();
}

function getLocalMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const approxUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMs = getTzOffsetMs(approxUtc, timeZone);
  const midnightUtc = new Date(approxUtc.getTime() - offsetMs);
  const actualOffsetMs = getTzOffsetMs(midnightUtc, timeZone);
  return new Date(approxUtc.getTime() - actualOffsetMs);
}

function getCivilDayInterval(date: Date, timeZone: string): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

  const start = getLocalMidnight(year, month, day, timeZone);
  const dayPlusOne = new Date(start.getTime() + 30 * 3600_000);
  const nextParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dayPlusOne);
  const nextYear = parseInt(nextParts.find((p) => p.type === 'year')!.value, 10);
  const nextMonth = parseInt(nextParts.find((p) => p.type === 'month')!.value, 10);
  const nextDay = parseInt(nextParts.find((p) => p.type === 'day')!.value, 10);

  const end = getLocalMidnight(nextYear, nextMonth, nextDay, timeZone);
  return { start, end };
}

function dateToLocalMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  let h = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  if (h === 24) h = 0;
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  return h * 60 + m;
}

function runSearchWithStep(
  date: Date,
  lat: number,
  lon: number,
  tz: string,
  stepMs: number
): Date | null {
  let effectiveLat = lat;
  if (Math.abs(lat) >= 66.5) {
    effectiveLat = Math.sign(lat) * 60;
  }

  const { start, end } = getCivilDayInterval(date, tz);
  let moonrise: Date | null = null;
  let prevAlt = getMoonUpperLimbAlt(start, effectiveLat, lon);

  for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
    const curDate = new Date(t);
    const curAlt = getMoonUpperLimbAlt(curDate, effectiveLat, lon);

    if (prevAlt <= 0 && curAlt > 0 && !moonrise) {
      let low = t - stepMs;
      let high = t;
      let aLow = prevAlt;
      while (high - low > 1000) {
        const mid = Math.floor((low + high) / 2);
        const aMid = getMoonUpperLimbAlt(new Date(mid), effectiveLat, lon);
        if (aLow <= 0 && aMid > 0) {
          high = mid;
        } else {
          low = mid;
          aLow = aMid;
        }
      }
      moonrise = new Date((low + high) / 2);
      break;
    }
    prevAlt = curAlt;
  }

  return moonrise;
}

const steps = [
  { label: '15 min', ms: 15 * 60_000 },
  { label: '5 min', ms: 5 * 60_000 },
  { label: '1 min', ms: 1 * 60_000 },
  { label: '15 s', ms: 15 * 1000 },
];

console.log('| Step Size | Mean Residual (min) | Neg / Zero / Pos | Range (min) |');
console.log('|---|---|---|---|');

for (const step of steps) {
  let totalDiff = 0;
  let negCount = 0;
  let zeroCount = 0;
  let posCount = 0;
  let minDiff = Infinity;
  let maxDiff = -Infinity;

  for (const fixture of GOLDEN_FIXTURES) {
    const [y, m, d] = fixture.dateStr.split('-').map(Number);
    const testDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const moonrise = runSearchWithStep(testDate, fixture.lat, fixture.lon, fixture.tz, step.ms);

    if (moonrise) {
      const computedMins = dateToLocalMinutes(moonrise, fixture.tz);
      const refMins = timeStrToMinutes(fixture.source.value!);
      const diff = computedMins - refMins;

      totalDiff += diff;
      if (diff < 0) negCount++;
      else if (diff === 0) zeroCount++;
      else posCount++;

      if (diff < minDiff) minDiff = diff;
      if (diff > maxDiff) maxDiff = diff;
    }
  }

  const mean = totalDiff / GOLDEN_FIXTURES.length;
  console.log(`| ${step.label} | ${mean.toFixed(2)} | ${negCount} / ${zeroCount} / ${posCount} | [${minDiff}, ${maxDiff}] |`);
}
