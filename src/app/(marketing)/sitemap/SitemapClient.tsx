"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users,
  Smartphone,
  UserCircle,
  ShieldCheck,
  Search,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

type SitemapLink = {
  label: string;
  href: string;
  description?: string;
  isExternal?: boolean;
  badge?: string;
};

type SitemapCategory = {
  id: string;
  title: string;
  summary: string;
  icon: typeof Compass;
  links: SitemapLink[];
};

const SITEMAP_DIRECTORY: SitemapCategory[] = [
  {
    id: "traditions",
    title: "Traditions & Lineages",
    summary: "Shoonaya’s Sanatan roots and selected content for distinct traditions, each in its own context.",
    icon: Compass,
    links: [
      { label: "Explore Traditions", href: "/traditions", description: "Explore teachings and selected experiences from distinct traditions." },
      { label: "Sanatan Dharma", href: "/traditions/hindu", description: "Vedas, Upanishads, Gita, Nitya Karma, and Vrats." },
      { label: "Sikh Dharma", href: "/traditions/sikh", description: "Guru Granth Sahib, Nitnem, Hukamnama, Simran, and Seva." },
      { label: "Buddhist Dharma", href: "/traditions/buddhist", description: "Noble Eightfold Path, mindfulness, Suttas, and Dhamma." },
      { label: "Jain Dharma", href: "/traditions/jain", description: "Anekantavada, Tirthankara teachings, Ahimsa, and Agamas." },
      { label: "What is Shoonaya", href: "/what-is-shoonaya", description: "The purpose and spiritual philosophy behind the platform." },
      { label: "Scriptural Sources & Provenance", href: "/sources", description: "Council-approved lineage metadata and citations." },
    ],
  },
  {
    id: "sadhana",
    title: "Daily Practice & Bhakti",
    summary: "Grounded rituals, contemplative breathwork, and sacred sound for daily life.",
    icon: Sparkles,
    links: [
      { label: "Daily Sadhana", href: "/features/daily-sadhana", description: "Calm sequences tailored to your available time." },
      { label: "Tactile Japa Mala", href: "/features/japa", description: "27, 54, and 108-bead mantra meditation counter." },
      { label: "Bhakti Hub", href: "/bhakti", description: "Aarti, Stotram, and sacred song collections." },
      { label: "Stotram Library", href: "/bhakti/browse", description: "Devanagari, transliteration, and sourced translations." },
      { label: "Aarti Collection", href: "/bhakti/aarti", description: "Traditional hymns and devotional praise." },
      { label: "Sacred Katha Reader", href: "/bhakti/katha", description: "Stories and reflections behind sacred observances." },
      { label: "Daily Shloka & Reflections", href: "/discover", description: "Daily contemplative verse and translation." },
    ],
  },
  {
    id: "calendar",
    title: "Sacred Time & Panchang",
    summary: "High-precision astronomical calendar qualified by tradition and location.",
    icon: CalendarDays,
    links: [
      { label: "Sacred Calendar Overview", href: "/features/sacred-calendar", description: "How Shoonaya distinguishes astronomical instants and local civil dates." },
      { label: "Vedic Panchang", href: "/panchang", description: "Daily Tithi, Nakshatra, Yoga, Karana, and sunrise." },
      { label: "Today's Tithi & Muhurat", href: "/panchang/today", description: "Live auspicious timings for your current location." },
      { label: "Vrat & Fasting Guide", href: "/vrat", description: "Fast timings, rules, and observances across traditions." },
      { label: "Daily Rashiphala", href: "/rashiphala", description: "Vedic moon-sign guidance and daily planetary insight." },
      { label: "Vedic Kundali", href: "/kundali", description: "Birth chart calculations and planetary placements." },
    ],
  },
  {
    id: "pathshala",
    title: "Learning & Gyan Chaupar",
    summary: "Interactive wisdom games, scripture study, and authentic learning paths.",
    icon: BookOpen,
    links: [
      { label: "Pathshala Learning Paths", href: "/features/pathshala", description: "Structured foundational courses on philosophy and ethics." },
      { label: "Gyan Chaupar Board Game", href: "/play/gyan-chaupar", badge: "Interactive", description: "The traditional 72-square game of cosmic ascent and virtue." },
      { label: "Dharmic Kosh (Vocabulary)", href: "/kosh", description: "Deep etymology of sacred Sanskrit, Gurmukhi, and Prakrit terms." },
      { label: "Dharma AI Guide", href: "/features", description: "Grounded, scripture-anchored answers to spiritual inquiries." },
    ],
  },
  {
    id: "community",
    title: "Community & Sacred Places",
    summary: "Connect through shared practice, family memory, and pilgrimage.",
    icon: Users,
    links: [
      { label: "Shoonaya Community", href: "/community", description: "Local Mandali, shared practice, and family connection with respect for distinct paths." },
      { label: "Local Mandali Circles", href: "/features/mandali", description: "Find and participate in nearby practice groups." },
      { label: "Tirtha Pilgrimage Map", href: "/features/tirtha", description: "Explore sacred temples, gurdwaras, and pilgrimage sites." },
      { label: "Kul & Family Lineage", href: "/features/family-lineage", description: "Preserve sacred family traditions and memories privately." },
      { label: "Sthapaka WhatsApp Kit", href: "/founding/whatsapp-kit", description: "Share contemplative practice cards with your circle." },
    ],
  },
  {
    id: "downloads",
    title: "Apps & Downloads",
    summary: "Carry ancient wisdom with you on mobile and tablet devices.",
    icon: Smartphone,
    links: [
      { label: "Shoonaya for iOS", href: "https://apps.apple.com/app/shoonaya/id6793055966", isExternal: true, badge: "App Store", description: "Download on the official Apple App Store for iPhone & iPad." },
      { label: "Shoonaya for Android Beta", href: "/beta/android", badge: "Beta", description: "Join the verified Google Play / Android early access program." },
      { label: "Shoonaya Web Companion", href: "/", description: "Fast, responsive gateway experience accessible in any browser." },
    ],
  },
  {
    id: "account",
    title: "Account & Membership",
    summary: "Manage your profile and personal preferences.",
    icon: UserCircle,
    links: [
      { label: "Sign In", href: "/login", description: "Access your existing Shoonaya practice profile." },
      { label: "Create an Account", href: "/signup", description: "Begin your personalized spiritual journey today." },
    ],
  },
  {
    id: "trust",
    title: "Trust, Governance & Legal",
    summary: "Our commitment to privacy, scholar council oversight, and transparency.",
    icon: ShieldCheck,
    links: [
      { label: "About Shoonaya", href: "/about", description: "Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection." },
      { label: "Editorial & Scholarly Guidelines", href: "/guidelines", description: "Rigorous standards for scriptural translation and tradition accuracy." },
      { label: "Privacy Policy", href: "/privacy", description: "Zero ad tracking, zero user data sale, strict privacy standards." },
      { label: "Terms of Service", href: "/terms", description: "Terms governing use of the Shoonaya website and mobile app." },
      { label: "Frequently Asked Questions (FAQ)", href: "/faq", description: "Clear answers on daily sadhana, panchang accuracy, traditions, and services." },
      { label: "Data Deletion Request", href: "/data-deletion", description: "Clear, self-service instructions to purge your personal data." },
      { label: "Contact & Official Support", href: "/contact", description: "Get in touch with the editorial team and technical support." },
    ],
  },
];

export function SitemapClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SITEMAP_DIRECTORY;
    const q = searchQuery.toLowerCase().trim();

    return SITEMAP_DIRECTORY.map((cat) => {
      const matchesCat =
        cat.title.toLowerCase().includes(q) || cat.summary.toLowerCase().includes(q);
      const matchingLinks = cat.links.filter(
        (l) =>
          l.label.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q))
      );

      if (matchesCat) return cat;
      if (matchingLinks.length > 0) {
        return { ...cat, links: matchingLinks };
      }
      return null;
    }).filter(Boolean) as SitemapCategory[];
  }, [searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
      {/* Category quick-jump bar */}
      <div className="mb-10 flex flex-wrap items-center gap-2 border-b border-[var(--card-border)] pb-6">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)] mr-2">
          Quick Jump:
        </span>
        {SITEMAP_DIRECTORY.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted-warm)] transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)]"
          >
            {cat.title}
          </a>
        ))}
      </div>

      {/* Search Filter */}
      <div className="mb-14">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search site map (e.g. Panchang, Japa, Ahimsa, Vrat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] py-3 pl-11 pr-4 text-sm text-[var(--text-cream)] placeholder-[var(--text-dim)] shadow-[var(--shadow-soft)] transition-colors focus:border-[var(--brand-primary)] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] hover:text-[var(--text-cream)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="space-y-16">
        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center text-[var(--text-muted-warm)]">
            <p className="text-base">No directory pages matched &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary-strong)]"
            >
              Reset search query
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              className="scroll-mt-32 rounded-[2.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] sm:p-10"
            >
              <div className="flex items-start justify-between border-b border-[var(--card-border)] pb-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--brand-primary-strong)]">
                    <cat.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--text-cream)] sm:text-3xl">
                      {cat.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted-warm)]">
                      {cat.summary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.links.map((link) => {
                  const Content = (
                    <div className="group flex h-full flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--surface-base)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:shadow-[var(--shadow-soft)]">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-semibold text-[var(--text-cream)] group-hover:text-[var(--brand-primary-strong)] transition-colors">
                            {link.label}
                          </span>
                          {link.badge ? (
                            <span className="rounded-full bg-[var(--brand-primary-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                              {link.badge}
                            </span>
                          ) : link.isExternal ? (
                            <ExternalLink className="size-3.5 text-[var(--text-dim)] transition-colors group-hover:text-[var(--text-cream)]" />
                          ) : (
                            <ArrowRight className="size-3.5 text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--brand-primary-strong)]" />
                          )}
                        </div>
                        {link.description && (
                          <p className="mt-2 text-xs leading-5 text-[var(--text-muted-warm)]">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );

                  return link.isExternal ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-2xl"
                    >
                      {Content}
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-2xl"
                    >
                      {Content}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Apple-style footer note */}
      <div className="mt-16 border-t border-[var(--card-border)] pt-8 text-center text-xs text-[var(--text-dim)]">
        <p>
          Shoonaya Site Map • Complete directory for Sanatan, Sikh, Buddhist, and Jain sacred companions.
        </p>
        <p className="mt-2">
          Need immediate support? Contact us at{" "}
          <a href="mailto:info@shoonaya.com" className="underline hover:text-[var(--text-cream)]">
            info@shoonaya.com
          </a>
        </p>
      </div>
    </div>
  );
}
