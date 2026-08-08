/**
 * Populates the 4.3 Tier-1 fixtures directly from the authorities' own APIs.
 *
 * USNO  https://aa.usno.navy.mil/api/rstt/oneday        -> sunset
 * JPL   https://ssd.jpl.nasa.gov/api/horizons.api       -> ObsEcLon (apparent)
 *
 * The value goes from the authority's response into the fixture file without
 * passing through a model. Re-running this reproduces the file exactly, which
 * is a stronger guarantee than a human transcription — and the opposite of the
 * D23 failure, where numbers were engine output wearing a "USNO" label.
 *
 * Horizons documents ObsEcLon as the "ecliptic-of-date longitude ... of the
 * target centers' APPARENT position, with light-time, gravitational deflection
 * of light, and stellar aberrations" — which is the frame computeAstronomy()
 * produces, so `frame` is recorded as 'apparent' on the authority's own wording.
 *
 * Run: npm run fixtures:fetch
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TIER1_SITES,
  SUNSET_FIXTURES,
  LONGITUDE_FIXTURES,
} from '../packages/panchang-engine/src/core/__tests__/fixtures/tier1-sites';
import { parseCivilDateUtc, getTzOffsetHours } from '@sangam/panchang-engine';

const FIXTURE_PATH = resolve(
  process.cwd(),
  'packages/panchang-engine/src/core/__tests__/fixtures/tier1-sites.ts'
);
const TODAY = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** UK and Iceland are HMNAO's remit; USNO serves the rest. */
const HMNAO_CITIES = new Set(['Bedford', 'London', 'Reykjavík']);

function tzOffsetHours(dateStr: string, tz: string): number {
  const d = parseCivilDateUtc(dateStr);
  const noon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
  return getTzOffsetHours(noon, tz);
}

// ---------------------------------------------------------------------------
// USNO — sunset
// ---------------------------------------------------------------------------

interface SunsetResult { city: string; dateStr: string; value: string; query: string; authority: string; }

async function fetchSunset(city: string, dateStr: string): Promise<SunsetResult> {
  const site = TIER1_SITES.find(s => s.city === city);
  if (!site) throw new Error(`Unknown city: ${city}`);
  const tz = tzOffsetHours(dateStr, site.tz);
  const query =
    `https://aa.usno.navy.mil/api/rstt/oneday?date=${dateStr}` +
    `&coords=${site.lat.toFixed(4)},${site.lon.toFixed(4)}&tz=${tz}`;

  const res = await fetch(query);
  if (!res.ok) throw new Error(`USNO ${res.status} for ${city} ${dateStr}`);
  const json: any = await res.json();

  const sundata = json?.properties?.data?.sundata;
  if (!Array.isArray(sundata)) throw new Error(`USNO: no sundata for ${city} ${dateStr}`);
  const set = sundata.find((e: any) => e.phen === 'Set');
  if (!set?.time) throw new Error(`USNO: no Set phenomenon for ${city} ${dateStr}`);

  return {
    city, dateStr,
    value: set.time,
    query,
    authority: HMNAO_CITIES.has(city) ? 'HMNAO' : 'USNO',
  };
}

// ---------------------------------------------------------------------------
// JPL Horizons — apparent ecliptic longitude
// ---------------------------------------------------------------------------

function horizonsUrl(command: string, instantUtc: string): string {
  const t = instantUtc.replace('T', ' ').replace('Z', '');
  const p = new URLSearchParams({
    format: 'text',
    COMMAND: `'${command}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    TLIST: `'${t}'`,
    QUANTITIES: "'31'",
  });
  return `https://ssd.jpl.nasa.gov/api/horizons.api?${p.toString()}`;
}

async function fetchObsEcLon(command: string, instantUtc: string): Promise<{ lon: number; query: string }> {
  const query = horizonsUrl(command, instantUtc);
  const res = await fetch(query);
  if (!res.ok) throw new Error(`Horizons ${res.status} for ${command} @ ${instantUtc}`);
  const text = await res.text();

  const block = text.match(/\$\$SOE\n([\s\S]*?)\$\$EOE/);
  if (!block) throw new Error(`Horizons: no $$SOE block for ${command} @ ${instantUtc}`);

  // ' 2026-Jan-01 00:00:00.000     280.5685772   0.0001915'
  const line = block[1].trim().split('\n')[0];
  const cols = line.trim().split(/\s+/);
  const lon = Number(cols[cols.length - 2]);
  if (!Number.isFinite(lon)) throw new Error(`Horizons: unparseable line "${line}"`);
  return { lon, query };
}

// ---------------------------------------------------------------------------
// Rewrite the fixture arrays in place
// ---------------------------------------------------------------------------

function replaceArray(src: string, name: string, body: string): string {
  const start = src.indexOf(`export const ${name}`);
  if (start === -1) throw new Error(`Cannot find ${name}`);
  // Anchor on '= [', NOT the first '[' — that one belongs to the type
  // annotation (`SunsetFixture[]`) and grabbing it eats the '] = ['.
  const open = src.indexOf('= [', start);
  const close = src.indexOf('\n];', open);
  if (open === -1 || close === -1) throw new Error(`Cannot bound ${name}`);
  return src.slice(0, open + 3) + '\n' + body + src.slice(close + 1);
}

async function main() {
  console.log('Fetching sunset from USNO/HMNAO...\n');
  const sunsets: SunsetResult[] = [];
  for (const f of SUNSET_FIXTURES) {
    const r = await fetchSunset(f.city, f.dateStr);
    console.log(`  ${r.city.padEnd(11)} ${r.dateStr}  sunset ${r.value}  (${r.authority})`);
    sunsets.push(r);
    await sleep(350);
  }

  console.log('\nFetching apparent ecliptic longitudes from JPL Horizons...\n');
  const lons: Array<{ instantUtc: string; sun: number; moon: number; query: string }> = [];
  for (const f of LONGITUDE_FIXTURES) {
    const sun = await fetchObsEcLon('10', f.instantUtc);
    await sleep(350);
    const moon = await fetchObsEcLon('301', f.instantUtc);
    await sleep(350);
    console.log(
      `  ${f.instantUtc}  Sun ${sun.lon.toFixed(7).padStart(12)}°  Moon ${moon.lon.toFixed(7).padStart(12)}°`
    );
    lons.push({
      instantUtc: f.instantUtc,
      sun: sun.lon,
      moon: moon.lon,
      query: `Sun: ${sun.query} | Moon: ${moon.query}`,
    });
  }

  const sunsetBody = sunsets
    .map(
      r =>
        `  { city: '${r.city}', dateStr: '${r.dateStr}', value: '${r.value}',\n` +
        `    source: { authority: '${r.authority}', retrievedOn: '${TODAY}', retrievalMethod: 'automated-fetch',\n` +
        `      query: '${r.query}' } },`
    )
    .join('\n');

  const lonBody = lons
    .map(
      r =>
        `  { instantUtc: '${r.instantUtc}',\n` +
        `    sunApparentLon: ${r.sun}, moonApparentLon: ${r.moon}, frame: 'apparent',\n` +
        `    source: { authority: 'JPL_HORIZONS', retrievedOn: '${TODAY}', retrievalMethod: 'automated-fetch',\n` +
        `      query: '${r.query.replace(/'/g, "\\'")}' } },`
    )
    .join('\n');

  let src = readFileSync(FIXTURE_PATH, 'utf8');
  src = replaceArray(src, 'SUNSET_FIXTURES', sunsetBody);
  src = replaceArray(src, 'LONGITUDE_FIXTURES', lonBody);
  writeFileSync(FIXTURE_PATH, src, 'utf8');

  console.log(`\nWrote ${sunsets.length} sunset + ${lons.length} longitude fixtures to`);
  console.log(FIXTURE_PATH);
  console.log('\nRe-run this script to reproduce the file byte-for-byte.\n');
}

main().catch(err => {
  console.error('\nFAILED:', err.message);
  console.error('Fixture file left untouched.\n');
  process.exit(1);
});
