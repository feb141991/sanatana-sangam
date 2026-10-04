import { describe, expect, it } from "vitest";
import {
  computeAstronomy,
  getLunarMonth,
  getSunriseForDateStr,
} from "@sangam/panchang-engine";

import {
  getKulLocalDate,
  resolveKulRecurringGregorianDate,
  resolveNextKulTithiDates,
  validateKulCalendarTimezone,
  type KulTithiRequest,
} from "./native-kul-tithi";

const ujjain = { lat: 23.1765, lon: 75.7885, tz: "Asia/Kolkata" };

describe("Native KUL calendar resolution", () => {
  it("resolves the tithi active at the family's local sunrise using the canonical engine", () => {
    const fromDate = "2026-10-03";
    const { sunrise } = getSunriseForDateStr(fromDate, ujjain);
    const month = getLunarMonth(sunrise, "amanta");
    expect(month.ok).toBe(true);
    if (!month.ok) return;
    const tithiIndex = Math.floor(computeAstronomy(sunrise).elongation / 12) + 1;
    const request: KulTithiRequest = {
      masa: month.monthIndex + 1,
      paksha: tithiIndex <= 15 ? "shukla" : "krishna",
      tithi: ((tithiIndex - 1) % 15) + 1,
      monthSystem: "amanta",
      masaIsAdhika: month.isAdhika,
    };
    const resolved = resolveNextKulTithiDates([request], fromDate, ujjain);
    expect([...resolved.values()][0]?.civilDate).toBe(fromDate);
  });

  it("uses the KUL's IANA timezone for its local civil-day boundary", () => {
    expect(getKulLocalDate(new Date("2026-10-03T23:30:00.000Z"), "Asia/Kolkata")).toBe("2026-10-04");
    expect(getKulLocalDate(new Date("2026-10-03T23:30:00.000Z"), "Europe/London")).toBe("2026-10-04");
    expect(validateKulCalendarTimezone("Asia/Kolkata")).toBe(true);
    expect(validateKulCalendarTimezone("Not/A_Zone")).toBe(false);
  });

  it("resolves recurring Gregorian dates on the server and handles leap-day fallback", () => {
    expect(resolveKulRecurringGregorianDate("2000-02-29", "2026-02-28", true)).toBe("2026-02-28");
    expect(resolveKulRecurringGregorianDate("2000-02-29", "2028-02-28", true)).toBe("2028-02-29");
    expect(resolveKulRecurringGregorianDate("2020-01-01", "2026-10-03", false)).toBeNull();
  });

  it("labels the fifteenth tithi according to its paksha", () => {
    const requests: KulTithiRequest[] = [
      { masa: 7, paksha: "shukla", tithi: 15, monthSystem: "amanta", masaIsAdhika: false },
      { masa: 7, paksha: "krishna", tithi: 15, monthSystem: "amanta", masaIsAdhika: false },
    ];
    const resolved = resolveNextKulTithiDates(requests, "2026-10-03", ujjain);
    expect([...resolved.values()].map((value) => value.tithiLabel)).toEqual([
      "Ashwin Shukla Purnima",
      "Ashwin Krishna Amavasya",
    ]);
  });
});
