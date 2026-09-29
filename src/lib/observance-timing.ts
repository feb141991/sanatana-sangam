import { isValidTimeZone, resolveTimeZone } from "./sacred-time";

export type ObservanceSendInstant = {
  sendAt: Date;
  localDate: string;
  isPast: (now: Date) => boolean;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Calculates the local civil date when shifting by an integer number of days.
 */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function shiftCivilDate(dateIso: string, offsetDays: number): string | null {
  if (!isValidIsoDate(dateIso)) return null;
  const [y, m, d] = dateIso.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  if (Number.isNaN(shifted.getTime())) return null;
  const sy = shifted.getUTCFullYear();
  const sm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const sd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${sy}-${sm}-${sd}`;
}

/**
 * Converts a civil date + local hour/minute in a specific IANA timezone to a UTC Date.
 * Uses Intl.DateTimeFormat parts to cleanly account for standard and daylight saving offsets.
 */
export function localTimeToUtc(
  civilDateIso: string,
  timeString: string,
  timeZone: string
): Date | null {
  if (!isValidIsoDate(civilDateIso) || !TIME_RE.test(timeString)) return null;
  const tz = resolveTimeZone(timeZone);

  const [year, month, day] = civilDateIso.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  const targetWallTime = Date.UTC(year, month - 1, day, hour, minute, 0);

  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

    const getLocalWallTime = (instantMs: number) => {
      const parts = formatter.formatToParts(new Date(instantMs));
      const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
      return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), 0);
    };

    // Sample both sides of the requested local time. This yields all relevant
    // UTC offsets for ordinary DST folds/gaps without guessing one offset.
    const offsets = new Set<number>();
    for (const hours of [-36, -24, -12, 0, 12, 24, 36]) {
      const instantMs = targetWallTime + hours * 60 * 60 * 1000;
      offsets.add(getLocalWallTime(instantMs) - instantMs);
    }

    const exactInstants = Array.from(offsets)
      .map((offset) => targetWallTime - offset)
      .filter((instantMs) => getLocalWallTime(instantMs) === targetWallTime)
      .sort((a, b) => a - b);

    if (exactInstants.length > 0) {
      // If the wall time occurs twice when clocks move back, choose its first
      // occurrence. A single semantic reminder can then never fire twice.
      return new Date(exactInstants[0]);
    }

    // If the wall time is skipped when clocks move forward, shift it forward
    // by the DST gap while preserving its minutes (02:30 becomes 03:30).
    const shiftedForward = Array.from(offsets)
      .map((offset) => targetWallTime - offset)
      .map((instantMs) => ({ instantMs, localWallTime: getLocalWallTime(instantMs) }))
      .filter(({ localWallTime }) => localWallTime > targetWallTime && localWallTime - targetWallTime <= 6 * 60 * 60 * 1000)
      .sort((a, b) => a.localWallTime - b.localWallTime || a.instantMs - b.instantMs);

    return shiftedForward.length > 0 ? new Date(shiftedForward[0].instantMs) : null;
  } catch {
    return null;
  }
}

/**
 * Computes the exact UTC send instant for an observance reminder given:
 * - occurrenceDate: the civil date of the observance (YYYY-MM-DD)
 * - leadDays: offset before the observance (0 = morning of, 1 = D-1, 7 = D-7)
 * - reminderTime: preferred local send time (HH:MM)
 * - timeZone: user timezone
 */
export function computeObservanceSendInstant(
  occurrenceDate: string,
  leadDays: number,
  reminderTime: string,
  timeZone: string
): ObservanceSendInstant | null {
  if (!Number.isInteger(leadDays) || leadDays < 0) return null;

  // The local date on which the reminder should be delivered
  const localSendDate = shiftCivilDate(occurrenceDate, -leadDays);
  if (!localSendDate) return null;

  const sendAt = localTimeToUtc(localSendDate, reminderTime, timeZone);
  if (!sendAt) return null;

  return {
    sendAt,
    localDate: localSendDate,
    isPast: (now: Date) => sendAt.getTime() <= now.getTime(),
  };
}
