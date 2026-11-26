// Pure helpers for the homepage moon hero (scripts/moon-hero/scene.ts).
//
// Only astronomy is computed here: how far the Moon is from the Sun, and from that how much of it
// is lit and whether it is waxing. No tithi, observance or date is derived from it. The tithi
// names below label an illustrated month and are never presented as today's tithi (AGENTS.md,
// Calendar Governance).

const DEG = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

/**
 * Moon-Sun elongation in degrees (0 = new moon, 180 = full moon), from the low-precision Sun and
 * Moon longitudes (main periodic terms of Meeus, Astronomical Algorithms, ch. 25 and 47).
 * Good to well under a degree, which is enough for a picture of the phase.
 */
export function moonElongationDeg(date: Date): number {
  const d = date.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545.0; // days since J2000.0
  const g = norm360(357.528 + 0.9856003 * d); // Sun's mean anomaly
  const sunMean = norm360(280.46 + 0.9856474 * d);
  const sun = sunMean + 1.915 * Math.sin(g * DEG) + 0.02 * Math.sin(2 * g * DEG);
  const L = norm360(218.316 + 13.176396 * d);
  const Mp = norm360(134.963 + 13.064993 * d);
  const D = norm360(297.85 + 12.190749 * d);
  const F = norm360(93.272 + 13.22935 * d);
  const moon =
    L +
    6.289 * Math.sin(Mp * DEG) +
    1.274 * Math.sin((2 * D - Mp) * DEG) +
    0.658 * Math.sin(2 * D * DEG) +
    0.214 * Math.sin(2 * Mp * DEG) -
    0.186 * Math.sin(g * DEG) -
    0.114 * Math.sin(2 * F * DEG);
  return norm360(moon - sun);
}

/** Fraction of the disc that is lit, 0..1. */
export function illuminatedFraction(elongationDeg: number): number {
  return (1 - Math.cos(elongationDeg * DEG)) / 2;
}

export function isWaxing(elongationDeg: number): boolean {
  const e = norm360(elongationDeg);
  return e > 0 && e < 180;
}

const TITHI = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
  'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
] as const;

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

/**
 * Name of the lunar day at position 0..29 of the illustrated month (0 = Shukla Pratipada,
 * 14 = Purnima, 29 = Amavasya), with a plain-English line under it.
 */
export function tithiLabel(index: number): { name: string; line: string } {
  if (!Number.isInteger(index) || index < 0 || index > 29) throw new RangeError(`tithi index ${index}`);
  const waxing = index < 15;
  const k = index % 15;
  const name = k === 14 ? (waxing ? 'Purnima' : 'Amavasya') : `${waxing ? 'Shukla' : 'Krishna'} ${TITHI[k]}`;
  return { name, line: `the ${ordinal(k + 1)} lunar day, ${waxing ? 'waxing' : 'waning'}` };
}

/** Where the illustrated month is at scroll progress p: a thin crescent, Shukla Ekadashi at 2/3, Purnima at the end. */
export function illustratedFraction(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return 0.1 + 0.385 * t;
}

/** Lunar-day position (0..29) for a fraction of the month (0..1). */
export function tithiIndexForFraction(fraction: number): number {
  const f = ((fraction % 1) + 1) % 1;
  return Math.min(29, Math.floor(f * 30));
}
