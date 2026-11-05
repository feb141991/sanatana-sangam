import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landingHtml = readFileSync("public/landing.html", "utf8");
const cardStart = landingHtml.indexOf('id="sacred-places"');
const cardEnd = landingHtml.indexOf('class="member-list"', cardStart);
const card = landingHtml.slice(cardStart, cardEnd);
const mapStart = card.indexOf('<div class="world-map"');
const map = card.slice(mapStart, card.indexOf('class="place-filters"'));
const attrs = (html: string, tag: string) =>
  [...html.matchAll(new RegExp(`class="${tag}[^"]*"[^>]*data-place="([^"]+)"|class="${tag}[^"]*" data-place="([^"]+)"`, "g"))].map(
    (match) => match[1] ?? match[2],
  );

describe("homepage sacred places map", () => {
  it("draws sampled land, not a hand-drawn shape, with no borders", () => {
    expect(cardStart).toBeGreaterThan(-1);
    const paths = [...map.matchAll(/<path[\s\S]*?\sd="([^"]+)"/g)];
    expect(paths).toHaveLength(1);
    expect(paths[0][1].match(/h0/g)?.length ?? 0).toBeGreaterThan(1000);
    expect(paths[0][1]).not.toMatch(/Q/);
  });

  it("is visible and records where the land data came from", () => {
    const opacity = /\.world-svg \{[^}]*opacity: ([\d.]+);/.exec(landingHtml)?.[1];
    expect(Number(opacity)).toBeGreaterThanOrEqual(0.2);
    expect(map).toContain("world-atlas@2.0.2");
    expect(map).toContain("Natural Earth, public domain");
  });

  it("gives every dot exactly one button and one description, and no dot without them", () => {
    const dots = attrs(card, "city-dot");
    expect(dots).toHaveLength(8);
    expect(new Set(dots).size).toBe(8);
    expect(attrs(card, "place-chip").sort()).toEqual([...dots].sort());
    expect(attrs(card, "place-detail").sort()).toEqual([...dots].sort());
  });

  it("treats all four traditions evenly", () => {
    for (const tradition of ["hindu", "sikh", "buddhist", "jain"]) {
      expect(card.match(new RegExp(`class="place-chip"[^>]*data-tradition="${tradition}"`, "g"))).toHaveLength(2);
    }
  });

  it("does not present the places as members or a community", () => {
    expect(card).not.toMatch(/\b(seekers|members|users|families|Across distances)\b/i);
    expect(card).toContain("not a ranking");
  });

  it("reserves the Live Darshan line for places with a stream in the app's catalogue", () => {
    const streams = readFileSync("src/lib/live-streams.ts", "utf8");
    const withLive = [...card.matchAll(/class="place-detail" data-place="([^"]+)"(?:(?!class="place-detail")[\s\S])*?class="place-live"/g)].map(
      (match) => match[1],
    );
    expect(withLive.sort()).toEqual(["harmandir", "hazur", "mahakaleshwar"]);
    for (const id of ["golden-temple-sgpc", "takhat-hazur-sahib", "mahakaleshwar-ujjain"]) {
      expect(streams).toContain(`id: '${id}'`);
    }
    // /live-darshan sends a signed-out visitor back to the homepage.
    expect(card).not.toContain('href="/live-darshan');
  });

  it("is keyboard reachable, with 44px targets, and the dots stay out of the accessibility tree", () => {
    expect(landingHtml.slice(landingHtml.indexOf('class="world-map"'), landingHtml.indexOf('class="world-map"') + 40)).toContain('aria-hidden="true"');
    expect(card.match(/<button type="button" class="place-(filter|chip)"/g)).toHaveLength(13);
    expect(landingHtml).toMatch(/\.place-filter,\s*\.place-chip \{\s*min-height: 44px;/);
    expect(landingHtml).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.city-dot\.is-selected \{\s*animation: none;/);
  });
});

describe("homepage Explore button", () => {
  it("sits above the hero, takes clicks itself, and goes away once the page is open", () => {
    expect(landingHtml).toMatch(/#splash-bottom \{\s*z-index: 3;\s*pointer-events: none;/);
    expect(landingHtml).toMatch(/#splash-bottom > \* \{\s*pointer-events: auto;/);
    expect(landingHtml).toMatch(/body\.landing-entered #splash-bottom \{\s*display: none;/);
  });
});
