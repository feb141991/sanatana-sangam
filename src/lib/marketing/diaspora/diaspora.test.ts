import { describe, it, expect } from "vitest";
import { PRODUCT_CLAIMS, claimById, confirmedClaims, unconfirmedClaims } from "./claims";
import { PILLARS, pillarById } from "./pillars";
import { REGIONS, regionById } from "./regions";
import { buildDiasporaStrategyPrompt, NEVER_WRITE, PLACE_OF_WORSHIP, DIASPORA_TRADITIONS } from "./brief";

describe("claims registry", () => {
  it("every claim has a unique id, a statement and the evidence it rests on", () => {
    expect(new Set(PRODUCT_CLAIMS.map((c) => c.id)).size).toBe(PRODUCT_CLAIMS.length);
    for (const claim of PRODUCT_CLAIMS) {
      expect(claim.statement.length).toBeGreaterThan(10);
      expect(claim.evidence.length).toBeGreaterThan(20);
    }
  });

  it("the claims that cannot be made today are kept visible, not dropped: Kul, Mandali and ad-free", () => {
    expect(unconfirmedClaims().map((c) => c.id).sort()).toEqual(["ad_free", "kul_family_space", "mandali_community"]);
    for (const claim of unconfirmedClaims()) expect(claim.evidence).toMatch(/\S/);
    expect(confirmedClaims().length + unconfirmedClaims().length).toBe(PRODUCT_CLAIMS.length);
  });

  it("the temples claim always says coverage is still growing", () => {
    expect(claimById("temples_directory")?.statement).toMatch(/still growing/);
  });
});

describe("pillars", () => {
  it("ids are unique and every pillar has all its parts", () => {
    expect(new Set(PILLARS.map((p) => p.id)).size).toBe(PILLARS.length);
    for (const pillar of PILLARS) {
      for (const field of [pillar.title, pillar.audience, pillar.insight, pillar.message]) expect(field.length).toBeGreaterThan(15);
      expect(pillar.claims.length).toBeGreaterThan(0);
    }
  });

  it("no pillar leans on a claim that is not confirmed, or that does not exist", () => {
    for (const pillar of PILLARS) {
      for (const id of pillar.claims) {
        const claim = claimById(id);
        expect(claim, `${pillar.id} names unknown claim ${id}`).toBeDefined();
        expect(claim?.status, `${pillar.id} uses unconfirmed claim ${id}`).toBe("confirmed");
      }
    }
  });

  it("only the festival pillar needs an occasion", () => {
    expect(PILLARS.filter((p) => p.needsOccasion).map((p) => p.id)).toEqual(["festival_season_ahead"]);
  });

  it("an unknown id is not found", () => {
    expect(pillarById("nope")).toBeUndefined();
  });
});

describe("regions", () => {
  it("are guidance on tone, never statements of fact: no figures and no claims about places of worship", () => {
    for (const region of REGIONS) {
      expect(region.writeFor).not.toMatch(/\d/);
      expect(region.writeFor).not.toMatch(/million|thousand|largest|biggest|most|limited|few |no (temples|gurdwaras)/i);
    }
    expect(regionById("uk")?.spelling).toBe("British");
    expect(regionById("usa")?.spelling).toBe("American");
  });
});

describe("buildDiasporaStrategyPrompt", () => {
  const pillar = pillarById("a_small_daily_anchor")!;
  const region = regionById("uk")!;

  it("states who it is for, the region's spelling, the feeling and the message", () => {
    const prompt = buildDiasporaStrategyPrompt({ pillar, region, tradition: null });
    expect(prompt).toContain(pillar.audience);
    expect(prompt).toContain("United Kingdom");
    expect(prompt).toContain("British English");
    expect(prompt).toContain(pillar.insight);
    expect(prompt).toContain(pillar.message);
  });

  it("lists exactly the pillar's confirmed facts and nothing from the unconfirmed ones", () => {
    const prompt = buildDiasporaStrategyPrompt({ pillar, region, tradition: null });
    for (const id of pillar.claims) expect(prompt).toContain(claimById(id)!.statement);
    for (const claim of unconfirmedClaims()) expect(prompt).not.toContain(claim.statement);
  });

  it("every 'never write' rule is in the brief", () => {
    const prompt = buildDiasporaStrategyPrompt({ pillar, region, tradition: null });
    for (const rule of NEVER_WRITE) expect(prompt).toContain(rule);
  });

  it("uses each tradition's own word for its place of worship, and never mixes them up", () => {
    for (const tradition of DIASPORA_TRADITIONS) {
      const prompt = buildDiasporaStrategyPrompt({ pillar, region, tradition });
      expect(prompt).toContain(PLACE_OF_WORSHIP[tradition]);
    }
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: "sikh" })).toContain("gurdwara");
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: "sikh" })).not.toContain("mandir");
  });

  it("with no tradition it says never to imply the traditions are the same", () => {
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: null })).toMatch(/interchangeable/);
  });

  it("an occasion pillar tells the writer to use the verified name and date exactly", () => {
    const festival = pillarById("festival_season_ahead")!;
    expect(buildDiasporaStrategyPrompt({ pillar: festival, region, tradition: null })).toMatch(/verified source block/);
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: null })).not.toMatch(/verified source block/);
  });

  it("corrections from a failed attempt are included, and absent otherwise", () => {
    const withFix = buildDiasporaStrategyPrompt({ pillar, region, tradition: null, corrections: ["Do not state any percentage. (you wrote: \"90%\")"] });
    expect(withFix).toContain("Your previous attempt broke these rules");
    expect(withFix).toContain("90%");
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: null })).not.toContain("previous attempt");
  });

  it("is deterministic", () => {
    expect(buildDiasporaStrategyPrompt({ pillar, region, tradition: "jain" })).toBe(buildDiasporaStrategyPrompt({ pillar, region, tradition: "jain" }));
  });
});
