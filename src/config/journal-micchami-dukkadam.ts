// ============================================================================
// Journal essay: Micchami Dukkadam — The Discipline of Asking Forgiveness
//
// Grounded in the Avashyaka / Pratikramana liturgical tradition and Samvatsari.
// Promoted to `published` after Pramana, Ritual Practice, and founder review.
// ============================================================================

import type { JournalEssay } from "./journal";

export const micchamiDukkadamEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "micchami-dukkadam-the-jain-practice-of-seeking-forgiveness",
  title: "Micchami Dukkadam: The Discipline of Asking Forgiveness",
  subtitle:
    "Inside Samvatsari and Pratikramana—how the Jain tradition turns annual apology into a structured rhythm of self-reflection and release.",
  tradition: "Jain Dharma",
  traditionColor: "text-[#3d8a60] border-[#3d8a60]/30 bg-[#3d8a60]/10",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Jain & Contemplative Traditions Desk",
  authorBio:
    "Compiled from classical Jain Agamic and liturgical sources under Shoonaya's scriptural integrity standards.",
  publishedDate: "November 2026",
  emblem: "/relics/jain-kalasha.png",
  excerpt:
    "Micchami Dukkadam ('may my misdeeds be rendered fruitless') crowns Pratikramana—a disciplined turning back from harm and releasing of resentment.",
  keyTakeaways: [
    "Pratikramana literally means 'turning back'—stepping out of habitual reactivity to examine faults in thought, speech, and conduct.",
    "Micchami Dukkadam (Prakrit for Sanskrit mithya me duskrtam) asks that any harm caused knowingly or unknowingly bear no lingering bitterness.",
    "Shvetambara Jains observe universal forgiveness on Samvatsari (culminating Paryushana), while Digambara Jains observe Kshamavani after Das Lakshan Parva.",
    "Forgiveness is paired with offering pardon to others first ('Khamemi savve jiva'), dissolving mutual enmity rather than keeping score.",
  ],
  sections: [
    {
      heading: "What 'Micchami Dukkadam' Actually Means",
      highlights: [
        { label: "Prakrit Phrase", value: "Micchāmi Dukkadaṁ", note: "May my misdeeds be fruitless" },
        { label: "Liturgical Core", value: "Pratikramana", note: "Turning back from transgression" },
        { label: "Annual Culmination", value: "Samvatsari / Kshamavani", note: "Paryushana & Das Lakshan" },
      ],
      paragraphs: [
        "Every year at the close of Paryushana, Jain households exchange the phrase Micchami Dukkadam—literally from the Prakrit for the Sanskrit mithya me duskrtam, meaning 'may whatever ill I have done become fruitless.' Far from a casual greeting, it concludes hours of Pratikramana, a structured liturgy of honest self-examination.",
        "Significantly, the canonical Kshamapana Gatha begins not by begging for pardon, but by granting it first: 'I forgive all living beings; may all living beings forgive me.' In Jain understanding, pride and buried grievance weigh down the soul long after an argument has ended; releasing enmity restores inner clarity.",
      ],
      quote: {
        text: "Khāmemi savve jīvā, savve jīvā khamaṃtu me; mittī me savvabhūesu, veraṃ majjha na keṇaï.",
        source: "Āvaśyaka Sūtra / Pratikramaṇa Sūtra (Kṣamāpanā Gāthā)",
        context: "I forgive all living beings; may all living beings forgive me. My friendship is with all beings; I bear enmity toward none.",
      },
    },
    {
      heading: "The Five Rhythms of Pratikramana",
      paragraphs: [
        "Rather than saving repentance for a single dramatic day each year, the Shvetambara liturgical calendar divides Pratikramana into five recurring cycles so small lapses are noticed before they harden into resentment.",
      ],
      table: {
        caption: "The five canonical rhythms of Jain Pratikramana",
        columns: ["Observance", "Cadence", "Category", "Reflective Scope"],
        filterColumnIndex: 2,
        rows: [
          ["Devasi Pratikramana", "Daily (Evening)", "Daily", "Reviewing faults of thought, speech, and action from sunrise to dusk"],
          ["Rai Pratikramana", "Daily (Morning)", "Daily", "Examining restlessness, negligence, or lapses during the night"],
          ["Pakkhi Pratikramana", "Every 15 days", "Periodic", "Fortnightly reckoning on the fourteenth or full/new-moon lunar day"],
          ["Chaumasi Pratikramana", "Every 4 months", "Periodic", "Seasonal reckoning across each four-month division of the sacred year"],
          ["Samvatsari Pratikramana", "Once a year", "Annual", "Full-year confession on the final day of Paryushana, culminating in Micchami Dukkadam"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Bringing Pratikramana into Personal Life",
    steps: [
      "Set aside five quiet minutes before sleep to review the day honestly without self-condemnation, noticing where impatience or harsh speech crept in.",
      "When asking someone's pardon, name the specific hurt clearly rather than offering a vague formula, and avoid demanding an immediate emotional response.",
      "Practice letting go of silent scorekeeping toward others—recognizing that forgiveness frees your own mind from replaying old injuries.",
      "Keep healthy boundaries: spiritual forgiveness releases inner hatred, but it never requires staying in unsafe or abusive situations; consult a counselor or trusted elder when navigating deep relational harm.",
      "For annual Samvatsari, Kshamavani, or fortnightly Pakkhi Pratikramana dates, confirm the exact lunar day with your local Jain Panchang, sunrise/tithi timings, and community tradition (Śvetāmbara or Digambara).",
    ],
  },
  citations: [
    {
      text: "Āvaśyaka Sūtra & Śrāvaka Pratikramaṇa Sūtra",
      reference: "Kṣamāpanā Gāthā and five-fold Pratikramana framework in traditional Śvetāmbara liturgy.",
    },
    {
      text: "Tattvārtha Sūtra by Ācārya Umāsvāti",
      reference: "Chapter 9 (Uttama Kṣamā / supreme forbearance among the ten virtues); translated by Nathmal Tatia, HarperCollins, 1994.",
    },
    {
      text: "The Jaina Path of Purification",
      reference: "Padmanabh S. Jaini, University of California Press, 1979.",
    },
  ],
  relatedSlugs: [
    "ahimsa-in-thought-speech-and-everyday-choices",
    "namokar-mantra-bowing-to-virtues-not-personalities",
    "2027-hindu-sikh-jain-festival-calendar-verified-dates",
    "anekantavada-antidote-to-polarization",
  ],
};
