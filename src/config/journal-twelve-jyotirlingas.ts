// ============================================================================
// Journal essay: The Twelve Jyotirlingas — Sacred Geography of Shiva Devotion
//
// Grounded in the Shiva Purana (Kotirudra Samhita) and Dwadasha Jyotirlinga
// Smaranam.
// ============================================================================

import type { JournalEssay } from "./journal";

export const jyotirlingasEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "twelve-jyotirlingas-sacred-geography-of-shiva-devotion",
  title: "The Twelve Jyotirlingas: Sacred Geography of Shiva Devotion",
  subtitle:
    "How the Shiva Purana's Kotirudra Samhita and the Dwadasha Jyotirlinga Stotra weave twelve temples across India into one contemplative map of light.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Puranic Traditions & Pilgrimage Desk",
  authorBio:
    "Documenting classical Tirtha traditions and temple lineages grounded in Puranic and Agamic texts.",
  publishedDate: "November 2026",
  emblem: "/relics/vibhuti-ash.png",
  excerpt:
    "From Somnath on the Arabian Sea to Kedarnath in the Garhwal Himalayas and Rameswaram at the southern tip, the twelve Jyotirlingas trace a sacred geography of Shiva devotion.",
  keyTakeaways: [
    "In the Shiva Purana (Kotirudra Samhita, Chapters 14–33), Jyotirlingas are revered as self-manifest pillars of infinite light (Jyoti).",
    "Reciting the Dwadasha Jyotirlinga Smaranam morning and evening turns distant shrines into an inward daily pilgrimage.",
    "The twelve shrines span coastal, riverine, forest, and high-Himalayan landscapes across western, central, northern, eastern, and southern India.",
    "Some traditional site identifications—such as Vaidyanath and Bhimashankar—carry regional lineages honored across multiple states.",
  ],
  sections: [
    {
      heading: "Columns of Infinite Light",
      highlights: [
        { label: "Sacred Shrines", value: "12 Jyotirlingas", note: "Across 5 regions of India" },
        { label: "Primary Text", value: "Kotirudra Samhita", note: "Shiva Purana, Ch. 14–33" },
        { label: "Daily Hymn", value: "Dwadasha Smaranam", note: "Morning & evening remembrance" },
      ],
      paragraphs: [
        "In Shaiva Puranic lore, a Jyotirlinga is not merely a carved stone emblem, but a place where Shiva manifested as an unmeasured column of radiant light (Jyoti). The Shiva Purana's Kotirudra Samhita devotes twenty chapters to the origins, legends, and worship of these twelve paramount sanctuaries.",
        "Rather than confining sacredness to one region, the tradition links seaside cliffs, central Indian river valleys, and Himalayan snow peaks into a single devotional mandala. For seekers unable to travel, reciting their twelve names at dawn and dusk serves as a mental pilgrimage (Manasa Tirtha).",
      ],
      quote: {
        text: "सौराष्ट्रे सोमनाथं च श्रीशैले मल्लिकार्जुनम् । उज्जयिन्यां महाकालमोङ्कारममलेश्वरम् ॥",
        source: "Dwadasha Jyotirlinga Smaranam, Verse 1",
        context:
          "Invoking Somnath in Saurashtra, Mallikarjuna at Srisailam, Mahakala in Ujjain, and Omkareshwar on the Narmada.",
      },
    },
    {
      heading: "The Twelve Jyotirlingas by Region",
      paragraphs: [
        "Filter by region below to trace how the twelve shrines anchor the cardinal directions of the subcontinent, noting traditional regional lineages where more than one shrine preserves a cherished claim.",
      ],
      table: {
        caption: "Classical order of the twelve Jyotirlingas in the Kotirudra Samhita",
        columns: ["#", "Jyotirlinga", "Traditional Location", "Region", "Puranic Association"],
        filterColumnIndex: 3,
        rows: [
          ["1", "Somnath", "Prabhas Patan, Saurashtra (Gujarat)", "West", "Chandra's penance & restoration (Ch. 14)"],
          ["2", "Mallikarjuna", "Srisailam (Andhra Pradesh)", "South", "Shiva & Parvati's visit to Kartikeya (Ch. 15)"],
          ["3", "Mahakaleshwar", "Ujjain (Madhya Pradesh)", "Central", "Lord of Time protecting devotees (Ch. 16–17)"],
          ["4", "Omkareshwar", "Mandhata Island, Narmada (Madhya Pradesh)", "Central", "Boon to the Vindhya mountain (Ch. 18)"],
          ["5", "Kedarnath", "Rudraprayag, Himalayas (Uttarakhand)", "North", "Tapasya of Nara and Narayana (Ch. 19)"],
          ["6", "Bhimashankar", "Sahyadri Hills, Pune (Maharashtra)", "West", "Victory over the demon Bhima (Ch. 20–21)"],
          ["7", "Kashi Vishwanath", "Varanasi (Uttar Pradesh)", "North", "Eternal presence in Avimukta Kashi (Ch. 22–23)"],
          ["8", "Trimbakeshwar", "Near Nashik, Godavari source (Maharashtra)", "West", "Sage Gautama's devotion (Ch. 24–28)"],
          ["9", "Vaidyanath", "Deoghar (Jharkhand) / Parli (Maharashtra)", "East", "Ravana's penance; revered healer lineage"],
          ["10", "Nageshwar", "Darukavana, near Dwarka (Gujarat)", "West", "Protection of devotees in Daruka forest"],
          ["11", "Rameswaram", "Rameswaram Island (Tamil Nadu)", "South", "Linga consecrated by Sri Rama at Setubandha"],
          ["12", "Grishneshwar", "Verul, near Ellora (Maharashtra)", "West", "Devotion of Ghushma at Shivalaya"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Honoring the Jyotirlinga Tradition",
    steps: [
      "Recite the four verses of the Dwadasha Jyotirlinga Smaranam quietly after your morning or evening bath as a contemplative remembrance.",
      "If applying sacred vibhuti (bhasma) on the forehead, use a small pinch externally from clean, pure sources; avoid inhaling loose ash dust or ingesting unverified ash preparations.",
      "When planning high-altitude or physically demanding yatras such as Kedarnath, obtain medical clearance if you have heart or respiratory conditions, acclimatize gradually, and carry warm layers.",
      "Approach temple queues and abhishekam darshan with patience, treating fellow pilgrims with quiet courtesy.",
    ],
  },
  citations: [
    {
      text: "Shiva Purana, Kotirudra Samhita (Chapters 1 & 14–33)",
      reference:
        "Classical Puranic narration of the twelve Jyotirlingas and their origins (Dwadasha Jyotirlinga Mahatmya).",
    },
    {
      text: "Dwadasha Jyotirlinga Smaranam (Stotra)",
      reference:
        "Traditional four-verse Sanskrit hymn enumerating the twelve Jyotirlingas for morning and evening recitation.",
    },
  ],
  relatedSlugs: [
    "maha-shivratri-nishita-kaal-and-four-pahar-puja",
    "architecture-of-silence-ancient-mandirs",
    "kumbh-2027-haridwar-nashik-official-dates",
  ],
};
