import {
  BookOpen,
  CalendarDays,
  Compass,
  HeartHandshake,
  Landmark,
  Users,
  SunMedium,
  Dices,
  Bot,
  Smile,
  Music,
  Flame,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export type MarketingDeepLink = {
  label: string;
  href: string;
  isPrimary?: boolean;
};

export type MarketingFeature = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  highlights: readonly string[];
  icon: LucideIcon;
  imageSrc: string;
  deepLinks: readonly MarketingDeepLink[];
};

export type UpcomingFeature = {
  name: string;
  badge: string;
  eyebrow: string;
  summary: string;
  description: string;
  highlights: readonly string[];
  icon: LucideIcon;
  imageSrc: string;
};

export type MarketingTradition = {
  slug: string;
  name: string;
  nativeName: string;
  summary: string;
  description: string;
  commitments: readonly string[];
};

export const marketingNavItems = [
  { label: "Play", href: "/play/gyan-chaupar" },
  { label: "Traditions", href: "/traditions" },
  { label: "Festivals", href: "/features/sacred-calendar" },
  { label: "Community", href: "/community" },
  { label: "Features", href: "/features" },
  { label: "About", href: "/about" },
] as const;

export const marketingFeatures: readonly MarketingFeature[] = [
  {
    slug: "sacred-calendar",
    name: "Local Panchang & Sacred Calendar",
    eyebrow: "Astronomy-backed sacred time",
    summary:
      "Follow daily tithi, nakshatra, and selected timings shaped by your exact location, timezone, and tradition.",
    description:
      "Sacred time is calculated using an astronomy-backed engine anchored to the traditional Ujjain meridian and solved for your exact geographical coordinates. Follow tithi, nakshatra, yoga, karana, vara, sunrise/sunset, and auspicious muhurtas (Brahma Muhurta, Abhijit, Rahu Kaal) with complete tradition qualification.",
    highlights: [
      "Astronomical solar and lunar calculations solved for your exact city",
      "82 tradition-qualified observances across Hindu, Sikh, Buddhist, and Jain paths",
      "Precise Dwadashi Parana windows for Ekadashi and fasting vrats",
    ],
    icon: CalendarDays,
    imageSrc: "/relics/chakra.png",
    deepLinks: [
      { label: "Launch Panchang", href: "/panchang", isPrimary: true },
      { label: "Today's Timings", href: "/panchang/today" },
      { label: "Ekadashi Vrat Rules", href: "/vrat/ekadashi" },
    ],
  },
  {
    slug: "japa",
    name: "Japa Mala & Daily Practice",
    eyebrow: "Return, bead by bead",
    summary:
      "Keep a focused mantra practice with a tactile 108-bead virtual mala counter and serene ambient audio.",
    description:
      "A calm, distraction-free space for mantra repetition, mala sessions, and daily reflection. Features 27, 54, and 108-bead cycles, gentle milestone chimes, ambient temple soundscapes, and tradition-curated mantras with Devanagari lyrics, phonetic transliteration, and spiritual meanings.",
    highlights: [
      "27, 54, and 108-bead cycles with natural bead slip and vibration feedback",
      "Tradition-curated mantras with original lyrics, transliteration, and meanings",
      "Daily sadhana tracking designed around real life, not artificial pressure",
    ],
    icon: Compass,
    imageSrc: "/relics/mala.png",
    deepLinks: [
      { label: "Open Japa Mala", href: "/bhakti/mala", isPrimary: true },
      { label: "Daily Sadhana", href: "/home" },
    ],
  },
  {
    slug: "dharma-mitra",
    name: "Dharma Mitra: Verifiable AI Companion",
    eyebrow: "Interactive scripture assistant",
    summary:
      "Study scripture and ask philosophical questions with a tradition-grounded AI companion that cites verified sources.",
    description:
      "Dharma Mitra is Shoonaya's scripturally grounded spiritual companion, active and accessible directly in your dashboard. Ask nuanced questions about philosophy, practice, and ritual etiquette, explore comparative perspectives across traditions, and receive answers rooted strictly in verified scriptures—with exact chapter and verse citations.",
    highlights: [
      "Grounded in verified scriptures across Hindu, Sikh, Buddhist, and Jain traditions",
      "Exact chapter, verse, and source citations without synthetic hallucinations",
      "Context-aware companion for Bhagavad Gita study, Upanishads, and daily reflection",
    ],
    icon: Bot,
    imageSrc: "/icons/dharma-mitra-scroll.png",
    deepLinks: [
      { label: "Launch Dharma Mitra", href: "/ai-chat", isPrimary: true },
      { label: "Scripture Study", href: "/pathshala" },
    ],
  },
  {
    slug: "kids-zone",
    name: "Kids Zone: Little Seekers",
    eyebrow: "Dharmic world for children",
    summary:
      "Illustrated moral wisdom tales, phonetically guided mantras, and cultural grounding built for young minds.",
    description:
      "A dharmic world built for little seekers to give every child a living, joyful connection to their roots. Features 50+ illustrated Panchatantra fables, Ramayana tales, Sikh saakhis, and Jain stories, plus phonetic mantra breakdowns that help young voices recite with correct swara and pronunciation—in a parent-approved, ad-free environment.",
    highlights: [
      "Illustrated Panchatantra, Jataka, and moral tales with ethics and life lessons",
      "Phonetically guided shloka and mantra learning for young voices",
      "100% ad-free, algorithm-free sanctuary designed for reverence and cultural pride",
    ],
    icon: Smile,
    imageSrc: "/relics/peacock-feather.png",
    deepLinks: [
      { label: "Explore Kids Stories", href: "/bhakti/katha", isPrimary: true },
      { label: "Panchatantra Library", href: "/bhakti" },
      { label: "Family Spaces", href: "/kul" },
    ],
  },
  {
    slug: "pathshala",
    name: "Scripture Library & Pathshala",
    eyebrow: "Learn with source context",
    summary:
      "Read, listen, and study through structured courses with verified text and transparent source provenance.",
    description:
      "Pathshala is Shoonaya's learning home: original scripture text where available, transliteration, verse-by-verse meaning, and source-aware study paths. Explore the Bhagavad Gita, Upanishads, Dhammapada, Gurbani, and Jain texts with transparent scholarly attribution.",
    highlights: [
      "Guided paths for Bhagavad Gita, Upanishads, Dhammapada, and Gurbani",
      "Searchable Stotrams, Kathas, and Aartis with original verses and translations",
      "Public-domain and verified edition transparency on every chapter",
    ],
    icon: BookOpen,
    imageSrc: "/relics/prarthana-pothi.png",
    deepLinks: [
      { label: "Explore Pathshala", href: "/pathshala", isPrimary: true },
      { label: "Bhagavad Gita Course", href: "/pathshala/bhagavad-gita" },
      { label: "Bhakti Library", href: "/bhakti" },
    ],
  },
  {
    slug: "rashiphal-kundali",
    name: "Rashiphal & Kundali Charts",
    eyebrow: "Vedic astrology & reflection",
    summary:
      "Explore birth-chart views and planetary transit reflections to contemplate life's patterns and timing.",
    description:
      "Explore interactive Vedic birth charts (Janam Kundali) and daily Rashiphal reflections calculated from planetary transits. Gain clarity on life patterns, planetary periods (Dasha), and astrological insights for all 12 rashis from a reflective, dharmic perspective.",
    highlights: [
      "North Indian and South Indian interactive birth chart visualizations",
      "Daily transit-based Rashiphal guidance for all 12 moon signs",
      "Ascendant (Lagna), planetary degrees, and house placement breakdowns",
    ],
    icon: SunMedium,
    imageSrc: "/relics/siddhachakra-wheel.png",
    deepLinks: [
      { label: "Generate Kundali", href: "/kundali", isPrimary: true },
      { label: "Daily Rashiphal", href: "/rashiphala" },
    ],
  },
  {
    slug: "tirtha",
    name: "Live Darshan & Sacred Places",
    eyebrow: "Devotion across distance",
    summary:
      "Visit temple live streams and discover sacred places connected to global dharmic communities.",
    description:
      "Step into historic sanctums across India with live Aarti and Darshan streams from Somnath, Mahakaleshwar, and Kashi Vishwanath. Discover temples, gurdwaras, and sacred shrines around the world with verified cultural context, timings, and traditions.",
    highlights: [
      "Live temple Aarti broadcasts and daily morning darshan streams",
      "Global directory of diaspora temples, shrines, and pilgrimage centers",
      "Ritual and cultural guidelines for planning sacred temple visits",
    ],
    icon: Landmark,
    imageSrc: "/darshan/krishna.webp",
    deepLinks: [
      { label: "Watch Live Darshan", href: "/live-darshan", isPrimary: true },
      { label: "Discover Sacred Sites", href: "/discover" },
    ],
  },
  {
    slug: "family-lineage",
    name: "Kul Family Spaces",
    eyebrow: "Continuity across generations",
    summary:
      "Preserve family lineage, memories, meaningful dates, and shared practices in private, sacred spaces.",
    description:
      "Kul gives families a private, sacred sanctuary for lineage, shared memories, and important life traditions without reducing heritage to a social feed. Maintain ancestral remembrance schedules, family gotra, kuldevta traditions, and cross-generational connections.",
    highlights: [
      "Private, encrypted family circles away from public social feeds",
      "Shared ancestral calendar for barsi, shraddha, and family anniversaries",
      "Preservation of family stories, Gotra/Pravara, and kuldevta practices",
    ],
    icon: HeartHandshake,
    imageSrc: "/relics/diya-bronze.png",
    deepLinks: [
      { label: "Enter Kul Spaces", href: "/kul", isPrimary: true },
      { label: "Tradition Guidelines", href: "/traditions" },
    ],
  },
  {
    slug: "mandali",
    name: "Mandali Community",
    eyebrow: "Community without noise",
    summary:
      "Find local belonging, share reflections, and participate in respectful dharmic satsangs.",
    description:
      "Shoonaya connects practice with people through local discovery, considered conversation, and community spaces designed around belonging rather than algorithms. Share reflections, join discussions, and discover nearby gatherings.",
    highlights: [
      "Location-based discovery of nearby satsangs and temple circles",
      "Calm, ad-free discussion spaces designed for reverence and respect",
      "Shared learning circles and community announcements",
    ],
    icon: Users,
    imageSrc: "/relics/lotus-bloom.png",
    deepLinks: [
      { label: "Join Mandali", href: "/community", isPrimary: true },
    ],
  },
  {
    slug: "gyan-chaupar",
    name: "Gyan Chaupar (Game of Karma)",
    eyebrow: "Ancient wisdom board",
    summary:
      "Experience the traditional Vedic board game of cosmic consciousness, karma, and spiritual planes.",
    description:
      "The historical Indian precursor to Snakes and Ladders, created by ancient sages to teach the soul's journey through karmic actions, virtues, and spiritual planes. Roll the cowrie shells and reflect on the philosophical significance of every square.",
    highlights: [
      "Authentic 72-square traditional board with original Sanskrit virtues and vices",
      "Interactive cowrie shell roll with deep philosophical commentary on each square",
      "Reflective spiritual play mode for personal contemplation and family study",
    ],
    icon: Dices,
    imageSrc: "/relics/brahma-lotus.png",
    deepLinks: [
      { label: "Play Gyan Chaupar", href: "/play/gyan-chaupar", isPrimary: true },
    ],
  },
] as const;

export const upcomingMarketingFeatures: readonly UpcomingFeature[] = [
  {
    name: "Offline Chanting & Sacred Soundscapes",
    badge: "Coming Soon · Audio",
    eyebrow: "High-Fidelity Devotion",
    summary:
      "Studio audio recordings of revered stotrams, Vedic chants, and temple bells with synced text.",
    description:
      "Listen to masterfully recorded Sanskrit stotrams, Vedic chants, Buddhist mantras, and Gurbani shabads with synchronized word-by-word highlighted text and offline playback for uninterrupted travel or meditation.",
    highlights: [
      "Synchronized lyrics and phonetic transliteration tracking audio in real-time",
      "Authentic Vedic chanting meter (swara-accurate pronunciations)",
      "Full offline caching for flights, remote retreats, and daily commutes",
    ],
    icon: Music,
    imageSrc: "/relics/shankha-conch.png",
  },
  {
    name: "Temple Sankalpa Pooja & Sacred Prasad",
    badge: "Coming Soon · Sanctum",
    eyebrow: "Sanctum Connectivity",
    summary:
      "Coordinate personalized sankalpa poojas at ancient tirthas with consecrated prasad delivered to your home.",
    description:
      "Connect directly with revered historic temples across India to book personalized archana and sankalpa poojas performed in your family's name by verified temple priests, with sanctified prasad safely delivered to your doorstep.",
    highlights: [
      "Direct coordination with historic tirthas and traditional temple trusts",
      "Verified sankalpa with your family name and Gotra recited during the ritual",
      "Safely packaged sacred prasad and vibhuti/kumkum dispatched to your address",
    ],
    icon: Flame,
    imageSrc: "/relics/clay-kalash.png",
  },
  {
    name: "Multi-Generation Kul Ancestry & Gotra Tree",
    badge: "Coming Soon · Lineage",
    eyebrow: "Ancestral Continuity",
    summary:
      "Deep genealogical mapping, gotra tracing, ancestral memorialization schedules, and multi-generation heritage archival.",
    description:
      "Expand your Kul space with multi-generational family tree mapping, Gotra and Pravara verification, Pitru Tarpan calendar alerts, and collaborative oral history preservation across global diaspora branches.",
    highlights: [
      "Multi-generation visual family tree with verified Gotra and Kuldevta links",
      "Automated Pitru Paksha and Shradh remembrance alerts based on lunar tithis",
      "Shared family heritage vault for heirlooms, sacred dates, and ancestral audio stories",
    ],
    icon: HeartHandshake,
    imageSrc: "/relics/ananta-shesha.png",
  },
  {
    name: "Yatra Pilgrimage Companion",
    badge: "Coming Soon · Pilgrimage",
    eyebrow: "Sacred Travel Guides",
    summary:
      "Verified temple darshan schedules, sacred parikrama routes, dress codes, and pilgrimage guides.",
    description:
      "Comprehensive, reverence-focused pilgrimage guides featuring verified temple opening and aarti timings, dress code protocols, sacred parikrama maps, nearby dharmashalas, and tradition-accurate travel advice.",
    highlights: [
      "Verified real-time temple darshan schedules and queue expectations",
      "Accurate walking maps for temple circumambulations and holy ghats",
      "Practical travel advice: dress codes, photography rules, and offering etiquette",
    ],
    icon: MapPin,
    imageSrc: "/relics/rishi-kamandalu.png",
  },
] as const;

export const marketingTraditions: readonly MarketingTradition[] = [
  {
    slug: "hindu",
    name: "Hindu",
    nativeName: "सनातन धर्म",
    summary:
      "Daily practice, sacred time, scripture, bhakti and living family tradition.",
    description:
      "Shoonaya supports a broad Hindu experience while keeping regional, sampradāya and family differences visible rather than presenting one practice as universal.",
    commitments: [
      "Panchang context never presented without location and profile scope",
      "Scripture separated from Shoonaya-authored explanation",
      "Regional and sampradāya differences preserved",
    ],
  },
  {
    slug: "sikh",
    name: "Sikh",
    nativeName: "ਸਿੱਖੀ",
    summary:
      "Gurbani learning, simran, Gurpurab context and connection with sangat.",
    description:
      "The Sikh experience is designed around its own vocabulary, sources and community life, rather than a relabelled generic interface.",
    commitments: [
      "Gurbani source and Ang references shown where verified",
      "Sikh vocabulary and observances treated independently",
      "Community framed through sangat and seva with care",
    ],
  },
  {
    slug: "buddhist",
    name: "Buddhist",
    nativeName: "बौद्ध धर्म",
    summary:
      "Dhamma study, contemplative practice and connection across Buddhist communities.",
    description:
      "Shoonaya’s Buddhist path is intended to respect distinct schools, languages and community contexts rather than flattening them into generic mindfulness.",
    commitments: [
      "School and source context retained",
      "Meditation not detached from Dhamma",
      "Translations labelled by source and rights status",
    ],
  },
  {
    slug: "jain",
    name: "Jain",
    nativeName: "जैन धर्म",
    summary:
      "Study, reflection, observance and community shaped by Jain sources and practice.",
    description:
      "The Jain experience keeps sect, source and observance differences explicit while supporting learning and daily reflection with restraint.",
    commitments: [
      "Sect-specific differences never silently collapsed",
      "Ahimsa treated as living practice, not decoration",
      "Source and translation status remain visible",
    ],
  },
] as const;

export function findMarketingFeature(slug: string) {
  return marketingFeatures.find((feature) => feature.slug === slug);
}

export function findMarketingTradition(slug: string) {
  return marketingTraditions.find((tradition) => tradition.slug === slug);
}
