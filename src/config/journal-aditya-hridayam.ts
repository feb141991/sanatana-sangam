// ============================================================================
// Journal essay: Aditya Hridayam — Valmiki Ramayana's Hymn of Inner Fortitude
//
// Reviewed and published for Sanctuary Journal.
// ============================================================================

import type { JournalEssay } from "./journal";

export const adityaHridayamEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "aditya-hridayam-inner-fortitude-before-difficult-work",
  title: "Aditya Hridayam: Valmiki Ramayana's Hymn of Inner Fortitude",
  subtitle:
    "Imparted by Sage Agastya to a weary Shri Rama in the Yuddha Kanda, this thirty-verse solar hymn restores steadiness before daunting duty.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Itihasa & Solar Liturgy Desk",
  authorBio:
    "Documenting the Valmiki Ramayana, dawn contemplative traditions, and safe liturgical practice.",
  publishedDate: "November 2026",
  emblem: "/relics/rama-bow.png",
  excerpt:
    "When exhaustion clouded Shri Rama on the battlefield of Lanka, Sage Agastya taught the Aditya Hridayam—rekindling clarity, resolve, and unshaken purpose.",
  keyTakeaways: [
    "Preserved in the Yuddha Kanda of the Valmiki Ramayana, delivered by Sage Agastya when Rama paused in weariness.",
    "Celebrates Surya not only as the visible sun, but as the indwelling awareness awake within all beings even during sleep.",
    "Safety rule: Morning practice faces east in gentle dawn light with eyes lowered or closed—never look directly at the solar disc.",
  ],
  sections: [
    {
      heading: "Agastya's Counsel at the Moment of Fatigue",
      highlights: [
        { label: "Epic Context", value: "Yuddha Kanda", note: "Valmiki Ramayana" },
        { label: "Traditional Length", value: "30 Verses", note: "Chanted thrice (Trigunita)" },
        { label: "Core Gift", value: "Nashta-Shokah", note: "Dispelling grief & hesitation" },
      ],
      paragraphs: [
        "At the climax of the Lanka war, the Valmiki Ramayana portrays a strikingly human moment: Shri Rama stands weary and absorbed in thought (yuddha-parishrantam samare chintaya sthitam) while Ravana faces him ready to strike. Approaching him, Sage Agastya imparts the Aditya Hridayam—an eternal contemplative teaching (guhyam sanatanam) to dispel sorrow and renew resolve.",
        "Notice what restores Rama before he lifts his bow: not anger, but recollection of the one luminous principle uniting all deities, seasons, and living beings.",
      ],
      quote: {
        text: "एनमापत्सु कृच्छ्रेषु कान्तारेषु भयेषु च । कीर्तयन् पुरुषः कश्चिन्नावसीदति राघव ॥",
        source: "Valmiki Ramayana, Yuddha Kanda (Aditya Hridayam, Verse 25)",
        context:
          "O Raghava, one who sings this praise during calamity, hardship, lonely wilderness, or fear does not sink into despair.",
      },
    },
    {
      heading: "Structure of the Hymn & Safe Practice",
      paragraphs: [
        "Traditional commentators divide the thirty verses into a clear narrative and meditative progression. Note on eye safety: while verse 28 mentions Rama beholding the sun before taking his bow, never gaze directly at the solar disc—not even through water, mist, or sunglasses—as solar light can cause painless, permanent retinal injury. Face east with eyes closed or resting softly on your altar.",
      ],
      table: {
        caption: "Narrative and contemplative flow of the Aditya Hridayam",
        columns: ["Verses", "Section", "Theme", "Takeaway for Difficult Work"],
        filterColumnIndex: 1,
        rows: [
          ["Verses 1–5", "Narrative", "Rama's exhaustion & Agastya's arrival", "Acknowledges human weariness without shame"],
          ["Verses 6–15", "Praise", "Surya as Brahma, Vishnu, Shiva & seasons", "Replaces tunnel vision with cosmic perspective"],
          ["Verses 16–21", "Contemplation", "Salutations from eastern rise to western set", "Honors steady cyclical order over panic"],
          ["Verses 22–26", "Fruit", "Eshah supteshu jagarti & threefold japa", "Fosters quiet vigilance and unhurried focus"],
          ["Verses 27–30", "Narrative", "Rama's achamana, clarity & renewed bow", "Transitions calmly from doubt into action"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Reciting Aditya Hridayam Safely & Mindfully",
    steps: [
      "Recite in the morning—traditionally on Sundays or before demanding responsibilities—seated comfortably indoors or facing east in gentle early light.",
      "Eye-safety rule: Keep your eyes closed in meditation or lowered toward your book, floor, or altar; never stare toward the solar disc directly or through water or filters.",
      "Sip water calmly (achamana) or wash your hands beforehand, then recite once attentively—or three times unhurriedly when time permits.",
      "Use this hymn for inner steadiness before hard duties, never as a substitute for rest, sleep, or medical care when experiencing exhaustion or illness.",
    ],
  },
  citations: [
    {
      text: "The Aditya Hridayam dialogue between Sage Agastya and Shri Rama in the Lanka war.",
      reference: "Valmiki Ramayana, Yuddha Kanda (Sarga 105 in Gita Press / traditional recensions; Appendix I, No. 65 in BORI Critical Edition).",
    },
    {
      text: "Classical commentary on trigunita (threefold) recitation and Rama's inner steadiness.",
      reference: "Govindaraja, Bhushana commentary on Valmiki Ramayana, Yuddha Kanda.",
    },
    {
      text: "Full 30-verse Sanskrit text, transliteration, and English meaning in Shoonaya's Stotra archive.",
      reference: "Shoonaya Stotram Archive (`src/lib/stotrams.ts`, aditya-hrudaya).",
    },
  ],
  relatedSlugs: [
    "the-sacred-science-of-brahma-muhurta-astronomy-and-awakening",
    "sandhyavandanam-cosmic-science-of-trisandhya-and-solar-meditation",
    "hanuman-chalisa-meaning-meter-and-astrological-protection",
  ],
};
