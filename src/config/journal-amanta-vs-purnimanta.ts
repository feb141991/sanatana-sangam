// ============================================================================
// Journal essay: Amanta vs Purnimanta — Why Hindu Month Names Differ
// Evergreen guide to Shukla vs Krishna Paksha lunar month boundaries.
// Reviewed for Pramana, Ritual/Safety, and editorial publication.
// ============================================================================

import type { JournalEssay } from "./journal";

export const amantaPurnimantaEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "amanta-vs-purnimanta-why-lunar-month-names-differ",
  title: "Amanta vs Purnimanta: Why Hindu Month Names Differ Across India",
  subtitle:
    "Why a single Krishna Paksha day carries two different month names between North and South India—and why festival dates still stay aligned.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Panchang & Regional Tradition Desk",
  authorBio:
    "Compiled from classical Dharmashastra conventions, the Positional Astronomy Centre's Rashtriya Panchang, and Shoonaya's regional calendar profiles.",
  publishedDate: "November 2026",
  emblem: "/relics/clay-kalash.png",
  excerpt:
    "Amanta calendars end each lunar month on Amavasya, while Purnimanta calendars end on Purnima. During Krishna Paksha, the month label shifts by one—yet the Moon phase and festival day remain the same.",
  keyTakeaways: [
    "Both systems track the exact same lunar Tithis and solar seasons; only the boundary point where a month name increments differs.",
    "In Shukla Paksha (Pratipada to Purnima), Amanta and Purnimanta month names match 100% of the time.",
    "In Krishna Paksha (the waning fortnight), Purnimanta calendars (North India) already carry the upcoming month's name, whereas Amanta calendars (South and West India) retain the current month's name until Amavasya.",
  ],
  sections: [
    {
      heading: "Same Moon, Different Month Boundary",
      highlights: [
        { label: "Amanta Ending", value: "Amavasya", note: "Shukla Paksha comes first" },
        { label: "Purnimanta Ending", value: "Purnima", note: "Krishna Paksha comes first" },
        { label: "Shukla Paksha Agreement", value: "Identical", note: "All waxing fortnights match" },
      ],
      paragraphs: [
        "Families comparing Panchangs across regions often notice a puzzling discrepancy: on the same morning in the waning half of the moon, a calendar in Varanasi may read Kartik Krishna Paksha while one in Pune reads Ashwin Krishna Paksha. Neither calendar is mistaken about the sky—only their month-ending rule differs.",
        "Amanta (literally 'ending at Amavasya') begins each month after the New Moon, placing the waxing Shukla Paksha first and the waning Krishna Paksha second. Purnimanta ('ending at Purnima') begins right after the Full Moon, placing Krishna Paksha first and Shukla Paksha second.",
      ],
    },
    {
      heading: "Comparing Amanta and Purnimanta Across Regions & Festivals",
      paragraphs: [
        "Because both systems agree completely throughout Shukla Paksha, waxing-fortnight and Full Moon festivals—such as Rama Navami, Guru Purnima, and Raksha Bandhan—share the same month name nationwide. Only Krishna Paksha observances like Janmashtami, Diwali Amavasya, and Maha Shivratri carry shifted month labels.",
      ],
      table: {
        caption: "Structural rules, regional adoption, and festival naming in Amanta vs Purnimanta calendars",
        columns: ["Topic", "Amanta (Amavasyanta)", "Purnimanta", "Scope"],
        filterColumnIndex: 3,
        rows: [
          ["Month Boundary", "Ends on New Moon (Amavasya)", "Ends on Full Moon (Purnima)", "Calendar Rule"],
          ["Fortnight Order", "Shukla Paksha → Krishna Paksha", "Krishna Paksha → Shukla Paksha", "Calendar Rule"],
          ["Primary Regions", "Maharashtra, Gujarat, Karnataka, Andhra, Telangana", "Uttar Pradesh, Bihar, Madhya Pradesh, Rajasthan, Delhi, Punjab", "Regional Usage"],
          ["Krishna Janmashtami", "Shravana Krishna Ashtami", "Bhadrapada Krishna Ashtami", "Festival Example"],
          ["Diwali (Lakshmi Puja)", "Ashwin Amavasya (Kartik begins next day)", "Kartik Amavasya", "Festival Example"],
          ["Maha Shivratri", "Magha Krishna Chaturdashi", "Phalguna Krishna Chaturdashi", "Festival Example"],
          ["Holi / Guru Purnima", "Phalguna Purnima / Ashadha Purnima", "Phalguna Purnima / Ashadha Purnima (identical)", "Festival Example"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Navigating Regional Month Names Without Confusion",
    steps: [
      "Choose the calendar profile that matches your family or temple lineage (Amanta or Purnimanta) in Shoonaya's calendar settings.",
      "When coordinating fasts or Sankalpas with relatives in another state, confirm the Paksha and Tithi alongside the month name so Krishna Paksha labels are not misread as a different date; observe any associated fasts only as your health permits, consulting a physician if you manage chronic conditions, are pregnant, or take regular medication.",
      "Remember that local sunrise (Udaya Tithi) or moonrise—not the month-naming convention—determines the actual calendar date of an observance in your city.",
    ],
  },
  citations: [
    {
      text: "Rashtriya Panchang & Report of the Calendar Reform Committee (1955)",
      reference: "Positional Astronomy Centre, India Meteorological Department; Council of Scientific and Industrial Research, Government of India (Amanta and Purnimanta conventions).",
    },
    {
      text: "Nirnaya Sindhu & Dharmasindhu: Masa-Nirnaya (Amanta vs Purnimanta Usage)",
      reference: "Kamalakara Bhatta, Nirnaya Sindhu; Kashinatha Upadhyaya, Dharmasindhu.",
    },
    {
      text: "Surya Siddhanta: Lunar Months and Synodic Fortnights",
      reference: "Translated by Rev. Ebenezer Burgess, Motilal Banarsidass Publishers.",
    },
  ],
  relatedSlugs: [
    "the-global-tithi-discrepancy-astronomy-and-timezones",
    "amavasya-vs-purnima-navigating-lunar-polarities-and-consciousness",
    "rhythm-of-sacred-time-panchang",
  ],
};
