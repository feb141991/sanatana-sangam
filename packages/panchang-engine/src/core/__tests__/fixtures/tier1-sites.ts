/**
 * Tier-1 validation sites and fixture slots for tracker item 4.3.
 *
 * WHAT 4.3 STILL NEEDS
 * --------------------
 * Moonrise, moonset and sunrise are already cited (11 USNO + 3 HMNAO, retrieved
 * 2026-08-07, in `moon-rise-set.test.ts`). §10 leaves these uncovered:
 *
 *   sunset · tithi boundary · nakshatra boundary · Sankranti instant · Nishita window
 *
 * HOW EACH IS COVERED HERE
 * ------------------------
 * `sunset` comes from the USNO/HMNAO one-day API — the same request already used
 * for sunrise, so it is a second reading off a page we already fetch.
 *
 * Tithi, nakshatra and Sankranti are NOT published as such by any Tier-1
 * astronomical authority; they are Hindu-calendar quantities. Rather than chase
 * published pañcāṅga tables — which are Tier 5 at best and off-limits to scrape
 * (source-governance §3) — we validate the **two longitudes all three derive from**:
 *
 *   tithi index      = floor(elongation / 12°),  elongation = moonTropical − sunTropical
 *   nakshatra index  = floor(moonSidereal / (360/27)),  moonSidereal = moonTropical − ayanāṁśa
 *   Sankranti        = instant sunSidereal crosses a multiple of 30°
 *
 * So if `sunTropical` and `moonTropical` agree with JPL Horizons (DE440, Tier 1,
 * free, non-commercial), and the ayanāṁśa is separately validated (<0.12″ at four
 * epochs, `astronomy.test.ts`), then all three derived quantities are validated at
 * the root. This is stronger than table-matching: it tests the ephemeris itself.
 *
 * Nishita has NO external authority — it is our own definition, a fraction of the
 * sunrise→sunset span. Once sunrise and sunset are cited it is arithmetic over
 * validated inputs, and is checked as such rather than pretending a source exists.
 *
 * *** THE APPARENT-vs-ASTROMETRIC TRAP ***
 * Horizons can return astrometric OR apparent coordinates. They differ by
 * aberration — about 20.5″ for the Sun, i.e. 0.0057°. The §1.2 Sankranti budget is
 * 0.0034° of solar longitude. **The difference is larger than the tolerance**, so
 * recording the wrong one would inject an error bigger than the thing being
 * measured, while looking like a legitimate citation. `computeAstronomy` returns
 * APPARENT longitude (aberration + nutation applied), so fixtures must record
 * apparent values — QUANTITIES='31' (ObsEcLon/ObsEcLat, ecliptic-of-date).
 * `frame` below is mandatory so this is never left implicit.
 *
 * LLM output is Tier 6 and is NEVER a valid value here (source-governance §2).
 * Every `value` must be read off the authority's own response by a person.
 */

/** A citation. A label is not a source; the query must be replayable. */
export interface Tier1Source {
  authority: 'USNO' | 'HMNAO' | 'JPL_HORIZONS';
  /** The exact replayable query — full URL, or the API parameters used. */
  query: string;
  /** ISO date the value was read. */
  retrievedOn: string;
}

export interface Tier1Site {
  city: string;
  lat: number;
  lon: number;
  tz: string;
}

/** The 12 validation cities (4.3). Deliberately spans latitude −33.9° to +64.1°:
 *  Reykjavík is above the Arctic-adjacent band where the latitude proxy engages,
 *  and Sydney is the southern-hemisphere check. */
export const TIER1_SITES: Tier1Site[] = [
  { city: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  { city: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  { city: 'Varanasi', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata' },
  { city: 'Mumbai', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  { city: 'Chennai', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { city: 'Kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { city: 'Kathmandu', lat: 27.7172, lon: 85.324, tz: 'Asia/Kathmandu' },
  { city: 'Bedford', lat: 52.1356, lon: -0.4685, tz: 'Europe/London' },
  { city: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { city: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { city: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { city: 'Reykjavík', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
];

/** Sunset fixture. `value` null until a person reads it off the authority. */
export interface SunsetFixture {
  city: string;
  dateStr: string;
  /** Local clock time 'HH:MM' as printed by the authority. */
  value: string | null;
  source: Tier1Source | null;
}

/** Geocentric apparent ecliptic longitude of Sun and Moon at a UTC instant. */
export interface LongitudeFixture {
  /** UTC instant, ISO-8601 with Z. */
  instantUtc: string;
  /** Apparent geocentric ecliptic longitude of date, degrees. */
  sunApparentLon: number | null;
  moonApparentLon: number | null;
  /** MUST be 'apparent'. See the aberration note above — astrometric values
   *  differ by more than the Sankranti tolerance. */
  frame: 'apparent' | 'astrometric' | null;
  source: Tier1Source | null;
}

/** Dates chosen to span solstices, equinoxes and the 2026 Adhika Jyeshtha. */
export const SUNSET_FIXTURES: SunsetFixture[] = [
  { city: 'Ujjain', dateStr: '2026-02-17', value: null, source: null },
  { city: 'Ujjain', dateStr: '2026-06-21', value: null, source: null },
  { city: 'Delhi', dateStr: '2026-03-20', value: null, source: null },
  { city: 'Varanasi', dateStr: '2026-06-21', value: null, source: null },
  { city: 'Mumbai', dateStr: '2026-09-22', value: null, source: null },
  { city: 'Chennai', dateStr: '2026-12-21', value: null, source: null },
  { city: 'Kolkata', dateStr: '2026-03-03', value: null, source: null },
  { city: 'Kathmandu', dateStr: '2026-03-20', value: null, source: null },
  { city: 'Bedford', dateStr: '2026-02-17', value: null, source: null },
  { city: 'London', dateStr: '2026-06-21', value: null, source: null },
  { city: 'New York', dateStr: '2026-09-22', value: null, source: null },
  { city: 'Sydney', dateStr: '2026-12-21', value: null, source: null },
  { city: 'Reykjavík', dateStr: '2026-03-20', value: null, source: null },
];

/** Instants for the longitude checks. Geocentric, so location-independent —
 *  these validate the ephemeris that every site's tithi/nakshatra depends on.
 *  Includes the 2026 Adhika Jyeshtha boundaries, since the leap month is what
 *  drives the largest festival-date shifts in the 3.7 migration. */
export const LONGITUDE_FIXTURES: LongitudeFixture[] = [
  { instantUtc: '2026-01-01T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-03-20T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-05-16T20:01:58Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-06-15T02:54:50Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-06-21T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-09-22T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2026-12-21T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
  { instantUtc: '2027-01-01T00:00:00Z', sunApparentLon: null, moonApparentLon: null, frame: null, source: null },
];

/** §1.2 tolerances, as decimal degrees / seconds. Single source for the tests. */
export const TOLERANCES = {
  sunsetSeconds: 30,
  tithiBoundarySeconds: 60,
  nakshatraBoundarySeconds: 120,
  sankrantiSeconds: 300,
  /** Implied longitude budgets from the same §1.2 table. */
  elongationDegrees: 0.0085,
  siderealDegrees: 0.017,
  solarDegrees: 0.0034,
} as const;

export const isPopulated = <T extends { source: Tier1Source | null }>(f: T): boolean =>
  f.source !== null;
