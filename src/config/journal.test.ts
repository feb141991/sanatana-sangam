import { describe, expect, it } from "vitest";
import {
  findJournalEssay,
  getAllJournalEssays,
  getFeaturedJournalEssay,
  getRelatedEssays,
} from "./journal";

describe("journal publication gate", () => {
  it("does not expose source-unreviewed draft essays through public readers", () => {
    expect(getAllJournalEssays()).toEqual([]);
    expect(findJournalEssay("architecture-of-silence-ancient-mandirs")).toBeUndefined();
    expect(getFeaturedJournalEssay()).toBeUndefined();
    expect(getRelatedEssays("architecture-of-silence-ancient-mandirs")).toEqual([]);
  });
});
