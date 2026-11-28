// ============================================================================
// Journal essay: Sangat & Pangat: Equality in Sacred Company and Langar
//
// Grounded in Sri Guru Granth Sahib Ji (Angs 62, 72, 967, 1349), Guru Amar
// Das Ji's Pangat principle, and Sikh Rehat Maryada Chapter XII.
// ============================================================================

import type { JournalEssay } from "./journal";

export const sangatPangatEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "sangat-and-pangat-equality-in-company-and-langar",
  title: "Sangat & Pangat: Equality in Sacred Company and Langar",
  subtitle:
    "How Guru Amar Das Ji's rule of 'Pehlay Pangat, Pachhay Sangat' turned shared meals into a living practice of human dignity.",
  tradition: "Sikh Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Gurmat & Contemplative Practice Desk",
  authorBio:
    "Compiled from Sri Guru Granth Sahib Ji, Sikh historical chronicles, and SGPC Sikh Rehat Maryada (Chapter XII).",
  publishedDate: "November 2026",
  emblem: "/relics/deg-teg.png",
  excerpt:
    "In Sikh Dharma, spiritual fellowship (Sangat) and shared egalitarian dining (Pangat) are inseparable—dissolving caste, status, and pride before one ever steps into prayer.",
  keyTakeaways: [
    "Sangat means gathering around Ik Onkar in shared remembrance, where all voices sit at the same level beneath Sri Guru Granth Sahib Ji.",
    "Guru Amar Das Ji institutionalized 'Pehlay Pangat, Pachhay Sangat' at Goindwal Sahib, requiring every visitor—even Emperor Akbar—to dine in the common row before meeting him.",
    "Sikh Rehat Maryada (Chapter XII) defines Guru Ka Langar as training in selfless Seva and the active erasure of social hierarchy.",
  ],
  sections: [
    {
      heading: "Pehlay Pangat, Pachhay Sangat",
      highlights: [
        { label: "Core Maxim", value: "Pehlay Pangat", note: "First the row, then the assembly" },
        { label: "Instituted By", value: "Guru Amar Das Ji", note: "Third Guru · Goindwal Sahib" },
        { label: "Rehat Maryada", value: "Chapter XII", note: "Guru Ka Langar & Seva" },
      ],
      paragraphs: [
        "Guru Nanak Dev Ji opened the earliest community kitchen, and Mata Khivi Ji nurtured its generosity at Khadur Sahib—praised on Ang 967 of the Sri Guru Granth Sahib Ji. Guru Amar Das Ji then made Pangat (sitting together in one unbroken row on the floor) the threshold to Sangat: no visitor could enter his spiritual assembly without first sharing the same simple meal.",
        "According to Sikh chronicles, when Mughal Emperor Akbar came to Goindwal Sahib, he too sat in the Pangat alongside ordinary villagers. Worship and social dignity were never separate tracks.",
      ],
      quote: {
        text: "Sabh ko ouchaa aakheeai, neech na deesai koe.",
        source: "Sri Guru Granth Sahib Ji, Ang 62 (Sri Raag, Guru Nanak Dev Ji)",
        context: "Call everyone exalted—none appears low; the One Creator fashioned all vessels and shines His One Light within all",
      },
    },
    {
      heading: "How Sangat and Pangat Reinforce Each Other",
      paragraphs: [
        "Sitting together in the Diwan hall softens isolation, while serving and dining together in the Langar hall tests that insight in plain sight. Both spaces strip away external rank.",
      ],
      table: {
        caption: "Pillars of Sangat and Pangat in Gurdwara life",
        columns: ["Dimension", "Sangat (Diwan Hall)", "Pangat (Langar Hall)"],
        rows: [
          ["Core Purpose", "Collective Kirtan, Gurbani reflection, and Ardas", "Sharing vegetarian meals freely with all visitors"],
          ["Seating Principle", "Everyone sits equally below Sri Guru Granth Sahib Ji", "Everyone sits shoulder-to-shoulder in straight rows"],
          ["Inner Discipline", "Humility through listening (Suniai) to the Shabad", "Humility through serving (Seva) and eating without rank"],
          ["Key Scriptural Anchor", "Ang 72: Where the One Name is spoken, there is Satsangat", "Ang 967: Langar of the Guru's Word never runs short"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Entering Sangat and Pangat Mindfully",
    steps: [
      "Enter a Gurdwara with head covered and shoes left in the shoe room, offering a quiet greeting to the congregation without rushing.",
      "In Langar, sit in the Pangat row and take only as much food as you will finish—avoiding waste is an essential mark of respect for the sevaks' labor.",
      "If floor seating is painful due to knee, hip, or back conditions, use the chairs or tables provided in most Gurdwaras; dignity and inclusion belong to every body.",
      "Volunteer for a simple task afterward—rolling rotis, clearing plates, or washing dishes—while keeping kitchens clean and following basic food-hygiene care.",
    ],
  },
  citations: [
    {
      text: "Sri Guru Granth Sahib Ji — Angs 62, 72, 967, and 1349",
      reference: "Verses on human equality (Guru Nanak Dev Ji, Ang 62), Satsangat (Ang 72), Mata Khivi's Langar (Balwand & Satta, Ang 967), and One Light (Bhagat Kabir Ji, Ang 1349).",
    },
    {
      text: "SGPC — Sikh Rehat Maryada, Section Five, Chapter XII",
      reference: "Articles governing Guru Ka Langar, selfless Seva, and eradication of caste and status distinctions.",
    },
  ],
  relatedSlugs: [
    "seva-as-stillness-unconditional-presence",
    "ardas-humility-gratitude-and-sarbat-da-bhala",
    "sikh-gurpurab-and-khalsa-calendar-2027",
  ],
};
