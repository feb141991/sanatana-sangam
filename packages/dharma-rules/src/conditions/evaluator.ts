import {
  calculatePanchang,
  formatCivilDateInTz,
  parseCivilDateUtc,
  offsetCivilDateStr,
  getTzOffsetHours,
  LocationInput,
} from '../../../panchang-engine/src/index.js';
import { getSunriseSunset } from '../../../panchang-engine/src/core/astronomy.js';
import { getMoonRiseSet } from '../../../panchang-engine/src/core/moon-rise-set.js';

import {
  RuleCondition,
  ConditionEvaluationResult,
  VariantEvaluationResult,
  EvaluationReason,
  PeriodType,
  CONDITION_EVALUATOR_VERSION,
  TithiCondition,
  PakshaCondition,
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

/** Computes the exact time window for a period on a civil date and location */
export function getPeriodWindow(
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
      if (!moon.ok || !moon.moonrise) {
        diagnostics.push('no_moonrise');
        return null;
      }
      start = moon.moonrise;
      end = moon.moonrise;
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
  const { withinPakshaTithi, paksha } = getWithinPakshaTithi(absoluteTithiIndex);
  if (targetPaksha) {
    return withinPakshaTithi === targetTithi && paksha === targetPaksha;
  }
  // Paksha-ambiguous: match if within-paksha number matches regardless of half
  return withinPakshaTithi === targetTithi;
}

/** Evaluates a single rule condition on a given civil date and location */
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
    // Note: evaluate tithi/month conditions directly. No compensation for D1 per requirements.
    const satisfied = panchang.masaName.toLowerCase() === condition.value.toLowerCase();
    reasons.push({
      code: 'lunar_month_check',
      text: `Lunar month on ${civilDateStr} at sunrise is ${panchang.masaName} (target: ${condition.value}, system: ${condition.monthSystem}).`,
      details: { actualMasa: panchang.masaName, targetMasa: condition.value, system: condition.monthSystem },
    });
    return {
      conditionType: condition.type,
      satisfied,
      reasons,
      diagnostics,
      astronomy: { masaName: panchang.masaName },
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
    const satisfied = isTithiMatching(panchang.tithiIndex, condition.value, targetPaksha);
    reasons.push({
      code: 'tithi_check',
      text: `Tithi on ${civilDateStr} at sunrise is ${getTithiName(panchang.tithiIndex)} (index ${panchang.tithiIndex}, target: ${condition.value}${targetPaksha ? ' ' + targetPaksha : ''}).`,
      details: { actualTithi: panchang.tithiIndex, targetTithi: condition.value, targetPaksha },
    });
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

    if (condition.mode === 'at') {
      satisfied = mStart;
    } else if (condition.mode === 'prevails') {
      satisfied = mStart && mEnd;
    } else if (condition.mode === 'touches') {
      satisfied = mStart || mEnd || mMid;
    } else if (condition.mode === 'majority') {
      satisfied = [mStart, mMid, mEnd].filter(Boolean).length >= 2;
    }

    // formatInstantInTz produces "YYYY-MM-DD HH:MM" fully in the local timezone.
    // The old code concatenated a local-timezone date with a UTC time slice,
    // producing a hybrid timestamp that was neither local nor UTC.
    const startStr = formatInstantInTz(window.start, location.tz);
    const endStr = formatInstantInTz(window.end, location.tz);

    reasons.push({
      code: 'tithi_presence_check',
      text: `Tithi ${getTithiName(targetTithi)} (${targetTithi}${targetPaksha ? ' ' + targetPaksha : ''}) presence mode '${condition.mode}' during '${condition.period}' ` +
        `[${startStr} to ${endStr}]: ${satisfied ? 'MATCHED' : 'DID NOT MATCH'}. ` +
        `(Start: ${getTithiName(startPanchang.tithiIndex)}, End: ${getTithiName(endPanchang.tithiIndex)}).`,
      details: {
        targetTithi,
        targetPaksha,
        period: condition.period,
        mode: condition.mode,
        startTithi: startPanchang.tithiIndex,
        endTithi: endPanchang.tithiIndex,
        startUtc: window.start.toISOString(),
        endUtc: window.end.toISOString(),
      },
    });

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
