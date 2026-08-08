/**
 * Does the ephemeris truncation actually MOVE a date?
 *
 * `measure-ephemeris-floor.ts` shows our solar series is 2.23x outside the §1.2
 * Sankranti budget and elongation is 1.08x outside the tithi budget. That is a
 * statement about longitudes. This script answers the question that matters:
 * does it change the tithi / nakshatra / rashi actually recorded for a day?
 *
 * Uses the same evaluation instant the rule engine uses (01:00 UTC, ~Ujjain
 * sunrise) for every day of 2026-2028, and compares the indices derived from the
 * low-precision series against the high-precision ones.
 *
 * Run: npx tsx scripts/measure-ephemeris-date-impact.ts
 */
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import planetposition from 'astronomia/planetposition';
import elp from 'astronomia/elp';
import nutation from 'astronomia/nutation';
import julian from 'astronomia/julian';
import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import elpMppDe from 'astronomia/data/elpMppDe';
import { lahiriAyanamsha } from '../packages/panchang-engine/src/core/astronomy';

const DEG = 180 / Math.PI;
const earth = new planetposition.Planet(vsop87Bearth as any);
const moonElp = new elp.Moon(elpMppDe as any);
const norm = (d: number) => ((d % 360) + 360) % 360;

interface Indices { tithi: number; nakshatra: number; sunRashi: number; yoga: number; }

function indicesLow(jde: number): Indices {
  const t = (jde - 2451545.0) / 36525.0;
  const [dPsi] = nutation.nutation(jde);
  const sun = norm(solar.apparentLongitude(t) * DEG);
  const moon = norm((moonposition.position(jde).lon + dPsi) * DEG);
  return derive(sun, moon, jde);
}

function indicesHigh(jde: number): Indices {
  const [dPsi] = nutation.nutation(jde);
  const sun = norm(solar.apparentVSOP87(earth, jde).lon * DEG);
  const moon = norm((moonElp.position(jde).lon + dPsi) * DEG);
  return derive(sun, moon, jde);
}

function derive(sunTropical: number, moonTropical: number, jde: number): Indices {
  const ay = lahiriAyanamsha(jde);
  const elongation = norm(moonTropical - sunTropical);
  const moonSid = norm(moonTropical - ay);
  const sunSid = norm(sunTropical - ay);
  return {
    tithi: Math.floor(elongation / 12),
    nakshatra: Math.floor(moonSid / (360 / 27)),
    sunRashi: Math.floor(sunSid / 30),
    yoga: Math.floor(norm(sunSid + moonSid) / (360 / 27)),
  };
}

const diffs = { tithi: 0, nakshatra: 0, sunRashi: 0, yoga: 0 };
const examples: string[] = [];
let days = 0;

for (const year of [2026, 2027, 2028]) {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const n = isLeap ? 366 : 365;
  for (let i = 0; i < n; i++) {
    // Exactly the instant precomputePanchangForYear uses.
    const date = new Date(Date.UTC(year, 0, i + 1, 1, 0, 0));
    const jde = julian.DateToJDE(date);
    const lo = indicesLow(jde);
    const hi = indicesHigh(jde);
    days++;

    const iso = date.toISOString().slice(0, 10);
    if (lo.tithi !== hi.tithi) {
      diffs.tithi++;
      if (examples.length < 12) examples.push(`${iso}  tithi     ${lo.tithi} -> ${hi.tithi}`);
    }
    if (lo.nakshatra !== hi.nakshatra) {
      diffs.nakshatra++;
      if (examples.length < 12) examples.push(`${iso}  nakshatra ${lo.nakshatra} -> ${hi.nakshatra}`);
    }
    if (lo.sunRashi !== hi.sunRashi) {
      diffs.sunRashi++;
      if (examples.length < 12) examples.push(`${iso}  sunRashi  ${lo.sunRashi} -> ${hi.sunRashi}`);
    }
    if (lo.yoga !== hi.yoga) {
      diffs.yoga++;
      if (examples.length < 12) examples.push(`${iso}  yoga      ${lo.yoga} -> ${hi.yoga}`);
    }
  }
}

console.log(`\nEphemeris switch impact, ${days} days across 2026-2028`);
console.log('(evaluated at 01:00 UTC — the same instant the rule engine uses)\n');
console.log('| Quantity  | Days changed | % of days |');
console.log('|-----------|--------------|-----------|');
for (const [k, v] of Object.entries(diffs)) {
  console.log(`| ${k.padEnd(9)} | ${String(v).padStart(12)} | ${((v / days) * 100).toFixed(2).padStart(8)}% |`);
}

if (examples.length) {
  console.log('\nFirst changes:');
  for (const e of examples) console.log(`  ${e}`);
} else {
  console.log('\nNo index changes on any day. The truncation is real in longitude but');
  console.log('never large enough to move a recorded tithi/nakshatra/rashi/yoga at the');
  console.log('evaluation instant, so switching the ephemeris would not move a date.');
}

const total = Object.values(diffs).reduce((a, b) => a + b, 0);
console.log(
  total === 0
    ? '\nVERDICT: switching is behaviour-preserving at the evaluation instant.\n'
    : `\nVERDICT: switching changes ${total} recorded index values. This is a [C] change\n` +
        '(conventions §1.2 / AGENTS.md rule 8): ADR update, version bump, re-materialisation\n' +
        'and a golden re-run before it can land.\n'
);
