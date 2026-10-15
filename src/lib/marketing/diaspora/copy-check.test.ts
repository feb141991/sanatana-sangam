import { describe, it, expect } from "vitest";
import { checkDiasporaCopy, checkVariantCopy, type CopyRule } from "./copy-check";

const rules = (text: string, options = {}) => checkDiasporaCopy(text, options).map((v) => v.rule);

describe("clean copy passes", () => {
  it.each([
    "Keep a few steady minutes in a full day. Open Shoonaya and begin with a japa mala and the day's shloka.",
    "When your family lives in different places, the day of a festival can feel uncertain. Set your city and check it in one place.",
    "Tirtha lists temples and gurdwaras in many cities, and coverage is still growing.",
    "Your optional analytics and email stay off until you turn them on.",
    "Pathshala has learning paths and lessons you can open privately."
  ])("%s", (text) => expect(checkDiasporaCopy(text)).toEqual([]));
});

describe("each rule catches what it is for", () => {
  it.each<[CopyRule, string]>([
    ["indic_script", "Begin each morning with कर्मण्येवाधिकारस्ते"],
    ["indic_script", "ਸਤਿ ਨਾਮੁ with your family"],
    ["statistic", "Join 10,000 families keeping the tradition"],
    ["statistic", "Used by 2k users across the world"],
    ["statistic", "Thousands of households trust it"],
    ["statistic", "millions of people"],
    ["statistic", "Nine in ten feel closer: 90% say so"],
    ["social_proof", "Trusted by families everywhere"],
    ["social_proof", "The #1 app for dharma"],
    ["social_proof", "An award-winning app"],
    ["social_proof", "Top-rated by parents"],
    ["attributed_quote", "“This app brought my whole family closer to our roots” — Priya, London"],
    ["overclaim", "Never miss a festival again"],
    ["overclaim", "The most accurate panchang"],
    ["overclaim", "Guaranteed to get the day right"],
    ["outcome_promise", "It will bring you peace"],
    ["outcome_promise", "A practice that heals"],
    ["scripture_attribution", "The Gita teaches us to let go"],
    ["scripture_attribution", "According to the Vedas, the morning is sacred"],
    ["scripture_attribution", "As the scriptures say, begin with stillness"],
    ["unconfirmed_feature", "Start a Kul for your whole family"],
    ["unconfirmed_feature", "Meet people in your city through Mandali"],
    ["unconfirmed_feature", "A 100% ad-free sanctuary"],
    ["unconfirmed_feature", "Completely free forever"],
    ["unconfirmed_feature", "Zero-tracking by design"],
    ["store_availability", "Now on Google Play"],
    ["store_availability", "Download the Android app"],
    ["date_or_time", "Sunrise is at 6:42 where you live"],
    ["date_or_time", "Light the lamp at 7 pm"],
    ["date_or_time", "Karwa Chauth falls on 29 October"],
    ["date_or_time", "On November 8 we light diyas"],
    ["date_or_time", "Mark 2026-11-08 in your calendar"],
    ["date_or_time", "See you on 08/11/2026"]
  ])("%s: %s", (rule, text) => {
    expect(rules(text), text).toContain(rule);
  });
});

describe("dates: only the verified occasion's own date may appear", () => {
  it("the occasion's date is allowed in every written form", () => {
    for (const text of ["It falls on 8 November.", "It falls on 8th November.", "It falls on 8th of November.", "It falls on November 8.", "It falls on Nov 8.", "Marked as 2026-11-08."]) {
      expect(checkDiasporaCopy(text, { occasionDate: "2026-11-08" }), text).toEqual([]);
    }
  });

  it("any other date is refused even when an occasion is given", () => {
    expect(rules("It falls on 9 November.", { occasionDate: "2026-11-08" })).toContain("date_or_time");
    expect(rules("It falls on 8 December.", { occasionDate: "2026-11-08" })).toContain("date_or_time");
    expect(rules("Marked as 2026-11-09.", { occasionDate: "2026-11-08" })).toContain("date_or_time");
  });

  it("a clock time is refused whatever the occasion", () => {
    expect(rules("Puja at 6:30 on 8 November", { occasionDate: "2026-11-08" })).toContain("date_or_time");
  });

  it("a malformed occasion date allows no date at all", () => {
    expect(rules("It falls on 8 November.", { occasionDate: "soon" })).toContain("date_or_time");
  });

  it("'may' as an ordinary word is not read as a month", () => {
    expect(checkDiasporaCopy("You may open it any time.")).toEqual([]);
  });
});

describe("Android", () => {
  it("is refused while there is no public listing, and allowed once there is", () => {
    expect(rules("Get it for Android")).toContain("store_availability");
    expect(checkDiasporaCopy("Get it for Android", { androidPublic: true })).toEqual([]);
  });
});

describe("reporting", () => {
  it("returns a plain-language message and the offending text for each violation", () => {
    const [violation] = checkDiasporaCopy("Join 10,000 families today");
    expect(violation.message).toMatch(/number of users/i);
    expect(violation.excerpt).toContain("10,000");
  });

  it("reports one entry per rule and excerpt, not duplicates", () => {
    const v = checkDiasporaCopy("Join 10,000 families. Join 10,000 families.");
    expect(v.filter((x) => x.rule === "statistic" && x.excerpt.includes("10,000")).length).toBeLessThanOrEqual(1);
  });

  it("checkVariantCopy covers the subject, the body and the button text, not just the body", () => {
    expect(checkVariantCopy({ subject: "Trusted by thousands", body: "Fine body.", cta_text: "Open" }).length).toBeGreaterThan(0);
    expect(checkVariantCopy({ subject: "Fine", body: "Fine body.", cta_text: "Never miss a day" }).length).toBeGreaterThan(0);
    expect(checkVariantCopy({ subject: "Fine", body: "Fine body.", cta_text: "Open Shoonaya" })).toEqual([]);
    expect(checkVariantCopy({ body: "Fine body." })).toEqual([]);
  });
});
