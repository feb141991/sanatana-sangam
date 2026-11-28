// ============================================================================
// Journal essay: Ekadashi Calendar 2027 — All 25 Verified Dates & Parana Guide
//
// Grounded in Shoonaya's published `observance_occurrences` register for 2027
// (read 2026-11-28). Remains `pending_review` until human/Pramana/Ritual review.
// ============================================================================

import type { JournalEssay } from "./journal";

export const ekadashi2027Essay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:15:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:15:00.000Z",
    sourcesVerified: true,
  },
  slug: "ekadashi-dates-2027-complete-calendar-and-parana",
  title: "Ekadashi Calendar 2027: All 25 Verified Dates & Parana Guide",
  subtitle:
    "Every confirmed Ekadashi of 2027 in one filterable table, with Chaturmasya milestones and safe Parana principles.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Panchang & Vrata Desk",
  authorBio:
    "Compiled from Shoonaya's verified 2027 observance register (legacy-ujjain and north_indian_purnimanta profiles, read 28 November 2026).",
  publishedDate: "November 2026",
  emblem: "/relics/tulsi-leaf.png",
  excerpt:
    "All 25 verified Ekadashi dates in 2027—filterable by quarter—covering Vijaya, Amalaki, Devshayani, Devutthana, and Utpanna Ekadashi.",
  keyTakeaways: [
    "25 Ekadashi dates are confirmed in Shoonaya's 2027 register from 3 January through 23 December 2027.",
    "Devshayani Ekadashi (14 July 2027) opens Chaturmasya, and Devutthana Ekadashi (10 November 2027) concludes it.",
    "Smarta and Vaishnava traditions can differ by one day when Dashami overlaps sunrise (dashami-viddha); always verify your local Parana window.",
  ],
  sections: [
    {
      heading: "2027 Ekadashi Overview",
      highlights: [
        { label: "Total Ekadashis", value: "25 Dates", note: "Verified in 2027 register" },
        { label: "Chaturmasya Opens", value: "14 July 2027", note: "Devshayani Ekadashi" },
        { label: "Chaturmasya Closes", value: "10 November 2027", note: "Devutthana Ekadashi" },
      ],
      paragraphs: [
        "Ekadashi falls on the eleventh lunar day (tithi) of both the waxing (Shukla) and waning (Krishna) fortnights. In Vaishnava and Smarta practice alike, it is dedicated to Bhagavan Vishnu, mantra japa, and mindful restraint.",
        "Because the exact Parana (fast-breaking) window depends on when Dwadashi ends relative to local sunrise in your city, use this table as your year-long reference and check Shoonaya's Panchang on the morning of your fast.",
      ],
    },
    {
      heading: "All 25 Ekadashi Dates in 2027",
      paragraphs: [
        "Filter by quarter below to jump straight to upcoming Ekadashis.",
      ],
      table: {
        caption: "Complete 2027 Ekadashi calendar",
        columns: ["Date", "Observance", "Quarter", "Note"],
        filterColumnIndex: 2,
        rows: [
          ["3 January 2027", "Ekadashi (Pausha Krishna)", "Q1 (Jan–Mar)", "First Ekadashi of 2027"],
          ["19 January 2027", "Ekadashi (Pausha Shukla)", "Q1 (Jan–Mar)", "Waxing fortnight"],
          ["2 February 2027", "Ekadashi (Magha Krishna)", "Q1 (Jan–Mar)", "Waning fortnight"],
          ["17 February 2027", "Ekadashi (Magha Shukla)", "Q1 (Jan–Mar)", "Waxing fortnight"],
          ["3 March 2027", "Ekadashi (Phalguna Krishna)", "Q1 (Jan–Mar)", "Smarta / Ujjain reference"],
          ["4 March 2027", "Vijaya Ekadashi", "Q1 (Jan–Mar)", "North Indian Purnimanta profile"],
          ["18 March 2027", "Amalaki Ekadashi", "Q1 (Jan–Mar)", "Before Holi / Phalguna Purnima"],
          ["2 April 2027", "Ekadashi (Chaitra Krishna)", "Q2 (Apr–Jun)", "Waning fortnight"],
          ["17 April 2027", "Kamada Ekadashi", "Q2 (Apr–Jun)", "After Chaitra Navratri"],
          ["2 May 2027", "Ekadashi (Vaishakha Krishna)", "Q2 (Apr–Jun)", "Waning fortnight"],
          ["16 May 2027", "Ekadashi (Vaishakha Shukla)", "Q2 (Apr–Jun)", "Waxing fortnight"],
          ["1 June 2027", "Apara Ekadashi", "Q2 (Apr–Jun)", "Jyeshtha Krishna Ekadashi"],
          ["14 June 2027", "Ekadashi (Jyeshtha Shukla)", "Q2 (Apr–Jun)", "Waxing fortnight"],
          ["30 June 2027", "Ekadashi (Ashadha Krishna)", "Q2 (Apr–Jun)", "Waning fortnight"],
          ["14 July 2027", "Devshayani Ekadashi", "Q3 (Jul–Sep)", "Chaturmasya begins"],
          ["30 July 2027", "Kamika Ekadashi", "Q3 (Jul–Sep)", "Shravana Krishna Ekadashi"],
          ["12 August 2027", "Shravana Putrada Ekadashi", "Q3 (Jul–Sep)", "Shravana Shukla Ekadashi"],
          ["28 August 2027", "Aja Ekadashi", "Q3 (Jul–Sep)", "Bhadrapada Krishna Ekadashi"],
          ["11 September 2027", "Parivartini Ekadashi", "Q3 (Jul–Sep)", "Vamana Dwadashi follows"],
          ["26 September 2027", "Ekadashi (Ashwin Krishna)", "Q3 (Jul–Sep)", "During Pitru Paksha"],
          ["11 October 2027", "Ekadashi (Ashwin Shukla)", "Q4 (Oct–Dec)", "Following Sharad Navratri"],
          ["25 October 2027", "Rama Ekadashi", "Q4 (Oct–Dec)", "Precedes Diwali week"],
          ["10 November 2027", "Devutthana Ekadashi", "Q4 (Oct–Dec)", "Chaturmasya concludes"],
          ["24 November 2027", "Utpanna Ekadashi", "Q4 (Oct–Dec)", "Margashirsha Krishna Ekadashi"],
          ["9 December 2027", "Ekadashi (Margashirsha Shukla)", "Q4 (Oct–Dec)", "Waxing fortnight"],
          ["23 December 2027", "Ekadashi (Pausha Krishna)", "Q4 (Oct–Dec)", "Final Ekadashi of 2027"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Observing Ekadashi Safely",
    steps: [
      "Verify your city's exact Ekadashi date and Dwadashi Parana window in Shoonaya's Calendar before starting the fast.",
      "Observe a full or fruit-and-water (phalahara) fast only if you are in good health; anyone who is pregnant, elderly, or managing diabetes or other medical conditions should eat normally or consult a physician.",
      "Pair the day with extra japa, Vishnu Sahasranama or Gita reading, and quiet restraint rather than treating fasting as an endurance test.",
      "Break the fast (Parana) within the Dwadashi window after morning prayers and offering.",
    ],
  },
  citations: [
    {
      text: "Shoonaya 2027 Verified Observance Register (observance_occurrences)",
      reference:
        "25 published Ekadashi dates in 2027 (legacy-ujjain and north_indian_purnimanta profiles, read 28 November 2026).",
    },
    {
      text: "Garuda Purana & Padma Purana (Ekadashi Mahatmya)",
      reference: "Traditional Smarta and Vaishnava vrata guidelines on Ekadashi and Dwadashi Parana.",
    },
  ],
  relatedSlugs: [
    "the-complete-ekadashi-parana-guide-shastric-rules-and-timing",
    "2027-hindu-sikh-jain-festival-calendar-verified-dates",
    "dietary-purity-and-the-science-of-fasting-ayurvedic-autophagy",
  ],
};
