// ============================================================================
// Journal essay: Kashi — The City of Light in Puranic Tradition
//
// Grounded in Skanda Purana (Kashi Khanda) and classical Varanasi pilgrimage
// tradition.
// ============================================================================

import type { JournalEssay } from "./journal";

export const kashiEssay: JournalEssay = {
  publicationStatus: "published",
  publishedAt: "2026-11-28T06:30:00.000Z",
  editorialReview: {
    reviewerName: "Pt. Prince Sharma",
    reviewedAt: "2026-11-28T06:30:00.000Z",
    sourcesVerified: true,
  },
  slug: "kashi-the-city-of-light-in-puranic-tradition",
  title: "Kashi: The City of Light in Puranic Tradition",
  subtitle:
    "Why the Skanda Purana's Kashi Khanda calls Varanasi Avimukta—the sacred field never forsaken—and maps its ghats and Panchakroshi circuit as a mandala of liberation.",
  tradition: "Sanatan Dharma",
  traditionColor:
    "text-[var(--brand-primary-strong)] border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)]",
  readTime: "4 min read",
  author: "Shoonaya Editorial",
  authorRole: "Puranic Literature & Sacred Cities Desk",
  authorBio:
    "Studying Puranic mahatmyas, classical pilgrimage circuits, and living temple traditions across India.",
  publishedDate: "November 2026",
  emblem: "/relics/incense-sandalwood.png",
  excerpt:
    "In the Skanda Purana's Kashi Khanda, Kashi is the City of Light and Avimukta—an enduring sanctuary bounded by the Ganga and a concentric five-krosha pilgrimage mandala.",
  keyTakeaways: [
    "The name Kashi derives from the Sanskrit root 'kash' (to shine), celebrating Varanasi as the luminous city of spiritual illumination.",
    "In the Skanda Purana (Kashi Khanda, Chapter 26), Shiva declares Kashi to be Avimukta—never abandoned even during cosmic dissolution (pralaya).",
    "Traditional pilgrimage follows concentric circles: from the outer Panchakroshi Yatra down to the inner Antargriha sanctum around Vishwanath.",
    "Kashi's riverfront ghats hold daily morning prayer and final rites side by side, inviting contemplative acceptance of impermanence.",
  ],
  sections: [
    {
      heading: "Avimukta: The City Never Forsaken",
      highlights: [
        { label: "Primary Text", value: "Kashi Khanda", note: "Skanda Purana · 100 chapters" },
        { label: "Sacred Name", value: "Avimukta", note: "Never forsaken by Shiva" },
        { label: "Outer Circuit", value: "Panchakroshi", note: "Five-krosha mandala" },
      ],
      paragraphs: [
        "Across its hundred chapters, the Kashi Khanda of the Skanda Purana portrays Varanasi not merely as an ancient river city, but as a luminous spiritual threshold. Rooted in the verb 'kash'—to shine—Kashi is revered as the place where inner clarity dawns and worldly restlessness softens.",
        "Chapter 26 calls its core zone Avimukta, the field never forsaken by Shiva and Parvati even at the end of a cosmic cycle. Bounded by the Varuna and Asi streams along the north-flowing Ganga, this five-krosha landscape became a template for sacred urban geography.",
      ],
      quote: {
        text: "अविमुक्तं महाक्षेत्रं परनिर्वाणकारणम् । क्षेत्राणां परमं क्षेत्रं मंगलानां च मंगलम् ॥",
        source: "Skanda Purana, Kashi Khanda",
        context:
          "\"The great field of Avimukta is the cause of supreme liberation—highest among all sacred fields and most auspicious among all auspicious things.\"",
      },
    },
    {
      heading: "Concentric Anchors of the Kashi Mandala",
      paragraphs: [
        "Pilgrimage texts organize Kashi into nested rings—from the heart of the city around Kashi Vishwanath and the riverside ghats to the five traditional overnight halts of the Panchakroshi Yatra.",
      ],
      table: {
        caption: "Key sacred anchors of Kashi in Puranic and pilgrimage tradition",
        columns: ["Sacred Anchor", "Traditional Role", "Zone", "Spiritual Focus"],
        filterColumnIndex: 2,
        rows: [
          ["Kashi Vishwanath", "Central Jyotirlinga & Antargriha heart", "Inner Sanctum", "Lord of the Universe; stillness & jnana"],
          ["Manikarnika Ghat", "Ancient cremation & Puranic tirtha", "Riverfront Ghat", "Contemplation of mortality & Taraka mantra lore"],
          ["Dashashwamedh Ghat", "Major Ganga Aarti & Puranic bath ghat", "Riverfront Ghat", "Collective evening sandhya & gratitude"],
          ["Kardameshwar", "First halt of the Panchakroshi Yatra", "Panchakroshi Halt", "Ancient Shiva temple marking the southwest arc"],
          ["Rameshwar", "Third halt beside the Varuna river", "Panchakroshi Halt", "Shrine linked to Sri Rama's pilgrimage tradition"],
          ["Kapildhara", "Fifth halt near the Ganga confluence", "Panchakroshi Halt", "Ancestral tarpan before returning to Vishwanath"],
        ],
      },
    },
  ],
  practiceGuidance: {
    title: "Carrying Kashi's Stillness Into Practice",
    steps: [
      "When visiting Kashi's ghats, maintain quiet dignity around Manikarnika and Harishchandra Ghats, avoiding intrusive photography out of respect for grieving families.",
      "If lighting sandalwood incense or a ghee lamp in your home altar, keep the room well ventilated and never leave burning embers or open flames unattended.",
      "For multi-day walking pilgrimages like the Panchakroshi circuit, wear supportive footwear, carry safe bottled drinking water, and pace rest breaks carefully.",
      "Pair any outer yatra with inner reflection—remembering that the Kashi Khanda links liberation not just to geography, but to truth, compassion, and steady devotion.",
    ],
  },
  citations: [
    {
      text: "Skanda Purana, Kashi Khanda (Adhyayas 26 & 100)",
      reference:
        "Puranic narration of Avimukta Kshetra, Manikarnika Mahatmya, and the sacred yatras of Varanasi.",
    },
    {
      text: "Kashi Rahasya (Brahmavaivarta Purana Tradition)",
      reference:
        "Classical pilgrimage manual detailing the five halts of the Panchakroshi circuit.",
    },
    {
      text: "Eck, Diana L. (1982). Banaras: City of Light",
      reference:
        "Alfred A. Knopf (New York) — Historical and textual study of Kashi's sacred geography.",
    },
  ],
  relatedSlugs: [
    "twelve-jyotirlingas-sacred-geography-of-shiva-devotion",
    "sapta-nadi-why-rivers-are-revered-as-living-mothers",
    "architecture-of-silence-ancient-mandirs",
  ],
};
