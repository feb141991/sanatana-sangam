import { describe, it, expect } from "vitest";
import { PAPER } from "./card-theme";

// The app enforces these contrast ratios on its reading paper (shoonaya-mobile __tests__/reader-appearance.test.ts):
// text >= 7:1, dim and accent >= 4.5:1. The cards use the same paper, so the same rules must hold here.
function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("card colours keep the app's reading contrast", () => {
  it("text on the page is at least 7:1", () => expect(contrast(PAPER.text, PAPER.page)).toBeGreaterThanOrEqual(7));
  it("dim text on the page is at least 4.5:1", () => expect(contrast(PAPER.dim, PAPER.page)).toBeGreaterThanOrEqual(4.5));
  it("accent text on the page is at least 4.5:1", () => expect(contrast(PAPER.accent, PAPER.page)).toBeGreaterThanOrEqual(4.5));
  it("text stays readable on the lighter centre glow too", () => expect(contrast(PAPER.text, PAPER.card)).toBeGreaterThanOrEqual(7));
});
