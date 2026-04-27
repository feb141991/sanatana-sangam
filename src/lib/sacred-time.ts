export function isValidTimeZone(timeZone: string | null | undefined): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone: string | null | undefined): string {
  return isValidTimeZone(timeZone) ? timeZone! : 'UTC';
}

function getParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';

  return {
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
    hour: Number(part('hour')),
    minute: Number(part('minute')),
  };
}

export function getLocalDateIso(date: Date, timeZone: string): string {
  const { year, month, day } = getParts(date, resolveTimeZone(timeZone));
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getLocalHour(date: Date, timeZone: string): number {
  return getParts(date, resolveTimeZone(timeZone)).hour;
}

export function isLocalHour(date: Date, timeZone: string, targetHour: number): boolean {
  return getLocalHour(date, timeZone) === targetHour;
}

export function isHourInQuietWindow(
  localHour: number,
  quietStart: number | null | undefined,
  quietEnd: number | null | undefined
): boolean {
  if (
    quietStart === null || quietStart === undefined
    || quietEnd === null || quietEnd === undefined
    || Number.isNaN(quietStart)
    || Number.isNaN(quietEnd)
    || quietStart === quietEnd
  ) {
    return false;
  }

  if (quietStart < quietEnd) {
    return localHour >= quietStart && localHour < quietEnd;
  }

  return localHour >= quietStart || localHour < quietEnd;
}

export function canSendInLocalWindow(
  date: Date,
  timeZone: string,
  targetHour: number,
  quietStart: number | null | undefined,
  quietEnd: number | null | undefined,
  toleranceHours = 2
): boolean {
  const localHour = getLocalHour(date, resolveTimeZone(timeZone));
  // Use circular distance to handle midnight wrap (e.g. target=23, local=0 → distance=1)
  const rawDiff  = Math.abs(localHour - targetHour);
  const distance = Math.min(rawDiff, 24 - rawDiff);
  return distance <= toleranceHours && !isHourInQuietWindow(localHour, quietStart, quietEnd);
}

export function isoDateDiff(targetDateIso: string, baseDateIso: string): number {
  const target = new Date(`${targetDateIso}T00:00:00Z`);
  const base = new Date(`${baseDateIso}T00:00:00Z`);
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

/**
 * Returns the "spiritual day" date in YYYY-MM-DD for the given timezone.
 *
 * In Sanatana tradition, a new day begins at Brahma Muhurta (dawn), not at
 * civil midnight. Before `brahmaMuhurtaHour` (default 4 AM local time), the
 * previous calendar date is returned — the sadhak is still in the previous
 * spiritual day and should see their completed steps.
 *
 * Safe for both browser and Node.js (uses Intl.DateTimeFormat).
 */
export function localSpiritualDate(
  timeZone: string | null | undefined,
  brahmaMuhurtaHour = 4
): string {
  const tz  = resolveTimeZone(timeZone);
  const now  = new Date();
  const { year, month, day, hour } = getParts(now, tz);

  // Before Brahma Muhurta — still the previous spiritual day
  if (hour < brahmaMuhurtaHour) {
    // Use UTC constructor; JS handles day=0 as last day of previous month
    const prev = new Date(Date.UTC(year, month - 1, day - 1));
    return prev.toISOString().slice(0, 10);
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Build a contiguous range of spiritual-day date strings.
 * `days=30` → last 30 spiritual days, ascending, using the user's timezone.
 */
export function buildSpiritualDateRange(
  timeZone: string | null | undefined,
  days: number,
  brahmaMuhurtaHour = 4
): string[] {
  const tz      = resolveTimeZone(timeZone);
  const todayIso = localSpiritualDate(tz, brahmaMuhurtaHour);
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // Subtract i days from today
    const d = new Date(`${todayIso}T12:00:00Z`); // noon UTC to avoid DST edge cases
    d.setUTCDate(d.getUTCDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}
