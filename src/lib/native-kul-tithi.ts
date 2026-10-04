import {
  computeAstronomy,
  getLunarMonth,
  getSunriseForDateStr,
  MONTH_NAMES,
  offsetCivilDateStr,
  type LocationInput,
  type MonthSystem,
} from "@sangam/panchang-engine";

export type KulTithiRequest = {
  masa: number;
  paksha: "shukla" | "krishna";
  tithi: number;
  monthSystem: MonthSystem;
  masaIsAdhika: boolean;
};

export type KulTithiResolution = {
  civilDate: string | null;
  masaLabel: string;
  tithiLabel: string;
};

const PAKSHA_TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
] as const;

function requestKey(request: KulTithiRequest): string {
  return [
    request.masa,
    request.paksha,
    request.tithi,
    request.monthSystem,
    request.masaIsAdhika ? "adhika" : "nija",
  ].join(":");
}

function localDateInTimezone(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getKulLocalDate(instant: Date, timezone: string): string {
  return localDateInTimezone(instant, timezone);
}

export function resolveNextKulTithiDates(
  requests: KulTithiRequest[],
  fromDate: string,
  location: LocationInput,
): Map<string, KulTithiResolution> {
  const unique = new Map<string, KulTithiRequest>();
  for (const request of requests) {
    if (
      !Number.isInteger(request.masa) || request.masa < 1 || request.masa > 12 ||
      !Number.isInteger(request.tithi) || request.tithi < 1 || request.tithi > 15 ||
      (request.paksha !== "shukla" && request.paksha !== "krishna") ||
      (request.monthSystem !== "amanta" && request.monthSystem !== "purnimanta")
    ) continue;
    unique.set(requestKey(request), request);
  }

  const unresolved = new Set(unique.keys());
  const datesByKey = new Map<string, string>();
  let civilDate = fromDate;

  // Resolve all due family dates in one bounded pass so a KUL with many dates
  // does not repeat a year-long astronomy scan once per row.
  for (let offset = 0; offset <= 400 && unresolved.size > 0; offset += 1) {
    const { sunrise } = getSunriseForDateStr(civilDate, location);
    if (!(sunrise instanceof Date) || !Number.isFinite(sunrise.getTime())) {
      throw new Error("KUL calendar sunrise could not be resolved");
    }
    const tithiIndex = Math.floor(computeAstronomy(sunrise).elongation / 12) + 1;
    const paksha = tithiIndex <= 15 ? "shukla" : "krishna";
    const tithi = ((tithiIndex - 1) % 15) + 1;
    const matching = [...unresolved]
      .map((key) => [key, unique.get(key)!] as const)
      .filter(([, request]) => request.paksha === paksha && request.tithi === tithi);

    if (matching.length > 0) {
      const monthResults = new Map<MonthSystem, ReturnType<typeof getLunarMonth>>();
      for (const [, request] of matching) {
        if (!monthResults.has(request.monthSystem)) {
          monthResults.set(request.monthSystem, getLunarMonth(sunrise, request.monthSystem));
        }
      }
      for (const [key, request] of matching) {
        const month = monthResults.get(request.monthSystem);
        if (!month?.ok) continue;
        const expectedIndex = request.masa - 1;
        if (
          month.monthIndex === expectedIndex &&
          month.isAdhika === request.masaIsAdhika
        ) {
          datesByKey.set(key, civilDate);
          unresolved.delete(key);
        }
      }
    }

    civilDate = offsetCivilDateStr(civilDate, 1);
  }

  return new Map(
    [...unique.entries()].map(([key, request]) => {
      const masaName = MONTH_NAMES[request.masa - 1] ?? "Unknown";
      const masaLabel = request.masaIsAdhika ? `Adhika ${masaName}` : masaName;
      const tithiName = request.tithi === 15
        ? request.paksha === "shukla" ? "Purnima" : "Amavasya"
        : PAKSHA_TITHI_NAMES[request.tithi - 1] ?? "Tithi";
      return [key, {
        civilDate: datesByKey.get(key) ?? null,
        masaLabel,
        tithiLabel: `${masaLabel} ${request.paksha === "shukla" ? "Shukla" : "Krishna"} ${tithiName}`,
      }];
    }),
  );
}

export function kulTithiRequestKey(request: KulTithiRequest): string {
  return requestKey(request);
}

export function resolveKulRecurringGregorianDate(
  eventDate: string,
  today: string,
  recurring: boolean,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
  if (!recurring) return eventDate >= today ? eventDate : null;
  if (eventDate >= today) return eventDate;

  const year = Number(today.slice(0, 4));
  const monthDay = eventDate.slice(5);
  let candidate = `${year}-${monthDay}`;
  if (!isValidCivilDate(candidate)) candidate = `${year}-02-28`;
  if (candidate < today) {
    candidate = `${year + 1}-${monthDay}`;
    if (!isValidCivilDate(candidate)) candidate = `${year + 1}-02-28`;
  }
  return candidate;
}

function isValidCivilDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateKulCalendarTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}
