/**
 * Strict validation for dates and times that arrive from a client.
 *
 * `new Date("2025-02-31T00:00:00Z")` is a valid Date: JavaScript rolls it over to 3 March. A
 * shape check plus a NaN check therefore accepts days that do not exist. Where that reaches
 * Postgres it fails with 22008 and surfaces as an HTTP 500 carrying raw database text; where it
 * reaches the astrology engine it is worse: the engine silently computes a chart for the rolled-over
 * date and nothing fails at all. Every client-supplied date goes through here instead.
 */

export type IsoDateFailure = 'format' | 'calendar' | 'future' | 'too_old';

export type IsoDateResult = { ok: true; iso: string } | { ok: false; reason: IsoDateFailure };

export interface IsoDateOptions {
  /** Earliest accepted year. Default 1. */
  minYear?: number;
  /** Dates after today are valid (events, reminders) when true. A birth date is not. */
  allowFuture?: boolean;
  /** "Now" for the future check; injectable for tests. */
  now?: Date;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A UTC date for y-m-d without `Date.UTC`'s quirk of reading years 0 to 99 as 1900 to 1999. */
function utcDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  return date;
}

/** True when y-m-d is a real calendar date: no 31 Feb, no month 13, no day 0, leap years respected. */
export function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const probe = utcDate(year, month - 1, day);
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

/** `YYYY-MM-DD` that names a day that exists. No bounds; use `parseIsoDate` for those. */
export function isRealIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  return match !== null && isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/**
 * Parses a client-supplied `YYYY-MM-DD` (surrounding whitespace is ignored), or says why it cannot.
 * "Not in the future" allows one day of slack: a client east of UTC can legitimately send a "today"
 * that is still tomorrow in UTC.
 */
export function parseIsoDate(value: unknown, options: IsoDateOptions = {}): IsoDateResult {
  if (typeof value !== 'string') return { ok: false, reason: 'format' };
  const text = value.trim();
  const match = ISO_DATE.exec(text);
  if (!match) return { ok: false, reason: 'format' };
  if (!isRealCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) return { ok: false, reason: 'calendar' };
  if (Number(match[1]) < (options.minYear ?? 1)) return { ok: false, reason: 'too_old' };

  if (!options.allowFuture) {
    const now = options.now ?? new Date();
    const limit = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString().slice(0, 10);
    if (text > limit) return { ok: false, reason: 'future' };
  }
  return { ok: true, iso: text };
}

export type ClockTimeResult = { ok: true; value: string } | { ok: false; reason: 'format' | 'range' };

/** `HH:MM` or `HH:MM:SS`, 24-hour, returned zero padded. */
export function parseClockTime(value: unknown): ClockTimeResult {
  if (typeof value !== 'string') return { ok: false, reason: 'format' };
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return { ok: false, reason: 'format' };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? null : Number(match[3]);
  if (hours > 23 || minutes > 59 || (seconds !== null && seconds > 59)) return { ok: false, reason: 'range' };
  const base = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return { ok: true, value: seconds === null ? base : `${base}:${String(seconds).padStart(2, '0')}` };
}
