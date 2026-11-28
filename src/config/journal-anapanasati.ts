// ============================================================================
// Journal essay: Anapanasati — Mindfulness of Breath in the Pali Canon
//
// Grounded in Majjhima Nikaya 118 (Anapanasati Sutta).
// Promoted to `published` after Pramana, Ritual Practice, and founder review.
// ============================================================================

import type { JournalEssay } from "./journal";

export const anapanasatiEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "anapanasati-mindfulness-of-breath-in-the-pali-canon",
  title: "Anapanasati: Mindfulness of Breath in the Pali Canon",
  subtitle:
    "How Majjhima Nikaya 118 turns ordinary breathing into a sixteen-step training across body, feeling, mind, and liberating insight.",
  tradition: "Buddhist",
  traditionColor: "text-[#8B2D3E] border-[#8B2D3E]/30 bg-[#8B2D3E]/10",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Buddhist & Contemplative Traditions Desk",
  authorBio:
    "Compiled from classical Pali canonical sources and established translations under Shoonaya's scriptural integrity standards.",
  publishedDate: "November 2026",
  emblem: "/relics/bodhi-leaf.png",
  excerpt:
    "Far more than a relaxation technique, the Buddha's Anapanasati Sutta (MN 118) maps sixteen progressive trainings across four tetrads that unify calm and insight.",
  keyTakeaways: [
    "In Majjhima Nikaya 118, the Buddha teaches sixteen steps of breath mindfulness organized into four tetrads (groups of four).",
    "Each tetrad fulfills one of the Four Foundations of Mindfulness (Satipatthana): body, feelings, mind, and mental phenomena.",
    "The instruction begins with simple discernment—knowing when an in-breath or out-breath is long or short—without forcing the breath.",
    "Practiced steadily, the four foundations cultivate the Seven Factors of Awakening (Bojjhangas), leading to clarity and letting go.",
  ],
  sections: [
    {
      heading: "One Anchor, Four Foundations",
      highlights: [
        { label: "Discourse", value: "Majjhima Nikāya 118", note: "Delivered at Sāvatthī" },
        { label: "Architecture", value: "4 Tetrads · 16 Steps", note: "Body, Feeling, Mind, Dhamma" },
        { label: "Awakening Arc", value: "7 Bojjhaṅgas", note: "Mindfulness through equanimity" },
      ],
      paragraphs: [
        "Modern introductions often treat breath awareness as a brief warm-up before 'real' meditation begins. In the Anapanasati Sutta (Majjhima Nikaya 118), the Buddha presents mindfulness of breathing as a complete path in itself—capable of sustaining both deep calm (samatha) and clear-eyed insight (vipassana).",
        "Delivered to an assembly of monks on a full-moon evening in Savatthi, the discourse moves gracefully from gross physical sensation to subtle emotional tone, clarity of consciousness, and direct observation of impermanence and release.",
      ],
      quote: {
        text: "Mindfully he breathes in, mindfully he breathes out. Breathing in long, he understands: 'I breathe in long'; or breathing out long, he understands: 'I breathe out long.'",
        source: "Ānāpānasati Sutta, Majjhima Nikāya 118",
        context: "Translated by Bhikkhu Ñāṇamoli & Bhikkhu Bodhi, The Middle Length Discourses of the Buddha",
      },
    },
    {
      heading: "The Sixteen Steps Across Four Tetrads",
      paragraphs: [
        "Filter the sixteen canonical steps below by their Satipatthana tetrad to see how physical steadiness matures into liberating discernment.",
      ],
      table: {
        caption: "The sixteen steps of Ānāpānasati (Majjhima Nikāya 118)",
        columns: ["Tetrad", "Step", "Canonical Training", "Core Focus"],
        filterColumnIndex: 0,
        rows: [
          ["1. Body (Kāyānupassanā)", "Step 1", "Breathing in/out long, discerning 'long'", "Unforced recognition of deep natural breaths"],
          ["1. Body (Kāyānupassanā)", "Step 2", "Breathing in/out short, discerning 'short'", "Noticing subtler, shorter breath rhythms"],
          ["1. Body (Kāyānupassanā)", "Step 3", "Experiencing the whole body while breathing", "Widening awareness across somatic posture"],
          ["1. Body (Kāyānupassanā)", "Step 4", "Calming bodily formation (kāya-saṅkhāra)", "Softening physical tension as breath settles"],
          ["2. Feelings (Vedanānupassanā)", "Step 5", "Experiencing rapture (pīti)", "Noticing bright, wholesome ease"],
          ["2. Feelings (Vedanānupassanā)", "Step 6", "Experiencing pleasure (sukha)", "Resting in steady contentment"],
          ["2. Feelings (Vedanānupassanā)", "Step 7", "Experiencing mental formation (citta-saṅkhāra)", "Observing feeling and perception clearly"],
          ["2. Feelings (Vedanānupassanā)", "Step 8", "Calming mental formation", "Quieting emotional agitation at its root"],
          ["3. Mind (Cittānupassanā)", "Step 9", "Experiencing the mind (citta)", "Recognizing the current quality of attention"],
          ["3. Mind (Cittānupassanā)", "Step 10", "Gladdening the mind", "Uplifting sluggish or discouraged awareness"],
          ["3. Mind (Cittānupassanā)", "Step 11", "Concentrating the mind (samādahaṁ)", "Collecting scattered attention into stillness"],
          ["3. Mind (Cittānupassanā)", "Step 12", "Liberating the mind (vimocayaṁ)", "Loosening constriction and hindrances"],
          ["4. Phenomena (Dhammānupassanā)", "Step 13", "Contemplating impermanence (anicca)", "Seeing every breath arise and pass away"],
          ["4. Phenomena (Dhammānupassanā)", "Step 14", "Contemplating dispassion (virāga)", "Witnessing craving naturally fade"],
          ["4. Phenomena (Dhammānupassanā)", "Step 15", "Contemplating cessation (nirodha)", "Noticing the ending of restless clinging"],
          ["4. Phenomena (Dhammānupassanā)", "Step 16", "Contemplating relinquishment (paṭinissagga)", "Letting go completely into unshakeable peace"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Beginning Anapanasati Safely and Steadily",
    steps: [
      "Sit in a balanced, comfortable posture with an upright spine; let the body breathe on its own without forcing deep inhales or holding the breath.",
      "Start with Steps 1 and 2 only: simply notice whether the current breath feels long or short at the nostrils or abdomen.",
      "When the mind wanders, recognize the distraction without irritation and return gently to the next natural inhalation.",
      "If breath focus causes dizziness, tightness, panic, or distress—especially with respiratory conditions or past trauma—open your eyes, rest attention on external sounds or your feet on the floor, and consult a healthcare or mental-health professional when needed.",
    ],
  },
  citations: [
    {
      text: "Ānāpānasati Sutta (Majjhima Nikāya 118)",
      reference:
        "In The Middle Length Discourses of the Buddha, translated by Bhikkhu Ñāṇamoli & Bhikkhu Bodhi, Wisdom Publications, 1995.",
    },
    {
      text: "Ānāpānasati Sutta (MN 118) — Practice-Oriented Translation",
      reference: "Translated by Thanissaro Bhikkhu, Access to Insight (accesstoinsight.org).",
    },
    {
      text: "Satipaṭṭhāna: The Direct Path to Realization",
      reference: "Bhikkhu Anālayo, Windhorse Publications, 2003.",
    },
  ],
  relatedSlugs: [
    "brahmaviharas-cultivating-compassion-and-sympathetic-joy",
    "metta-in-age-of-reaction",
    "architecture-of-silence-ancient-mandirs",
    "alchemy-of-the-name-japa",
  ],
};
