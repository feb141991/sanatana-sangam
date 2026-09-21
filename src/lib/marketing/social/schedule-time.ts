/**
 * Local-wall-clock-in-a-timezone -> UTC instant conversion, with no external
 * timezone library dependency (none exists in this repo's package.json).
 * Uses the standard Intl.DateTimeFormat offset-probe technique: format a
 * trial UTC instant back into the target zone's wall-clock fields, diff
 * against the trial instant to get that zone's offset, then apply it once.
 *
 * This is used only for social-post publish-time scheduling (a UX
 * convenience, "publish around 9am local"), never for computing an
 * observance's calendar date -- that remains the canonical
 * evaluator/rules.json path per AGENTS.md's Calendar Governance section. A
 * few minutes of imprecision exactly at a DST transition is acceptable here
 * and is not the kind of astronomical-instant precision that section
 * governs.
 */

function offsetMinutesForZoneAt(timeZone: string, instant: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = formatter.formatToParts(instant).reduce<Record<string, string>>((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asIfUtc - instant.getTime()) / 60000;
}

/**
 * @param dateStr "YYYY-MM-DD" local calendar date
 * @param timeStr "HH:MM" local wall-clock time
 * @param timeZone IANA zone, e.g. "Asia/Kolkata"
 */
export function zonedTimeToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`zonedTimeToUtcIso: malformed date/time input "${dateStr} ${timeStr}"`);
  }

  const naiveUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMinutes = offsetMinutesForZoneAt(timeZone, new Date(naiveUtcMs));
  return new Date(naiveUtcMs - offsetMinutes * 60000).toISOString();
}

/** Local calendar date ("YYYY-MM-DD") for a given instant in a given zone. */
export function localDateInZone(instant: Date, timeZone: string): string {
  return instant.toLocaleDateString("en-CA", { timeZone });
}
