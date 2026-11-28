// ============================================================================
// Journal essay: Lalita Sahasranama — Shakti Devotion & the Brahmanda Purana
//
// Reviewed and published for Sanctuary Journal.
// ============================================================================

import type { JournalEssay } from "./journal";

export const lalitaSahasranamaEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "lalita-sahasranama-shakti-tradition-and-sacred-geometry",
  title: "Lalita Sahasranama: Shakti Devotion & the Brahmanda Purana",
  subtitle:
    "Revealed in the Brahmanda Purana, the thousand names of Lalita Tripurasundari unite maternal devotion with Sri Chakra contemplation.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Pramana & Shakta Liturgy Desk",
  authorBio:
    "Documenting Shakta Pauranic texts, Sri Vidya devotional literature, and accessible home-altar practice.",
  publishedDate: "November 2026",
  emblem: "/relics/lotus-bloom.png",
  excerpt:
    "Framed as a sacred dialogue between Hayagriva and Sage Agastya, the Lalita Sahasranama weaves Shakti devotion with the traditional geometry of the Sri Chakra.",
  keyTakeaways: [
    "Occurs in the Lalitopakhyana (Uttara Khanda) of the Brahmanda Purana, narrated by Lord Hayagriva to Sage Agastya.",
    "Tradition honors the eight Vagdevis (Vashinyadi Vagdevatas) as the composers of these 1,000 non-repeating names.",
    "Contemplation bridges maternal bhakti with Sri Chakra (Sri Yantra) symbolism and inner meditative awareness.",
  ],
  sections: [
    {
      heading: "From the Brahmanda Purana to the Eight Vagdevis",
      highlights: [
        { label: "Pauranic Source", value: "Brahmanda Purana", note: "Uttara Khanda · Lalitopakhyana" },
        { label: "Distinctive Trait", value: "Zero Repeats", note: "1,000 unique names" },
        { label: "Sacred Diagram", value: "Sri Chakra", note: "Nine-enclosure geometry" },
      ],
      paragraphs: [
        "In the closing section of the Brahmanda Purana, Sage Agastya asks Hayagriva—an incarnation of Vishnu—how householders and seekers may worship the Divine Mother completely. Hayagriva reveals the Lalita Sahasranama, explaining that the eight Vagdevis (deities of sacred speech) composed it directly in the presence of Lalita Tripurasundari.",
        "Unlike many hymns that repeat epithets for meter, Shakta commentators celebrate this text because none of its one thousand names is repeated—earning it the title punarukti-rahita.",
      ],
      quote: {
        text: "श्रीमाता श्रीमहाराज्ञी श्रीमत्सिंहासनेश्वरी । चिदग्निकुण्डसम्भूता देवकार्यसमुद्यता ॥",
        source: "Brahmanda Purana, Lalita Sahasranama, Verse 1",
        context:
          "Salutations to the Auspicious Mother, Supreme Empress upon the lion-throne, who arose from the fire-altar of pure consciousness.",
      },
    },
    {
      heading: "Sacred Geometry & Thematic Flow",
      paragraphs: [
        "The hymn unfolds like a visual meditation: beginning with the Mother rising from pure awareness (Chidagni-kunda), moving from crown to feet, honoring her abode in the nine-fold Sri Chakra, and recognizing her as both transcendent awareness and tender grace.",
      ],
      table: {
        caption: "Core thematic movements in the Lalita Sahasranama",
        columns: ["Movement", "Focus", "Traditional Symbolism", "Contemplative Meaning"],
        filterColumnIndex: 1,
        rows: [
          ["Opening Invocation", "Origin", "Chidagni-kunda & cosmic throne", "Awareness as the source of compassion"],
          ["Nakha-Shikha Dhyana", "Form", "Contemplation from crown to lotus feet", "Anchors wandering attention in devotion"],
          ["Sri Chakra Enclosures", "Geometry", "Nine interlocking enclosures (Navavarana)", "Journey from outer world to inner Bindu"],
          ["Yogic Subtle Centers", "Inner Path", "Traditional Kundalini & Chakra imagery", "Symbolic map of inner stillness in Yoga"],
          ["Kameshwara Union", "Non-Duality", "Inseparability of Shiva and Shakti", "Harmony of stillness and creative grace"],
          ["Phala Shruti", "Dedication", "Panchami, Purnima & Navaratri recitation", "Cultivates humility and steady devotion"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Approaching Lalita Sahasranama Gently",
    steps: [
      "Begin on a Friday, Purnima, or during Navaratri (confirming tithi dates by your local Panchang) in a clean, quiet room with an unhurried, respectful mindset.",
      "If lighting a ghee lamp or small camphor flame before a Sri Chakra or Devi image, keep windows ventilated and flames away from drapes and flowers.",
      "Read slowly with transliteration or listen along before attempting full speed; formal Sri Vidya mantra initiations are traditionally received from a qualified teacher.",
      "Honor physical limits—sit comfortably with support if needed, and never substitute devotional chanting for medical evaluation or treatment.",
    ],
  },
  citations: [
    {
      text: "Narrative frame of Hayagriva and Sage Agastya and the thousand names of Goddess Lalita.",
      reference: "Brahmanda Purana, Uttara Khanda (Lalitopakhyana), Adhyayas 41–44.",
    },
    {
      text: "Classical Sri Vidya commentary explaining the non-repeating names and Sri Chakra symbolism.",
      reference: "Bhaskararaya Makhin, Saubhagya Bhaskara (Commentary on Lalita Sahasranama).",
    },
    {
      text: "Opening Sanskrit verse and meaning preserved in Shoonaya's Stotra library.",
      reference: "Shoonaya Stotram Archive (`src/lib/stotrams.ts`, lalitha-sahasranama).",
    },
  ],
  relatedSlugs: [
    "navratri-ghatasthapana-muhurta-and-nine-devi-forms",
    "mantra-japa-tulsi-vs-rudraksha-mala-and-meru-bead-rule",
    "home-mandir-vastu-direction-geometry-and-altar-setup",
  ],
};
