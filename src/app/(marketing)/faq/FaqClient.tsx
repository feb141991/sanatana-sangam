"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Sparkles,
  Compass,
  ShieldCheck,
  Smartphone,
  Users,
  BookOpen,
  ArrowRight,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

type FaqCategory = "all" | "services" | "traditions" | "privacy" | "platform";

type FaqItem = {
  id: string;
  category: "services" | "traditions" | "privacy" | "platform";
  categoryLabel: string;
  question: string;
  answer: string;
  bullets?: string[];
  links?: { label: string; href: string }[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-shoonaya",
    category: "traditions",
    categoryLabel: "Traditions & Philosophy",
    question: "What is Shoonaya and what is the vision behind it?",
    answer:
      "Shoonaya is a calm, contemplative spiritual companion engineered for seekers of Sanatan, Sikh, Jain, and Buddhist wisdom. It unites daily sadhana, astronomical panchang, sacred scriptures, tactile japa, and living community into one serene digital space — completely personalized to your tradition, language, and timezone.",
    bullets: [
      "Derived from Shoonya: The Sanskrit word for zero, emptiness, and the boundless potential where all paths return to source.",
      "Built for the global diaspora: Maintaining authentic spiritual practice whether in India, North America, the UK, Europe, or beyond.",
      "Ad-free and sacred: No corporate algorithms, no commercial popups, and no distractions during meditation or prayer.",
    ],
    links: [
      { label: "What is Shoonaya Philosophy", href: "/what-is-shoonaya" },
      { label: "Four Traditions Overview", href: "/traditions" },
    ],
  },
  {
    id: "various-services",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What services and spiritual tools are included in Shoonaya?",
    answer:
      "Shoonaya offers a comprehensive suite of dedicated services designed to ground your spiritual routine throughout the day:",
    bullets: [
      "Daily Dharma & Sadhana: Structured morning contemplation, daily verses, and guided ritual reflections.",
      "Panchang & Sacred Time: Drik Ganita astronomical calculations for your exact city, including tithi, nakshatra, rahu kalam, and auspicious muhurats.",
      "Tactile Japa Mala: Mala counter (27, 54, 108 beads) with responsive haptic feedback, mantra audio, and daily streak tracking.",
      "Pathshala & Scripture Study: Verse-by-verse learning across the Bhagavad Gita, Upanishads, Guru Granth Sahib, Dhammapada, and Jain Agamas with Devanagari, Gurmukhi, Roman transliterations, and scholarly translations.",
      "Gyan Chaupar: The original Indian philosophical board game demonstrating karmic ascent and the spiritual ladder of virtues.",
      "Tirtha Map: A global sacred directory to locate nearby mandirs, gurduwaras, viharas, and Jain deris anywhere in the world.",
      "Kul (Family Spaces): A sacred sanctuary to preserve your family gotra, ancestral lineage, sanskaras, and generational blessings.",
      "Mandali: Local spiritual circles, satsang discovery, and community connection.",
    ],
    links: [
      { label: "Explore Daily Sadhana", href: "/features/daily-sadhana" },
      { label: "Tactile Japa Feature", href: "/features/japa" },
      { label: "Play Gyan Chaupar", href: "/play/gyan-chaupar" },
    ],
  },
  {
    id: "panchang-accuracy",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "How does the Sacred Calendar and Panchang calculate timings?",
    answer:
      "Shoonaya relies on an astronomical calculation engine grounded in the Drik Ganita system. Rather than using generic timezone approximations, our engine computes celestial positions relative to your exact latitude, longitude, and local sunrise/sunset.",
    bullets: [
      "Observes solar and lunar transitions down to the precise minute.",
      "Accounts for tradition-specific observance rules (e.g. Smartha vs. Vaishnava Ekadashi, regional masa start rules).",
      "Zero hardcoded guesswork: disputed astronomical events carry transparent council and lineage notices.",
    ],
    links: [{ label: "View Today's Panchang", href: "/panchang" }],
  },
  {
    id: "japa-mala",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "How does the Tactile Japa Mala counter work?",
    answer:
      "The Japa Mala recreates the tactile mindfulness of traditional rudraksha, tulsi, and crystal beads on your mobile device. As you chant, tapping produces custom-tuned micro-vibrations simulating the physical passing of a bead through your fingertips.",
    bullets: [
      "Configurable mala sizes: 27 beads, 54 beads, or the traditional 108 beads.",
      "Auditory chanting support: listen to authentic mantra recitations or practice in silent absorption.",
      "Offline tracking: your japa counts and streaks record seamlessly even in remote retreats without internet.",
    ],
    links: [{ label: "Read Japa Guide", href: "/features/japa" }],
  },
  {
    id: "pathshala-scripture",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "How does Pathshala and scripture recitation work?",
    answer:
      "Pathshala transforms sacred texts from static books into an active daily learning path. Each text is presented in original scripts (Devanagari, Gurmukhi, Pali, Prakrit), alongside phonetic Roman transliterations and authentic verse-by-verse commentaries.",
    bullets: [
      "Listen and recite: audio recitations assist with correct Sanskrit, Gurmukhi, and Pali pronunciation and meter.",
      "Preserves multiple commentaries: explore traditional bhasyas from historic acharyas without editorial bias.",
      "Bookmark verses and track memorization progress at your own pace.",
    ],
    links: [{ label: "Review Sources & Provenance", href: "/sources" }],
  },
  {
    id: "gyan-chaupar",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is Gyan Chaupar and how can I play it?",
    answer:
      "Gyan Chaupar (the Game of Wisdom) is the ancient Indian philosophical board game that gave birth to modern Snakes and Ladders. Designed by rishis as an educational contemplation tool, each square represents a virtue (ladder) or a vice (snake). Playing the game teaches the dynamics of karma, ego, patience, and liberation (Moksha).",
    bullets: [
      "Fully interactive board playable directly in your browser without installs.",
      "Rich spiritual descriptions for every square detailing scriptural virtues and karmic pitfalls.",
      "Available as an educational tool for youth and adults alike.",
    ],
    links: [{ label: "Play Gyan Chaupar Online", href: "/play/gyan-chaupar" }],
  },
  {
    id: "tirtha-map",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is the Tirtha Map and how does it locate mandirs and gurduwaras?",
    answer:
      "The Tirtha Map helps seekers locate sacred places of worship anywhere in the world. Whether looking for a Hindu mandir, Sikh gurduwara, Buddhist vihara, or Jain derasar in your home city or while traveling abroad, the map provides verified directions, timings, and community contacts.",
    bullets: [
      "Crowdsourced and council-verified data for global diaspora accuracy.",
      "Filters by specific tradition, deity, or sampradaya.",
      "Includes community-submitted updates for festive celebrations and langar/prasad timings.",
    ],
    links: [{ label: "Explore Traditions", href: "/traditions" }],
  },
  {
    id: "kul-family",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is Kul (Family Spaces)?",
    answer:
      "Kul is a private, family-centric sanctuary within Shoonaya dedicated to preserving heritage across generations. In modern diaspora life, family stories, gotra knowledge, and ancestral sanskaras are often lost over time; Kul creates an enduring digital record for your lineage.",
    bullets: [
      "Preserve ancestral gotra, kuldevi/kuldevta, and pravara lineages.",
      "Document important family rites, shraddha observances, and birth sanskaras.",
      "Invite family elders to record oral histories and spiritual memories for future generations.",
    ],
  },
  {
    id: "four-traditions",
    category: "traditions",
    categoryLabel: "Traditions & Philosophy",
    question: "Is Shoonaya only for Hindus, or does it support other traditions?",
    answer:
      "Shoonaya is built for four living dharmic traditions: Sanatan (Hindu), Sikh, Jain, and Buddhist. The platform respects the distinctive theology, sacred texts, calendar rules, and vocabulary of each path rather than homogenizing them into a generic blend.",
    bullets: [
      "Sikh practitioners receive Gurbani verses, Nitnem schedules, and Gurpurab commemorations.",
      "Buddhist seekers find Dhammapada verses, Pali canon reflections, and mindfulness tools.",
      "Jain followers observe Paryushana, Tirthankara teachings, and Ahimsa-centered guidelines.",
      "Sanatan followers access Vedic hymns, Upanishads, Gita wisdom, and sampradaya calendars.",
    ],
    links: [
      { label: "Sanatan Dharma", href: "/traditions/hindu" },
      { label: "Sikh Dharma", href: "/traditions/sikh" },
      { label: "Buddhist Dharma", href: "/traditions/buddhist" },
      { label: "Jain Dharma", href: "/traditions/jain" },
    ],
  },
  {
    id: "zeroists-philosophy",
    category: "traditions",
    categoryLabel: "Traditions & Philosophy",
    question: "Who are the Zeroists?",
    answer:
      "Zeroists are the seekers and practitioners who make up the Shoonaya community. A Zeroist is someone who strives to return to the primordial zero (Shoonya) — stripping away mental clutter, ego, and sectarian animosity to discover inner quiet and pure awareness. Zeroism embraces daily discipline, intellectual humility, and compassion across all dharmic lineages.",
    links: [{ label: "About Shoonaya Community", href: "/community" }],
  },
  {
    id: "privacy-pledge",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Is my spiritual practice and personal reflection data kept private?",
    answer:
      "Absolutely. We believe that spiritual sadhana is deeply personal and must never be commercialized. Shoonaya adheres strictly to our Zeroists Privacy Charter:",
    bullets: [
      "Zero behavioral advertising: We do not display ad banners, tracking pixels, or sell user behavior to advertising brokers.",
      "Encrypted reflections: Private journal entries, japa counts, and family Kul records remain private and secure.",
      "Transparent data ownership: You can export your sadhana history or delete your account with one click at any time.",
    ],
    links: [{ label: "Privacy Policy", href: "/privacy" }],
  },
  {
    id: "offline-mode",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Can I use Shoonaya offline while meditating or during retreats?",
    answer:
      "Yes. Shoonaya features an offline-first architectural model. Your active sadhana routines, japa counters, daily panchang calculations, and downloaded scripture texts remain accessible without an active internet connection. When you reconnect, your progress synchronizes automatically.",
  },
  {
    id: "free-or-paid",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Is Shoonaya free to use, and why is there a subscription?",
    answer:
      "The foundational dharma tools on Shoonaya — including Daily Sadhana, Panchang, Japa Mala, Scripture readings, and the Tirtha Map — are completely free. We believe sacred wisdom should never be locked behind a mandatory paywall.",
    bullets: [
      "Core Dharma: Free forever for all seekers globally.",
      "Optional Seva Subscriptions: Support scholarly translations, server infrastructure, and advanced multi-generational family space tools.",
    ],
    links: [{ label: "Pricing & Seva Details", href: "/pricing" }],
  },
  {
    id: "diaspora-support",
    category: "platform",
    categoryLabel: "Platform & Access",
    question: "Does Shoonaya work accurately outside India?",
    answer:
      "Yes — Shoonaya was purpose-built from the first line of code for the global diaspora. Whether you live in London, Toronto, Dubai, New York, Singapore, Sydney, or Johannesburg, your Panchang is computed for your city's local coordinates, ensuring that sunrise-dependent vrats and muhurats are 100% accurate for your real-world location.",
  },
  {
    id: "available-platforms",
    category: "platform",
    categoryLabel: "Platform & Access",
    question: "Which platforms and devices can I use Shoonaya on?",
    answer:
      "Shoonaya is accessible today across all modern platforms:",
    bullets: [
      "Web App (Live Now): Works instantly on any browser (Chrome, Safari, Firefox, Edge) on phones, tablets, and laptops.",
      "Android App: Verified beta is currently open for early adopters.",
      "iPhone & iPad (iOS): Add to Home Screen directly from Safari for a native, app-like standalone experience. A dedicated iOS app is planned for future release.",
    ],
    links: [{ label: "Android Beta Access", href: "/beta/android" }],
  },
  {
    id: "kids-zone",
    category: "platform",
    categoryLabel: "Platform & Access",
    question: "When will the Kids Zone be available?",
    answer:
      "Kids Zone is currently undergoing beta testing and curation. It is designed to offer parent-approved, ad-free dharmic learning paths featuring interactive story lessons, shloka chanting with correct pronunciation, and cultural grounding for the next generation.",
  },
];

const CATEGORIES: { id: FaqCategory; label: string; icon: typeof Sparkles }[] = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "services", label: "Services & Practice", icon: Sparkles },
  { id: "traditions", label: "Traditions & Philosophy", icon: Compass },
  { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
  { id: "platform", label: "Platform & Access", icon: Smartphone },
];

export function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "what-is-shoonaya": true,
    "various-services": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      allOpen[item.id] = true;
    });
    setOpenItems(allOpen);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = item.answer.toLowerCase().includes(q);
      const inBullets = item.bullets?.some((b) => b.toLowerCase().includes(q)) ?? false;
      return inQuestion || inAnswer || inBullets;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:px-10">
      {/* Search and Filter Controls */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted-warm)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, services (Panchang, Japa, Sadhana, Kul, Tirtha), or traditions..."
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] py-4 pl-12 pr-4 text-base text-[var(--text-cream)] placeholder-[var(--text-muted-warm)] transition-colors focus:border-[var(--brand-primary)] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted-warm)] hover:text-[var(--text-cream)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--brand-primary)] text-white shadow-sm"
                      : "border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-muted-warm)] hover:border-[var(--brand-primary-soft)] hover:text-[var(--text-cream)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted-warm)]">
            <button
              onClick={expandAll}
              className="hover:text-[var(--text-cream)] transition-colors underline-offset-4 hover:underline"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              onClick={collapseAll}
              className="hover:text-[var(--text-cream)] transition-colors underline-offset-4 hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-8 text-xs font-medium uppercase tracking-wider text-[var(--text-muted-warm)]">
        Showing {filteredItems.length} {filteredItems.length === 1 ? "Answer" : "Answers"}
      </div>

      {/* FAQ Accordion List */}
      <div className="mt-6 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center">
            <p className="text-base text-[var(--text-muted-warm)]">
              No questions found matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-strong)] hover:underline"
            >
              Reset filters &amp; view all questions
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = !!openItems[item.id];
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] transition-colors hover:border-[var(--card-border-hover)]"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                      {item.categoryLabel}
                    </div>
                    <h3 className="text-lg font-medium leading-snug text-[var(--text-cream)] sm:text-xl">
                      {item.question}
                    </h3>
                  </div>
                  <div
                    className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--text-muted-warm)] transition-transform duration-300 ${
                      isOpen
                        ? "rotate-180 bg-[var(--brand-primary)] text-white border-transparent"
                        : "hover:border-[var(--brand-primary-soft)]"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--card-border)] px-6 pb-6 pt-5 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
                    <p className="text-[var(--text-cream)]/90">{item.answer}</p>

                    {item.bullets && item.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2.5 pl-1">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--brand-primary-strong)]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.links && item.links.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3 pt-3 border-t border-[var(--card-border)]/50">
                        {item.links.map((link, idx) => (
                          <Link
                            key={idx}
                            href={link.href}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg-subtle)] px-4 py-1.5 text-xs font-semibold text-[var(--brand-primary-strong)] hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)] transition-colors"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions Callout */}
      <div className="mt-16 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-medium text-[var(--text-cream)]">
          Still have a question or need council guidance?
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted-warm)]">
          Our team and lineage advisors are available to assist with questions regarding scriptural sources, observance timings, or account queries.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:info@shoonaya.com"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <span>Email info@shoonaya.com</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            href="/sitemap"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-3 text-xs font-semibold text-[var(--text-cream)] hover:border-[var(--brand-primary-soft)] transition-colors"
          >
            <span>Browse Full Site Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
