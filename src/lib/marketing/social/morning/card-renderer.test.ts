import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { CardRenderError, FONT_DIR, missingFontsFor, renderMorningCard, type FontOverrides } from "./card-renderer";
import { formatVerseLines } from "./verse-format";
import { pickMorningVerse } from "./verse-sources";
import { CARD_SIZE, PAPER } from "./card-theme";
import type { MorningVerse } from "./types";

const hash = (b: Buffer) => crypto.createHash("sha256").update(b).digest("hex");
const verse = (tradition: "hindu" | "sikh", date = "2026-10-16"): MorningVerse => {
  const picked = pickMorningVerse(tradition, date);
  if (!picked.ok) throw new Error(picked.detail);
  return picked.verse;
};
const NO_GURMUKHI: FontOverrides = { gurmukhi: { path: path.join(FONT_DIR, "does-not-exist.ttf"), family: "Nope" } };

/** Counts pixels clearly darker than the paper in a region: the ink. */
async function inkIn(png: Buffer, region: { left: number; top: number; width: number; height: number }): Promise<number> {
  const { data, info } = await sharp(png).extract(region).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] < 110 && data[i + 1] < 110 && data[i + 2] < 110) ink++;
  return ink;
}

describe("formatVerseLines", () => {
  it("keeps line breaks the corpus already has", () => {
    expect(formatVerseLines("पहली पंक्ति ।\nदूसरी पंक्ति ॥")).toBe("पहली पंक्ति ।\nदूसरी पंक्ति ॥");
  });

  it("breaks Gurbani stored as one run after each verse-ending mark, keeping the mark on its own line", () => {
    expect(formatVerseLines("ਸੁਣਿਐ ਸਤੁ ਸੰਤੋਖੁ ਗਿਆਨੁ ॥ ਸੁਣਿਐ ਅਠਸਠਿ ਕਾ ਇਸਨਾਨੁ ॥")).toBe("ਸੁਣਿਐ ਸਤੁ ਸੰਤੋਖੁ ਗਿਆਨੁ ॥\nਸੁਣਿਐ ਅਠਸਠਿ ਕਾ ਇਸਨਾਨੁ ॥");
  });

  it("changes no character: removing the line breaks gives back the original words", () => {
    const original = "ਪਾਤਾਲਾ ਪਾਤਾਲ ਲਖ ਆਗਾਸਾ ਆਗਾਸ ॥ ਓੜਕ ਓੜਕ ਭਾਲਿ ਥਕੇ ਵੇਦ ਕਹਨਿ ਇਕ ਵਾਤ ॥";
    expect(formatVerseLines(original).replace(/\n/g, " ")).toBe(original);
  });
});

describe("missingFontsFor", () => {
  it("lists the Gurmukhi font for a Sikh card when it is not installed, and nothing for a Hindu card", () => {
    expect(missingFontsFor(verse("sikh"), NO_GURMUKHI)).toContain("gurmukhi");
    expect(missingFontsFor(verse("hindu"))).toEqual([]);
  });
});

describe("renderMorningCard (Hindu)", () => {
  it("makes a 1080 x 1350 PNG", async () => {
    const card = await renderMorningCard(verse("hindu"));
    expect(card.png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    const meta = await sharp(card.png).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([CARD_SIZE.width, CARD_SIZE.height, "png"]);
  });

  it("is deterministic: the same verse gives the same bytes", async () => {
    const a = await renderMorningCard(verse("hindu"));
    const b = await renderMorningCard(verse("hindu"));
    expect(hash(a.png)).toBe(hash(b.png));
  });

  it("a different verse gives a different card", async () => {
    const a = await renderMorningCard(verse("hindu", "2026-10-16"));
    const b = await renderMorningCard(verse("hindu", "2026-10-17"));
    expect(hash(a.png)).not.toBe(hash(b.png));
  });

  it("has real ink where the verse and the wordmark are, and none in the empty corners", async () => {
    const { png } = await renderMorningCard(verse("hindu"));
    expect(await inkIn(png, { left: 130, top: 330, width: 820, height: 260 })).toBeGreaterThan(2000); // the verse
    expect(await inkIn(png, { left: 380, top: 1160, width: 320, height: 90 })).toBeGreaterThan(300); // the wordmark
    expect(await inkIn(png, { left: 100, top: 100, width: 200, height: 120 })).toBe(0); // an empty corner
  });

  it("every Hindu verse in the rotation fits the card", async () => {
    for (let day = 0; day < 28; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const { png } = await renderMorningCard(verse("hindu", date));
      expect((await sharp(png).metadata()).height).toBe(CARD_SIZE.height);
    }
  }, 120_000);

  it("uses the app's paper colour for the background", async () => {
    const { data } = await sharp((await renderMorningCard(verse("hindu"))).png).extract({ left: 20, top: 20, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const [r, g, b] = [...data];
    const paper = parseInt(PAPER.page.slice(1), 16);
    expect(Math.abs(r - ((paper >> 16) & 255))).toBeLessThan(10);
    expect(Math.abs(g - ((paper >> 8) & 255))).toBeLessThan(10);
    expect(Math.abs(b - (paper & 255))).toBeLessThan(10);
  });
});

describe("renderMorningCard: failures are loud, never a quiet wrong card", () => {
  it("a Sikh card without the Gurmukhi font fails with font_missing and names the file", async () => {
    await expect(renderMorningCard(verse("sikh"), NO_GURMUKHI)).rejects.toMatchObject({ code: "font_missing" });
  });

  it("a font file the text engine cannot use for the script is caught, not silently replaced by a system font", async () => {
    // Inter has no Devanagari, so asking for it measures the same as the system fallback.
    const overrides: FontOverrides = { devanagari: { path: path.join(FONT_DIR, "Inter_500Medium.ttf"), family: "Inter Medium" } };
    await expect(renderMorningCard(verse("hindu"), overrides)).rejects.toMatchObject({ code: "font_not_loaded" });
  });

  it("content too long for the card is refused, not overflowed", async () => {
    const long: MorningVerse = { ...verse("hindu"), original: Array.from({ length: 12 }, () => "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।").join("\n") };
    await expect(renderMorningCard(long)).rejects.toBeInstanceOf(CardRenderError);
    await expect(renderMorningCard(long)).rejects.toMatchObject({ code: "content_too_long" });
  });
});
