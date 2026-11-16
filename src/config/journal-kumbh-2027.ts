// ============================================================================
// Journal essay: the two Kumbh gatherings of 2027 (Haridwar; Nashik–Trimbakeshwar).
//
// Every date and every factual line is read from
// packages/dharma-rules/src/melas/mela-schedule.json, the same file the Native app's
// Kumbh pages are generated from, so the website and the app cannot disagree. That
// file transcribes the state Mela authorities' official websites (read 2026-11-14).
// Unconfirmed days are named as unconfirmed, never listed as bathing days.
//
// Published 2026-11-15, reviewed and approved by Pt. Prince Sharma (see
// isPublishableJournalEssay in ./journal). If a
// date in the schedule changes, re-check the essay before the next deploy.
// ============================================================================

import scheduleJson from "../../packages/dharma-rules/src/melas/mela-schedule.json";
import type { JournalEssay } from "./journal";

type Day = { date: string; title: string; kind: string; place: string; status: string; note?: string };
type Ref = { sourceName: string; publisher?: string; pageOrSection?: string; url?: string };
type TextField = { value: { en: string }; sourceRefs: Ref[] };
type ListField = { value: { en: string[] }; sourceRefs: Ref[] };
type Mela = {
  slug: string;
  periodStart: string | null;
  periodEnd: string | null;
  officialUrl: string;
  name: TextField;
  tagline: TextField;
  significance: TextField;
  places: ListField;
  rituals: ListField;
  guidance?: ListField;
  days: Day[];
};

const schedule = scheduleJson as unknown as { accessedOn: string; melas: Mela[] };

function mela(slug: string): Mela {
  const found = schedule.melas.find((m) => m.slug === slug);
  if (!found) throw new Error(`mela-schedule.json has no ${slug}`);
  return found;
}

/** A civil date at the mela, named as that calendar day (no time-zone shift). */
export function formatMelaDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${iso}T00:00:00Z`));
}

function dayLine(day: Day): string {
  const label =
    day.kind === "principal_amrit_snan" ? " (principal Amrit Snan)" :
    day.kind === "amrit_snan" ? " (Amrit Snan)" : "";
  return `${formatMelaDate(day.date)}: ${day.title}${label}, ${day.place}.`;
}

const haridwar = mela("haridwar-kumbh-2027");
const nashik = mela("nashik-trimbakeshwar-simhastha-2027");
const confirmed = (m: Mela) => m.days.filter((d) => d.status === "confirmed");
const unconfirmed = (m: Mela) => m.days.filter((d) => d.status === "unconfirmed");

function citationsFor(melas: Mela[]): JournalEssay["citations"] {
  const seen = new Set<string>();
  const out: JournalEssay["citations"] = [];
  for (const m of melas) {
    for (const field of [m.name, m.tagline, m.significance, m.places, m.rituals, m.guidance]) {
      for (const ref of field?.sourceRefs ?? []) {
        const key = ref.url ?? ref.sourceName;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          text: `${ref.sourceName}${ref.pageOrSection ? `, ${ref.pageOrSection}` : ""}`,
          reference: `${ref.publisher ?? ref.sourceName}. ${ref.url ?? ""} (read ${formatMelaDate(schedule.accessedOn)})`.trim(),
        });
      }
    }
  }
  return out;
}

const pendingNotes = unconfirmed(haridwar).map(
  (d) => `${formatMelaDate(d.date)} (${d.title}) appears on Haridwar's official website as an Amrit Snan, but it was not in the earlier announcements by the Mela Officer or the Chief Minister. We have left it out of the list above until a dated notice confirms it.`,
);

export const kumbh2027Essay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-15T12:00:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-15T12:00:00.000Z",
    sourcesVerified: true,
  },
  slug: "kumbh-2027-haridwar-nashik-official-dates",
  title: "Kumbh 2027: The Official Bathing Days at Haridwar and Nashik–Trimbakeshwar",
  subtitle: "Two Kumbh gatherings fall in 2027, on the Ganga and on the Godavari. Here are the dates the state Mela authorities have published, and what happens on them.",
  tradition: "Sanatan Dharma",
  traditionColor: "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "6 min read",
  author: "Shoonaya Editorial",
  authorRole: "Compiled from the official Mela authority websites",
  authorBio: `Dates and details are taken from the official Kumbh websites of the Government of Uttarakhand and the Government of Maharashtra, read on ${formatMelaDate(schedule.accessedOn)}.`,
  publishedDate: "November 2026",
  emblem: "/relics/ganga-kalash.png",
  excerpt: `${haridwar.tagline.value.en} ${nashik.tagline.value.en}`,
  keyTakeaways: [
    haridwar.tagline.value.en,
    nashik.tagline.value.en,
    "Every date here comes from the state Mela authorities' official websites. The authorities and the akharas make the final announcements.",
    "The Kumbh bath is traditionally taken with a sankalp, and followed by daan, japa, meditation and darshan.",
  ],
  sections: [
    {
      heading: "Two Kumbh gatherings in one year",
      paragraphs: [haridwar.significance.value.en, nashik.significance.value.en],
    },
    {
      heading: `${haridwar.name.value.en}: bathing days on the Ganga`,
      paragraphs: [
        ...haridwar.places.value.en,
        ...confirmed(haridwar).map(dayLine),
        ...pendingNotes,
      ],
    },
    {
      heading: `${nashik.name.value.en}: the Simhastha on the Godavari`,
      paragraphs: [
        ...nashik.places.value.en,
        ...confirmed(nashik).map(dayLine),
      ],
    },
    {
      heading: "What happens on a Kumbh bathing day",
      paragraphs: [...haridwar.rituals.value.en, ...nashik.rituals.value.en.filter((line) => !haridwar.rituals.value.en.includes(line))],
    },
  ],
  practiceGuidance: {
    title: "Before you travel",
    steps: [
      `Check the official websites before you set out: ${haridwar.officialUrl} for Haridwar and ${nashik.officialUrl} for Nashik–Trimbakeshwar. Dates and arrangements can change.`,
      ...(nashik.guidance?.value.en ?? []),
      "Make your sankalp before the bath, then follow it with daan, japa, meditation or darshan, as your own tradition and teacher guide you.",
    ],
  },
  citations: citationsFor([haridwar, nashik]),
  relatedSlugs: [],
};
