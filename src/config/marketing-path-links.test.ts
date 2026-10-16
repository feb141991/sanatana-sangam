import { describe, expect, it } from "vitest";
import { marketingFeatures } from "@/config/marketing";
import { SEED_PATHS } from "@/lib/pathshala-paths";

describe("marketing Pathshala links", () => {
  it("points every linked Pathshala course to a published course route", () => {
    const pathIds = new Set(SEED_PATHS.map((path) => path.id));
    const links = marketingFeatures.flatMap((feature) => feature.deepLinks ?? []);
    const courseLinks = links.filter((link) => link.href.startsWith("/pathshala/"));

    expect(courseLinks.length).toBeGreaterThan(0);
    expect(links.some((link) => link.href === "/pathshala")).toBe(false);
    for (const link of courseLinks) {
      const pathId = link.href.slice("/pathshala/".length).split("/")[0];
      expect(pathIds.has(pathId), `${link.label} points to unknown Pathshala route ${link.href}`).toBe(true);
    }
  });
});
