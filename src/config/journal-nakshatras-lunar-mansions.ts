// ============================================================================
// Journal essay: The 27 Nakshatras — Lunar Mansions in Daily Panchang
// Evergreen astronomical and Shastric guide from Ashwini to Revati.
// Reviewed for Pramana, Ritual/Safety, and editorial publication.
// ============================================================================

import type { JournalEssay } from "./journal";

export const nakshatrasEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "nakshatras-the-27-lunar-mansions-in-daily-life",
  title: "The 27 Nakshatras: How Lunar Mansions Shape Daily Panchang",
  subtitle:
    "From Ashwini to Revati: how the Moon's 13°20′ sidereal star-segments anchor Vedic astronomy, presiding deities, and daily observance.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Panchang & Astrometry Desk",
  authorBio:
    "Grounded in Siddhanta Jyotisha, Taittiriya Brahmana traditions, and Shoonaya's Lahiri (Chitra Paksha) sidereal Panchang calculations.",
  publishedDate: "November 2026",
  emblem: "/relics/siddhashila-moon.png",
  excerpt:
    "The 27 Nakshatras divide the ecliptic into equal 13°20′ star-segments—guiding daily Panchang readings, temple Sankalpas, and Muhurta traditions from Ashwini to Revati.",
  keyTakeaways: [
    "Each Nakshatra spans exactly 13°20′ (1/27th) of the 360° sidereal ecliptic along the Moon's orbital path.",
    "The Moon completes one sidereal circuit against the fixed stars in roughly 27.3 days, spending about one day in each Nakshatra.",
    "Early Vedic texts such as the Taittiriya Brahmana and Atharva Veda list 28 asterisms (including Abhijit) beginning with Krittika, while classical Panchangs standardize 27 equal divisions from Ashwini to Revati.",
  ],
  sections: [
    {
      heading: "What Is a Nakshatra?",
      highlights: [
        { label: "Sidereal Divisions", value: "27 Mansions", note: "13°20′ of ecliptic arc each" },
        { label: "Lunar Circuit", value: "~27.3 Days", note: "Sidereal orbital period" },
        { label: "Early Vedic Count", value: "28 Asterisms", note: "Includes Abhijit in Taittiriya Brahmana" },
      ],
      paragraphs: [
        "In Vedic astronomy, a Nakshatra is one of twenty-seven equal sectors dividing the 360-degree sidereal ecliptic (each measuring 13 degrees and 20 minutes of arc). Because the Moon orbits Earth relative to the background stars in roughly 27.3 days, it passes through approximately one Nakshatra each civil day.",
        "Ancient Vedic liturgy—such as the Nakshatra Suktam of the Taittiriya Brahmana (Kanda 3) and the Atharva Veda (19.7)—preserves an older sequence of twenty-eight asterisms opening with Krittika and placing Abhijit between Uttara Ashadha and Shravana. Classical Siddhantic Panchangs standardize twenty-seven equal divisions from Ashwini to Revati.",
      ],
      quote: {
        text: "The time which contains sixty ghatikas is called a nakshatra ahoratra (a sidereal day and night); and a nakshatra masa (a sidereal month) consists of thirty nakshatra ahoratras.",
        source: "Surya Siddhanta, Chapter 1, Verse 12 (trans. Ebenezer Burgess)",
        context: "Classical Siddhantic definition of sidereal timekeeping",
      },
    },
    {
      heading: "All 27 Nakshatras: Deities & Muhurta Temperaments",
      paragraphs: [
        "Classical Muhurta Shastra groups the twenty-seven Nakshatras into seven traditional temperaments—Fixed (Dhruva), Movable (Chara), Swift (Kshipra), Gentle (Mridu), Mixed (Mishra), Fierce (Ugra), and Sharp (Tikshna)—alongside the presiding Devatas recorded in the Taittiriya Brahmana. Filter by temperament below to inspect all twenty-seven lunar mansions.",
      ],
      table: {
        caption: "The 27 Nakshatras from Ashwini to Revati with Taittiriya Brahmana deities and Muhurta class",
        columns: ["#", "Nakshatra", "Presiding Deity", "Muhurta Class", "Traditional Affinity"],
        filterColumnIndex: 3,
        rows: [
          ["1", "Ashwini", "Ashwini Kumaras", "Swift (Kshipra)", "Prompt undertakings, healing arts, beginnings"],
          ["2", "Bharani", "Yama", "Fierce (Ugra)", "Restraint, discipline, clearing obstacles"],
          ["3", "Krittika", "Agni", "Mixed (Mishra)", "Fire rituals (Homa), purification, decisive focus"],
          ["4", "Rohini", "Prajapati", "Fixed (Dhruva)", "Foundations, planting, steady vows, creative growth"],
          ["5", "Mrigashira", "Soma", "Gentle (Mridu)", "Study, fine arts, quiet inquiry, friendly counsel"],
          ["6", "Ardra", "Rudra", "Sharp (Tikshna)", "Intense tapasya, research, breaking stagnation"],
          ["7", "Punarvasu", "Aditi", "Movable (Chara)", "Renewal, travel, welcoming guests, study"],
          ["8", "Pushya", "Brihaspati", "Swift (Kshipra)", "Teaching, charity (Dana), spiritual initiation"],
          ["9", "Ashlesha", "Sarpas (Nagas)", "Sharp (Tikshna)", "Solitary focus, guarded discernment"],
          ["10", "Magha", "Pitris (Ancestors)", "Fierce (Ugra)", "Ancestral remembrance, honoring lineage"],
          ["11", "Purva Phalguni", "Bhaga", "Fierce (Ugra)", "Rest, artistry, household celebration"],
          ["12", "Uttara Phalguni", "Aryaman", "Fixed (Dhruva)", "Vows, partnerships, long-term commitments"],
          ["13", "Hasta", "Savitar", "Swift (Kshipra)", "Craftsmanship, writing, skillful service"],
          ["14", "Chitra", "Tvashtar", "Gentle (Mridu)", "Design, architecture, sacred adornment"],
          ["15", "Swati", "Vayu", "Movable (Chara)", "Travel, trade, adaptable movement"],
          ["16", "Vishakha", "Indragni", "Mixed (Mishra)", "Goal-oriented effort, ceremonial lamps"],
          ["17", "Anuradha", "Mitra", "Gentle (Mridu)", "Friendship, devotional sangha, reconciliation"],
          ["18", "Jyeshtha", "Indra", "Sharp (Tikshna)", "Stewardship, protective resolve"],
          ["19", "Mula", "Nirriti", "Sharp (Tikshna)", "Root inquiry, letting go of excess"],
          ["20", "Purva Ashadha", "Apah (Waters)", "Fierce (Ugra)", "Purification, courageous determination"],
          ["21", "Uttara Ashadha", "Vishvedevas", "Fixed (Dhruva)", "Enduring institutions, oaths, construction"],
          ["22", "Shravana", "Vishnu", "Movable (Chara)", "Listening to scripture (Shravana), learning"],
          ["23", "Dhanishtha", "Vasus", "Movable (Chara)", "Music, rhythm, community generosity"],
          ["24", "Shatabhisha", "Varuna", "Movable (Chara)", "Quiet retreat, study, ocean/water contemplation"],
          ["25", "Purva Bhadrapada", "Aja Ekapada", "Fierce (Ugra)", "Austere contemplation, inner discipline"],
          ["26", "Uttara Bhadrapada", "Ahir Budhnya", "Fixed (Dhruva)", "Deep meditation, lasting charity"],
          ["27", "Revati", "Pushan", "Gentle (Mridu)", "Safe journeys, nurturing care, completion"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Using Nakshatra Awareness in Daily Practice",
    steps: [
      "Check the active Nakshatra and its ending timestamp (Upto) for your local city in Shoonaya's daily Panchang, as Nakshatra boundaries do not align with midnight.",
      "Read the Nakshatra's traditional deity as a contemplative theme—such as remembering the Pitris during Magha or dedicating scriptural listening on Shravana.",
      "Use Muhurta classifications gently for optional milestones and ceremonies; never delay urgent medical care, daily duties (Nitya Karma), or compassionate action because of a star-class label.",
      "Observe traditional vows or fasting associated with a Nakshatra only if your health permits, consulting a qualified physician if you manage chronic conditions or take regular medication.",
    ],
  },
  citations: [
    {
      text: "Nakshatra Suktam: The 28 Lunar Mansions and Presiding Devatas",
      reference: "Krishna Yajurveda, Taittiriya Brahmana, Kanda 3, Prapathaka 1 (3.1.1–3.1.5).",
    },
    {
      text: "Atharva Veda Samhita (Shaunaka), Book 19, Hymn 7 (28 Nakshatras)",
      reference: "Traditional Vedic hymn enumerating the twenty-eight lunar asterisms beginning with Krittika.",
    },
    {
      text: "Surya Siddhanta: Sidereal Time and Nakshatra Divisions",
      reference: "Translated by Rev. Ebenezer Burgess & William Dwight Whitney, Motilal Banarsidass, Chapter 1 & Chapter 8.",
    },
    {
      text: "Muhurta Chintamani: Sapta Nakshatra Vargikaran (Sevenfold Classification)",
      reference: "Daivajna Rama (Rama Daivajna), Nakshatra Prakarana; Positional Astronomy Centre, Rashtriya Panchang (Lahiri Ayanamsha).",
    },
  ],
  relatedSlugs: [
    "rhythm-of-sacred-time-panchang",
    "rahu-kaal-and-choghadiya-astronomy-and-muhurta-science",
    "the-global-tithi-discrepancy-astronomy-and-timezones",
  ],
};
