import { describe, expect, it } from "vitest";
import { findJournalEssay, getAllJournalEssays } from "./journal";
import { sacredCalendar2027Essay } from "./journal-2027-sacred-calendar";

describe("2027 sacred calendar journal essay", () => {
  const fullText = JSON.stringify(sacredCalendar2027Essay);

  it("remains gated at pending_review until human and Pramana review sign-off", () => {
    expect(sacredCalendar2027Essay.publicationStatus).toBe("pending_review");
    expect(sacredCalendar2027Essay.editorialReview).toBeUndefined();
    expect(findJournalEssay(sacredCalendar2027Essay.slug)).toBeUndefined();
    expect(getAllJournalEssays().some((e) => e.slug === sacredCalendar2027Essay.slug)).toBe(false);
  });

  it("includes verified 2027 observance dates and withholds disputed dates like Janmashtami 2027", () => {
    for (const confirmedDate of [
      "13 January 2027",
      "14 January 2027",
      "6 March 2027",
      "22 March 2027",
      "14 April 2027",
      "19 April 2027",
      "18 July 2027",
      "4 September 2027",
      "5 September 2027",
      "29 October 2027",
      "13 November 2027",
    ]) {
      expect(fullText).toContain(confirmedDate);
    }

    // Janmashtami 2027 is withheld_disputed between 2027-08-24 and 2027-08-25 in observance_occurrences.
    expect(fullText).not.toContain("24 August 2027");
    expect(fullText).not.toContain("25 August 2027");
  });

  it("carries non-empty citations and fasting safety guidance", () => {
    expect(sacredCalendar2027Essay.citations.length).toBeGreaterThan(0);
    for (const c of sacredCalendar2027Essay.citations) {
      expect(c.text.trim().length).toBeGreaterThan(0);
      expect(c.reference.trim().length).toBeGreaterThan(0);
    }
    expect(sacredCalendar2027Essay.practiceGuidance.steps.join(" ")).toContain("consult a physician");
  });
});
