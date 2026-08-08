/**
 * Measures our ephemeris truncation error against the §1.2 tolerance budgets.
 *
 * WHY THIS IS NOT A SELF-COMPARISON
 * ---------------------------------
 * Our engine calls astronomia's LOW-precision series:
 *   Sun  -> solar.apparentLongitude   (Meeus ch. 25 truncated)
 *   Moon -> moonposition.position     (Meeus ch. 47, ~10" claimed)
 *
 * astronomia ALSO ships, with data files already installed:
 *   Sun  -> solar.apparentVSOP87      (full VSOP87)
 *   Moon -> elp.position              (ELP/MPP02)
 *
 * These are genuinely different computations, not the same code called twice, so
 * the difference is a real measurement of our truncation error. It is NOT external
 * validation and cannot close tracker 4.3 — for that the reference must come from
 * outside our dependency tree (USNO / JPL Horizons), read by a person.
 *
 * What this DOES answer: are we inside our own stated budgets?
 *
 *   Sankranti  0.0034 deg  (12.2")   solar longitude
 *   Nakshatra  0.017  deg  (61.2")   sidereal longitude
 *   Tithi      0.0085 deg  (30.6")   elongation
 *
 * Run: npx tsx scripts/measure-ephemeris-floor.ts
 */
import solar from 'astronomia/solar';
import moonposition from 'astronomia/moonposition';
import planetposition from 'astronomia/planetposition';
import elp from 'astronomia/elp';
import nutation from 'astronomia/nutation';
import julian from 'astronomia/julian';
import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import elpMppDe from 'astronomia/data/elpMppDe';

const DEG = 180 / Math.PI;
const earth = new planetposition.Planet(vsop87Bearth as any);
const moonElp = new elp.Moon(elpMppDe as any);

const norm = (d: number) => ((d % 360) + 360) % 360;
const signedDelta = (a: number, b: number) => {
  const d = norm(a - b);
  return d > 180 ? d - 360 : d;
};

const INSTANTS = [
  '2026-01-01T00:00:00Z', '2026-03-20T00:00:00Z', '2026-05-16T20:01:58Z',
  '2026-06-15T02:54:50Z', '2026-06-21T00:00:00Z', '2026-09-22T00:00:00Z',
  '2026-12-21T00:00:00Z', '2027-01-01T00:00:00Z', '2027-06-21T00:00:00Z',
  '2028-03-20T00:00:00Z', '2028-08-13T00:00:00Z', '2028-12-21T00:00:00Z',
];

const BUDGET = { solar: 0.0034, sidereal: 0.017, elongation: 0.0085 };

interface Row { instant: string; dSun: number; dMoon: number; dElong: number; }
const rows: Row[] = [];

for (const iso of INSTANTS) {
  const date = new Date(iso);
  const jde = julian.DateToJDE(date);
  const t = (jde - 2451545.0) / 36525.0;

  // --- what the engine uses today ---
  const sunLow = norm(solar.apparentLongitude(t) * DEG);
  const [deltaPsi] = nutation.nutation(jde);
  const moonLow = norm((moonposition.position(jde).lon + deltaPsi) * DEG);

  // --- astronomia's high-precision paths ---
  // apparentVSOP87 already includes aberration + nutation in longitude.
  const sunHigh = norm(solar.apparentVSOP87(earth, jde).lon * DEG);
  // ELP returns geometric mean-equinox-of-date longitude; add nutation to match
  // the "apparent" convention used above.
  const moonHigh = norm((moonElp.position(jde).lon + deltaPsi) * DEG);

  rows.push({
    instant: iso,
    dSun: signedDelta(sunLow, sunHigh),
    dMoon: signedDelta(moonLow, moonHigh),
    dElong: signedDelta(norm(moonLow - sunLow), norm(moonHigh - sunHigh)),
  });
}

const arcsec = (deg: number) => deg * 3600;
const fmt = (deg: number) => `${deg >= 0 ? '+' : ''}${deg.toFixed(6)}° (${arcsec(deg).toFixed(1)}")`;

console.log('\nEphemeris truncation: engine (Meeus, low-precision) vs astronomia high-precision');
console.log('Sun : solar.apparentLongitude  vs  solar.apparentVSOP87');
console.log('Moon: moonposition.position    vs  elp.position (ELP/MPP02)\n');
console.log('| Instant                | ΔSun                    | ΔMoon                   | ΔElongation             |');
console.log('|------------------------|-------------------------|-------------------------|-------------------------|');
for (const r of rows) {
  console.log(
    `| ${r.instant} | ${fmt(r.dSun).padEnd(23)} | ${fmt(r.dMoon).padEnd(23)} | ${fmt(r.dElong).padEnd(23)} |`
  );
}

const maxAbs = (f: (r: Row) => number) => Math.max(...rows.map(r => Math.abs(f(r))));
const mSun = maxAbs(r => r.dSun);
const mMoon = maxAbs(r => r.dMoon);
const mElong = maxAbs(r => r.dElong);

console.log('\nWorst case vs the §1.2 budget it feeds:\n');
const verdict = (label: string, worst: number, budget: number, feeds: string) => {
  const ratio = worst / budget;
  const ok = worst <= budget;
  console.log(
    `  ${label.padEnd(12)} worst ${arcsec(worst).toFixed(1).padStart(7)}"  ` +
      `budget ${arcsec(budget).toFixed(1).padStart(6)}"  ` +
      `${ok ? 'WITHIN' : 'EXCEEDS'} (${ratio.toFixed(2)}x)   -> ${feeds}`
  );
  return ok;
};

const okSun = verdict('Solar', mSun, BUDGET.solar, 'Sankranti instant');
const okMoon = verdict('Lunar', mMoon, BUDGET.sidereal, 'nakshatra boundary');
const okElong = verdict('Elongation', mElong, BUDGET.elongation, 'tithi boundary');

console.log('');
if (okSun && okMoon && okElong) {
  console.log('All three inside budget. The low-precision series is adequate for our tolerances.');
} else {
  console.log('AT LEAST ONE QUANTITY IS OUTSIDE ITS OWN STATED BUDGET.');
  console.log('astronomia already ships the higher-precision path with its data files,');
  console.log('so this is a switch we can make, not a limit we have to accept.');
}
console.log('\nThis is a truncation measurement, NOT external validation.');
console.log('4.3 still needs USNO / JPL values read by a person.\n');
