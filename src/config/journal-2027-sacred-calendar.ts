// ============================================================================
// Journal essay: 2027 Sacred Calendar — Verified Hindu, Sikh & Jain Dates
//
// Every 2027 date below comes directly from Shoonaya's published
// `observance_occurrences` register (read 2026-11-28, calendar_profile:
// `legacy-ujjain` unless noted). Unresolved or disputed 2027 occurrences
// (such as Janmashtami 2027, currently `withheld_disputed`) are intentionally
// omitted until council resolution.
//
// Published 2026-11-28 after Pramana & Ritual Practice review and founder sign-off.
// ============================================================================

import type { JournalEssay } from "./journal";

export const sacredCalendar2027Essay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:00:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:00:00.000Z",
    sourcesVerified: true,
  },
  slug: "2027-hindu-sikh-jain-festival-calendar-verified-dates",
  title: "The 2027 Sacred Calendar: Verified Hindu, Sikh, and Jain Observance Dates",
  subtitle:
    "A scannable guide to the confirmed major observances of 2027—filterable by tradition and anchored to Shoonaya's verified calendar register.",
  tradition: "Sanatan, Sikh & Jain",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Calendar Governance & Traditions Desk",
  authorBio:
    "Compiled from Shoonaya's verified 2027 observance register (legacy-ujjain and north_indian_purnimanta profiles, read 28 November 2026).",
  publishedDate: "November 2026",
  emblem: "/relics/chakra.png",
  excerpt:
    "Every verified 2027 Hindu, Sikh, and Jain festival date in one scannable table—from Makar Sankranti and Maha Shivaratri to Baisakhi, Samvatsari, Diwali, and Guru Nanak Gurpurab.",
  keyTakeaways: [
    "Only verified, published 2027 dates from Shoonaya's observance register are listed; disputed dates (such as Janmashtami 2027) remain withheld until council resolution.",
    "Lunar observances follow Udaya Tithi (sunrise) or specific muhurta windows (Nishita Kaal, Pradosha), which can shift by one day outside India.",
    "Solar and Nanakshahi/Punjabi milestones—Makar Sankranti (14 January 2027) and Baisakhi (14 April 2027)—anchor the solar year.",
    "Two Kumbh gatherings also fall in 2027 at Haridwar and Nashik–Trimbakeshwar.",
  ],
  sections: [
    {
      heading: "2027 at a Glance",
      highlights: [
        { label: "Major Confirmed Dates", value: "25 Festivals", note: "Across Sanatan, Sikh & Jain" },
        { label: "Ekadashi Rhythm", value: "25 Ekadashis", note: "4 Mar (Vijaya) to 23 Dec" },
        { label: "Kumbh Melas", value: "2 Gatherings", note: "Haridwar & Nashik–Trimbakeshwar" },
      ],
      paragraphs: [
        "Lunar festivals depend on the exact tithi prevailing at local sunrise (Udaya Tithi) or during a prescribed ritual window such as Nishita Kaal or Pradosha. Every date below comes from Shoonaya's verified 2027 register; any observance still under council review (such as Janmashtami 2027) is withheld rather than guessed.",
      ],
      quote: {
        text: "कालः सृजति भूतानि कालः संहरते प्रजाः।",
        source: "Mahabharata, Adi Parva",
        context: "Time brings forth all beings and gathers all generations within its sacred rhythm.",
      },
    },
    {
      heading: "Confirmed 2027 Festival Calendar",
      paragraphs: [
        "Use the tradition filter below to narrow down the 2027 schedule to Sanatan, Sikh, or Jain observances.",
      ],
      table: {
        caption: "Verified 2027 Hindu, Sikh, and Jain observance dates",
        columns: ["Date", "Observance", "Tradition", "Significance / Window"],
        filterColumnIndex: 2,
        rows: [
          ["13 January 2027", "Lohri", "Sikh", "Winter harvest & evening bonfire"],
          ["14 January 2027", "Makar Sankranti", "Sanatan", "Uttarayana Punya Kaal · Haridwar Kumbh opens"],
          ["15 January 2027", "Guru Gobind Singh Gurpurab", "Sikh", "Prakash Utsav of the Tenth Guru"],
          ["21 February 2027", "Holla Mohalla", "Sikh", "Khalsa gathering & kirtan at Anandpur Sahib"],
          ["6 March 2027", "Maha Shivaratri", "Sanatan", "Nishita Kaal & four-pahar Shiva abhishekam"],
          ["22 March 2027", "Holi", "Sanatan", "Phalguna Purnima celebrations"],
          ["7 April 2027", "Chaitra Navratri Begins", "Sanatan", "Ghatasthapana & nine nights of Devi sadhana"],
          ["14 April 2027", "Baisakhi", "Sikh", "Khalsa Sajna Diwas & Mesha Sankranti"],
          ["19 April 2027", "Mahavir Jayanti", "Jain", "Birth anniversary of Bhagavan Mahavira"],
          ["16 June 2027", "Guru Arjan Dev Martyrdom", "Sikh", "Shaheedi Diwas · Chhabeel seva & Sukhmani Sahib"],
          ["14 July 2027", "Devshayani Ekadashi", "Sanatan", "Chaturmasya begins (Ashadha Shukla Ekadashi)"],
          ["18 July 2027", "Guru Purnima", "Shared", "Vyasa Purnima · Honoring spiritual teachers"],
          ["4 September 2027", "Ganesh Chaturthi", "Sanatan", "Madhyahna Ganesha sthapana"],
          ["5 September 2027", "Samvatsari", "Jain", "Paryushana culmination & Micchami Dukkadam"],
          ["30 September 2027", "Sharad Navratri Begins", "Sanatan", "Ashwin Shukla Pratipada · Shakti upasana"],
          ["18 October 2027", "Karva Chauth", "Sanatan", "Kartik Krishna Chaturthi · Moonrise arghya"],
          ["27 October 2027", "Dhanteras", "Sanatan", "Dhanvantari Trayodashi"],
          ["28 October 2027", "Bandhi Chhor Divas", "Sikh", "Guru Hargobind Sahib's release from Gwalior"],
          ["29 October 2027", "Diwali", "Shared", "Pradosha Lakshmi Puja · Jain Mahavir Nirvana"],
          ["30 October 2027", "Govardhan Puja", "Sanatan", "Annakut & Kartik Shukla Pratipada"],
          ["31 October 2027", "Bhai Dooj", "Sanatan", "Yama Dwitiya"],
          ["10 November 2027", "Devutthana Ekadashi", "Sanatan", "Chaturmasya concludes (Prabodhini Ekadashi)"],
          ["13 November 2027", "Guru Nanak Gurpurab", "Sikh", "Kartik Purnima Prakash Utsav"],
          ["23 November 2027", "Guru Tegh Bahadur Martyrdom", "Sikh", "Shaheedi Diwas of the Ninth Guru"],
          ["26 December 2027", "Sahibzade Shaheedi Diwas", "Sikh", "Martyrdom remembrance of the Chhote Sahibzade"],
        ],
      },
    },
    {
      heading: "2027 Ekadashi Highlights",
      highlights: [
        { label: "Total in 2027", value: "25 Ekadashis", note: "12 Shukla + 13 Krishna" },
        { label: "Chaturmasya", value: "14 Jul – 10 Nov", note: "Devshayani to Devutthana" },
      ],
      paragraphs: [
        "Major named Ekadashis in 2027 include Vijaya Ekadashi (4 March 2027, North Indian Purnimanta), Amalaki Ekadashi (18 March), Kamada Ekadashi (17 April), Apara Ekadashi (1 June), Devshayani Ekadashi (14 July), Kamika Ekadashi (30 July), Shravana Putrada Ekadashi (12 August), Aja Ekadashi (28 August), Parivartini Ekadashi (11 September), Rama Ekadashi (25 October), Devutthana Ekadashi (10 November), and Utpanna Ekadashi (24 November).",
        "Because Ekadashi Parana depends on Dwadashi end-times and local sunrise, check your city's Panchang inside Shoonaya before fixing your fast-breaking window.",
      ],
    },
  ],
  practiceGuidance: {
    title: "Preparing Your 2027 Sadhana Calendar",
    steps: [
      "Check your local city and calendar profile (Amanta or Purnimanta) in Shoonaya's Calendar tab, as tithi boundaries can shift by one day outside India.",
      "For fasting observances such as Ekadashi, Maha Shivaratri, and Karva Chauth, observe full or partial fasts only if you are in good health; anyone who is pregnant, elderly, or managing medical conditions should adapt the vrata with food and water or consult a physician.",
      "Mark key Sankalpa mornings—such as Makar Sankranti (14 January), Baisakhi (14 April), and Guru Purnima (18 July)—for daan, scripture reading, and family remembrance.",
      "Watch for council updates on disputed 2027 observances (such as Janmashtami) inside the Shoonaya Calendar before finalizing travel or community bookings.",
    ],
  },
  citations: [
    {
      text: "Shoonaya 2027 Verified Observance Register (observance_occurrences)",
      reference:
        "Published 2027 occurrences (legacy-ujjain and north_indian_purnimanta profiles), verified in Supabase observance_occurrences on 28 November 2026.",
    },
    {
      text: "Kumbh 2027 Official Bathing Schedules",
      reference:
        "packages/dharma-rules/src/melas/mela-schedule.json (Haridwar Kumbh 2027 and Nashik–Trimbakeshwar Simhastha 2027).",
    },
    {
      text: "Mahabharata, Adi Parva (Reflection on Time)",
      reference: "Veda Vyasa, Mahabharata, Adi Parva (Anukramanika Parva).",
    },
  ],
  relatedSlugs: [
    "kumbh-2027-haridwar-nashik-official-dates",
    "the-global-tithi-discrepancy-astronomy-and-timezones",
    "the-complete-ekadashi-parana-guide-shastric-rules-and-timing",
  ],
};
