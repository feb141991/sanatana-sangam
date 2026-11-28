// ============================================================================
// Journal essay: Nitnem: The Daily Rhythm of the Five Banis
//
// Grounded in the Sikh Rehat Maryada (Chapter III, Article IV) and traditional
// Panthic Amrit Sanchar practice.
// ============================================================================

import type { JournalEssay } from "./journal";

export const nitnemEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "nitnem-the-daily-rhythm-of-five-banis",
  title: "Nitnem: The Daily Rhythm of the Five Banis",
  subtitle:
    "How morning, evening, and bedtime Gurbani anchors every transition of the Sikh day in remembrance and courage.",
  tradition: "Sikh Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Gurmat & Contemplative Practice Desk",
  authorBio:
    "Compiled from the SGPC Sikh Rehat Maryada and Sri Guru Granth Sahib Ji / Sri Dasam Granth sources.",
  publishedDate: "November 2026",
  emblem: "/relics/khanda-gold.png",
  excerpt:
    "Nitnem—literally 'daily rule'—frames morning awakening, sunset transition, and bedtime rest with seven sacred compositions spanning five morning Banis, Rehras Sahib, and Kirtan Sohila.",
  keyTakeaways: [
    "Morning Nitnem balances Guru Nanak Dev Ji's contemplative Japji Sahib and Guru Amar Das Ji's Anand Sahib with Guru Gobind Singh Ji's fearless Jaap Sahib, Tav-Prasad Savaiye, and Chaupai Sahib.",
    "Rehras Sahib marks dusk with gratitude after daily work, followed by Ardas.",
    "Kirtan Sohila closes the night before sleep with serenity and surrender.",
  ],
  sections: [
    {
      heading: "Sanctifying Morning, Dusk, and Night",
      highlights: [
        { label: "Morning", value: "5 Banis", note: "Japji · Jaap · Savaiye · Chaupai · Anand" },
        { label: "Evening", value: "Rehras Sahib", note: "Sunset transition + Ardas" },
        { label: "Bedtime", value: "Kirtan Sohila", note: "5 hymns before rest" },
      ],
      paragraphs: [
        "In Sikh Dharma, daily discipline does not withdraw a seeker from work or family; it threads Naam Simran through the natural hinges of the day. The Sikh Rehat Maryada (Chapter III, Article IV) sets the daily framework at Amrit Vela, sunset, and before sleep, while Panthic Amrit Sanchar discipline includes all five morning Banis.",
        "Together, these compositions cultivate saint-soldier (Sant-Sipahi) balance: stillness before Ik Onkar alongside moral courage in daily action.",
      ],
      quote: {
        text: "Aakhaa jeevaa visarai mar jaau.",
        source: "Sri Guru Granth Sahib Ji, Ang 9 (Raag Asa, Guru Nanak Dev Ji; Rehras Sahib)",
        context: "Chanting the Name, I live; forgetting it, my spirit withers — Guru Nanak Dev Ji",
      },
    },
    {
      heading: "The Complete Daily Nitnem Schedule",
      paragraphs: [
        "Each Bani carries a distinct mood—from philosophical awe in Japji Sahib and rhythmic praise of the Formless in Jaap Sahib, to protective prayer in Benti Chaupai and joy in Anand Sahib.",
      ],
      table: {
        caption: "Traditional Nitnem Banis across the day",
        columns: ["Bani", "Author / Source", "Time", "Core Focus"],
        filterColumnIndex: 2,
        rows: [
          ["Japji Sahib", "Guru Nanak Dev Ji (SGGS Ang 1–8)", "Morning", "Ik Onkar, Hukam, and spiritual ascent"],
          ["Jaap Sahib", "Guru Gobind Singh Ji (Dasam Granth)", "Morning", "199 verses praising the Timeless, Formless Creator"],
          ["Tav-Prasad Savaiye", "Guru Gobind Singh Ji (Dasam Granth)", "Morning", "Devotion beyond pride, wealth, or empty asceticism"],
          ["Benti Chaupai Sahib", "Guru Gobind Singh Ji (Dasam Granth)", "Morning", "Prayer for inner protection and refuge in Waheguru"],
          ["Anand Sahib", "Guru Amar Das Ji (SGGS Ang 917–922)", "Morning", "Spiritual bliss (Anand) in finding the True Guru"],
          ["Rehras Sahib", "SGGS & Dasam Granth anthology", "Evening", "Gratitude at dusk, So Dar & So Purakh, plus Ardas"],
          ["Kirtan Sohila", "Guru Nanak, Guru Ram Das, Guru Arjan (Ang 12–13)", "Bedtime", "Cosmic Aarti and peaceful surrender before sleep"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Building a Sustainable Daily Nitnem",
    steps: [
      "Start with one anchor window—such as Japji Sahib in the morning or Kirtan Sohila before bed—rather than rushing through all seven Banis without attention.",
      "Follow the Sikh Rehat Maryada's gentle guidance: if illness, travel, or urgent caregiving interrupts your morning routine, recite when you recover or find a quiet moment later in the day.",
      "Keep your gutka or digital device at comfortable eye level with adequate lighting to avoid neck and eye strain during longer recitations.",
      "Pause briefly after Rehras Sahib for a short Ardas of gratitude before shifting into evening family responsibilities.",
    ],
  },
  citations: [
    {
      text: "SGPC — Sikh Rehat Maryada, Chapter III (Article IV)",
      reference: "Specifies morning Nitnem, evening Sodar Rehras with Ardas, and bedtime Kirtan Sohila.",
    },
    {
      text: "Sri Guru Granth Sahib Ji (Angs 1–13, 917–922) & Sri Dasam Granth",
      reference: "Sources for Japji Sahib, Rehras selections, Kirtan Sohila, Anand Sahib, Jaap Sahib, Tav-Prasad Savaiye, and Chaupai Sahib.",
    },
  ],
  relatedSlugs: [
    "japji-sahib-and-the-mool-mantar-living-oneness",
    "ardas-humility-gratitude-and-sarbat-da-bhala",
    "sikh-gurpurab-and-khalsa-calendar-2027",
  ],
};
