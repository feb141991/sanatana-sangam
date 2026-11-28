// ============================================================================
// Journal essay: Sri Harmandir Sahib — Four Doors Open to Every Direction
//
// Grounded in Sri Guru Granth Sahib Ji (Ang 1362) and SGPC / Amritsar
// historical records.
// ============================================================================

import type { JournalEssay } from "./journal";

export const harmandirSahibEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "harmandir-sahib-four-doors-open-to-every-direction",
  title: "Sri Harmandir Sahib: Four Doors Open to Every Direction",
  subtitle:
    "How Amritsar's central Sikh sanctuary expresses humility and universal welcome through four cardinal entrances, a sunken sarovar, and continuous Gurbani kirtan.",
  tradition: "Sikh Dharma",
  traditionColor: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Sikh Heritage & Gurbani Traditions Desk",
  authorBio:
    "Documenting Sikh historical sanctuaries, Gurpurab traditions, and the living ethos of Seva and Simran.",
  publishedDate: "November 2026",
  emblem: "/relics/kartarpur-nishan.png",
  excerpt:
    "Designed by Guru Arjan Dev Ji in the center of Guru Ram Das Ji's Amrit Sarovar, Sri Harmandir Sahib is built lower than the surrounding ground with four doors open to every direction and every person.",
  keyTakeaways: [
    "Guru Ram Das Ji excavated the Amrit Sarovar in 1577, establishing Ramdaspur (modern Amritsar) as a center of spiritual gathering and seva.",
    "Guru Arjan Dev Ji initiated the construction of Sri Harmandir Sahib (foundation laid January 1589) with four doors welcoming people of all castes, faiths, and backgrounds.",
    "Unlike raised monuments, visitors descend steps toward the shrine—an architectural teaching that spiritual insight begins with humility.",
    "On 1 September 1604, the Adi Granth was installed inside Sri Harmandir Sahib with Baba Buddha Ji appointed as its first Granthi.",
  ],
  sections: [
    {
      heading: "Lower Than the Earth, Open to All",
      highlights: [
        { label: "Amrit Sarovar", value: "1577 CE", note: "Excavated by Guru Ram Das Ji" },
        { label: "Four Entrances", value: "N · S · E · W", note: "Open to every background" },
        { label: "Adi Granth Prakash", value: "1 Sep 1604", note: "First Granthi: Baba Buddha Ji" },
      ],
      paragraphs: [
        "Every line of Sri Harmandir Sahib's architecture teaches a spiritual principle before a word is spoken. Whereas grand monuments typically rise on high plinths, Guru Arjan Dev Ji placed the sanctuary at the center of the Amrit Sarovar—completed in 1577 under Guru Ram Das Ji—so visitors must walk downward to enter.",
        "Instead of a single gate reserved for a privileged group, the sanctuary opens through four doors facing north, south, east, and west. That symmetry proclaims that the Divine Light is equally near to everyone, regardless of caste, creed, gender, or social rank.",
      ],
      quote: {
        text: "ਡਿਠੇ ਸਭੇ ਥਾਵ ਨਹੀ ਤੁਧੁ ਜੇਹਿਆ ॥ ਬਧੋਹੁ ਪੁਰਖਿ ਬਿਧਾਤੈ ਤਾਂ ਤੂ ਸੋਹਿਆ ॥",
        source: "Sri Guru Granth Sahib Ji, Ang 1362 (Phunhay, Guru Arjan Dev Ji)",
        context:
          "\"I have seen all places, yet none compares to You; the Primal Architect established You, and thus You shine in beauty.\"",
      },
    },
    {
      heading: "Historical & Architectural Milestones",
      paragraphs: [
        "From its sixteenth-century founding to its nineteenth-century gold cladding, Sri Harmandir Sahib weaves architectural symbolism with the living discipline of Shabad Kirtan and Guru Ka Langar.",
      ],
      table: {
        caption: "Key historical and architectural features of Sri Harmandir Sahib",
        columns: ["Milestone / Feature", "Period / Form", "Aspect", "Spiritual & Historical Meaning"],
        filterColumnIndex: 2,
        rows: [
          ["Amrit Sarovar Excavation", "Completed 1577", "History", "Sacred pool excavated by Guru Ram Das Ji in Ramdaspur"],
          ["Foundation Stone", "January 1589", "History", "Construction initiated by Guru Arjan Dev Ji"],
          ["Adi Granth Installation", "1 September 1604", "History", "First Prakash with Baba Buddha Ji as first Granthi"],
          ["Four Cardinal Doors", "North, South, East, West", "Architecture", "Universal welcome across caste, faith, and region"],
          ["Descending Steps", "Below surrounding plaza", "Architecture", "Embodies nimrata (humility) upon approaching the Guru"],
          ["Gold Foil & Marble Cladding", "Completed c. 1830", "Architecture", "Commissioned by Maharaja Ranjit Singh over upper floors"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Entering a Gurdwara with Humility and Care",
    steps: [
      "Cover your head respectfully, remove shoes at the joda ghar, and wash your hands and feet before stepping onto the marble parikrama.",
      "Walk mindfully on wet marble steps around the Amrit Sarovar, which can become slippery, especially early in the morning or during rain.",
      "Sit quietly in the Darbar Hall to listen to Gurbani kirtan, observing local rules against photography inside the sanctum.",
      "Join Guru Ka Langar seated together in Pangat (equal rows), checking with volunteers if you have food allergies such as dairy, wheat, or nuts.",
    ],
  },
  citations: [
    {
      text: "Sri Guru Granth Sahib Ji, Ang 1362 (Phunhay, Mahalla 5)",
      reference:
        "Guru Arjan Dev Ji's hymn celebrating Ramdaspur and the Amrit Sarovar ('Dithey sabhe thav nahi tudh jehiya').",
    },
    {
      text: "Shiromani Gurdwara Parbandhak Committee (SGPC) Historical Records",
      reference:
        "Official archival chronology of Sri Harmandir Sahib, Guru Ram Das Ji (1577), Guru Arjan Dev Ji (1589, 1604), and Maharaja Ranjit Singh (c. 1830).",
    },
  ],
  relatedSlugs: [
    "sikh-gurpurab-and-khalsa-calendar-2027",
    "diwali-2027-dates-dhanteras-lakshmi-puja-bhai-dooj",
    "seva-as-stillness-unconditional-presence",
  ],
};
