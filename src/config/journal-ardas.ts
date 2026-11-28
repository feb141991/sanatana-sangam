// ============================================================================
// Journal essay: Ardas: Standing in Humility for Sarbat Da Bhala
//
// Grounded in the Sikh Rehat Maryada (SGPC) and Chandi Di Var / Ardas liturgy.
// ============================================================================

import type { JournalEssay } from "./journal";

export const ardasEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "ardas-humility-gratitude-and-sarbat-da-bhala",
  title: "Ardas: Standing in Humility for Sarbat Da Bhala",
  subtitle:
    "Why Sikhs stand with folded hands to remember the Gurus, honor collective resilience, and pray for the welfare of all humanity.",
  tradition: "Sikh Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Gurmat & Contemplative Practice Desk",
  authorBio:
    "Compiled from the SGPC Sikh Rehat Maryada and traditional Ardas liturgy.",
  publishedDate: "November 2026",
  emblem: "/relics/nishan-sahib.png",
  excerpt:
    "More than personal petition, Ardas anchors the Sikh community in shared memory—invoking the Ten Gurus, recalling steadfast sacrifice, and closing with Sarbat Da Bhala: goodwill for all beings.",
  keyTakeaways: [
    "Derived from the Persian 'Arz-dasht' (humble petition), Ardas is offered standing with folded hands facing Sri Guru Granth Sahib Ji.",
    "The Sikh Rehat Maryada standardizes its opening invocation from Guru Gobind Singh Ji's Var Sri Bhagauti Ji Ki and remembrance of the Panth's heritage.",
    "Ardas concludes with 'Nanak Naam Chardi Kala, Tere Bhane Sarbat Da Bhala'—placing universal welfare above private gain.",
  ],
  sections: [
    {
      heading: "Memory, Gratitude, and Universal Prayer",
      highlights: [
        { label: "Posture", value: "Standing", note: "Folded hands, bowed heart" },
        { label: "Opening", value: "Ten Gurus", note: "Var Sri Bhagauti Ji Ki" },
        { label: "Closing Ideal", value: "Sarbat Da Bhala", note: "Welfare of all humanity" },
      ],
      paragraphs: [
        "In Sikh practice, no gathering, meal, journey, or Nitnem session closes without Ardas. Codified in the Sikh Rehat Maryada, Ardas joins personal humility with collective history: first invoking Waheguru and the Ten Gurus up to the eternal Guru Granth Sahib Ji, then remembering the Panj Pyare, Sahibzade, and generations of devotion.",
        "Only after honoring that lineage does the prayer turn toward the present moment—asking for steady faith, wisdom, and harmony before ending with an embrace of every living being.",
      ],
      quote: {
        text: "Nanak Naam Chardi Kala, tere bhane sarbat da bhala.",
        source: "Sikh Rehat Maryada — Closing lines of the Ardas",
        context: "O Nanak, through the Naam comes ever-ascending spirit; by Your Will, may all humanity prosper",
      },
    },
    {
      heading: "Five Movements of the Standard Ardas",
      paragraphs: [
        "Whether whispered quietly at home or led aloud in a Gurdwara Diwan, the Ardas follows an ordered arc that moves the heart from ego toward gratitude and universal goodwill.",
      ],
      table: {
        caption: "Structure of the Sikh Ardas per Sikh Rehat Maryada",
        columns: ["Movement", "Theme", "Category", "Key Elements"],
        filterColumnIndex: 2,
        rows: [
          ["1. Invocation", "Divine & Guru Lineage", "Opening", "Var Sri Bhagauti Ji Ki; remembrance of Guru Nanak to Guru Gobind Singh Ji"],
          ["2. Living Guru", "Scriptural Center", "Opening", "Turning attention to Sri Guru Granth Sahib Ji as eternal Guru"],
          ["3. Panthic Memory", "Devotion & Resilience", "Remembrance", "Panj Pyare, Four Sahibzade, martyrs, and selfless sevaks"],
          ["4. Specific Petition", "Gratitude & Occasion", "Supplication", "Thanksgiving, forgiveness of errors, and the day's prayer"],
          ["5. Universal Blessing", "Chardi Kala & Welfare", "Closing", "Sarbat Da Bhala, Fateh, and Bole So Nihal"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Offering Ardas with Presence",
    steps: [
      "Stand with head covered, shoes removed, and hands folded in calm respect; anyone unable to stand comfortably due to age, illness, or mobility needs may participate seated with equal reverence.",
      "Begin by pausing for two quiet breaths so the transition from daily busyness to prayer feels unhurried.",
      "When voicing a personal concern in the middle section, pair it with gratitude and readiness to accept Hukam (Divine Will) with steadiness.",
      "Close with 'Sarbat Da Bhala', silently extending goodwill even toward people with whom life feels strained.",
    ],
  },
  citations: [
    {
      text: "SGPC — Sikh Rehat Maryada (Ardas Text & Protocol)",
      reference: "Standardized Panthic structure, standing posture, and closing supplication for personal and congregational Ardas.",
    },
    {
      text: "Sri Dasam Granth — Chandi Di Var (Opening Pauri)",
      reference: "Source of the opening invocation ('Pritham Bhagauti simar ke...') recited at the start of Ardas.",
    },
  ],
  relatedSlugs: [
    "nitnem-the-daily-rhythm-of-five-banis",
    "chardi-kala-cultivating-unshakeable-optimism-in-adversity",
    "sangat-and-pangat-equality-in-company-and-langar",
  ],
};
