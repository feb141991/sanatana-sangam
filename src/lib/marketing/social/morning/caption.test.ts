import { describe, it, expect } from "vitest";
import { buildMorningCaption, captionWithHashtags, morningCampaignKey } from "./caption";
import { pickMorningVerse } from "./verse-sources";
import type { MorningVerse } from "./types";

function verseFor(tradition: "hindu" | "sikh", date = "2026-10-16"): MorningVerse {
  const picked = pickMorningVerse(tradition, date);
  if (!picked.ok) throw new Error(picked.detail);
  return picked.verse;
}

describe("buildMorningCaption", () => {
  it("Hindu: greeting, the verse unchanged, the quoted translation with its credit, and a tracked link", () => {
    const verse = verseFor("hindu");
    const { caption } = buildMorningCaption(verse, "2026-10-16");
    const parts = caption.split("\n\n");
    expect(parts[0]).toBe("Good morning from Shoonaya.");
    expect(parts[1]).toBe(verse.original);
    expect(caption).toContain(`“${verse.translation}”`);
    expect(caption).toContain(`— ${verse.citation} (Translation: Annie Besant (public domain))`);
    const link = caption.match(/https:\/\/www\.shoonaya\.com\/get\?\S+/)![0];
    expect(Object.fromEntries(new URL(link).searchParams)).toEqual({
      utm_source: "shoonaya",
      utm_medium: "social",
      utm_campaign: "morning-2026-10-16-hindu"
    });
  });

  it("Sikh: the verse and its citation with the attribution, and no invented translation", () => {
    const verse = verseFor("sikh");
    const { caption } = buildMorningCaption(verse, "2026-10-16");
    expect(caption).toContain(verse.original.replace(/ ([॥।]) /g, " $1\n"));
    expect(caption).toContain(`— ${verse.citation} · ${verse.attribution}`);
    expect(caption).not.toContain("“");
    expect(caption).not.toMatch(/translation/i);
  });

  it("contains nothing that did not come from the verse: every line is the greeting, the verse, the citation or the link", () => {
    for (const tradition of ["hindu", "sikh"] as const) {
      const verse = verseFor(tradition);
      const { caption } = buildMorningCaption(verse, "2026-10-16");
      const verseLines = new Set(verse.original.split("\n").concat(verse.original.replace(/ ([॥।]) /g, " $1\n").split("\n")));
      for (const line of caption.split("\n").filter((l) => l.trim())) {
        const known =
          line === "Good morning from Shoonaya." ||
          verseLines.has(line) ||
          line.startsWith("— ") ||
          line.startsWith("Find your infinite: https://www.shoonaya.com/get?") ||
          (verse.translation !== null && line.includes(verse.translation.split("\n")[0]));
        expect(known, `unexpected line: ${line}`).toBe(true);
      }
    }
  });

  it("the translation is never present when there is no credit for it", () => {
    const verse: MorningVerse = { ...verseFor("hindu"), translation: "An uncredited English line.", translationCredit: null };
    expect(buildMorningCaption(verse, "2026-10-16").caption).not.toContain("An uncredited English line.");
  });

  it("is the same every time for the same verse and date", () => {
    const verse = verseFor("hindu");
    expect(buildMorningCaption(verse, "2026-10-16")).toEqual(buildMorningCaption(verse, "2026-10-16"));
  });

  it("each day and tradition gets its own campaign key", () => {
    expect(morningCampaignKey("2026-10-16", "sikh")).toBe("morning-2026-10-16-sikh");
    expect(buildMorningCaption(verseFor("hindu"), "2026-10-17").caption).toContain("utm_campaign=morning-2026-10-17-hindu");
  });

  it("hashtags are per tradition and always include the brand", () => {
    expect(buildMorningCaption(verseFor("hindu"), "2026-10-16").hashtags).toContain("SanatanDharma");
    expect(buildMorningCaption(verseFor("sikh"), "2026-10-16").hashtags).toContain("Gurbani");
    for (const t of ["hindu", "sikh"] as const) expect(buildMorningCaption(verseFor(t), "2026-10-16").hashtags).toContain("Shoonaya");
  });

  it("captionWithHashtags appends them as one line", () => {
    expect(captionWithHashtags("Hello", ["A", "B"])).toBe("Hello\n\n#A #B");
    expect(captionWithHashtags("Hello", [])).toBe("Hello");
  });
});
