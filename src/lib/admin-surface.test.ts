import { describe, expect, it } from "vitest";
import { LIGHT_SHEET_ROUTES, resolveAdminSurface } from "./admin-surface";

describe("resolveAdminSurface", () => {
  it("draws the overview in glass directly and every other admin route on the dark scope", () => {
    expect(resolveAdminSurface("/admin")).toBe("overview");
    expect(resolveAdminSurface("/admin/")).toBe("overview");
    expect(resolveAdminSurface("/admin/users")).toBe("glass");
    expect(resolveAdminSurface("/admin/users/abc-123")).toBe("glass");
    expect(resolveAdminSurface("/admin/monitoring?tab=errors".split("?")[0])).toBe("glass");
  });

  it("falls back to glass for an unknown path, never to the light sheet", () => {
    expect(resolveAdminSurface(null)).toBe("glass");
    expect(resolveAdminSurface(undefined)).toBe("glass");
  });

  it("keeps the light-sheet valve empty while every page is on glass", () => {
    expect(LIGHT_SHEET_ROUTES).toEqual([]);
  });
});
