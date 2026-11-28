// ============================================================================
// Journal essay: The Five Limbs of Panchang (Pancha-Anga Primer)
// Evergreen guide to Tithi, Vara, Nakshatra, Yoga, and Karana.
// Reviewed for Pramana, Ritual/Safety, and editorial publication.
// ============================================================================

import type { JournalEssay } from "./journal";

export const panchangaFiveLimbsEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "panchanga-tithi-vara-nakshatra-yoga-karana-explained",
  title: "The Five Limbs of Panchang: Tithi, Vara, Nakshatra, Yoga & Karana",
  subtitle:
    "A clear, practical primer on how the five astronomical coordinates of a daily Hindu almanac work together—and how to read them in seconds.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Panchang & Astrometry Desk",
  authorBio:
    "Grounded in Siddhanta Jyotisha, the Positional Astronomy Centre's Rashtriya Panchang standards, and Shoonaya's local horizon ephemeris.",
  publishedDate: "November 2026",
  emblem: "/relics/om.png",
  excerpt:
    "Panchang means 'five limbs': Tithi, Vara, Nakshatra, Yoga, and Karana. Understanding what each limb measures turns a dense almanac page into an intuitive daily compass.",
  keyTakeaways: [
    "Tithi (12° Moon–Sun arc) and Karana (6° half-tithi) track the changing angular separation between Moon and Sun.",
    "Vara is the solar weekday running from local sunrise to the next sunrise, while Nakshatra tracks the Moon's 13°20′ sidereal star-sector.",
    "Yoga adds the sidereal longitudes of the Sun and Moon into 27 divisions, completing the five coordinates (Pancha-Anga) of traditional timekeeping.",
  ],
  sections: [
    {
      heading: "Five Astronomical Coordinates of a Day",
      highlights: [
        { label: "Lunar Days", value: "30 Tithis", note: "12° Moon–Sun separation each" },
        { label: "Star & Sum Divisions", value: "27 Each", note: "Nakshatra & Yoga (13°20′)" },
        { label: "Half-Tithis", value: "60 Karanas", note: "6° Moon–Sun separation each" },
      ],
      paragraphs: [
        "The Sanskrit word Panchanga combines Pancha (five) and Anga (limb). Unlike a Gregorian date that tracks only a midnight-to-midnight solar count, a Hindu Panchang maps each moment across five distinct astronomical coordinates—three drawn from lunar-solar geometry, one from the solar weekday, and one from the fixed star backdrop.",
        "Because the Moon travels faster along an elliptical orbit, Tithis, Nakshatras, Yogas, and Karanas vary in length and change at any hour of day or night. Traditional calendars therefore note both the limb prevailing at local sunrise (Udaya) and the exact timestamp when it transitions.",
      ],
      quote: {
        text: "Time is of two kinds; the first destroys all animate and inanimate things, the second is that which can be known. This latter kind of time is also of two kinds; the one is called Murta (measurable) and the other is Amurta (immeasurable).",
        source: "Surya Siddhanta, Chapter 1, Verses 10–11 (trans. Ebenezer Burgess)",
        context: "Opening distinction between eternal and measurable astronomical time",
      },
    },
    {
      heading: "The Five Limbs Compared",
      paragraphs: [
        "Each limb serves a specific role in daily worship and calendar reading. Tithi anchors vrats and festivals, Vara governs weekday observances, Nakshatra guides samskaras and Sankalpas, and Yoga and Karana refine electional timing (Muhurta).",
      ],
      table: {
        caption: "Comparison of the five Panchang limbs (Pancha-Anga)",
        columns: ["Limb", "Cycle Anchor", "Astronomical Definition", "Count & Primary Role"],
        filterColumnIndex: 1,
        rows: [
          ["Tithi", "Sun & Moon", "Every 12° increase in Moon–Sun longitude separation", "30 per lunar month; governs Ekadashi, Purnima, Amavasya, and festivals"],
          ["Vara", "Sun", "Solar weekday running from local sunrise to next sunrise", "7 weekdays (Ravivara to Shanivara); anchors Rahu Kaal and weekday vrats"],
          ["Nakshatra", "Moon & Stars", "Moon's transit through 13°20′ sidereal star divisions", "27 mansions (Ashwini–Revati); guides Sankalpa, naming, and Muhurta"],
          ["Yoga", "Sun & Moon", "Combined sum of Sun + Moon sidereal longitudes divided by 13°20′", "27 Yogas (Vishkamba–Vaidhriti); marks qualitative harmony for rituals"],
          ["Karana", "Sun & Moon", "Half of a Tithi (every 6° of Moon–Sun separation)", "11 karana types across 60 half-tithis; refines action and trade timing"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "How to Read a Daily Panchang in Under a Minute",
    steps: [
      "Confirm your local city in Shoonaya so sunrise, sunset, and all five limb transition times match your geographic horizon.",
      "Read Vara and Tithi first to identify today's sunrise-anchored observance (Udaya Tithi) and whether it falls in Shukla (waxing) or Krishna (waning) Paksha.",
      "Note the active Nakshatra, Yoga, and Karana when reciting a daily Sankalpa or scheduling an optional milestone, while keeping daily duties unhurried.",
      "Treat Panchang fasting or vrata cues as voluntary spiritual discipline—never skip prescribed medication or undertake strict fasts without medical guidance if you are pregnant, elderly, or managing an illness.",
    ],
  },
  citations: [
    {
      text: "Surya Siddhanta: A Text-Book of Hindu Astronomy",
      reference: "Translated by Rev. Ebenezer Burgess & William Dwight Whitney, Motilal Banarsidass, Chapters 1 & 14.",
    },
    {
      text: "The Indian Ephemeris & Rashtriya Panchang (Chitra Paksha / Lahiri Ayanamsha)",
      reference: "Positional Astronomy Centre, India Meteorological Department, Ministry of Earth Sciences, Kolkata.",
    },
    {
      text: "Muhurta Chintamani & Dharmasindhu",
      reference: "Traditional Jyotisha and Dharmashastra definitions of Tithi, Vara, Nakshatra, Yoga, and Karana.",
    },
  ],
  relatedSlugs: [
    "rhythm-of-sacred-time-panchang",
    "the-global-tithi-discrepancy-astronomy-and-timezones",
    "rahu-kaal-and-choghadiya-astronomy-and-muhurta-science",
  ],
};
