import { describe, expect, it } from "vitest";
import { getAllJournalEssays } from "./journal";

// Founder decision 2026-11-26: the journal's named authors could not be shown to
// exist, so every essay is credited to Shoonaya Editorial. A named person may be
// credited only once they are real and have agreed; add them here deliberately.
const ALLOWED_AUTHORS = new Set(["Shoonaya Editorial"]);

describe("journal bylines", () => {
  it("credits every published essay to an allowed author", () => {
    expect(getAllJournalEssays().length).toBeGreaterThan(30);
    for (const essay of getAllJournalEssays()) {
      expect(ALLOWED_AUTHORS.has(essay.author), `${essay.slug}: ${essay.author}`).toBe(true);
    }
  });

  it("gives no scholar's credentials in the role or bio of an editorial byline", () => {
    for (const essay of getAllJournalEssays()) {
      expect(essay.authorRole, essay.slug).not.toMatch(/researcher|scholar|professor|preceptor|council/i);
      expect(essay.authorBio, essay.slug).not.toMatch(/\b(Dr|Prof|Acharya|Swami|Pt)\.?\s/);
    }
  });

  // 2026-11-26: no council reviewed these essays. A reviewer is Shoonaya Editorial
  // or a real person who did check the essay (the founder reviewed Kumbh 2027).
  it("names no council, board or committee as an essay's reviewer", () => {
    const allowedReviewers = new Set(["Shoonaya Editorial", "Pt. Prince Sharma"]);
    for (const essay of getAllJournalEssays()) {
      const reviewer = essay.editorialReview?.reviewerName ?? "";
      expect(allowedReviewers.has(reviewer), `${essay.slug}: ${reviewer}`).toBe(true);
    }
  });
});
