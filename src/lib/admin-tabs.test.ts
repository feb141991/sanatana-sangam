import { describe, expect, it } from "vitest";
import { formatTabBadge, nextTabIndex, resolveActiveTabId } from "./admin-tabs";

describe("nextTabIndex", () => {
  it("moves right and wraps from the last tab to the first", () => {
    expect(nextTabIndex(0, "ArrowRight", 4)).toBe(1);
    expect(nextTabIndex(3, "ArrowRight", 4)).toBe(0);
  });

  it("moves left and wraps from the first tab to the last", () => {
    expect(nextTabIndex(2, "ArrowLeft", 4)).toBe(1);
    expect(nextTabIndex(0, "ArrowLeft", 4)).toBe(3);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextTabIndex(2, "Home", 5)).toBe(0);
    expect(nextTabIndex(1, "End", 5)).toBe(4);
  });

  it("ignores every other key and an empty rail", () => {
    expect(nextTabIndex(0, "Enter", 3)).toBeNull();
    expect(nextTabIndex(0, "a", 3)).toBeNull();
    expect(nextTabIndex(0, "ArrowRight", 0)).toBeNull();
    expect(nextTabIndex(Number.NaN, "ArrowRight", 3)).toBeNull();
  });

  it("stays on the only tab when there is one", () => {
    expect(nextTabIndex(0, "ArrowRight", 1)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 1)).toBe(0);
  });
});

describe("resolveActiveTabId", () => {
  const tabs = [{ id: "apis" }, { id: "telemetry" }, { id: "errors" }] as const;

  it("keeps a known id", () => {
    expect(resolveActiveTabId(tabs, "telemetry")).toBe("telemetry");
  });

  it("falls back to the first tab for a stale or empty id, so one tab is always selectable", () => {
    expect(resolveActiveTabId(tabs, "removed-tab")).toBe("apis");
    expect(resolveActiveTabId(tabs, "")).toBe("apis");
  });

  it("has no active tab when there are no tabs", () => {
    expect(resolveActiveTabId([], "apis")).toBeNull();
  });
});

describe("formatTabBadge", () => {
  it("shows every count exactly, large ones included (an admin must never read '99+' for 412 rows)", () => {
    expect(formatTabBadge(0)).toBe("0");
    expect(formatTabBadge(7)).toBe("7");
    expect(formatTabBadge(100)).toBe("100");
    expect(formatTabBadge(412)).toBe("412");
    expect(formatTabBadge(12345)).toBe("12345");
  });

  it("drops a fractional part rather than showing it", () => {
    expect(formatTabBadge(3.9)).toBe("3");
  });

  it("hides empty, missing and invalid values", () => {
    expect(formatTabBadge(undefined)).toBeNull();
    expect(formatTabBadge(null)).toBeNull();
    expect(formatTabBadge("")).toBeNull();
    expect(formatTabBadge(-1)).toBeNull();
    expect(formatTabBadge(Number.NaN)).toBeNull();
  });

  it("passes text through unchanged", () => {
    expect(formatTabBadge("P1")).toBe("P1");
  });
});
