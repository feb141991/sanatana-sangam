/**
 * Pure helper function to compute contiguous windows for masa names.
 *
 * In purnimanta reckoning, a month's Krishna paksha segment has tithiIndex > 15.
 * Shukla paksha segments (tithiIndex <= 15) must NOT be included in Krishna paksha
 * windows, nor should Shukla days bridge two separate Krishna fortnights.
 *
 * Resets / closes an active window when:
 * 1. A day fails the `isActive` predicate (e.g. not Krishna paksha);
 * 2. The masa name key changes;
 * 3. The input series ends (EOF is reached).
 */

export interface DayRecord {
  dateStr: string;
  panchang: {
    tithiIndex?: number;
    masaName?: string;
    masaNamePurnimanta?: string;
    [key: string]: any;
  };
}

export interface Window {
  start: string;
  end: string;
}

export function contiguousWindows(
  days: DayRecord[],
  key: 'masaName' | 'masaNamePurnimanta',
  options?: {
    filterKey?: (name: string) => boolean;
    isActive?: (day: DayRecord) => boolean;
  }
): Map<string, Window[]> {
  const windowsByName = new Map<string, Window[]>();
  let curKey: string | null = null;
  let startStr: string | null = null;
  let endStr: string | null = null;

  for (const d of days) {
    const active = options?.isActive ? options.isActive(d) : true;
    const name = d.panchang?.[key] as string | undefined;
    const keyValid = name != null && (options?.filterKey ? options.filterKey(name) : true);
    const matches = active && keyValid;
    const activeKey = matches ? name! : null;

    if (matches && activeKey === curKey) {
      endStr = d.dateStr;
    } else {
      if (curKey !== null && startStr !== null && endStr !== null) {
        if (!windowsByName.has(curKey)) windowsByName.set(curKey, []);
        windowsByName.get(curKey)!.push({ start: startStr, end: endStr });
      }

      if (matches) {
        curKey = activeKey;
        startStr = d.dateStr;
        endStr = d.dateStr;
      } else {
        curKey = null;
        startStr = null;
        endStr = null;
      }
    }
  }

  if (curKey !== null && startStr !== null && endStr !== null) {
    if (!windowsByName.has(curKey)) windowsByName.set(curKey, []);
    windowsByName.get(curKey)!.push({ start: startStr, end: endStr });
  }

  return windowsByName;
}
