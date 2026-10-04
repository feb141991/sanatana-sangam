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
      "Shoonaya — Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection. It helps people with full lives notice what is unfolding in their local Panchang, understand sacred days, and make room for daily practice.",
    bullets: [
      "Notice upcoming observances such as Ekadashi and Amavasya, with local context where available.",
      "Return to Japa, daily sadhana, scripture, and reflection at a pace that fits your life.",
      "Stay connected through family spaces, sacred-place discovery, and community features.",
    ],
    links: [
      { label: "What is Shoonaya Philosophy", href: "/what-is-shoonaya" },
      { label: "Explore Traditions", href: "/traditions" },
    ],
  },
  {
    id: "various-services",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What services and spiritual tools are included in Shoonaya?",
    answer:
      "Shoonaya brings together experiences for sacred time, daily practice, learning, reflection, family, and community:",
    bullets: [
      "Panchang and observances: Daily sacred-time context and upcoming days such as Ekadashi and Amavasya.",
      "Daily practice and Japa: Tools for mantra practice, sadhana, and reflection.",
      "Scripture and Pathshala: Sacred texts and guided learning, with content varying by tradition and feature.",
      "Rashiphal and Kundali: Chart views and reflective astrology features.",
      "Live Darshan and Tirtha: Available streams and sacred-place discovery.",
      "Kul and Mandali: Family, lineage, and community spaces.",
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
      "Shoonaya combines astronomical context with tradition-specific calendar rules. Some observance dates vary by location, calendar profile, or tradition, so a date should be read with the context and review information shown in the app.",
    bullets: [
      "Panchang views include tithi, nakshatra, and selected timings based on available location settings.",
      "Recognized tradition and regional rules can produce different observance dates.",
      "Check the displayed notes and sources where available; unresolved occurrences may be withheld.",
    ],
    links: [{ label: "View Today's Panchang", href: "/panchang" }],
  },
  {
    id: "japa-mala",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "How does the Tactile Japa Mala counter work?",
    answer:
      "The Japa counter offers a digital mala interface for mantra repetition. You can use it to keep count and support a focused practice; available feedback depends on your device and app settings.",
    bullets: [
      "Choose from available counter lengths, including 27, 54, and 108 beads.",
      "Use available audio support or practice in silence.",
      "Progress and synchronization can depend on device connectivity and account state.",
    ],
    links: [{ label: "Read Japa Guide", href: "/features/japa" }],
  },
  {
    id: "pathshala-scripture",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "How does Pathshala and scripture recitation work?",
    answer:
      "Pathshala offers guided study experiences for selected sacred texts. Depending on the text, a lesson may include original script, transliteration, translation, commentary, or audio.",
    bullets: [
      "Study the sources and translations available for each text.",
      "Use recitation audio where it is available.",
      "Bookmark and track learning progress in supported lessons.",
    ],
    links: [{ label: "Review Sources & Provenance", href: "/sources" }],
  },
  {
    id: "gyan-chaupar",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is Gyan Chaupar and how can I play it?",
    answer:
      "Gyan Chaupar is an interactive adaptation of a traditional wisdom-game format. It offers a playful way to explore themes and reflections associated with the board.",
    bullets: [
      "Play the browser-based version from the Shoonaya website.",
      "Explore reflections associated with the spaces on the board.",
      "Availability and content may change as the experience develops.",
    ],
    links: [{ label: "Play Gyan Chaupar Online", href: "/play/gyan-chaupar" }],
  },
  {
    id: "tirtha-map",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is the Tirtha Map and how does it locate mandirs and gurduwaras?",
    answer:
      "The Tirtha directory helps you explore sacred places and community-submitted listings. Coverage and listing details vary by location, so confirm practical details with the place before travelling.",
    bullets: [
      "Explore available listings for different traditions.",
      "Use location and tradition filters where supported.",
      "Check current hours and event details with the venue.",
    ],
    links: [{ label: "Explore Traditions", href: "/traditions" }],
  },
  {
    id: "kul-family",
    category: "services",
    categoryLabel: "Services & Practice",
    question: "What is Kul (Family Spaces)?",
    answer:
      "Kul is a family space for keeping lineage details, family dates, shared practices, and stories together across generations.",
    bullets: [
      "Add family members and lineage details.",
      "Keep family dates and remembrances together.",
      "Share practices and stories with invited family members.",
    ],
  },
  {
    id: "four-traditions",
    category: "traditions",
    categoryLabel: "Traditions & Philosophy",
    question: "Is Shoonaya only for Hindus, or does it support other traditions?",
    answer:
      "Shoonaya is rooted in Sanatan (Hindu) traditions and includes distinct content and experiences for Sikh, Jain, and Buddhist paths. Each tradition has its own teachings and practices; the content and tools available vary by feature.",
    bullets: [
      "Tradition-specific content is presented in its own context where available.",
      "Calendar and practice features may differ by tradition and selected profile.",
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
      "Zeroists is a community identity for Shoonaya seekers who value returning to stillness, humility, and compassion. It describes shared values; it is not a separate spiritual tradition or a claim that distinct paths are the same.",
    links: [{ label: "About Shoonaya Community", href: "/community" }],
  },
  {
    id: "privacy-pledge",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Is my spiritual practice and personal reflection data kept private?",
    answer:
      "Review the Privacy Policy for details about data handling. What other people can see depends on the feature and on what you choose to share.",
    bullets: [
      "Use the app's available privacy and sharing controls.",
      "Check the Privacy Policy for what information is stored and how it is used.",
      "Contact support if you need help with your account or data request.",
    ],
    links: [{ label: "Privacy Policy", href: "/privacy" }],
  },
  {
    id: "offline-mode",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Can I use Shoonaya offline while meditating or during retreats?",
    answer:
      "Offline availability depends on the feature and on what is already stored on your device. Features that need fresh calendar data, account sync, location lookup, or live streams require an internet connection.",
  },
  {
    id: "free-or-paid",
    category: "privacy",
    categoryLabel: "Privacy, Trust & Security",
    question: "Is Shoonaya free to use?",
    answer:
      "Yes. Every feature currently available in Shoonaya is free to use. There are no paid plans or app subscriptions at this time.",
  },
  {
    id: "diaspora-support",
    category: "platform",
    categoryLabel: "Platform & Access",
    question: "Does Shoonaya work accurately outside India?",
    answer:
      "Shoonaya provides location-aware Panchang context for supported locations. Calendar results can depend on the selected place, calendar profile, and tradition; review the context shown in the app for your location.",
  },
  {
    id: "available-platforms",
    category: "platform",
    categoryLabel: "Platform & Access",
    question: "Which platforms and devices can I use Shoonaya on?",
    answer:
      "Shoonaya is available on the web. Current mobile access options are listed on the website and may vary by platform.",
    bullets: [
      "Open shoonaya.com in a supported web browser.",
      "See the Android beta page for current enrollment details.",
      "Follow the store links on the site for current app availability.",
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
