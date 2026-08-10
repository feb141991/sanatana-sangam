/**
 * solar-month — Tracker 2.8. Solar months and regional day-assignment.
 *
 * Solar calendars start each month at a Sankranti (the Sun entering a rāśi).
 * The Sankranti instant is a single astronomical fact, identical everywhere.
 * What differs by region is **which civil day that instant belongs to** — and
 * that is a convention, not an observation.
 *
 * This is why Makar Sankranti, Pongal, Maghi, Magh Bihu and Uttarayan can land
 * on different civil dates from the same ingress. calendar-profiles.md §2 is
 * explicit that the engine must model that rather than average it away.
 *
 * LAYER
 * -----
 * The Sankranti instant is Layer A (universal). The day-assignment rule and the
 * month NAME are Layer B (profile-qualified). Nothing here is Layer C — no
 * observance logic lives in this file.
 *
 * `[S]` STATUS
 * ------------
 * The four assignment rules are marked `[S]` in the spec: documented in their
 * widely published form, pending council ratification. They are implemented
 * here as specified and every result carries `ratified: false` so no caller can
 * mistake them for settled. Engineering may implement and flag; never ratify
 * (AGENTS.md rule 10).
 */
import { findSankrantisBetween } from '../lunar-month/index.js';
import { getMuhurtaWindows } from '../core/muhurta.js';
import {
  formatCivilDateInTz,
  parseCivilDateUtc,
  offsetCivilDateStr,
  getSunriseForDateStr,
  type LocationInput,
} from '../core/day-boundary.js';

/** calendar-profiles.md §2. */
export type SolarMonthRule = 'sunset_rule' | 'aparahna_rule' | 'midnight_rule' | 'same_day_rule';

/** Profiles that reckon months solar. */
export type SolarProfile = 'tamil' | 'malayalam' | 'bengali' | 'odia';

/**
 * Month names, calendar-profiles.md §2.
 *
 * Each array is in the profile's own new-year order, NOT rāśi order, so each
 * carries the rāśi its first month corresponds to. Tamil, Bengali and Odia begin
 * at Meṣa; Malayalam begins at Siṁha (Chingam), which is why its list looks
 * rotated. Getting that offset wrong would silently name every Kerala month
 * four months out — a plausible-looking wrong answer, which is the worst kind.
 */
const PROFILE_MONTHS: Record<SolarProfile, { startRashi: number; names: string[] }> = {
  tamil: {
    startRashi: 0, // Mesha
    names: ['Chithirai', 'Vaikasi', 'Aani', 'Aadi', 'Aavani', 'Purattasi',
            'Aippasi', 'Karthigai', 'Margazhi', 'Thai', 'Maasi', 'Panguni'],
  },
  malayalam: {
    startRashi: 4, // Simha — Chingam 1 is the Kollam-era new year
    names: ['Chingam', 'Kanni', 'Thulam', 'Vrischikam', 'Dhanu', 'Makaram',
            'Kumbham', 'Meenam', 'Medam', 'Edavam', 'Mithunam', 'Karkidakam'],
  },
  bengali: {
    startRashi: 0,
    names: ['Boishakh', 'Jyoishtho', 'Asharh', 'Shrabon', 'Bhadro', 'Ashwin',
            'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Choitro'],
  },
  odia: {
    startRashi: 0,
    names: ['Baisakha', 'Jyestha', 'Asadha', 'Sravana', 'Bhadraba', 'Aswina',
            'Kartika', 'Margasira', 'Pausa', 'Magha', 'Phalguna', 'Chaitra'],
  },
};

/** The rule each profile uses, calendar-profiles.md §4 launch table. */
export const PROFILE_RULE: Record<SolarProfile, SolarMonthRule> = {
  tamil: 'sunset_rule',
  malayalam: 'aparahna_rule',
  bengali: 'midnight_rule',
  odia: 'same_day_rule',
};

export interface SolarMonthSuccess {
  ok: true;
  /** Profile-specific month name. */
  monthName: string;
  /** Sidereal solar rāśi, 0 = Meṣa. Layer A — identical for every profile. */
  rashi: number;
  /** Civil date (YYYY-MM-DD, local) that the profile counts as day 1. */
  monthStartCivilDate: string;
  /** The Sankranti instant itself, ISO-8601 UTC. */
  sankrantiUtc: string;
  /** 1-based day within the solar month. */
  dayOfMonth: number;
  rule: SolarMonthRule;
  profile: SolarProfile;
  /** Always false. These rules are `[S]` and unratified. */
  ratified: false;
  diagnostics: string[];
}

export type SolarMonthResult = SolarMonthSuccess | { ok: false; reason: string };

/**
 * Which civil day does a Sankranti instant belong to, under one regional rule?
 *
 * Every rule is evaluated in the OBSERVER's local day and clock. A Sankranti at
 * 18:40 IST is before sunset in Chennai in June and after it in December, so the
 * same instant genuinely assigns to different days across the year — that is the
 * rule working, not drifting.
 */
export function assignSankrantiToCivilDay(
  sankranti: Date,
  rule: SolarMonthRule,
  location: LocationInput,
): { civilDate: string; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const localDay = formatCivilDateInTz(sankranti, location.tz);

  switch (rule) {
    case 'same_day_rule':
      // Odisha: the Sankranti day is day 1, whatever the clock says.
      return { civilDate: localDay, diagnostics };

    case 'midnight_rule': {
      // Bengal/Assam: "Sankranti before midnight -> next day is day 1".
      // Any instant is before the midnight that ends its own local day, so this
      // resolves to "the day after the Sankranti's local day" in every case.
      // Recorded explicitly because the spec's phrasing invites a reader to look
      // for a branch that does not exist.
      diagnostics.push('midnight_rule: always the day following the Sankranti day');
      return { civilDate: offsetCivilDateStr(localDay, 1), diagnostics };
    }

    case 'sunset_rule': {
      // Tamil Nadu: before sunset -> same day, else next.
      //
      // Sunset comes from getSunriseForDateStr rather than the adapter directly,
      // so this inherits the day-boundary layer's high-latitude proxy handling
      // (§8 / D21) instead of quietly disagreeing with it.
      const { sunset } = getSunriseForDateStr(localDay, location);
      if (!sunset) {
        diagnostics.push('sunset_rule: no sunset at this location/date; fell back to same-day');
        return { civilDate: localDay, diagnostics };
      }
      const before = sankranti.getTime() < sunset.getTime();
      diagnostics.push(
        `sunset_rule: Sankranti ${before ? 'before' : 'after'} sunset (${sunset.toISOString()})`,
      );
      return { civilDate: before ? localDay : offsetCivilDateStr(localDay, 1), diagnostics };
    }

    case 'aparahna_rule': {
      // Kerala: before the start of aparāhna (the 4th of five day-parts) ->
      // same day, else next.
      const windows = getMuhurtaWindows(
        parseCivilDateUtc(localDay),
        location.lat,
        location.lon,
        location.tz,
      );
      if (!windows.ok || !windows.windows.aparahna) {
        diagnostics.push('aparahna_rule: aparahna window unavailable; fell back to same-day');
        return { civilDate: localDay, diagnostics };
      }
      const start = windows.windows.aparahna.start;
      const before = sankranti.getTime() < start.getTime();
      diagnostics.push(
        `aparahna_rule: Sankranti ${before ? 'before' : 'after'} aparahna start (${start.toISOString()})`,
      );
      return { civilDate: before ? localDay : offsetCivilDateStr(localDay, 1), diagnostics };
    }
  }
}

/**
 * The solar month containing `instant`, for one profile at one location.
 *
 * Searches back far enough to guarantee catching the governing Sankranti: solar
 * months run 29–32 days, so 40 days is comfortably clear of the longest.
 */
export function getSolarMonth(
  instant: Date,
  profile: SolarProfile,
  location: LocationInput,
): SolarMonthResult {
  const rule = PROFILE_RULE[profile];
  const { startRashi, names } = PROFILE_MONTHS[profile];

  const searchStart = new Date(instant.getTime() - 40 * 24 * 3600 * 1000);
  const sankrantis = findSankrantisBetween(searchStart, new Date(instant.getTime() + 24 * 3600 * 1000));
  if (sankrantis.length === 0) {
    return { ok: false, reason: 'No Sankranti found in the 40-day search window' };
  }

  const todayCivil = formatCivilDateInTz(instant, location.tz);

  // The governing Sankranti is the last one whose assigned day-1 is on or
  // before today. Assignment can push a Sankranti to the NEXT civil day, so the
  // most recent Sankranti is not always the governing one — checking the
  // assigned day rather than the raw instant is the whole point of this module.
  let governing: { rashi: number; at: Date } | null = null;
  let governingStart = '';
  let governingDiagnostics: string[] = [];

  for (const s of sankrantis) {
    const { civilDate, diagnostics } = assignSankrantiToCivilDay(s.at, rule, location);
    if (civilDate <= todayCivil) {
      governing = s;
      governingStart = civilDate;
      governingDiagnostics = diagnostics;
    }
  }

  if (!governing) {
    return { ok: false, reason: 'No Sankranti assigns to a civil day on or before the target date' };
  }

  const nameIndex = (governing.rashi - startRashi + 12) % 12;
  const dayOfMonth =
    Math.round(
      (parseCivilDateUtc(todayCivil).getTime() - parseCivilDateUtc(governingStart).getTime()) /
        (24 * 3600 * 1000),
    ) + 1;

  return {
    ok: true,
    monthName: names[nameIndex],
    rashi: governing.rashi,
    monthStartCivilDate: governingStart,
    sankrantiUtc: governing.at.toISOString(),
    dayOfMonth,
    rule,
    profile,
    ratified: false,
    diagnostics: [
      ...governingDiagnostics,
      `[S] ${rule} is documented but not council-ratified (calendar-profiles.md §2)`,
    ],
  };
}

/**
 * The same Sankranti assigned under every rule, for one location.
 *
 * Exists to make the divergence inspectable rather than theoretical — this is
 * the function that shows Pongal and Magh Bihu landing on different civil days
 * from one ingress.
 */
export function compareAssignments(
  sankranti: Date,
  location: LocationInput,
): Record<SolarMonthRule, string> {
  const rules: SolarMonthRule[] = ['sunset_rule', 'aparahna_rule', 'midnight_rule', 'same_day_rule'];
  const out = {} as Record<SolarMonthRule, string>;
  for (const r of rules) out[r] = assignSankrantiToCivilDay(sankranti, r, location).civilDate;
  return out;
}

export { getSunriseForDateStr };
