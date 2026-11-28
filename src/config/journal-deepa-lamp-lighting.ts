// ============================================================================
// Journal Essay: Deepa Prakash — The Meaning of Lighting a Lamp at Dusk
// Scannable guide to Sandhya deepam tradition with practical flame safety.
// ============================================================================

import type { JournalEssay } from "./journal";

export const deepaLampEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "deepa-prakash-the-meaning-of-lighting-a-lamp-at-dusk",
  title: "Deepa Prakash: The Meaning of Lighting a Lamp at Dusk",
  subtitle:
    "Why Sanatan households light a brass or earthen diya at sunset—bridging inner clarity, Agni as sacred witness, and safe home practice.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Home Ritual & Samagri Desk",
  authorBio:
    "Documenting everyday Sanatan household observances, regional Samagri traditions, and practical altar care.",
  publishedDate: "November 2026",
  emblem: "/relics/diya-bronze.png",
  excerpt:
    "At dusk (Sayam Sandhya), lighting a diya marks the transition from daytime toil to quiet gratitude—honoring light as a symbol of discerning wisdom and welcoming serenity into the home.",
  keyTakeaways: [
    "Lighting a lamp at dusk (Sandhya Deepam) creates a deliberate pause between work and evening family life.",
    "In Sanatan tradition, the flame serves as Agni—the sacred witness (Sakshi) of prayer and hospitality—rather than mere ornament.",
    "The traditional Deepa Jyoti verse ('Shubham Karoti Kalyanam') prays for auspiciousness, health, and the removal of ill-will.",
    "Real flames produce heat and particulate smoke, so good indoor ventilation and fire-safe placement are essential.",
  ],
  sections: [
    {
      heading: "Light at the Threshold of Dusk",
      highlights: [
        { label: "Traditional Window", value: "Sayam Sandhya", note: "Just before or at sunset" },
        { label: "Core Prayer", value: "Shubham Karoti", note: "Deepa Jyoti Stotram" },
        { label: "Sacred Role", value: "Agni Sakshi", note: "Witness to altar & home" },
      ],
      paragraphs: [
        "Across Indian homes, dusk arrives with a simple gesture: washing one's hands, lighting a small brass or clay diya at the altar or doorway, and folding the palms for a moment of stillness. In Sanatan Dharma, Agni is revered as the luminous witness that carries heartfelt gratitude.",
        "Rather than making claims about air ionization or atmospheric purification, the tradition treats the lamp as an outer mirror of inner clarity—reminding the household to release daytime irritation and cultivate steady goodwill as night falls.",
      ],
      quote: {
        text: "शुभं करोति कल्याणमारोग्यं धनसंपदा । शत्रुबुद्धिविनाशाय दीपज्योतिर्नमोऽस्तुते ॥",
        source: "Deepa Jyoti Stotram (Traditional Sandhya Deepam Verse)",
        context:
          "Salutations to the light of the lamp, which brings auspiciousness, well-being, and clarity, dispelling hostile or clouded thought.",
      },
    },
    {
      heading: "Traditional Lamp Fuels, Wicks & Vessels",
      paragraphs: [
        "Regional customs vary widely in lamp material, fuel, and wick direction—each carrying devotional symbolism within household Paddhati manuals.",
      ],
      table: {
        caption: "Common household diya elements across Sanatan customs",
        columns: ["Element", "Category", "Traditional Choice", "Customary Meaning & Practical Note"],
        filterColumnIndex: 1,
        rows: [
          ["Cow Ghee", "Fuel", "Clarified butter", "Traditionally favored for clean, steady flame at the main altar"],
          ["Sesame (Til) Oil", "Fuel", "Cold-pressed sesame oil", "Widely used in South Indian & Shani/festival lamps"],
          ["Earthen Clay (Mitti)", "Vessel", "Unpainted baked clay", "Humility and earth connection; soak briefly before first use"],
          ["Brass / Bronze", "Vessel", "Kansa or Pital", "Durable heirloom metal; clean soot residue after cooling"],
          ["Cotton Wick (Batti)", "Wick", "Hand-rolled raw cotton", "Single or paired wicks trimmed short to minimize excess smoke"],
        ],
      },
    },
    {
      heading: "Ventilation & Open-Flame Responsibility",
      paragraphs: [
        "While traditional texts praise ghee and sesame oil for burning evenly, any open flame consumes indoor oxygen and releases soot or fine particulates. Lighting lamps near an open window or in a well-ventilated room keeps the prayer space comfortable for everyone, especially children, elders, and anyone sensitive to smoke.",
      ],
    },
  ],
  practiceGuidance: {
    title: "Four Steps for Safe & Mindful Evening Deepam",
    steps: [
      "Prepare the altar around local sunset: wipe the brass or clay lamp clean, fill it with ghee or sesame oil, and trim the cotton wick so the flame stays steady and low-smoke.",
      "Place the diya on a stable, heat-resistant metal plate away from curtains, loose dupattas, paper calendars, synthetic garlands, and curious children or pets.",
      "Ensure gentle cross-ventilation (an open window or airy room), and avoid burning scented or synthetic oils if anyone in the household has asthma or smoke sensitivity.",
      "Recite the 'Shubham Karoti Kalyanam' verse with folded hands, and never leave an open flame unattended overnight or when leaving the room.",
    ],
  },
  citations: [
    {
      text: "Traditional evening lamp prayer honoring light as auspiciousness and Supreme Brahman.",
      reference: "Deepa Jyoti Stotram ('Shubham Karoti Kalyanam'), oral Smriti & household Sandhya liturgy.",
    },
    {
      text: "Agni as the primal domestic witness and guardian of the hearth (Garhapatya).",
      reference: "Rigveda Samhita 1.1; Apastamba Grihya Sutra (domestic hearth & twilight rites).",
    },
    {
      text: "Sayam Sandhya timing as the threshold between day and night.",
      reference: "Manu Smriti, Adhyaya 2, Verse 101.",
    },
  ],
  relatedSlugs: [
    "diwali-lakshmi-puja-sthira-lagna-and-dhanteras-astronomy",
    "home-mandir-vastu-direction-geometry-and-altar-setup",
    "sandhyavandanam-cosmic-science-of-trisandhya-and-solar-meditation",
  ],
};
