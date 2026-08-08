/**
 * Prints the exact queries needed to populate the 4.3 Tier-1 fixtures.
 *
 * Run: npm run fixtures:tier1-queries
 *
 * You (a person) open each URL, read the number, and paste it into
 * `packages/panchang-engine/src/core/__tests__/fixtures/tier1-sites.ts`.
 * A model must not fill these in — LLM output is Tier 6 and would launder its
 * own guess behind a "USNO" or "JPL" label, which is exactly the D23 failure.
 */
import { parseCivilDateUtc, getTzOffsetHours } from '@sangam/panchang-engine';
import {
  TIER1_SITES,
  SUNSET_FIXTURES,
  LONGITUDE_FIXTURES,
} from '../packages/panchang-engine/src/core/__tests__/fixtures/tier1-sites';

function tzOffsetHours(dateStr: string, tz: string): number {
  const d = parseCivilDateUtc(dateStr);
  const noon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
  return getTzOffsetHours(noon, tz);
}

const site = (city: string) => {
  const s = TIER1_SITES.find(x => x.city === city);
  if (!s) throw new Error(`Unknown city in fixture list: ${city}`);
  return s;
};

console.log('='.repeat(78));
console.log('PART 1 — SUNSET  (authority: USNO for most, HMNAO for UK/Iceland)');
console.log('='.repeat(78));
console.log('Read the "Sunset" row. Record local clock time as HH:MM.');
console.log('Set authority to HMNAO for Bedford, London and Reykjavík; USNO otherwise.\n');

SUNSET_FIXTURES.forEach((f, i) => {
  const s = site(f.city);
  const off = tzOffsetHours(f.dateStr, s.tz);
  const url =
    `https://aa.usno.navy.mil/api/rstt/oneday?date=${f.dateStr}` +
    `&coords=${s.lat.toFixed(4)},${s.lon.toFixed(4)}&tz=${off}`;
  const status = f.value === null ? 'NEEDED' : `have ${f.value}`;
  console.log(`${String(i + 1).padStart(2)}. ${f.city} ${f.dateStr}  [${status}]`);
  console.log(`    ${url}\n`);
});

console.log('='.repeat(78));
console.log('PART 2 — SUN & MOON APPARENT ECLIPTIC LONGITUDE  (JPL Horizons, DE440)');
console.log('='.repeat(78));
console.log('These validate tithi, nakshatra and Sankranti at the root: all three are');
console.log('functions of these two longitudes, so citing them cites all three.\n');
console.log('*** READ THIS BEFORE COPYING ANY NUMBER ***');
console.log('Record the APPARENT value (ecliptic OF DATE), not astrometric.');
console.log('They differ by aberration, ~20.5" for the Sun = 0.0057 deg.');
console.log('The Sankranti budget is 0.0034 deg — the difference is LARGER than the');
console.log('tolerance, so the wrong column injects more error than we are measuring,');
console.log("while still looking like a real citation. Set frame: 'apparent'.\n");
console.log("QUANTITIES='31' returns ObsEcLon / ObsEcLat. Take ObsEcLon, in degrees.");
console.log("COMMAND='10' is the Sun; COMMAND='301' is the Moon.");
console.log("CENTER='500@399' is geocentric, matching computeAstronomy().\n");

const horizons = (command: string, instantUtc: string) => {
  // Horizons TLIST wants 'YYYY-MMM-DD HH:MM:SS'-ish; ISO with a space works.
  const t = instantUtc.replace('T', ' ').replace('Z', '');
  return (
    'https://ssd.jpl.nasa.gov/api/horizons.api?format=text' +
    `&COMMAND='${command}'` +
    "&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'" +
    "&CENTER='500@399'" +
    `&TLIST='${t}'` +
    "&QUANTITIES='31'"
  );
};

LONGITUDE_FIXTURES.forEach((f, i) => {
  const status = f.source === null ? 'NEEDED' : 'have';
  console.log(`${String(i + 1).padStart(2)}. ${f.instantUtc}  [${status}]`);
  console.log(`    Sun : ${horizons('10', f.instantUtc)}`);
  console.log(`    Moon: ${horizons('301', f.instantUtc)}\n`);
});

const sunsetNeeded = SUNSET_FIXTURES.filter(f => f.source === null).length;
const lonNeeded = LONGITUDE_FIXTURES.filter(f => f.source === null).length;
console.log('='.repeat(78));
console.log(`Outstanding: ${sunsetNeeded} sunset readings, ${lonNeeded} longitude instants`);
console.log(`(each longitude instant needs BOTH the Sun and the Moon URL)`);
console.log('='.repeat(78));
