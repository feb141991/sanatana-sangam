import { describe, expect, it } from "vitest";
import { canonicalInternalPath } from "./canonical-internal-path";

describe("canonicalInternalPath", () => {
  it("rewrites the retired Vichaar Sabha route to its direct destination", () => {
    expect(canonicalInternalPath("/vichaar-sabha")).toBe("/mandali");
    expect(canonicalInternalPath("/vichaar-sabha/topic")).toBe("/mandali/topic");
    expect(canonicalInternalPath("/vichaar-sabha?tab=posts")).toBe("/mandali?tab=posts");
  });

  it("leaves unrelated paths unchanged", () => {
    expect(canonicalInternalPath("/features/pathshala")).toBe("/features/pathshala");
    expect(canonicalInternalPath("/vichaar-sabhana")).toBe("/vichaar-sabhana");
  });
});
