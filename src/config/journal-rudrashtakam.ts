// ============================================================================
// Journal essay: Shri Rudrashtakam — Goswami Tulsidas's Hymn of Surrender
//
// Reviewed and published for Sanctuary Journal.
// ============================================================================

import type { JournalEssay } from "./journal";

export const rudrashtakamEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "rudrashtakam-tulsidas-hymn-of-surrender-to-shiva",
  title: "Shri Rudrashtakam: Goswami Tulsidas's Hymn of Surrender",
  subtitle:
    "Set within the Uttara Kanda of the Ramcharitmanas, these eight Sanskrit verses move from cosmic awe to humble sharanagati before Shiva.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Bhakti & Shaiva Literature Desk",
  authorBio:
    "Exploring classical Shaiva hymns, Tulsidas's devotional corpus, and evening Pradosha contemplation.",
  publishedDate: "November 2026",
  emblem: "/relics/shiva-damaru.png",
  excerpt:
    "Embedded in the Ramcharitmanas Uttara Kanda, Goswami Tulsidas's eight-verse Rudrashtakam bridges Nirguna transcendence and heartfelt surrender.",
  keyTakeaways: [
    "Composed in Sanskrit within the Awadhi Shri Ramcharitmanas (Uttara Kanda), recounted by Kakabhushundi.",
    "Written in the rhythmic Bhujangaprayata meter (eight stanzas), gliding like a flowing mountain stream.",
    "Moves deliberately from formless Absolute (Nirguna) to the compassionate form of Shiva, ending in pure surrender.",
  ],
  sections: [
    {
      heading: "A Sanskrit Jewel in the Uttara Kanda",
      highlights: [
        { label: "Textual Home", value: "Uttara Kanda", note: "Shri Ramcharitmanas" },
        { label: "Length", value: "8 Verses", note: "Classical Ashtakam" },
        { label: "Poetic Meter", value: "Bhujangaprayata", note: "12 syllables per quarter" },
      ],
      paragraphs: [
        "Although Goswami Tulsidas composed the Shri Ramcharitmanas primarily in Awadhi, he placed one of Hinduism's most beloved Sanskrit prayers in its Uttara Kanda. There, Kakabhushundi recalls how a gentle Shiva-devotee guru in Ujjain fell to his knees and sang the Rudrashtakam to plead for mercy on behalf of an arrogant disciple.",
        "That narrative origin shapes the hymn's tone: it is neither boastful nor transactional, but an outpouring of awe, repentance, and trust in Lord Shiva's compassion (Ashutosha).",
      ],
      quote: {
        text: "नमामीशमीशान निर्वाणरूपं विभुं व्यापकं ब्रह्मवेदस्वरूपम् । निजं निर्गुणं निर्विकल्पं निरीहं चिदाकाशमाकाशवासं भजेऽहम् ॥",
        source: "Shri Ramcharitmanas, Uttara Kanda (Rudrashtakam, Verse 1)",
        context:
          "I bow to the Supreme Lord Ishana, embodiment of liberation, all-pervading essence of the Vedas, desireless expanse of pure consciousness.",
      },
    },
    {
      heading: "The Eight-Verse Journey to Surrender",
      paragraphs: [
        "Each stanza shifts the devotee's gaze—from the beyond-form Absolute to the familiar emblems of Kailash, and finally to simple admission of human helplessness before grace.",
      ],
      table: {
        caption: "Verse-by-verse arc of the Shri Rudrashtakam",
        columns: ["Verse", "Movement", "Key Imagery", "Devotional Shift"],
        filterColumnIndex: 1,
        rows: [
          ["Verse 1", "Nirguna", "Nirvana-rupam, chidakasha (sky of awareness)", "Honors Shiva beyond form and attribute"],
          ["Verse 2", "Nirguna", "Source of Omkara, Turiya, Lord of Kailash", "Transcends intellect while remaining merciful"],
          ["Verse 3", "Saguna", "Snow-peak radiance, flowing Ganga, crescent moon", "Presents cooling serenity amid restless thought"],
          ["Verse 4", "Saguna", "Neelakantha, serene gaze, garland of skulls", "Holds compassion alongside mortality"],
          ["Verse 5", "Saguna", "Trishula uprooting the threefold afflictions", "Seeks Bhavani's Lord through pure feeling"],
          ["Verse 6", "Surrender", "Kalatita, Chidananda, dispeller of delusion", "First direct plea: 'Prasida, Prasida' (Be pleased)"],
          ["Verse 7", "Surrender", "Shanti found at Uma-natha's lotus feet", "Recognizes lasting peace belongs to devotion"],
          ["Verse 8", "Surrender", "No yoga, japa, or formal puja—only bowing", "Culminates in total sharanagati (refuge)"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Chanting Shri Rudrashtakam Mindfully",
    steps: [
      "Recite in the calm of Monday morning, Maha Shivaratri, or Pradosha twilight (confirming tithi and local dusk timing via your local Panchang), sitting comfortably with steady breath.",
      "If offering a ghee diya, incense, or camphor during Shiva worship, ensure proper room ventilation and keep open flames away from fabrics.",
      "Focus on the closing confession in Verse 8 ('Na janami yogam...'): sincerity matters more than elaborate ritual or perfect speed.",
      "Seek Rudrashtakam for spiritual solace and steadiness during hardship, alongside—never in place of—medical or mental-health care when needed.",
    ],
  },
  citations: [
    {
      text: "Shri Rudrashtakam within Kakabhushundi's narrative in the Uttara Kanda.",
      reference: "Goswami Tulsidas, Shri Ramcharitmanas, Uttara Kanda (Chhanda following Doha 107), Gita Press Gorakhpur.",
    },
    {
      text: "Classical prosody of the Bhujangaprayata meter (four yagana feet per pada).",
      reference: "Pingala Chhanda Shastra & Sanskrit Stotra prosody tradition.",
    },
    {
      text: "Full Sanskrit verses, transliteration, and translations in Shoonaya's Shaiva library.",
      reference: "Shoonaya Shaiva Archive (`src/lib/data/shiva-purana.ts`, shiva-rudrashtakam-1 to 8).",
    },
  ],
  relatedSlugs: [
    "maha-shivratri-nishita-kaal-and-four-pahar-puja",
    "pradosh-vrat-twilight-window-and-shani-pradosham",
    "hanuman-chalisa-meaning-meter-and-astrological-protection",
  ],
};
