// ============================================================================
// Journal essay: Vishnu Sahasranama — The Thousand Names in Mahabharata Tradition
//
// Reviewed and published for Sanctuary Journal.
// ============================================================================

import type { JournalEssay } from "./journal";

export const vishnuSahasranamaEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "vishnu-sahasranama-the-thousand-names-and-contemplative-chanting",
  title: "Vishnu Sahasranama: The Thousand Names in Mahabharata Tradition",
  subtitle:
    "How Bhishma Pitamaha's deathbed teaching to Yudhishthira turns a thousand divine names into an anchor for Dharma and quiet steadiness.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Pramana & Stotra Desk",
  authorBio:
    "Documenting classical Sanskrit stotras, Pauranic lineages, and mindful daily parayana across Sanatan Dharma traditions.",
  publishedDate: "November 2026",
  emblem: "/relics/chakra.png",
  excerpt:
    "Embedded in the Mahabharata's Anushasana Parva, the Vishnu Sahasranama answers Yudhishthira's search for what steadies the mind and upholds Dharma.",
  keyTakeaways: [
    "Spoken by Bhishma Pitamaha to Yudhishthira in the Mahabharata's Anushasana Parva while Lord Krishna listened beside them.",
    "Structured around six foundational questions on the highest refuge, the noblest Dharma, and what truly purifies the heart.",
    "Commented upon across lineages—from Adi Shankaracharya's Advaita Bhashya to Parasara Bhattar's Sri Vaishnava exposition.",
  ],
  sections: [
    {
      heading: "Bhishma's Counsel on the Bed of Arrows",
      highlights: [
        { label: "Scriptural Source", value: "Anushasana Parva", note: "Mahabharata (Danadharma)" },
        { label: "Sacred Names", value: "1,000 Names", note: "Across 108 Anushtup verses" },
        { label: "Opening Inquiry", value: "6 Questions", note: "Asked by Yudhishthira" },
      ],
      paragraphs: [
        "After the Kurukshetra war, Yudhishthira approached Bhishma Pitamaha on his bed of arrows with six earnest questions: Who is the one supreme refuge, what is the highest Dharma, and whose praise brings true peace? Bhishma pointed directly to Lord Krishna standing near them and offered the thousand names of the all-pervading Vishnu.",
        "In traditional commentary, Sahasranama is not mere repetition. Each name highlights an aspect of cosmic order, compassion, and inner steadiness, guiding the reciter from restless grief toward clarity of duty.",
      ],
      quote: {
        text: "शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम् । प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥",
        source: "Vishnu Sahasranama Purva Nyasa (Dhyana Shloka)",
        context:
          "We meditate upon the serene-faced Lord Vishnu, robed in white and radiant as the moon, for the quietening of all obstacles.",
      },
    },
    {
      heading: "Architecture of the Parayana",
      paragraphs: [
        "A complete traditional recitation follows a five-part liturgical arc—moving from introductory dialogue and meditation to the core hymn and closing dedication. Filter by role below to trace how each section prepares and settles the mind.",
      ],
      table: {
        caption: "Classical structure and commentarial tradition of the Vishnu Sahasranama",
        columns: ["Section", "Role", "Key Feature", "Tradition Focus"],
        filterColumnIndex: 1,
        rows: [
          ["Purva Peethika", "Dialogue", "Yudhishthira's six questions & Bhishma's reply", "Sets Dharmic inquiry before chanting"],
          ["Dhyana & Nyasa", "Preparation", "Meditation on Narayana & sage-meter sankalpa", "Centers breath, posture, and intention"],
          ["108 Anushtup Shlokas", "Core Hymn", "1,000 names from Vishvam to Sarva-praharanayudha", "Sustained rhythmic parayana"],
          ["Phala Shruti", "Closing", "Traditional fruits of steady devotion & humility", "Frames benefits within Shastric faith"],
          ["Rama-Nama Equivalence", "Closing", "Shiva's counsel to Parvati ('Sri Rama Rama Rameti')", "Affirms accessible japa for all"],
          ["Shankara & Bhattar Bhashyas", "Commentary", "Advaita & Visishtadvaita verse expositions", "Deepens contemplative meaning"],
        ],
      },
    },
    {
      heading: "Contemplative Chanting in Daily Life",
      paragraphs: [
        "Devotees traditionally recite the hymn on Ekadashi (confirming the tithi by your local Panchang and sunrise), Thursdays, Saturdays, or quietly at dawn. Because the Anushtup meter flows in even eight-syllable quarters, reading slowly with clear pronunciation naturally keeps attention anchored in meaning rather than speed.",
      ],
    },
  ],
  practiceGuidance: {
    title: "Observing Vishnu Sahasranama Parayana",
    steps: [
      "Sit comfortably on a clean mat with an upright, relaxed spine at dawn or dusk, without straining your voice or breath.",
      "If lighting a brass diya with ghee or sesame oil, place it in a well-ventilated space away from curtains, books, and children.",
      "Begin with the opening Dhyana verse, then chant at an unhurried pace—or recite one section mindfully if short on time.",
      "Treat parayana as a devotional discipline for steadiness and ethical clarity alongside—never instead of—appropriate medical care for any health concern.",
    ],
  },
  citations: [
    {
      text: "Mahabharata, Anushasana Parva (Danadharma Parva) — Dialogue of Yudhishthira and Bhishma Pitamaha on the Vishnu Sahasranama.",
      reference: "Gita Press Gorakhpur edition (Adhyaya 149); BORI Critical Edition (Adhyaya 135).",
    },
    {
      text: "Classical Sanskrit commentaries on the thousand names of Vishnu.",
      reference: "Adi Shankaracharya, Vishnu Sahasranama Bhashya; Parasara Bhattar, Bhagavad Guna Darpanam.",
    },
    {
      text: "Opening Dhyana Shloka and liturgical framing preserved in Shoonaya's Stotra library.",
      reference: "Shoonaya Stotram Archive (`src/lib/stotrams.ts`, vishnu-sahasranama).",
    },
  ],
  relatedSlugs: [
    "ekadashi-dates-2027-complete-calendar-and-parana",
    "mantra-japa-tulsi-vs-rudraksha-mala-and-meru-bead-rule",
    "alchemy-of-the-name-japa",
  ],
};
