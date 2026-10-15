import { describe, it, expect } from "vitest";
import {
  assessCorpus,
  assessEntry,
  buildPool,
  dayNumber,
  detectScript,
  GITA_MORNING_IDS,
  pickMorningVerse,
  poolSize,
  translationCreditFor,
  type CorpusEntry
} from "./verse-sources";
import { MORNING_TRADITIONS } from "./types";
import { DHAMMAPADA_ENTRIES } from "@/lib/data/buddhist-dhammapada";
import { METTA_SUTTA_ENTRIES } from "@/lib/data/buddhist-metta-sutta";
import { NAMOKAR_ENTRIES } from "@/lib/data/jain-namokar";
import { TATTVARTHA_ENTRIES } from "@/lib/data/jain-tattvartha-sutra";
import { BHAKTAMAR_ENTRIES } from "@/lib/data/jain-bhaktamar-stotra";

const good = (over: Partial<CorpusEntry> = {}): CorpusEntry => ({
  id: "x-1",
  source: "Test Text 1.1",
  original: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।",
  meaning: "To work alone thou hast the right.",
  attribution: "Test attribution",
  tags: [],
  ...over
});
const none = new Set<string>();

describe("detectScript", () => {
  it("tells the scripts apart, and does not count the shared danda marks as a script", () => {
    expect(detectScript("कर्म")).toBe("devanagari");
    expect(detectScript("ਸਤਿ ਨਾਮੁ")).toBe("gurmukhi");
    expect(detectScript("ਸਤਿ ਨਾਮੁ ॥")).toBe("gurmukhi"); // the double danda is shared
    expect(detectScript("कर्म ਸਤਿ")).toBe("mixed");
    expect(detectScript("Namo Arihantanam")).toBe("latin");
    expect(detectScript("॥ ।")).toBe("none");
  });
});

describe("assessEntry: each rule on its own", () => {
  it("a clean entry has no problems", () => {
    expect(assessEntry(good(), none, ["devanagari"])).toEqual([]);
  });

  it("rejects a missing or tiny original", () => {
    expect(assessEntry(good({ original: "" }), none)).toContain("original_missing_or_short");
    expect(assessEntry(good({ original: "कर्म" }), none)).toContain("original_missing_or_short");
  });

  it("rejects an original too long for the card", () => {
    expect(assessEntry(good({ original: "कर्मण्येव ".repeat(40) }), none)).toContain("original_too_long");
    expect(assessEntry(good({ original: ["कर्मण्येवाधि", "कारस्ते", "मा फलेषु", "कदाचन", "पाँचवीं पंक्ति"].join("\n") }), none)).toContain("original_too_long");
  });

  it("rejects mixed scripts, the sign of a corrupted entry", () => {
    expect(assessEntry(good({ original: "णਮੋ ਅਰिहंताणੰ ॥" }), none)).toContain("mixed_scripts");
  });

  it("rejects a script the card cannot set (Roman text)", () => {
    expect(assessEntry(good({ original: "Manopubbangama dhamma manasettha" }), none)).toContain("unsupported_script");
  });

  it("rejects the wrong script for the tradition: Prakrit stored in Gurmukhi, a shabad stored in Devanagari", () => {
    expect(assessEntry(good({ original: "ਤਿੱਥਯਰ ਨਮੋ ਤਿੱਥਯਰ" }), none, ["devanagari"])).toContain("script_not_expected");
    expect(assessEntry(good(), none, ["gurmukhi"])).toContain("script_not_expected");
    expect(assessEntry(good({ original: "ਸੋਚੈ ਸੋਚਿ ਨ ਹੋਵਈ ਜੇ ਸੋਚੀ ਲਖ ਵਾਰ ॥" }), none, ["gurmukhi"])).toEqual([]);
  });

  it.each([
    "Romanized Pali text.",
    "Authentic Pali verse covering the subject of twin-verses.",
    "In praise of Lord Adinath. Meaning for verse 1 goes here.",
    "Placeholder for individual lines in Prakrit",
    "lorem ipsum dolor",
    "TODO translate",
    "TBD"
  ])("rejects filler text in a displayed field: %s", (filler) => {
    expect(assessEntry(good({ meaning: filler }), none)).toContain("placeholder_text");
    expect(assessEntry(good({ transliteration: filler }), none)).toContain("placeholder_text");
    expect(assessEntry(good({ original: `कर्मण्येवाधिकारस्ते ${filler}` }), none)).toContain("placeholder_text");
  });

  it("rejects an entry whose original appears more than once in its corpus", () => {
    const corpus = [good({ id: "a" }), good({ id: "b" }), good({ id: "c", original: "मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥" })];
    const result = assessCorpus(corpus, ["devanagari"]);
    expect(result.usable.map((e) => e.id)).toEqual(["c"]);
    expect(result.problemCounts.duplicate_original).toBe(2);
  });

  it("rejects an entry with no attribution (it could not be cited)", () => {
    expect(assessEntry(good({ attribution: "" }), none)).toContain("no_attribution");
    expect(assessEntry(good({ attribution: undefined }), none)).toContain("no_attribution");
  });
});

describe("translationCreditFor: a translation is shown only when the corpus can say whose it is", () => {
  it("credits the public-domain Besant translation when the tags say so", () => {
    expect(translationCreditFor(good({ tags: ["gita", "public-domain-translation", "wikisource-besant"] }))).toBe(
      "Translation: Annie Besant (public domain)"
    );
  });

  it("gives no credit, so no translation, when the corpus does not record a translator or its rights", () => {
    expect(translationCreditFor(good({ tags: [] }))).toBeNull();
    expect(translationCreditFor(good({ tags: ["public-domain-translation"] }))).toBeNull();
    expect(translationCreditFor(good({ tags: ["japji", "gurbani"] }))).toBeNull();
  });
});

describe("picking a verse", () => {
  it("dayNumber counts whole days", () => {
    expect(dayNumber("1970-01-02") - dayNumber("1970-01-01")).toBe(1);
    expect(dayNumber("2026-10-16") - dayNumber("2026-10-15")).toBe(1);
  });

  it("is the same verse every time for one date, and different on the next", () => {
    for (const tradition of ["hindu", "sikh"] as const) {
      const a = pickMorningVerse(tradition, "2026-10-16");
      const b = pickMorningVerse(tradition, "2026-10-16");
      const next = pickMorningVerse(tradition, "2026-10-17");
      expect(a.ok && b.ok && next.ok).toBe(true);
      if (a.ok && b.ok && next.ok) {
        expect(a.verse).toEqual(b.verse);
        expect(next.verse.sourceRef).not.toBe(a.verse.sourceRef);
      }
    }
  });

  it("rotates through every verse in the pool before repeating", () => {
    for (const tradition of ["hindu", "sikh"] as const) {
      const size = poolSize(tradition);
      const seen = new Set<string>();
      for (let day = 0; day < size; day++) {
        const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
        const picked = pickMorningVerse(tradition, date);
        if (picked.ok) seen.add(picked.verse.sourceRef);
      }
      expect(seen.size).toBe(size);
    }
  });

  it("Hindu verses come only from the chosen list, in the corpus text", () => {
    for (let day = 0; day < 60; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const picked = pickMorningVerse("hindu", date);
      expect(picked.ok).toBe(true);
      if (picked.ok) {
        expect(GITA_MORNING_IDS).toContain(picked.verse.sourceRef);
        expect(picked.verse.translationCredit).toBe("Translation: Annie Besant (public domain)");
        expect(picked.verse.translation).toBeTruthy();
      }
    }
  });

  it("Sikh cards carry the original text only: there is no sourced English to show", () => {
    for (let day = 0; day < 40; day++) {
      const date = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const picked = pickMorningVerse("sikh", date);
      expect(picked.ok).toBe(true);
      if (picked.ok) {
        expect(picked.verse.script).toBe("gurmukhi");
        expect(picked.verse.translation).toBeNull();
        expect(picked.verse.translationCredit).toBeNull();
        expect(picked.verse.attribution).toBeTruthy();
      }
    }
  });
});

describe("what the real corpora allow today", () => {
  const YEAR = Array.from({ length: 400 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10));

  it("whatever is offered for any tradition on any day passes every check: single expected script, no filler, cited", () => {
    for (const tradition of MORNING_TRADITIONS) {
      for (const date of YEAR) {
        const picked = pickMorningVerse(tradition, date);
        if (!picked.ok) continue;
        const { verse } = picked;
        expect(verse.original.length).toBeGreaterThan(7);
        expect(["devanagari", "gurmukhi"]).toContain(verse.script);
        expect(verse.citation.length).toBeGreaterThan(0);
        expect(`${verse.original} ${verse.translation ?? ""}`).not.toMatch(/placeholder|goes here|covering the subject|romanized pali/i);
      }
    }
  });

  it("a withheld tradition says why", () => {
    for (const tradition of MORNING_TRADITIONS) {
      const picked = pickMorningVerse(tradition, "2026-10-16");
      if (!picked.ok) {
        expect(picked.reason).toBe("corpus_not_usable");
        expect(picked.detail).toMatch(/have /);
      }
    }
  });

  // These corpora are known to be unfit (placeholder meanings, repeated entries, mixed-script text). When one is
  // repaired and reviewed, update this test on purpose; until then they must never reach a card.
  it.each([
    ["Dhammapada", DHAMMAPADA_ENTRIES, ["devanagari"]],
    ["Metta Sutta", METTA_SUTTA_ENTRIES, ["devanagari"]],
    ["Namokar Mantra", NAMOKAR_ENTRIES, ["devanagari"]],
    ["Tattvartha Sutra", TATTVARTHA_ENTRIES, ["devanagari"]],
    ["Bhaktamar Stotra", BHAKTAMAR_ENTRIES, ["devanagari"]]
  ] as const)("%s is rejected: nothing in it may reach a card", (_name, entries, scripts) => {
    expect(assessCorpus(entries as unknown as CorpusEntry[], scripts).usable).toHaveLength(0);
  });

  it("the Gita and Japji Sahib have plenty to rotate through", () => {
    expect(poolSize("hindu")).toBeGreaterThanOrEqual(20);
    expect(poolSize("sikh")).toBeGreaterThanOrEqual(20);
  });

  it("buildPool follows the curated order for the Gita, whatever order the corpus is in", () => {
    const pool = buildPool({
      tradition: "hindu",
      label: "Hindu",
      scripts: ["devanagari"],
      corpora: [
        {
          name: "Test",
          entries: [good({ id: "b", original: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।" }), good({ id: "a", original: "मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥" })],
          only: ["a", "b"]
        }
      ]
    });
    expect(pool.usable.map((u) => u.entry.id)).toEqual(["a", "b"]);
  });
});
