import { describe, expect, it } from "vitest";
import scheduleJson from "../../packages/dharma-rules/src/melas/mela-schedule.json";
import { findJournalEssay, getAllJournalEssays } from "./journal";
import { formatMelaDate, kumbh2027Essay } from "./journal-kumbh-2027";

describe("Kumbh 2027 journal essay", () => {
  const text = JSON.stringify(kumbh2027Essay);

  it("is published with a recorded, dated review", () => {
    expect(kumbh2027Essay.publicationStatus).toBe("published");
    expect(kumbh2027Essay.editorialReview?.sourcesVerified).toBe(true);
    expect(findJournalEssay(kumbh2027Essay.slug)?.slug).toBe(kumbh2027Essay.slug);
    expect(getAllJournalEssays().some((e) => e.slug === kumbh2027Essay.slug)).toBe(true);
  });

  it("lists every confirmed day from the shared schedule, and never an unconfirmed one as a bathing day", () => {
    for (const mela of scheduleJson.melas) {
      for (const day of mela.days) {
        const line = `${formatMelaDate(day.date)}: ${day.title}`;
        if (day.status === "confirmed") expect(text, line).toContain(line);
        else {
          expect(text).not.toContain(line);
          expect(text).toContain(`${formatMelaDate(day.date)} (${day.title})`);
        }
      }
    }
  });

  it("names a civil date as that same day", () => {
    expect(formatMelaDate("2027-01-14")).toBe("Thursday, 14 January 2027");
    expect(formatMelaDate("2027-09-12")).toBe("Sunday, 12 September 2027");
  });

  it("cites only the official Mela authority websites", () => {
    expect(kumbh2027Essay.citations.length).toBeGreaterThan(0);
    for (const c of kumbh2027Essay.citations) {
      expect(c.reference).toMatch(/https:\/\/(haridwarkumbh\.uk\.gov\.in|simhasthamahakumbh\.maharashtra\.gov\.in)/);
    }
  });
});
