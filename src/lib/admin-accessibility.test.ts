import { describe, it, expect } from "vitest";
import { getStaggerDelayStyle } from "./admin-accessibility";

describe("Admin Accessibility & Motion Utilities", () => {
  it("computes staggered delays correctly within bounds", () => {
    expect(getStaggerDelayStyle(0)).toEqual({ animationDelay: "0ms" });
    expect(getStaggerDelayStyle(1)).toEqual({ animationDelay: "25ms" });
    expect(getStaggerDelayStyle(4)).toEqual({ animationDelay: "100ms" });
    // Capped at maxDelayMs
    expect(getStaggerDelayStyle(20, 240)).toEqual({ animationDelay: "240ms" });
  });

  it("returns empty style object when prefersReducedMotion is true", () => {
    expect(getStaggerDelayStyle(0, 240, true)).toEqual({});
    expect(getStaggerDelayStyle(5, 240, true)).toEqual({});
    expect(getStaggerDelayStyle(20, 240, true)).toEqual({});
  });

  it("ensures row stagger does not exceed 30ms step", () => {
    for (let i = 1; i <= 10; i++) {
      const prevDelayStr = (getStaggerDelayStyle(i - 1) as { animationDelay: string }).animationDelay;
      const currDelayStr = (getStaggerDelayStyle(i) as { animationDelay: string }).animationDelay;
      const prevMs = parseInt(prevDelayStr, 10);
      const currMs = parseInt(currDelayStr, 10);
      expect(currMs - prevMs).toBeLessThanOrEqual(30);
    }
  });
});
