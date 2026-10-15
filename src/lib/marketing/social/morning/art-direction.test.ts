import { describe, it, expect } from "vitest";
import { allBackgroundPrompts, buildBackgroundPrompt } from "./art-direction";
import { BRAND_GOLD, PAPER, TRADITION_ACCENT } from "./card-theme";
import { MORNING_TRADITIONS } from "./types";

describe("background art prompts", () => {
  it("there is one for every tradition", () => {
    expect(allBackgroundPrompts().map((p) => p.tradition)).toEqual([...MORNING_TRADITIONS]);
  });

  it("carries the app's own colours: the paper, the brand gold and the tradition accent", () => {
    for (const tradition of MORNING_TRADITIONS) {
      const { prompt } = buildBackgroundPrompt(tradition);
      expect(prompt).toContain(PAPER.page);
      expect(prompt).toContain(BRAND_GOLD);
      expect(prompt).toContain(TRADITION_ACCENT[tradition]);
    }
  });

  it("asks for a quiet centre so scripture can sit on it, and for portrait 4:5", () => {
    for (const tradition of MORNING_TRADITIONS) {
      const built = buildBackgroundPrompt(tradition);
      expect(built.prompt).toMatch(/centre/);
      expect(built.prompt).toMatch(/4:5/);
      expect(built.size).toEqual({ width: 1080, height: 1350 });
    }
  });

  it("always forbids text, faces and watermarks", () => {
    for (const tradition of MORNING_TRADITIONS) {
      const { negativePrompt } = buildBackgroundPrompt(tradition);
      expect(negativePrompt).toMatch(/text, letters, numbers/);
      expect(negativePrompt).toMatch(/human faces/);
      expect(negativePrompt).toMatch(/watermarks/);
    }
  });

  it("never asks for what a tradition asks not to see: those appear only in the avoid list", () => {
    const forbiddenInSubject: Record<string, RegExp> = {
      sikh: /guru|khanda|ik onkar|golden temple|gurdwara|turban|guru granth/i,
      buddhist: /\bbuddha\b|statue|monk/i,
      jain: /tirthankara|emblem/i,
      hindu: /deity|murti|avatar/i
    };
    for (const tradition of MORNING_TRADITIONS) {
      const { prompt, negativePrompt } = buildBackgroundPrompt(tradition);
      expect(prompt).not.toMatch(forbiddenInSubject[tradition]);
      expect(negativePrompt).toMatch(forbiddenInSubject[tradition]);
    }
  });

  it("is deterministic", () => {
    expect(buildBackgroundPrompt("sikh")).toEqual(buildBackgroundPrompt("sikh"));
  });
});
