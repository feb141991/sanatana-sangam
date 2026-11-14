import { describe, expect, it } from "vitest";
import { axisLabelIndexes, buildLineGeometry } from "./admin-chart";

const PAD = { top: 10, right: 10, bottom: 20, left: 10 };

describe("buildLineGeometry", () => {
  it("spreads points evenly from the left to the right edge of the plot", () => {
    const g = buildLineGeometry([0, 5, 10], 120, 80, PAD);
    expect(g.points.map((p) => p.x)).toEqual([10, 60, 110]);
  });

  it("puts the highest value on the top grid line and zero on the bottom one", () => {
    const g = buildLineGeometry([0, 5, 10], 120, 80, PAD);
    expect(g.points[2].y).toBe(10);
    expect(g.points[0].y).toBe(60);
    expect(g.gridLines[0]).toBe(10);
    expect(g.gridLines[3]).toBe(60);
    expect(g.max).toBe(10);
  });

  it("returns four grid lines in order, evenly spaced", () => {
    const g = buildLineGeometry([1, 2], 120, 80, PAD);
    expect(g.gridLines).toEqual([10, 26.67, 43.33, 60]);
  });

  it("keeps an all-zero series on the zero line instead of dividing by zero", () => {
    const g = buildLineGeometry([0, 0, 0, 0], 100, 60, PAD);
    expect(g.max).toBe(1);
    // plot height is 60 - 10 - 20 = 30, so the zero line sits at 10 + 30
    expect(g.points.every((p) => p.y === 40)).toBe(true);
    expect(g.gridLines[3]).toBe(40);
    expect(g.path).not.toContain("NaN");
  });

  it("treats negative, missing and non-finite values as zero", () => {
    const g = buildLineGeometry([-4, Number.NaN, Number.POSITIVE_INFINITY, 2], 100, 60, PAD);
    expect(g.points.map((p) => p.value)).toEqual([0, 0, 0, 2]);
    expect(g.path).not.toContain("NaN");
    expect(g.path).not.toContain("Infinity");
  });

  it("centres a single point and draws no segment", () => {
    const g = buildLineGeometry([3], 100, 60, PAD);
    expect(g.points).toHaveLength(1);
    expect(g.points[0].x).toBe(50);
    expect(g.path).toBe(`M50 ${g.points[0].y}`);
  });

  it("has no path and no points for no data", () => {
    const g = buildLineGeometry([], 100, 60, PAD);
    expect(g.points).toEqual([]);
    expect(g.path).toBe("");
  });

  it("builds one straight segment per step", () => {
    const g = buildLineGeometry([1, 2, 3], 100, 60, PAD);
    expect(g.path.split("L")).toHaveLength(3);
    expect(g.path.startsWith("M")).toBe(true);
  });
});

describe("axisLabelIndexes", () => {
  it("always labels the latest point, then every second one back", () => {
    expect(axisLabelIndexes(12)).toEqual([1, 3, 5, 7, 9, 11]);
    expect(axisLabelIndexes(11)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("copes with tiny and invalid lengths", () => {
    expect(axisLabelIndexes(1)).toEqual([0]);
    expect(axisLabelIndexes(0)).toEqual([]);
    expect(axisLabelIndexes(-3)).toEqual([]);
    expect(axisLabelIndexes(2.5)).toEqual([]);
  });

  it("honours a different step, and never loops forever on a zero step", () => {
    expect(axisLabelIndexes(7, 3)).toEqual([0, 3, 6]);
    expect(axisLabelIndexes(4, 0)).toEqual([0, 1, 2, 3]);
  });
});
