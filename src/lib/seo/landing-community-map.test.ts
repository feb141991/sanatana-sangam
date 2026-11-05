import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingHtml = readFileSync("public/landing.html", "utf8");
const mapStart = landingHtml.indexOf('<div class="world-map"');
const map = landingHtml.slice(mapStart, landingHtml.indexOf('class="map-label"', mapStart));

describe("homepage community map", () => {
  it("draws sampled land, not a hand-drawn shape", () => {
    expect(mapStart).toBeGreaterThan(-1);
    const path = /<path\s+d="([^"]+)"/.exec(map)?.[1] ?? "";
    expect(path.match(/h0/g)?.length ?? 0).toBeGreaterThan(1000);
    expect(path).not.toMatch(/Q/);
  });

  it("is visible and records where the land data came from", () => {
    const opacity = /\.world-svg \{[^}]*opacity: ([\d.]+);/.exec(landingHtml)?.[1];
    expect(Number(opacity)).toBeGreaterThanOrEqual(0.2);
    expect(map).toContain("world-atlas@2.0.2");
    expect(map).toContain("Natural Earth, public domain");
  });

  it("positions the eight dots against the map itself, as decoration", () => {
    expect(map.match(/class="city-dot"/g)).toHaveLength(8);
    expect(map).toContain('class="city-dots"');
    expect(landingHtml.slice(mapStart - 40, mapStart + 60)).toContain('aria-hidden="true"');
  });
});

describe("homepage Explore button", () => {
  it("sits above the hero, takes clicks itself, and goes away once the page is open", () => {
    expect(landingHtml).toMatch(/#splash-bottom \{\s*z-index: 3;\s*pointer-events: none;/);
    expect(landingHtml).toMatch(/#splash-bottom > \* \{\s*pointer-events: auto;/);
    expect(landingHtml).toMatch(/body\.landing-entered #splash-bottom \{\s*display: none;/);
  });
});
