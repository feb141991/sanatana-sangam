import { parseCivilDateUtc, getTzOffsetHours } from '@sangam/panchang-engine';

interface RawFixture {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  dateStr: string;
  authority: 'USNO' | 'HMNAO';
}

const RAW_FIXTURES: RawFixture[] = [
  { city: 'Bedford', lat: 52.1356, lon: -0.4685, tz: 'Europe/London', dateStr: '2026-02-17', authority: 'HMNAO' },
  { city: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata', dateStr: '2026-02-17', authority: 'USNO' },
  { city: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata', dateStr: '2026-03-03', authority: 'USNO' },
  { city: 'Delhi', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata', dateStr: '2026-03-20', authority: 'USNO' },
  { city: 'Varanasi', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata', dateStr: '2026-06-21', authority: 'USNO' },
  { city: 'Mumbai', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata', dateStr: '2026-09-22', authority: 'USNO' },
  { city: 'Chennai', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', dateStr: '2026-12-21', authority: 'USNO' },
  { city: 'Kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata', dateStr: '2026-03-03', authority: 'USNO' },
  { city: 'Kathmandu', lat: 27.7172, lon: 85.3240, tz: 'Asia/Kathmandu', dateStr: '2026-03-20', authority: 'USNO' },
  { city: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', dateStr: '2026-06-21', authority: 'HMNAO' },
  { city: 'New York', lat: 40.7128, lon: -74.0060, tz: 'America/New_York', dateStr: '2026-09-22', authority: 'USNO' },
  { city: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', dateStr: '2026-12-21', authority: 'USNO' },
  { city: 'Reykjavík', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik', dateStr: '2026-03-20', authority: 'HMNAO' },
];

export function getTzOffsetDecimalHours(dateStr: string, tz: string): number {
  const date = parseCivilDateUtc(dateStr);
  const noon = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
  return getTzOffsetHours(noon, tz);
}

function generateQueries() {
  console.log('=== USNO Query URL List for 13 Golden Fixtures ===\n');
  
  RAW_FIXTURES.forEach((fixture, index) => {
    const tzOffset = getTzOffsetDecimalHours(fixture.dateStr, fixture.tz);
    const coordsStr = `${fixture.lat.toFixed(4)},${fixture.lon.toFixed(4)}`;
    const queryUrl = `https://aa.usno.navy.mil/api/rstt/oneday?date=${fixture.dateStr}&coords=${coordsStr}&tz=${tzOffset}`;
    
    console.log(`${index + 1}. ${fixture.city} (${fixture.dateStr})`);
    console.log(`   Timezone: ${fixture.tz} (Offset: ${tzOffset >= 0 ? '+' : ''}${tzOffset}h)`);
    console.log(`   Authority: ${fixture.authority}`);
    console.log(`   URL: ${queryUrl}\n`);
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('usno-queries.ts')) {
  generateQueries();
}
