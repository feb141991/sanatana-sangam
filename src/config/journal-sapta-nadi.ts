// ============================================================================
// Journal essay: Sapta Nadi — Why India's Seven Sacred Rivers Are Invoked Daily
//
// Grounded in the classical Snana Mantra (Narada Purana / Smriti Paddhati)
// and Rigveda Nadistuti Sukta.
// ============================================================================

import type { JournalEssay } from "./journal";

export const saptaNadiEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "sapta-nadi-why-rivers-are-revered-as-living-mothers",
  title: "Sapta Nadi: Why India's Seven Sacred Rivers Are Invoked Daily",
  subtitle:
    "How a two-line Sanskrit bathing prayer gathers Ganga, Yamuna, Godavari, Saraswati, Narmada, Sindhu, and Kaveri into every morning vessel of water.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Nitya Karma & Sacred Geography Desk",
  authorBio:
    "Examining daily household prayers, Vedic hymns, and contemplative traditions that honor the natural world.",
  publishedDate: "November 2026",
  emblem: "/relics/rishi-kamandalu.png",
  excerpt:
    "Every morning across Sanatan households, the Snana Mantra invokes seven sacred rivers—Ganga, Yamuna, Godavari, Saraswati, Narmada, Sindhu, and Kaveri—into ordinary water as an act of gratitude and unity.",
  keyTakeaways: [
    "The Sapta Nadi invocation (Gange cha Yamune...) is a daily Tirtha-Avahana prayer recited before bathing or preparing puja water.",
    "In Sanatan tradition, water is honored symbolically and devotionally as a carrier of sankalpa (sacred intention), transforming routine washing into remembrance.",
    "The seven rivers bridge Himalayan basins, Vedic memory (Saraswati), central plateaus, and southern plains into one living landscape.",
    "Revering rivers as mothers carries an ethical responsibility to keep local streams and ghats clean and free of waste.",
  ],
  sections: [
    {
      heading: "Seven Rivers in a Single Vessel",
      highlights: [
        { label: "Sacred Rivers", value: "7 Nadis", note: "North, Central & South" },
        { label: "Daily Context", value: "Snana & Puja", note: "Tirtha-Avahana invocation" },
        { label: "Vedic Antecedent", value: "Nadistuti Sukta", note: "Rigveda 10.75" },
      ],
      paragraphs: [
        "Before stepping under the shower or pouring water into a copper kalash for morning puja, millions of practitioners whisper a brief Sanskrit couplet known as the Snana Mantra. With seven river names, it asks the sacred waters of the entire subcontinent to grace the water right in front of them.",
        "This practice does not claim a physical change in the water's chemistry; rather, in Puranic and Smriti understanding, prayer aligns the mind's intention (bhava) with gratitude. Ordinary water becomes a reminder that every drop we use participates in the same cycle that sustains forests, farms, and ancient cities.",
      ],
      quote: {
        text: "गङ्गे च यमुने चैव गोदावरि सरस्वति । नर्मदे सिन्धु कावेरि जलेऽस्मिन् संनिधिं कुरु ॥",
        source: "Traditional Snana Mantra (Narada Purana / Smriti Nitya Karma tradition)",
        context:
          "\"O Ganga, Yamuna, Godavari, Saraswati, Narmada, Sindhu, and Kaveri—be present in this water.\"",
      },
    },
    {
      heading: "The Seven Sacred Rivers at a Glance",
      paragraphs: [
        "Together, the seven rivers map an unbroken ecological and cultural arc—from Himalayan glaciers and ancient Vedic plains to the central Vindhya range and the fertile deltas of the Deccan and Tamil country.",
      ],
      table: {
        caption: "The seven rivers invoked in the daily Sapta Nadi prayer",
        columns: ["River", "Geographic Sphere", "Tradition / Association", "Sacred Role"],
        filterColumnIndex: 1,
        rows: [
          ["Ganga", "Himalayan", "Uttarakhand to Bay of Bengal", "Primary symbol of purification & moksha tradition"],
          ["Yamuna", "Himalayan", "Yamunotri to Prayagraj Sangam", "Sacred to Krishna bhakti & Triveni confluence"],
          ["Godavari", "Peninsular", "Trimbakeshwar to Andhra coast", "Revered as Dakshina Ganga; Nashik Kumbh site"],
          ["Saraswati", "Vedic Memory", "Praised in Rigveda; Triveni invisible stream", "Emblem of wisdom, speech, and hidden continuity"],
          ["Narmada", "Peninsular", "Amarkantak to Gulf of Khambhat", "Celebrated for parikrama & naturally rounded Banalingas"],
          ["Sindhu (Indus)", "Himalayan", "Tibetan plateau through Ladakh & Sindh", "Named in Rigveda 10.75; cradle of early civilization"],
          ["Kaveri", "Peninsular", "Talakaveri (Kodagu) to Tamil Nadu", "Southern lifeline of temple towns & Tula Snana"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Bringing the Sapta Nadi Prayer Into Daily Life",
    steps: [
      "Recite the 'Gange cha Yamune' verse silently before your morning bath or when filling your altar kalash to begin the day with gratitude for water.",
      "For any water you sip during achamana or charanamrita, use only clean, safe drinking water; avoid drinking untreated open river water directly due to waterborne health risks.",
      "Honor rivers in practice by never discarding plastics, synthetic flowers, or household detergents into lakes, streams, or temple ghats.",
      "Use water mindfully at home, treating conservation as daily seva toward the seven sacred mothers.",
    ],
  },
  citations: [
    {
      text: "Rigveda, Mandala 10, Hymn 75 (Nadistuti Sukta)",
      reference:
        "Vedic hymn praising the Sindhu, Ganga, Yamuna, Saraswati, and Himalayan tributaries.",
    },
    {
      text: "Narada Purana (Purvabhaga, Snana-vidhi) & Classical Smriti Paddhatis",
      reference:
        "Traditional Puranic and daily-liturgy sources preserving the Tirtha-Avahana / Snana Mantra.",
    },
  ],
  relatedSlugs: [
    "kumbh-2027-haridwar-nashik-official-dates",
    "sandhyavandanam-cosmic-science-of-trisandhya-and-solar-meditation",
    "pitru-paksha-and-mahalaya-ancestral-tarpan-science",
  ],
};
