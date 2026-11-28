// ============================================================================
// Journal essay: Ahimsa — Non-Harm in Thought, Speech, and Everyday Choices
//
// Grounded in the Acharanga Sutra and Umasvati's Tattvartha Sutra.
// Promoted to `published` after Pramana, Ritual Practice, and founder review.
// ============================================================================

import type { JournalEssay } from "./journal";

export const ahimsaEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "ahimsa-in-thought-speech-and-everyday-choices",
  title: "Ahimsa: Non-Harm in Thought, Speech, and Everyday Choices",
  subtitle:
    "How Jain scriptures define non-violence across mind, speech, and body—not as passive withdrawal, but as watchful care for all living beings.",
  tradition: "Jain Dharma",
  traditionColor: "text-[#3d8a60] border-[#3d8a60]/30 bg-[#3d8a60]/10",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Jain & Contemplative Traditions Desk",
  authorBio:
    "Compiled from classical Jain Agamic and philosophical sources under Shoonaya's scriptural integrity standards.",
  publishedDate: "November 2026",
  emblem: "/relics/ahimsa-hand.png",
  excerpt:
    "In Jain Dharma, Ahimsa begins inside attention: the Tattvartha Sutra traces harm to heedlessness (pramada) across thought, speech, and bodily action.",
  keyTakeaways: [
    "The Acharanga Sutra establishes non-harm toward all breathing, living, sentient beings as the shared teaching of all awakened masters.",
    "Umasvati's Tattvartha Sutra defines violence (himsa) as harming life-vitalities through heedless or passionate activity (pramatta-yoga).",
    "Jain ethics evaluates harm across nine channels: three doors (thought, speech, body) multiplied by three modes (doing, commissioning, approving).",
    "Ahimsa pairs restraint with active interdependence—expressed in the Jain motto Parasparopagraho Jivanam ('souls render service to one another').",
  ],
  sections: [
    {
      heading: "Beyond Non-Violence: Heedlessness as the Root of Harm",
      highlights: [
        { label: "Three Doors", value: "Manas · Vachana · Kaya", note: "Thought, speech, and bodily action" },
        { label: "Three Modes", value: "Krita · Karita · Anumodita", note: "Doing, commissioning, or approving" },
        { label: "Root Principle", value: "Tattvartha Sutra 5.21", note: "Souls sustain one another" },
      ],
      paragraphs: [
        "In everyday English, non-violence often sounds merely negative—simply refraining from physical assault. In the Jain tradition, Ahimsa is far subtler and more demanding: it begins with vigilance over inner agitation. Acharya Umasvati defines violence in the Tattvartha Sutra (7.8; 7.13 in the Digambara recension) as the severing or injuring of life-vitalities through pramatta-yoga—activity driven by heedlessness and unguarded passion.",
        "This shifts ethics from external appearances to intentional awareness. A sharp, dismissive remark, silent resentment, or careless waste of resources all spring from the same unguarded habit of mind, whereas careful attention turns ordinary daily routines into an expression of reverence for life.",
      ],
      quote: {
        text: "All breathing, existing, living, sentient creatures should not be slain, nor treated with violence, nor abused, nor tormented, nor driven away.",
        source: "Ācārāṅga Sūtra, Book I, Lecture 4, Lesson 1 (I.4.1.1)",
        context: "Translated by Hermann Jacobi, Sacred Books of the East, Vol. 22",
      },
    },
    {
      heading: "The Ninefold Matrix of Everyday Conduct",
      paragraphs: [
        "Classical Jain ethical texts map responsibility across nine intersections: three doors of expression (mind, speech, and body) combined with three degrees of participation—committing an act oneself, asking another to commit it, or endorsing it with approval.",
      ],
      table: {
        caption: "The nine classical channels of Ahimsa in Jain ethical discipline",
        columns: ["Channel", "Mode", "Everyday Expression", "Mindful Restraint"],
        filterColumnIndex: 0,
        rows: [
          ["Thought (Manas)", "Direct (Krita)", "Harboring anger, contempt, or wishing another's downfall", "Notice irritation early before it hardens into grudge"],
          ["Thought (Manas)", "Commissioned (Karita)", "Mentally plotting to provoke or divide two people", "Drop rehearsal of grievances and divisive schemes"],
          ["Thought (Manas)", "Approved (Anumodita)", "Secretly rejoicing when a rival suffers misfortune", "Cultivate goodwill instead of quiet schadenfreude"],
          ["Speech (Vachana)", "Direct (Krita)", "Harsh insults, mockery, slander, or careless exaggeration", "Speak truthfully, briefly, and without sting"],
          ["Speech (Vachana)", "Commissioned (Karita)", "Urging others to spread gossip or attack someone online", "Refuse to amplify outrage or recruit allies in hostility"],
          ["Speech (Vachana)", "Approved (Anumodita)", "Laughing along with demeaning remarks or cruelty", "Withdraw applause and calmly redirect conversation"],
          ["Action (Kaya)", "Direct (Krita)", "Physical cruelty, reckless driving, or needless waste", "Handle tools, creatures, water, and food with care"],
          ["Action (Kaya)", "Commissioned (Karita)", "Paying for or demanding products tied to avoidable cruelty", "Choose simpler, less harmful daily consumption"],
          ["Action (Kaya)", "Approved (Anumodita)", "Celebrating spectacles or habits built on suffering", "Align leisure and household purchases with compassion"],
        ],
      },
    },
    {
      heading: "Interdependence as Daily Practice",
      paragraphs: [
        "Jain philosophy never treats non-harm as cold isolation. In Tattvartha Sutra 5.21, Umasvati states simply: Parasparopagraho jivanam—'souls render service to one another.' Because every living being exists within a shared web of support, reducing harm in one's diet, speech, and consumption is an act of solidarity with the wider living world.",
      ],
    },
  ],
  practiceGuidance: {
    title: "Practicing Ahimsa in Ordinary Hours",
    steps: [
      "Pause before speaking when agitated: ask whether your words are true, necessary, and free of avoidable sting.",
      "Audit one everyday habit—water use, food waste, or digital commentary—and replace careless consumption with deliberate restraint.",
      "If adopting stricter Jain dietary vows or periodic fasting, do so gradually and responsibly; anyone who is pregnant, growing, elderly, or managing medical or nutritional conditions should adapt practices with a qualified clinician.",
      "End the day with a quiet two-minute review of thought, speech, and action, resolving to mend any carelessness tomorrow.",
    ],
  },
  citations: [
    {
      text: "Ācārāṅga Sūtra (Gaina Sūtras, Part I)",
      reference:
        "Book I, Lecture 4, Lesson 1 (I.4.1.1); translated by Hermann Jacobi, Sacred Books of the East, Vol. 22, Oxford University Press, 1884.",
    },
    {
      text: "Tattvārtha Sūtra (That Which Is) by Ācārya Umāsvāti",
      reference:
        "Chapters 5 (Sūtra 5.21) and 7 (Sūtra 7.8 / Digambara 7.13); translated by Nathmal Tatia, HarperCollins, 1994.",
    },
    {
      text: "The Jaina Path of Purification",
      reference: "Padmanabh S. Jaini, University of California Press, 1979.",
    },
  ],
  relatedSlugs: [
    "micchami-dukkadam-the-jain-practice-of-seeking-forgiveness",
    "namokar-mantra-bowing-to-virtues-not-personalities",
    "anekantavada-antidote-to-polarization",
    "aparigraha-in-the-screen-age",
  ],
};
