/**
 * New seekers per calendar month, for the admin overview chart. Pure: the route fetches
 * `profiles.created_at`, this buckets it. Months are UTC calendar months, so a seeker who signed
 * up at 23:30 local on the last day is counted the same way for every admin.
 */

export interface SeekerTrendMonth {
  /** "2026-11" */
  key: string;
  /** "NOV" */
  label: string;
  count: number;
}

export interface SeekerTrend {
  /** Oldest first, ending with the current month. Months with no signups are real zeros. */
  months: SeekerTrendMonth[];
  thisMonth: number;
  /** Null when the window has only one month. */
  lastMonth: number | null;
  /** The row limit was reached, so older months may be undercounted. */
  truncated: boolean;
}

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function keyOf(index: number): string {
  const year = Math.floor(index / 12);
  const month = index % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** The first instant of the oldest month in the window, for the database filter. */
export function seekerTrendWindowStart(now: Date, months = 12): string {
  const start = monthIndex(now) - (Math.max(1, months) - 1);
  return new Date(Date.UTC(Math.floor(start / 12), start % 12, 1)).toISOString();
}

export function buildSeekerTrend(
  createdAt: ReadonlyArray<string | null | undefined>,
  now: Date,
  months = 12,
  truncated = false,
): SeekerTrend {
  const length = Math.max(1, Math.floor(months));
  const last = monthIndex(now);
  const first = last - (length - 1);
  const counts = new Array<number>(length).fill(0);

  for (const value of createdAt) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    const slot = monthIndex(date) - first;
    if (slot >= 0 && slot < length) counts[slot] += 1;
  }

  const result: SeekerTrendMonth[] = counts.map((count, slot) => {
    const index = first + slot;
    return { key: keyOf(index), label: MONTH_LABELS[index % 12], count };
  });

  return {
    months: result,
    thisMonth: result[result.length - 1].count,
    lastMonth: result.length > 1 ? result[result.length - 2].count : null,
    truncated,
  };
}

/** "3 new this month", "No new seekers this month", or null when the trend is unknown. */
export function describeNewThisMonth(trend: SeekerTrend | null): string | null {
  if (!trend) return null;
  if (trend.thisMonth === 0) return "No new seekers this month";
  return `${trend.thisMonth.toLocaleString()} new this month`;
}
