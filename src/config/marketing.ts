import {
  BookOpen,
  CalendarDays,
  Compass,
  HeartHandshake,
  Landmark,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type MarketingFeature = {
  slug: string;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  highlights: readonly string[];
  icon: LucideIcon;
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
  { label: "Discover", href: "/#discover" },
  { label: "Features", href: "/features" },
  { label: "Traditions", href: "/traditions" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
] as const;

export const marketingFeatures: readonly MarketingFeature[] = [
  {
    slug: "daily-sadhana",
    name: "Daily Sadhana",
    eyebrow: "A rhythm you can live",
    summary:
      "Build a grounded daily practice around your path and available time.",
    description:
      "Shoonaya brings daily practice into one calm sequence, helping you return consistently without turning devotion into another noisy task list.",
    highlights: [
      "Guided daily-practice rhythms",
      "Progress that respects real life",
      "Tradition-aware recommendations",
    ],
    icon: Sparkles,
  },
  {
    slug: "sacred-calendar",
    name: "Sacred Calendar",
    eyebrow: "Sacred time, local context",
    summary:
      "See Panchang and observance context shaped by location, timezone and tradition.",
    description:
      "Sacred time is more than a date. Shoonaya is designed to keep astronomical context, local civil time and tradition-specific observances clearly distinguished.",
    highlights: [
      "Location-aware daily context",
      "Tradition-qualified observances",
      "Clear source and review signals",
    ],
    icon: CalendarDays,
  },
  {
    slug: "japa",
    name: "Japa",
    eyebrow: "Return, bead by bead",
    summary:
      "Keep a focused mantra practice with a tactile mala experience and personal rhythm.",
    description:
      "A quiet practice space for mantra repetition, mala sessions and reflection—designed for presence rather than performance.",
    highlights: [
      "27, 54 and 108-bead practices",
      "Session rhythm and continuity",
      "A focused, distraction-light mode",
    ],
    icon: Compass,
  },
  {
    slug: "pathshala",
    name: "Scripture & Pathshala",
    eyebrow: "Learn with context",
    summary:
      "Read, listen and study through structured paths with visible source provenance.",
    description:
      "Pathshala is Shoonaya’s learning home: original text where available, transliteration, meaning, guided reading and source-aware study paths.",
    highlights: [
      "Structured learning journeys",
      "Original script and meaning layers",
      "Source and rights transparency",
    ],
    icon: BookOpen,
  },
  {
    slug: "mandali",
    name: "Mandali",
    eyebrow: "Community without noise",
    summary:
      "Find local belonging and participate in respectful dharmic community.",
    description:
      "Shoonaya connects practice with people through local discovery, considered conversation and community spaces designed around belonging rather than attention.",
    highlights: [
      "Nearby community discovery",
      "Respectful discussion spaces",
      "Shared learning and practice",
    ],
    icon: Users,
  },
  {
    slug: "tirtha",
    name: "Tirtha",
    eyebrow: "Sacred places, remembered",
    summary:
      "Discover meaningful places and preserve the journeys connected to them.",
    description:
      "Tirtha helps seekers find sacred places and, over time, build a private record of visits, family memory and spiritual geography.",
    highlights: [
      "Sacred-place discovery",
      "Private-first journey memory",
      "Tradition and seasonal context",
    ],
    icon: Landmark,
  },
  {
    slug: "family-lineage",
    name: "Family & Lineage",
    eyebrow: "Continuity across generations",
    summary:
      "Keep family tradition, memory and belonging connected across distance.",
    description:
      "Kul gives families a considered space for lineage, shared memory and important life traditions without reducing heritage to a social feed.",
    highlights: [
      "Family spaces with privacy boundaries",
      "Lineage and heritage continuity",
      "Shared milestones and memories",
    ],
    icon: HeartHandshake,
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
      "The Sikh experience is designed around its own vocabulary, sources and community life—not as a relabelled Hindu interface.",
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
