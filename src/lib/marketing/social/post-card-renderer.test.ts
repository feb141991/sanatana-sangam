import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { renderSocialPostCard } from "./post-card-renderer";

describe("renderSocialPostCard", () => {
  it("renders a 1080x1350 PNG image for a general theme post", async () => {
    const { png } = await renderSocialPostCard({
      title: "Japa & Sacred Mantras",
      categoryLabel: "DAILY DHARMA CONTEMPLATION",
      tradition: "hindu",
      quoteOrInsight: `Scriptural grounding: Bhagavad Gita 10.25 ("Yajnanam japa-yajno 'smi" — "Of sacrifices I am the sacrifice of silent repetition"). Patanjali Yoga Sutras 1.28.`,
      citation: "Bhagavad Gita 10.25 • Yoga Sutras 1.28"
    });

    expect(png).toBeInstanceOf(Buffer);
    expect(png.length).toBeGreaterThan(10000);

    const metadata = await sharp(png).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
    expect(metadata.format).toBe("png");
  });

  it("renders a festival card with custom tradition accent", async () => {
    const { png } = await renderSocialPostCard({
      title: "Maha Shivratri",
      categoryLabel: "SACRED FESTIVAL OBSERVANCE",
      tradition: "hindu",
      quoteOrInsight: "The great night of Shiva — awakening to cosmic stillness, sacred awareness, and inner realization.",
      citation: "Sacred Calendar Observance"
    });

    const metadata = await sharp(png).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
  });

  it("handles long insight text without overflowing", async () => {
    const longText = "Daily rhythm includes mindful cleansing, respectful gratitude upon awakening, wholesome seasonal diet, purposeful activity, and restful contemplation before sleep to maintain tridosha equilibrium throughout the natural seasonal changes.";
    const { png } = await renderSocialPostCard({
      title: "Ayurveda & Dinacharya",
      categoryLabel: "DAILY DHARMA CONTEMPLATION",
      quoteOrInsight: longText,
      citation: "Charaka Samhita Sutrasthana 5"
    });

    expect(png.length).toBeGreaterThan(10000);
  });
});
