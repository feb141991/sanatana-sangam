import {
  computeAstronomy,
  getKaranaName,
  getSunriseForDateStr,
  getMuhurtaWindows,
  solveNextBoundary,
} from '@sangam/panchang-engine';

export type HoliLocation = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export const HOLI_LOCATIONS: HoliLocation[] = [
  { name: 'ujjain', latitude: 23.1765, longitude: 75.7885, timezone: 'Asia/Kolkata' },
  { name: 'kolkata', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'delhi', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
];

export const PRADOSHA_LENGTHS_MINUTES = [48, 72, 144] as const;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const HOLI_SEARCH_SEEDS: Record<number, string> = {
  2026: '2026-03-03T12:00:00Z',
  2027: '2027-03-22T12:00:00Z',
  2028: '2028-03-11T12:00:00Z',
  2029: '2029-02-28T12:00:00Z',
  2030: '2030-03-19T12:00:00Z',
};

function angularDelta(value: number, target: number): number {
  return ((value - target + 540) % 360) - 180;
}

function bisectBoundary(left: Date, right: Date, target: number): Date {
  let lo = left.getTime();
  let hi = right.getTime();
  const loSign = Math.sign(angularDelta(computeAstronomy(new Date(lo)).elongation, target));
  for (let i = 0; i < 45; i += 1) {
    const mid = (lo + hi) / 2;
    const midSign = Math.sign(angularDelta(computeAstronomy(new Date(mid)).elongation, target));
    if (midSign === loSign) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

/** Finds an astronomical elongation crossing without using formatted tithi strings. */
export function findBoundaryAround(date: Date, target: number, direction: 'before' | 'after'): Date {
  const step = direction === 'before' ? -HOUR : HOUR;
  let right = date;
  let rightDelta = angularDelta(computeAstronomy(right).elongation, target);
  for (let i = 0; i < 240; i += 1) {
    const left = new Date(right.getTime() + step);
    const leftDelta = angularDelta(computeAstronomy(left).elongation, target);
    if (leftDelta === 0 || Math.sign(leftDelta) !== Math.sign(rightDelta)) {
      return direction === 'before'
        ? bisectBoundary(left, right, target)
        : bisectBoundary(right, left, target);
    }
    right = left;
    rightDelta = leftDelta;
  }
  throw new Error(`Could not find ${direction} crossing for elongation ${target}`);
}

export function findPurnimaInterval(anchor: Date): { startsAt: Date; endsAt: Date } {
  const currentElongation = computeAstronomy(anchor).elongation;
  return {
    startsAt: findBoundaryAround(anchor, 168, 'before'),
    endsAt: findBoundaryAround(anchor, 180, currentElongation >= 180 ? 'before' : 'after'),
  };
}

function isVishtiAt(date: Date): boolean {
  return getKaranaName(Math.floor(computeAstronomy(date).elongation / 6) + 1) === 'Vishti';
}

export function findVishtiIntervals(anchor: Date): Array<{ startsAt: Date; endsAt: Date }> {
  const intervals: Array<{ startsAt: Date; endsAt: Date }> = [];
  let cursor = new Date(anchor.getTime() - 3 * DAY);
  const end = new Date(anchor.getTime() + 3 * DAY);
  let previous = isVishtiAt(cursor);
  let intervalStart = previous ? cursor : null;

  while (cursor < end) {
    const next = new Date(cursor.getTime() + 15 * 60 * 1000);
    const current = isVishtiAt(next);
    if (current !== previous) {
      const target = Math.round(computeAstronomy(next).elongation / 6) * 6;
      const boundary = bisectBoundary(cursor, next, target % 360);
      if (current) intervalStart = boundary;
      else if (intervalStart) {
        intervals.push({ startsAt: intervalStart, endsAt: boundary });
        intervalStart = null;
      }
    }
    cursor = next;
    previous = current;
  }
  return intervals;
}

export function overlaps(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date; endsAt: Date }): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

function shiftCivilDate(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function minutesOverlap(
  a: { startsAt: Date; endsAt: Date },
  b: { startsAt: Date; endsAt: Date },
): number {
  const start = Math.max(a.startsAt.getTime(), b.startsAt.getTime());
  const end = Math.min(a.endsAt.getTime(), b.endsAt.getTime());
  return Math.max(0, (end - start) / 60_000);
}

export function auditHoliYear(year: number, location: HoliLocation, pradoshaMinutes: number) {
  const anchor = new Date(HOLI_SEARCH_SEEDS[year]);
  const purnima = findPurnimaInterval(anchor);
  const localPurnimaDate = new Intl.DateTimeFormat('en-CA', { timeZone: location.timezone }).format(
    new Date((purnima.startsAt.getTime() + purnima.endsAt.getTime()) / 2),
  );
  const locationInput = { lat: location.latitude, lon: location.longitude, tz: location.timezone };
  const sunriseCandidates = [-1, 0, 1].map((offset) => {
    const civilDate = shiftCivilDate(localPurnimaDate, offset);
    return { civilDate, ...getSunriseForDateStr(civilDate, locationInput) };
  });
  const sunriseCandidate = sunriseCandidates.find(
    (candidate) => candidate.sunrise >= purnima.startsAt && candidate.sunrise < purnima.endsAt,
  );
  const sunriseDate = sunriseCandidate?.civilDate ?? null;
  const vishti = findVishtiIntervals(anchor);
  const startCivilDate = new Intl.DateTimeFormat('en-CA', { timeZone: location.timezone }).format(purnima.startsAt);
  const endCivilDate = new Intl.DateTimeFormat('en-CA', { timeZone: location.timezone }).format(purnima.endsAt);
  const civilDays: Array<Record<string, unknown>> = [];
  for (let civilDate = startCivilDate; civilDate <= endCivilDate; civilDate = shiftCivilDate(civilDate, 1)) {
    const day = getSunriseForDateStr(civilDate, locationInput);
    const muhurta = getMuhurtaWindows(new Date(`${civilDate}T12:00:00Z`), location.latitude, location.longitude, location.timezone);
    if (!muhurta.ok) throw new Error(`No muhurta windows for ${year}/${civilDate} at ${location.name}: ${muhurta.reason}`);
    const pradosha = {
      name: 'Pradosha',
      start: muhurta.sunset,
      end: new Date(muhurta.sunset.getTime() + pradoshaMinutes * 60_000),
    };
    const pradoshaInterval = { startsAt: pradosha.start, endsAt: pradosha.end };
    const purnimaOverlapMinutes = minutesOverlap(purnima, pradoshaInterval);
    const vishtiAtPradosha = vishti.filter((interval) => overlaps(interval, pradoshaInterval));
    const bhadraOverlapMinutes = vishtiAtPradosha.reduce(
      (total, interval) => total + minutesOverlap(interval, pradoshaInterval),
      0,
    );
    const windowMinutes = (pradosha.end.getTime() - pradosha.start.getTime()) / 60_000;
    const bhadraCoversPradosha = bhadraOverlapMinutes >= windowMinutes - 0.01;
    const outcome = purnimaOverlapMinutes === 0
      ? 'not_eligible_no_purnima_at_pradosha'
      : bhadraCoversPradosha
        ? 'authority_decision_bhadra_covers_pradosha'
        : bhadraOverlapMinutes > 0
          ? 'authority_decision_bhadra_intersects_pradosha'
          : 'computed_candidate_purnima_at_pradosha';
    civilDays.push({
      civilDate,
      sunset: muhurta.sunset,
      pradosha,
      sunrise: day.sunrise,
      purnimaOverlapMinutes,
      bhadraSpans: vishtiAtPradosha,
      bhadraOverlapMinutes,
      bhadraCoversPradosha,
      pradoshaMinutes: windowMinutes,
      outcome,
    });
  }
  const eligibleDays = civilDays.filter((day) => day.outcome !== 'not_eligible_no_purnima_at_pradosha');

  return {
    year,
    location: location.name,
    purnima,
    vishti,
    sunriseDate,
    civilDays,
    eligibleDays,
  };
}

if (process.argv[1]?.endsWith('holi-window-audit.mts')) {
  for (const year of [2026, 2027, 2028, 2029, 2030]) {
    for (const location of HOLI_LOCATIONS) {
      for (const pradoshaMinutes of PRADOSHA_LENGTHS_MINUTES) {
        const result = auditHoliYear(year, location, pradoshaMinutes);
        console.log(JSON.stringify({
          ...result,
          computed: true,
          note: 'Computed from astronomical elongation and engine windows; not independently verified.',
        }));
      }
    }
  }
}
