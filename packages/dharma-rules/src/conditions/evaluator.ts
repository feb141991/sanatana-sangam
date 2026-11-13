import {
  calculatePanchang as calculatePanchangUncached,
  formatCivilDateInTz,
  parseCivilDateUtc,
  offsetCivilDateStr,
  getTzOffsetHours,
  LocationInput,
  getLunarMonth as getLunarMonthUncached,
  computeAstronomy,
  getKaranaName,
} from '../../../panchang-engine/src/index.js';
import { getSunriseSunset } from '../../../panchang-engine/src/core/astronomy.js';
import { getMoonRiseSet } from '../../../panchang-engine/src/core/moon-rise-set.js';

/**
 * `calculatePanchang`/`getLunarMonth` each run an astronomy bisection solver
 * (~100ms+ per call). A single `evaluateVariant` call evaluates several
 * conditions (paksha, tithi, lunar_month, ...) against the SAME civil date --
 * and `calculateOccurrencesWithEvaluator` re-evaluates overlapping ±window-day
 * ranges across every variant of a rule, so the same (instant, location)
 * combination is recomputed dozens of times. Both are pure given their inputs,
 * so a bounded memo removes duplicate solver runs without changing results.
 * The limit prevents long-lived server processes from retaining every
 * date/location combination they have ever evaluated.
 */
const EVALUATOR_CACHE_LIMIT = 4096;

function memoizeBounded<T>(cache: Map<string, T>, key: string, compute: () => T): T {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const result = compute();
  cache.set(key, result);
  if (cache.size > EVALUATOR_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  return result;
}

const panchangCache = new Map<string, ReturnType<typeof calculatePanchangUncached>>();
function calculatePanchang(instant: Date, lat: number, lon: number): ReturnType<typeof calculatePanchangUncached> {
  const key = `${instant.getTime()}|${lat}|${lon}`;
  return memoizeBounded(panchangCache, key, () => calculatePanchangUncached(instant, lat, lon));
}

const lunarMonthCache = new Map<string, ReturnType<typeof getLunarMonthUncached>>();
function getLunarMonth(
  instant: Date,
  system: Parameters<typeof getLunarMonthUncached>[1],
): ReturnType<typeof getLunarMonthUncached> {
  const key = `${instant.getTime()}|${system}`;
  return memoizeBounded(lunarMonthCache, key, () => getLunarMonthUncached(instant, system));
}

import {
  RuleCondition,
  ConditionEvaluationResult,
  VariantEvaluationResult,
  EvaluationReason,
  PeriodType,
  CONDITION_EVALUATOR_VERSION,
  TithiCondition,
  PakshaCondition,
  KaranaPresenceCondition,
  HolikaDahanCondition,
} from './types.js';


export { CONDITION_EVALUATOR_VERSION };

export interface PeriodWindow {
  name: PeriodType;
  start: Date;
  end: Date;
  diagnostics: string[];
}

/** Tithi names helper for reasons[] string formatting */
const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

export function getTithiName(tithiIndex: number): string {
  return TITHI_NAMES[(tithiIndex - 1) % 30] || `Tithi ${tithiIndex}`;
}

/**
 * Formats a UTC instant as "YYYY-MM-DD HH:MM" in the given IANA timezone.
 * Replaces the old pattern of formatCivilDateInTz(instant, tz) + ' ' + instant.toISOString().slice(11,16)
 * which mixed a local-date component with a UTC time component, yielding a hybrid that was
 * neither local time nor UTC. All characters come from the same timezone here.
 */
function formatInstantInTz(instant: Date, tz: string): string {
  try {
    return instant.toLocaleString('sv-SE', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    // Fallback to UTC if timezone is invalid
    return instant.toISOString().slice(0, 16).replace('T', ' ');
  }
}

const periodWindowCache = new Map<string, PeriodWindow | null>();

/** Computes the exact time window for a period on a civil date and location */
export function getPeriodWindow(
  period: PeriodType,
  civilDateStr: string,
  location: LocationInput
): PeriodWindow | null {
  const cacheKey = `${period}|${civilDateStr}|${location.lat}|${location.lon}|${location.tz}`;
  return memoizeBounded(
    periodWindowCache,
    cacheKey,
    () => computePeriodWindow(period, civilDateStr, location),
  );
}

function computePeriodWindow(
  period: PeriodType,
  civilDateStr: string,
  location: LocationInput
): PeriodWindow | null {
  const diagnostics: string[] = [];
  const sampleDate = parseCivilDateUtc(civilDateStr);
  const tzOffset = getTzOffsetHours(sampleDate, location.tz);

  const effLat = Math.abs(location.lat) >= 66.5 ? (location.lat >= 0 ? 60.0 : -60.0) : location.lat;
  if (Math.abs(location.lat) >= 66.5) {
    diagnostics.push('latitude_proxy');
  }

  const todayRiseSet = getSunriseSunset(effLat, location.lon, sampleDate, tzOffset);

  if (!todayRiseSet.sunrise || !todayRiseSet.sunset) {
    diagnostics.push('no_sunrise');
    return null;
  }

  const sunrise = todayRiseSet.sunrise;
  const sunset = todayRiseSet.sunset;

  // Next day sunrise for night muhurtas & ahoratra
  const nextCivilDate = offsetCivilDateStr(civilDateStr, 1);
  const nextSampleDate = parseCivilDateUtc(nextCivilDate);
  const nextRiseSet = getSunriseSunset(effLat, location.lon, nextSampleDate, tzOffset);
  const nextSunrise = nextRiseSet.sunrise || new Date(sunrise.getTime() + 86_400_000);

  const dayLengthMs = Math.max(0, sunset.getTime() - sunrise.getTime());
  const nightLengthMs = Math.max(0, nextSunrise.getTime() - sunset.getTime());

  if (nightLengthMs < 4 * 3600_000) {
    diagnostics.push('compressed_night');
  }

  const dayFifth = dayLengthMs / 5;
  const nightMuhurta = nightLengthMs / 15;

  let start: Date;
  let end: Date;

  switch (period) {
    case 'sunrise':
      start = sunrise;
      end = sunrise;
      break;
    case 'sunset':
      start = sunset;
      end = sunset;
      break;
    case 'moonrise': {
      const moon = getMoonRiseSet(sampleDate, location.lat, location.lon, location.tz);
      if (moon.ok && moon.moonrise) {
        start = moon.moonrise;
        end = moon.moonrise;
      } else {
        // Moonrise is absent on this civil date. Extend search to the following night.
        const nextDate = offsetCivilDateStr(civilDateStr, 1);
        const nextSampleDate = parseCivilDateUtc(nextDate);
        const nextMoon = getMoonRiseSet(nextSampleDate, location.lat, location.lon, location.tz);
        
        const nextRiseSet = getSunriseSunset(effLat, location.lon, nextSampleDate, tzOffset);
        const nextSunrise = nextRiseSet.sunrise || new Date(sunrise.getTime() + 86_400_000);

        if (nextMoon.ok && nextMoon.moonrise && nextMoon.moonrise.getTime() < nextSunrise.getTime()) {
          start = nextMoon.moonrise;
          end = nextMoon.moonrise;
          diagnostics.push('extended_moonrise');
        } else {
          diagnostics.push('no_moonrise');
          return null;
        }
      }
      break;
    }
    case 'moonset': {
      const moon = getMoonRiseSet(sampleDate, location.lat, location.lon, location.tz);
      if (!moon.ok || !moon.moonset) {
        diagnostics.push('no_moonset');
        return null;
      }
      start = moon.moonset;
      end = moon.moonset;
      break;
    }
    case 'nishita':
      start = new Date(sunset.getTime() + 7 * nightMuhurta);
      end = new Date(sunset.getTime() + 8 * nightMuhurta);
      break;
    case 'pradosha':
      start = sunset;
      end = new Date(sunset.getTime() + 72 * 60_000); // 3 ghatikas = 72 min
      break;
    case 'sayahna':
      // Sayahna is the final fifth of the local daytime, ending at sunset.
      start = new Date(sunrise.getTime() + 4 * dayFifth);
      end = sunset;
      break;
    case 'purvahna':
      // Purvahna is the first two fifths of daytime: pratah + sangava.
      start = sunrise;
      end = new Date(sunrise.getTime() + 2 * dayFifth);
      break;
    case 'madhyahna':
      start = new Date(sunrise.getTime() + 2 * dayFifth);
      end = new Date(sunrise.getTime() + 3 * dayFifth);
      break;
    case 'aparahna':
      start = new Date(sunrise.getTime() + 3 * dayFifth);
      end = new Date(sunrise.getTime() + 4 * dayFifth);
      break;
    case 'brahma_muhurta':
      start = new Date(nextSunrise.getTime() - 2 * nightMuhurta);
      end = new Date(nextSunrise.getTime() - 1 * nightMuhurta);
      break;
    case 'midday':
    case 'abhijit': {
      const noon = new Date((sunrise.getTime() + sunset.getTime()) / 2);
      start = new Date(noon.getTime() - 24 * 60_000);
      end = new Date(noon.getTime() + 24 * 60_000);
      break;
    }
    case 'arunodaya':
      start = new Date(sunrise.getTime() - 96 * 60_000);
      end = sunrise;
      break;
    default:
      start = sunrise;
      end = sunrise;
  }

  return {
    name: period,
    start,
    end,
    diagnostics,
  };
}

export function getWithinPakshaTithi(absoluteTithiIndex: number): { withinPakshaTithi: number; paksha: 'shukla' | 'krishna' } {
  const paksha: 'shukla' | 'krishna' = absoluteTithiIndex <= 15 ? 'shukla' : 'krishna';
  const withinPakshaTithi = absoluteTithiIndex <= 15 ? absoluteTithiIndex : absoluteTithiIndex - 15;
  return { withinPakshaTithi, paksha };
}

/**
 * Test whether an absolute tithi index (1..30 from panchang.tithiIndex) matches
 * a within-paksha target tithi (1..15) and optional paksha.
 *
 * Canonical scheme (documented in festival-rule-schema.md §3.1):
 *   - targetTithi must be in 1..15 (within-paksha).
 *   - Shukla: absolute 1..15, Krishna: absolute 16..30 mapped to 1..15.
 *   - When targetPaksha is omitted, the tithi is paksha-ambiguous and matches
 *     either paksha (e.g. recurring Ekadashi rules).
 *
 * The old `targetTithi > 15` escape hatch (which bypassed paksha-normalisation
 * and did a raw absolute-index comparison) has been removed. The evaluator's
 * condition vocabulary exclusively uses within-paksha tithi numbers qualified
 * by a paksha field; absolute indices 16..30 are an internal convention of the
 * legacy engine's rules.ts and do not appear in RuleCondition objects.
 */
export function isTithiMatching(
  absoluteTithiIndex: number,
  targetTithi: number,
  targetPaksha?: 'shukla' | 'krishna'
): boolean {
  if (targetTithi > 15) {
    console.warn(
      `[DEPRECATION WARNING] absolute tithi index ${targetTithi} was used in rule. Use within-paksha index (1..15) + explicit paksha instead. This fallback will be removed in v3.0.0.`
    );
    return absoluteTithiIndex === targetTithi;
  }
  const { withinPakshaTithi, paksha } = getWithinPakshaTithi(absoluteTithiIndex);
  if (targetPaksha) {
    return withinPakshaTithi === targetTithi && paksha === targetPaksha;
  }
  // Paksha-ambiguous: match if within-paksha number matches regardless of half
  return withinPakshaTithi === targetTithi;
}

function getAbsoluteTithiIndex(targetTithi: number, targetPaksha?: 'shukla' | 'krishna'): number[] {
  if (targetPaksha === 'shukla') return [targetTithi];
  if (targetPaksha === 'krishna') return [targetTithi + 15];
  return [targetTithi, targetTithi + 15];
}

/** True when a target tithi occurs anywhere in the forward sequence from start through end. */
function hasTithiInForwardInterval(start: number, end: number, targets: number[]): boolean {
  let current = start;
  for (let step = 0; step < 30; step += 1) {
    if (targets.includes(current)) return true;
    if (current === end) return false;
    current = (current % 30) + 1;
  }
  return false;
}

function isAbsoluteTithiSkipped(prev: number, curr: number, target: number): boolean {
  const p0 = prev - 1; // 0..29
  const c0 = curr - 1; // 0..29
  const t0 = target - 1; // 0..29
  return (p0 + 1) % 30 === t0 && (p0 + 2) % 30 === c0;
}

function getUnderlyingTithiVrddhiInfo(
  targetTithi: number,
  targetPaksha: 'shukla' | 'krishna' | undefined,
  civilDateStr: string,
  location: LocationInput
): { isVrddhi: boolean; sunrisesWithTithi: string[]; isFirstSunrise: boolean; isSecondSunrise: boolean } {
  const yesterdayDate = offsetCivilDateStr(civilDateStr, -1);
  const tomorrowDate = offsetCivilDateStr(civilDateStr, 1);

  const yesterdaySunriseWindow = getPeriodWindow('sunrise', yesterdayDate, location);
  const yesterdaySunrise = yesterdaySunriseWindow ? yesterdaySunriseWindow.start : parseCivilDateUtc(yesterdayDate);
  const yesterdayPanchang = calculatePanchang(yesterdaySunrise, location.lat, location.lon);

  const tomorrowSunriseWindow = getPeriodWindow('sunrise', tomorrowDate, location);
  const tomorrowSunrise = tomorrowSunriseWindow ? tomorrowSunriseWindow.start : parseCivilDateUtc(tomorrowDate);
  const tomorrowPanchang = calculatePanchang(tomorrowSunrise, location.lat, location.lon);

  const riseWindow = getPeriodWindow('sunrise', civilDateStr, location);
  const riseTime = riseWindow ? riseWindow.start : parseCivilDateUtc(civilDateStr);
  const todayPanchang = calculatePanchang(riseTime, location.lat, location.lon);

  const todayMatched = isTithiMatching(todayPanchang.tithiIndex, targetTithi, targetPaksha);
  const yesterdayMatched = isTithiMatching(yesterdayPanchang.tithiIndex, targetTithi, targetPaksha);
  const tomorrowMatched = isTithiMatching(tomorrowPanchang.tithiIndex, targetTithi, targetPaksha);

  if (todayMatched && (yesterdayMatched || tomorrowMatched)) {
    const sunrisesWithTithi = [];
    if (yesterdayMatched) sunrisesWithTithi.push(yesterdayDate);
    sunrisesWithTithi.push(civilDateStr);
    if (tomorrowMatched) sunrisesWithTithi.push(tomorrowDate);

    return {
      isVrddhi: true,
      sunrisesWithTithi,
      isFirstSunrise: tomorrowMatched && !yesterdayMatched,
      isSecondSunrise: yesterdayMatched && !tomorrowMatched,
    };
  }

  return { isVrddhi: false, sunrisesWithTithi: [], isFirstSunrise: false, isSecondSunrise: false };
}

/** Evaluates a single rule condition on a given civil date and location */
// ---------------------------------------------------------------------------
// Holika Dahan (approved 2026-11-11, founder approval; puccha length PROPOSED)
// ---------------------------------------------------------------------------

function signedElongationDiff(elongation: number, target: number): number {
  return ((elongation - target + 540) % 360) - 180;
}

/** First instant in [fromMs, toMs] at which the lunar elongation crosses `target` degrees upward. */
function findElongationUpwardCrossing(target: number, fromMs: number, toMs: number): number | null {
  const step = 6 * 3_600_000;
  let prevT = fromMs;
  let prevD = signedElongationDiff(computeAstronomy(new Date(prevT)).elongation, target);
  for (let t = fromMs + step; t <= toMs + step; t += step) {
    const d = signedElongationDiff(computeAstronomy(new Date(t)).elongation, target);
    if (prevD < 0 && d >= 0) {
      let lo = prevT;
      let hi = t;
      for (let i = 0; i < 24; i += 1) {
        const mid = (lo + hi) / 2;
        if (signedElongationDiff(computeAstronomy(new Date(mid)).elongation, target) < 0) lo = mid;
        else hi = mid;
      }
      return hi;
    }
    prevT = t;
    prevD = d;
  }
  return null;
}

export type HolikaDahanBranch = 'pradosha_no_bhadra' | 'bhadra_puccha' | 'unresolved';

export interface HolikaDahanResolution {
  dahanDate: string | null;
  branch: HolikaDahanBranch;
  purnimaStartUtc: string | null;
  bhadraEndUtc: string | null;
  purnimaEndUtc: string | null;
}

const holikaDahanCache = new Map<string, HolikaDahanResolution>();

/**
 * Resolves the Holika Dahan civil date for the Purnima near `civilDateStr`.
 * Purnima = elongation 168-180 deg; Bhadra (Vishti) = its first half, 168-174 deg.
 * Primary: the first civil day whose pradosha touches Purnima with no Bhadra in it.
 * Fallback (Bhadra covers a pradosha that Purnima touches): the Bhadra-puccha, the last
 * `pucchaMinutes` of Bhadra; the date is the local civil date of that instant.
 * Otherwise unresolved (no date is invented).
 */
export function resolveHolikaDahan(civilDateStr: string, location: LocationInput, pucchaMinutes = 72): HolikaDahanResolution {
  const cacheKey = `${civilDateStr}|${location.lat}|${location.lon}|${location.tz}|${pucchaMinutes}`;
  return memoizeBounded(holikaDahanCache, cacheKey, () => {
    const unresolved: HolikaDahanResolution = { dahanDate: null, branch: 'unresolved', purnimaStartUtc: null, bhadraEndUtc: null, purnimaEndUtc: null };
    const base = parseCivilDateUtc(civilDateStr).getTime();
    const from = base - 96 * 3_600_000;
    const to = base + 120 * 3_600_000;
    const t168 = findElongationUpwardCrossing(168, from, to);
    if (t168 === null) return unresolved;
    const t174 = findElongationUpwardCrossing(174, t168 - 6 * 3_600_000, t168 + 48 * 3_600_000);
    const t180 = findElongationUpwardCrossing(180, t168 - 6 * 3_600_000, t168 + 72 * 3_600_000);
    if (t174 === null || t180 === null) return unresolved;

    const info = {
      purnimaStartUtc: new Date(t168).toISOString(),
      bhadraEndUtc: new Date(t174).toISOString(),
      purnimaEndUtc: new Date(t180).toISOString(),
    };

    let day = offsetCivilDateStr(formatCivilDateInTz(new Date(t168), location.tz), -1);
    const lastDay = offsetCivilDateStr(formatCivilDateInTz(new Date(t180), location.tz), 1);
    let bhadraCoversPurnimaPradosha = false;
    for (let guard = 0; guard < 6 && day <= lastDay; guard += 1) {
      const pradosha = getPeriodWindow('pradosha', day, location);
      if (pradosha) {
        const touchesPurnima = pradosha.start.getTime() < t180 && pradosha.end.getTime() > t168;
        const overlapsBhadra = pradosha.start.getTime() < t174 && pradosha.end.getTime() > t168;
        if (touchesPurnima && !overlapsBhadra) {
          return { ...info, dahanDate: day, branch: 'pradosha_no_bhadra' };
        }
        if (touchesPurnima && overlapsBhadra) bhadraCoversPurnimaPradosha = true;
      }
      day = offsetCivilDateStr(day, 1);
    }

    if (bhadraCoversPurnimaPradosha) {
      const puccha = Math.max(t168, t174 - pucchaMinutes * 60_000);
      if (puccha < t180) {
        return { ...info, dahanDate: formatCivilDateInTz(new Date(puccha), location.tz), branch: 'bhadra_puccha' };
      }
    }
    return { ...unresolved, ...info };
  });
}

export function evaluateCondition(
  condition: RuleCondition,
  civilDateStr: string,
  location: LocationInput,
  contextPaksha?: 'shukla' | 'krishna'
): ConditionEvaluationResult {
  const reasons: EvaluationReason[] = [];
  const diagnostics: string[] = [];

  const sampleDate = parseCivilDateUtc(civilDateStr);
  const tzOffset = getTzOffsetHours(sampleDate, location.tz);

  const sunriseWindow = getPeriodWindow('sunrise', civilDateStr, location);
  const sunrise = sunriseWindow ? sunriseWindow.start : sampleDate;
  const panchang = calculatePanchang(sunrise, location.lat, location.lon);

  if (condition.type === 'lunar_month') {
    const monthSys = condition.monthSystem || 'amanta';
    const mRes = getLunarMonth(sunrise, monthSys);
    const actualMasa = mRes.ok ? mRes.monthName : panchang.masaName;
    const satisfied = actualMasa.toLowerCase() === condition.value.toLowerCase();
    reasons.push({
      code: 'lunar_month_check',
      text: `Lunar month on ${civilDateStr} at sunrise is ${actualMasa} (target: ${condition.value}, system: ${monthSys}).`,
      details: { actualMasa, targetMasa: condition.value, system: monthSys },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics,
      astronomy: { masaName: actualMasa },
    };
  }

  if (condition.type === 'paksha') {
    const pakshaStr = panchang.tithiIndex <= 15 ? 'shukla' : 'krishna';
    const satisfied = pakshaStr === condition.value;
    reasons.push({
      code: 'paksha_check',
      text: `Paksha on ${civilDateStr} at sunrise is ${pakshaStr} (tithi ${panchang.tithiIndex}, target: ${condition.value}).`,
      details: { actualPaksha: pakshaStr, targetPaksha: condition.value, tithiIndex: panchang.tithiIndex },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics,
      astronomy: { paksha: pakshaStr, tithiIndex: panchang.tithiIndex },
    };
  }

  if (condition.type === 'tithi') {
    const targetPaksha = (condition as TithiCondition).paksha || contextPaksha;
    const targetTithi = condition.value;

    const yesterdayDate = offsetCivilDateStr(civilDateStr, -1);
    const tomorrowDate = offsetCivilDateStr(civilDateStr, 1);

    const yesterdaySunriseWindow = getPeriodWindow('sunrise', yesterdayDate, location);
    const yesterdaySunrise = yesterdaySunriseWindow ? yesterdaySunriseWindow.start : parseCivilDateUtc(yesterdayDate);
    const yesterdayPanchang = calculatePanchang(yesterdaySunrise, location.lat, location.lon);

    const tomorrowSunriseWindow = getPeriodWindow('sunrise', tomorrowDate, location);
    const tomorrowSunrise = tomorrowSunriseWindow ? tomorrowSunriseWindow.start : parseCivilDateUtc(tomorrowDate);
    const tomorrowPanchang = calculatePanchang(tomorrowSunrise, location.lat, location.lon);

    const todayMatched = isTithiMatching(panchang.tithiIndex, targetTithi, targetPaksha);
    const yesterdayMatched = isTithiMatching(yesterdayPanchang.tithiIndex, targetTithi, targetPaksha);
    const tomorrowMatched = isTithiMatching(tomorrowPanchang.tithiIndex, targetTithi, targetPaksha);

    let satisfied = false;
    let isVrddhi = false;
    let isKshaya = false;

    if (todayMatched) {
      satisfied = true;
      if (yesterdayMatched || tomorrowMatched) {
        isVrddhi = true;
        diagnostics.push('vrddhi_tithi');
        const sunrisesWithTithi = [];
        if (yesterdayMatched) sunrisesWithTithi.push(yesterdayDate);
        sunrisesWithTithi.push(civilDateStr);
        if (tomorrowMatched) sunrisesWithTithi.push(tomorrowDate);

        reasons.push({
          code: 'vrddhi_tithi_detected',
          text: `[S] Scholar review pending: Vrddhi tithi ${getTithiName(targetTithi)} spans two sunrises (${sunrisesWithTithi.join(', ')}). Tradition-specific resolution is required.`,
          details: {
            targetTithi,
            targetPaksha,
            sunrisesWithTithi,
            isFirstSunrise: tomorrowMatched && !yesterdayMatched,
            isSecondSunrise: yesterdayMatched && !tomorrowMatched,
          },
        });
      }
    } else {
      const targets = getAbsoluteTithiIndex(targetTithi, targetPaksha);
      for (const t of targets) {
        if (isAbsoluteTithiSkipped(yesterdayPanchang.tithiIndex, panchang.tithiIndex, t)) {
          satisfied = true;
          isKshaya = true;
          diagnostics.push('kshaya_tithi');
          reasons.push({
            code: 'kshaya_tithi_detected',
            text: `Kshaya tithi: Tithi ${getTithiName(targetTithi)} (${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}) was skipped at sunrise. Fallback observed on ${civilDateStr}.`,
            details: {
              targetTithi,
              targetPaksha,
              yesterdayTithi: yesterdayPanchang.tithiIndex,
              todayTithi: panchang.tithiIndex,
            },
          });
          break;
        }
      }
    }

    if (!isVrddhi && !isKshaya) {
      reasons.push({
        code: 'tithi_check',
        text: `Tithi on ${civilDateStr} at sunrise is ${getTithiName(panchang.tithiIndex)} (index ${panchang.tithiIndex}, target: ${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}).`,
        details: { actualTithi: panchang.tithiIndex, targetTithi, targetPaksha },
      });
    }

    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics,
      astronomy: { tithiIndex: panchang.tithiIndex, tithiName: getTithiName(panchang.tithiIndex) },
    };
  }

  if (condition.type === 'nakshatra') {
    const satisfied = panchang.nakshatra.toLowerCase() === condition.value.toLowerCase();
    reasons.push({
      code: 'nakshatra_check',
      text: `Nakshatra on ${civilDateStr} at sunrise is ${panchang.nakshatra} (target: ${condition.value}).`,
      details: { actualNakshatra: panchang.nakshatra, targetNakshatra: condition.value },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics,
      astronomy: { nakshatraName: panchang.nakshatra },
    };
  }

  if (condition.type === 'tithi_presence') {
    const window = getPeriodWindow(condition.period, civilDateStr, location);
    if (!window) {
      // Degenerate case (e.g. no moonrise on this civil date)
      diagnostics.push('no_event_window');
      reasons.push({
        code: 'window_absent',
        text: `Period window '${condition.period}' is absent on civil date ${civilDateStr} at location.`,
      });
      return {
        conditionType: condition.type,
        satisfied: 'indeterminate',
        reasons,
        diagnostics: ['no_event_window'],
      };
    }

    diagnostics.push(...window.diagnostics);

    const startPanchang = calculatePanchang(window.start, location.lat, location.lon);
    const endPanchang = calculatePanchang(window.end, location.lat, location.lon);
    const midInstant = new Date((window.start.getTime() + window.end.getTime()) / 2);
    const midPanchang = calculatePanchang(midInstant, location.lat, location.lon);

    const targetTithi = condition.tithi;
    const targetPaksha = (condition as any).paksha || contextPaksha;

    const mStart = isTithiMatching(startPanchang.tithiIndex, targetTithi, targetPaksha);
    const mEnd = isTithiMatching(endPanchang.tithiIndex, targetTithi, targetPaksha);
    const mMid = isTithiMatching(midPanchang.tithiIndex, targetTithi, targetPaksha);

    let satisfied = false;
    let isVrddhi = false;
    let isKshaya = false;

    if (condition.period === 'sunrise') {
      satisfied = mStart;
      if (satisfied) {
        const vrddhiInfo = getUnderlyingTithiVrddhiInfo(targetTithi, targetPaksha, civilDateStr, location);
        if (vrddhiInfo.isVrddhi) {
          isVrddhi = true;
          diagnostics.push('vrddhi_tithi');
          reasons.push({
            code: 'vrddhi_tithi_detected',
            text: `[S] Scholar review pending: Vrddhi tithi ${getTithiName(targetTithi)} spans two sunrises (${vrddhiInfo.sunrisesWithTithi.join(', ')}). Tradition-specific resolution is required.`,
            details: {
              targetTithi,
              targetPaksha,
              sunrisesWithTithi: vrddhiInfo.sunrisesWithTithi,
              isFirstSunrise: vrddhiInfo.isFirstSunrise,
              isSecondSunrise: vrddhiInfo.isSecondSunrise,
            },
          });
        }
      } else {
        const yesterdayDate = offsetCivilDateStr(civilDateStr, -1);
        const yesterdaySunriseWindow = getPeriodWindow('sunrise', yesterdayDate, location);
        const yesterdaySunrise = yesterdaySunriseWindow ? yesterdaySunriseWindow.start : parseCivilDateUtc(yesterdayDate);
        const yesterdayPanchang = calculatePanchang(yesterdaySunrise, location.lat, location.lon);
        const targets = getAbsoluteTithiIndex(targetTithi, targetPaksha);
        for (const t of targets) {
          if (isAbsoluteTithiSkipped(yesterdayPanchang.tithiIndex, startPanchang.tithiIndex, t)) {
            satisfied = true;
            isKshaya = true;
            diagnostics.push('kshaya_tithi');
            reasons.push({
              code: 'kshaya_tithi_detected',
              text: `Kshaya tithi: Tithi ${getTithiName(targetTithi)} (${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}) was skipped at sunrise. Fallback observed on ${civilDateStr}.`,
              details: {
                targetTithi,
                targetPaksha,
                yesterdayTithi: yesterdayPanchang.tithiIndex,
                todayTithi: startPanchang.tithiIndex,
              },
            });
            break;
          }
        }
      }
    } else {
      if (condition.mode === 'at') {
        satisfied = mStart;
      } else if (condition.mode === 'prevails') {
        satisfied = mStart && mEnd;
      } else if (condition.mode === 'touches') {
        // Presence only at the three sample instants misses a short overlap
        // between them (e.g. Trayodashi ending midway through Pradosha). Tithi
        // progresses monotonically through the 30-step cycle within a ritual
        // window, so the endpoint sequence also detects a target that began
        // and ended between samples.
        const targetTithis = getAbsoluteTithiIndex(targetTithi, targetPaksha);
        satisfied = mStart || mEnd || mMid || hasTithiInForwardInterval(
          startPanchang.tithiIndex,
          endPanchang.tithiIndex,
          targetTithis,
        );
      } else if (condition.mode === 'majority') {
        satisfied = [mStart, mMid, mEnd].filter(Boolean).length >= 2;
      }

      if (satisfied) {
        const vrddhiInfo = getUnderlyingTithiVrddhiInfo(targetTithi, targetPaksha, civilDateStr, location);
        if (vrddhiInfo.isVrddhi) {
          isVrddhi = true;
          diagnostics.push('vrddhi_tithi');
          reasons.push({
            code: 'vrddhi_tithi_detected',
            text: `[S] Scholar review pending: Vrddhi tithi ${getTithiName(targetTithi)} spans two sunrises (${vrddhiInfo.sunrisesWithTithi.join(', ')}). Tradition-specific resolution is required.`,
            details: {
              targetTithi,
              targetPaksha,
              sunrisesWithTithi: vrddhiInfo.sunrisesWithTithi,
              isFirstSunrise: vrddhiInfo.isFirstSunrise,
              isSecondSunrise: vrddhiInfo.isSecondSunrise,
            },
          });
        }
      }
    }

    const startStr = formatInstantInTz(window.start, location.tz);
    const endStr = formatInstantInTz(window.end, location.tz);

    if (!isVrddhi && !isKshaya) {
      let reasonCode = 'tithi_presence_check';
      let reasonText = `Tithi ${getTithiName(targetTithi)} (${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}) presence mode '${condition.mode}' during '${condition.period}' ` +
        `[${startStr} to ${endStr}]: ${satisfied ? 'MATCHED' : 'DID NOT MATCH'}. ` +
        `(Start: ${getTithiName(startPanchang.tithiIndex)}, End: ${getTithiName(endPanchang.tithiIndex)}).`;

      if (window.diagnostics.includes('extended_moonrise')) {
        reasonCode = 'extended_moonrise_check';
        reasonText = `Moonrise absent on civil date ${civilDateStr}; extended search found actual moonrise on next civil date at ${startStr} (before next sunrise). ` +
          `Tithi ${getTithiName(targetTithi)} (${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}) presence mode '${condition.mode}' during '${condition.period}': ${satisfied ? 'MATCHED' : 'DID NOT MATCH'}.`;
      }

      reasons.push({
        code: reasonCode,
        text: reasonText,
        details: {
          targetTithi,
          targetPaksha,
          period: condition.period,
          mode: condition.mode,
          startTithi: startPanchang.tithiIndex,
          endTithi: endPanchang.tithiIndex,
          startUtc: window.start.toISOString(),
          endUtc: window.end.toISOString(),
          isExtendedMoonrise: window.diagnostics.includes('extended_moonrise'),
        },
      });
    }

    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics: Array.from(new Set(diagnostics)),
      window: {
        name: condition.period,
        startUtc: window.start.toISOString(),
        endUtc: window.end.toISOString(),
        startLocal: window.start.toLocaleTimeString('en-US', { timeZone: location.tz }),
        endLocal: window.end.toLocaleTimeString('en-US', { timeZone: location.tz }),
      },
      astronomy: {
        tithiIndex: startPanchang.tithiIndex,
        tithiName: getTithiName(startPanchang.tithiIndex),
      },
    };
  }

  if (condition.type === 'nakshatra_presence') {
    const window = getPeriodWindow(condition.period, civilDateStr, location);
    if (!window) {
      diagnostics.push('no_event_window');
      return {
        conditionType: condition.type,
        satisfied: 'indeterminate',
        reasons: [{ code: 'window_absent', text: `Period window '${condition.period}' is absent on date ${civilDateStr}.` }],
        diagnostics: ['no_event_window'],
      };
    }

    const startPanchang = calculatePanchang(window.start, location.lat, location.lon);
    const endPanchang = calculatePanchang(window.end, location.lat, location.lon);
    const midPanchang = calculatePanchang(new Date((window.start.getTime() + window.end.getTime()) / 2), location.lat, location.lon);

    const targetNakshatra = condition.nakshatra.toLowerCase();
    let satisfied = false;

    if (condition.mode === 'at') {
      satisfied = startPanchang.nakshatra.toLowerCase() === targetNakshatra;
    } else if (condition.mode === 'prevails') {
      satisfied = startPanchang.nakshatra.toLowerCase() === targetNakshatra && endPanchang.nakshatra.toLowerCase() === targetNakshatra;
    } else if (condition.mode === 'touches') {
      satisfied = startPanchang.nakshatra.toLowerCase() === targetNakshatra || endPanchang.nakshatra.toLowerCase() === targetNakshatra || midPanchang.nakshatra.toLowerCase() === targetNakshatra;
    }

    reasons.push({
      code: 'nakshatra_presence_check',
      text: `Nakshatra '${condition.nakshatra}' presence mode '${condition.mode}' during '${condition.period}': ${satisfied ? 'MATCHED' : 'DID NOT MATCH'} (Start: ${startPanchang.nakshatra}, End: ${endPanchang.nakshatra}).`,
    });

    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics: window.diagnostics,
      astronomy: { nakshatraName: startPanchang.nakshatra },
    };
  }

  if (condition.type === 'holika_dahan') {
    const resolution = resolveHolikaDahan(civilDateStr, location, (condition as HolikaDahanCondition).pucchaMinutes ?? 72);
    const satisfied = resolution.dahanDate === civilDateStr;
    reasons.push({
      code: 'holika_dahan_check',
      text: resolution.dahanDate
        ? `Holika Dahan resolves to ${resolution.dahanDate} via '${resolution.branch}': ${satisfied ? 'MATCHED' : 'DID NOT MATCH'} on ${civilDateStr}.`
        : `Holika Dahan unresolved near ${civilDateStr}: Purnima does not touch any pradosha.`,
      details: { branch: resolution.branch, dahanDate: resolution.dahanDate, purnimaStartUtc: resolution.purnimaStartUtc, bhadraEndUtc: resolution.bhadraEndUtc, purnimaEndUtc: resolution.purnimaEndUtc },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics: [`holika_dahan_${resolution.branch}`],
    };
  }

  if (condition.type === 'karana_presence') {
    const window = getPeriodWindow(condition.period, civilDateStr, location);
    if (!window) {
      return {
        conditionType: condition.type,
        satisfied: 'indeterminate',
        reasons: [{ code: 'window_absent', text: `Period window '${condition.period}' absent on ${civilDateStr}.` }],
        diagnostics: ['no_event_window'],
      };
    }

    const target = condition.karana.toLowerCase();
    const sampleCount = Math.max(1, Math.ceil((window.end.getTime() - window.start.getTime()) / 300_000));
    let present = false;
    for (let i = 0; i <= sampleCount; i += 1) {
      const instant = new Date(window.start.getTime() + ((window.end.getTime() - window.start.getTime()) * i) / sampleCount);
      const karanaIndex = Math.floor(computeAstronomy(instant).elongation / 6) + 1;
      if (getKaranaName(karanaIndex).toLowerCase() === target) {
        present = true;
        break;
      }
    }

    const mode = (condition as KaranaPresenceCondition).mode;
    const satisfied = mode === 'absent' ? !present : present;
    reasons.push({
      code: 'karana_presence_check',
      text: `Karana '${condition.karana}' ${mode} during '${condition.period}': ${satisfied ? 'MATCHED' : 'DID NOT MATCH'}.`,
      details: { karana: condition.karana, period: condition.period, mode, present },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics: window.diagnostics,
      window: {
        name: condition.period,
        startUtc: window.start.toISOString(),
        endUtc: window.end.toISOString(),
        startLocal: formatInstantInTz(window.start, location.tz),
        endLocal: formatInstantInTz(window.end, location.tz),
      },
    };
  }

  if (condition.type === 'viddha') {
    const window = getPeriodWindow(condition.atPeriod, civilDateStr, location);
    if (!window) {
      return {
        conditionType: condition.type,
        satisfied: 'indeterminate',
        reasons: [{ code: 'window_absent', text: `Viddha check window '${condition.atPeriod}' absent on ${civilDateStr}.` }],
        diagnostics: ['no_event_window'],
      };
    }

    const startPanchang = calculatePanchang(window.start, location.lat, location.lon);
    const isPierced = startPanchang.tithiIndex === condition.piercedBy;

    const actionText = isPierced
      ? `Pierced (viddha) by tithi ${getTithiName(condition.piercedBy)} during ${condition.atPeriod}; action '${condition.action}' triggered.`
      : `Shuddha (unpierced); no contamination by tithi ${getTithiName(condition.piercedBy)} during ${condition.atPeriod}.`;

    reasons.push({
      code: 'viddha_check',
      text: actionText,
      details: { piercedBy: condition.piercedBy, isPierced, action: condition.action },
    });

    return {
      conditionType: condition.type,
      satisfied: !isPierced, // satisfied means unpierced/shuddha
      reasons,
      diagnostics: window.diagnostics,
    };
  }

  return {
    conditionType: condition.type,
    satisfied: false,
    reasons: [{ code: 'unknown_condition_type', text: `Unknown condition type '${condition.type}'.` }],
    diagnostics: [],
  };
}

/** Evaluates an entire observance rule variant (all conditions combined) */
export function evaluateVariant(
  variant: {
    ruleId: string;
    festivalId: string;
    traditionProfile?: string;
    conditions: RuleCondition[];
  },
  civilDateStr: string,
  location: LocationInput
): VariantEvaluationResult {
  const conditionResults: ConditionEvaluationResult[] = [];
  const allReasons: EvaluationReason[] = [];
  const allDiagnostics: string[] = [];

  let overallQualified: boolean | 'indeterminate' = true;

  const pakshaCond = variant.conditions.find((c) => c.type === 'paksha') as PakshaCondition | undefined;
  const contextPaksha = pakshaCond ? pakshaCond.value : undefined;

  for (const cond of variant.conditions) {
    const res = evaluateCondition(cond, civilDateStr, location, contextPaksha);
    conditionResults.push(res);
    allReasons.push(...res.reasons);
    allDiagnostics.push(...res.diagnostics);

    if (res.satisfied === 'indeterminate') {
      overallQualified = 'indeterminate';
    } else if (res.satisfied === false) {
      if (overallQualified !== 'indeterminate') {
        overallQualified = false;
      }
    }
  }

  const uniqueDiagnostics = Array.from(new Set(allDiagnostics));

  return {
    ruleId: variant.ruleId,
    festivalId: variant.festivalId,
    civilDate: civilDateStr,
    location,
    traditionProfile: variant.traditionProfile,
    qualified: overallQualified,
    conditionResults,
    reasons: allReasons,
    diagnostics: uniqueDiagnostics,
  };
}
