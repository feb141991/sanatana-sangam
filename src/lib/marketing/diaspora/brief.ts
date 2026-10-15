/**
 * Turns a pillar, a region and an optional tradition into the creative brief the copywriter is given.
 *
 * The brief does three jobs: it says who to write for and the feeling to write toward; it lists the ONLY product
 * facts the copy may lean on (confirmed claims, claims.ts); and it lists what must never appear. The same list is
 * enforced after the fact by copy-check.ts, because a model can ignore a brief and a checker cannot.
 */
import { claimById } from "./claims";
import type { Pillar } from "./pillars";
import type { Region } from "./regions";

export type DiasporaTradition = "hindu" | "sikh" | "buddhist" | "jain";
export const DIASPORA_TRADITIONS: readonly DiasporaTradition[] = ["hindu", "sikh", "buddhist", "jain"];

/** The word each tradition uses for its place of worship, so copy never calls a gurdwara a temple. */
export const PLACE_OF_WORSHIP: Record<DiasporaTradition, string> = {
  hindu: "mandir",
  sikh: "gurdwara",
  buddhist: "vihara",
  jain: "Jain temple (derasar)"
};

const TRADITION_NAME: Record<DiasporaTradition, string> = {
  hindu: "Hindu (Sanatan Dharma)",
  sikh: "Sikh",
  buddhist: "Buddhist",
  jain: "Jain"
};

/** What must never appear, in the words given to the writer. copy-check.ts enforces each of these. */
export const NEVER_WRITE: readonly string[] = [
  "any number of users, families, members, downloads, temples or cities, and words such as \"thousands\" or \"millions\"",
  "testimonials, quotes from people, awards, press mentions, \"trusted by\" or comparisons with other apps",
  "any scripture, verse, mantra or prayer text, or what a scripture \"says\" or \"teaches\"",
  "any date, day or clock time for a festival or vrat other than the one in the verified occasion (if there is one); never a sunrise, moonrise or muhurta time",
  "that Shoonaya is ad-free, tracks nothing or is free; that it has a family space (Kul) or a city community (Mandali); anything about Google Play or Android",
  "promises of outcomes such as peace, blessings, healing or certainty, and phrases such as \"never miss\", \"guaranteed\" or \"most accurate\"",
  "that the traditions are the same or interchangeable"
];

export interface BriefInput {
  pillar: Pillar;
  region: Region;
  tradition: DiasporaTradition | null;
  /** Rules the previous attempt broke, so the next one can avoid them. */
  corrections?: readonly string[];
}

export function buildDiasporaStrategyPrompt(input: BriefInput): string {
  const { pillar, region, tradition } = input;
  const facts = pillar.claims
    .map((id) => claimById(id))
    .filter((claim): claim is NonNullable<typeof claim> => claim !== undefined && claim.status === "confirmed")
    .map((claim) => `- ${claim.statement}`);

  const lines: string[] = [
    "DIASPORA CAMPAIGN BRIEF",
    `Who this is for: ${pillar.audience}. Picture ${region.writeFor}, in ${region.label}. Write in ${region.spelling} English.`
  ];

  if (tradition) {
    lines.push(
      `Tradition focus: ${TRADITION_NAME[tradition]}. Speak in this tradition's own words (its place of worship is a ${PLACE_OF_WORSHIP[tradition]}) and do not describe it in another tradition's terms.`
    );
  } else {
    lines.push("Tradition focus: none in particular. Never imply the traditions are interchangeable.");
  }

  lines.push(
    `The feeling to write toward (do not state it as a fact, a statistic or a quote): ${pillar.insight}`,
    `The message: ${pillar.message}`,
    "",
    "Facts about Shoonaya you may rely on. Say no more than these and add no features:",
    ...facts,
    "",
    "Never write:",
    ...NEVER_WRITE.map((rule) => `- ${rule}`),
    "",
    "Tone: warm, calm, specific and brief. Speak to one person. No exclamation marks and no emoji."
  );

  if (pillar.needsOccasion) {
    lines.push(
      "",
      "This is about one specific festival or vrat. Its name and date are given in the verified source block: use them exactly as given and add nothing about them."
    );
  }

  if (input.corrections && input.corrections.length > 0) {
    lines.push("", "Your previous attempt broke these rules. Fix every one:", ...input.corrections.map((c) => `- ${c}`));
  }

  return lines.join("\n");
}
