// ============================================================================
// Journal essay: The Four Brahmaviharas — Metta, Karuna, Mudita & Upekkha
//
// Grounded in the Pali Suttas (Sn 1.8, DN 13) and Visuddhimagga Chapter IX.
// Promoted to `published` after Pramana, Ritual Practice, and founder review.
// ============================================================================

import type { JournalEssay } from "./journal";

export const brahmaviharasEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "brahmaviharas-cultivating-compassion-and-sympathetic-joy",
  title: "The Four Brahmaviharas: Metta, Karuna, Mudita & Upekkha",
  subtitle:
    "How the Pali Canon and Buddhaghosa's Visuddhimagga train the four sublime abodes—and warn against their subtle counterfeits.",
  tradition: "Buddhist",
  traditionColor: "text-[#8B2D3E] border-[#8B2D3E]/30 bg-[#8B2D3E]/10",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Buddhist & Contemplative Traditions Desk",
  authorBio:
    "Compiled from Pali canonical discourses and Theravada commentarial sources under Shoonaya's scriptural integrity standards.",
  publishedDate: "November 2026",
  emblem: "/relics/three-jewels.png",
  excerpt:
    "The Four Brahmaviharas balance warmth with clarity: goodwill, compassion, appreciative joy, and equanimity—each guarded against both its opposite and its counterfeit.",
  keyTakeaways: [
    "The Pali Canon presents the Brahmaviharas ('sublime abodes' or 'immeasurables') as intentional heart-trainings radiated in all directions.",
    "Metta (goodwill), Karuna (compassion), and Mudita (sympathetic joy) are stabilized by Upekkha (equanimity), preventing emotional burnout.",
    "In Visuddhimagga Chapter IX, Buddhaghosa distinguishes each virtue's 'far enemy' (obvious opposite) from its 'near enemy' (a convincing counterfeit).",
    "Spotting near enemies—such as possessive attachment posing as love, or cold indifference posing as equanimity—keeps practice honest.",
  ],
  sections: [
    {
      heading: "Four Heart-Qualities That Keep Each Other Honest",
      highlights: [
        { label: "Four Abodes", value: "Brahmavihāras", note: "Metta · Karuna · Mudita · Upekkha" },
        { label: "Canonical Anchor", value: "Sutta Nipāta 1.8", note: "Karaṇīya Mettā Sutta" },
        { label: "Manual", value: "Visuddhimagga IX", note: "Ācariya Buddhaghosa (5th c. CE)" },
      ],
      paragraphs: [
        "Across the Pali Nikayas—including the Tevijja Sutta (Digha Nikaya 13) and the Karaniya Metta Sutta (Sutta Nipata 1.8)—the Buddha teaches practitioners to suffuse all directions with four immeasurable states: Metta (loving-kindness), Karuna (compassion), Mudita (sympathetic joy), and Upekkha (equanimity).",
        "Taken individually, any warm emotion can lose balance. Taken together, they form an ecosystem: Metta softens hostility, Karuna refuses to turn away from pain, Mudita cures envy when others prosper, and Upekkha keeps care grounded rather than frantic.",
      ],
      quote: {
        text: "As a mother would risk her life to protect her child, her only child, even so should one cultivate a limitless heart with regard to all beings.",
        source: "Karaṇīya Mettā Sutta, Sutta Nipāta 1.8",
        context: "Translated by Thanissaro Bhikkhu, Access to Insight",
      },
    },
    {
      heading: "Far Enemies and Near Enemies in the Visuddhimagga",
      paragraphs: [
        "In Chapter IX of the Visuddhimagga (The Path of Purification), Buddhaghosa offers a timeless diagnostic: every Brahmavihara faces an obvious 'far enemy' and a deceptive 'near enemy' that mimics its outward feel while quietly undermining it.",
      ],
      table: {
        caption: "The Four Brahmavihāras with their far and near enemies (Visuddhimagga IX)",
        columns: ["Brahmavihāra", "Core Orientation", "Far Enemy (Opposite)", "Near Enemy (Counterfeit)"],
        rows: [
          ["Mettā (Loving-Kindness)", "Wishing safety, peace, and genuine welfare for beings", "Ill-will & anger (vyāpāda)", "Possessive attachment / craving (lobha / pema)"],
          ["Karuṇā (Compassion)", "Steady readiness to help relieve suffering", "Cruelty (vihiṁsā)", "Overwhelmed grief or condescending pity (soka)"],
          ["Muditā (Sympathetic Joy)", "Rejoicing sincerely in others' goodness and success", "Envy & resentment (issā)", "Giddy exuberance or superficial excitement"],
          ["Upekkhā (Equanimity)", "Balanced, non-reactive steadiness amid ups and downs", "Craving & aversion", "Cold indifference or unfeeling apathy (avijjā)"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Cultivating the Sublime Abodes Gradually",
    steps: [
      "Begin with someone easy to appreciate—a benefactor, friend, or yourself—using simple phrases ('May you be safe, peaceful, and well') before extending outward to neutral or difficult people.",
      "Watch gently for 'near enemies': if compassion feels like drowning in helplessness, or equanimity feels like numbness, pause and return to warmth or grounding.",
      "Pair Karuna with clear personal boundaries; caring for suffering beings does not require abandoning rest or sustainable limits.",
      "Treat contemplation as inner cultivation alongside—never instead of—medical or psychological care if navigating acute grief, depression, or trauma.",
    ],
  },
  citations: [
    {
      text: "Karaṇīya Mettā Sutta (Sutta Nipāta 1.8 / Khuddakapāṭha 9)",
      reference: "Translated by Thanissaro Bhikkhu, Access to Insight (accesstoinsight.org).",
    },
    {
      text: "Tevijja Sutta (Dīgha Nikāya 13)",
      reference:
        "In The Long Discourses of the Buddha, translated by Maurice Walshe, Wisdom Publications, 1995.",
    },
    {
      text: "Visuddhimagga (The Path of Purification) by Ācariya Buddhaghosa",
      reference:
        "Chapter IX (Brahmavihāra-niddesa); translated by Bhikkhu Ñāṇamoli, Buddhist Publication Society.",
    },
  ],
  relatedSlugs: [
    "anapanasati-mindfulness-of-breath-in-the-pali-canon",
    "metta-in-age-of-reaction",
    "micchami-dukkadam-the-jain-practice-of-seeking-forgiveness",
    "ahimsa-in-thought-speech-and-everyday-choices",
  ],
};
