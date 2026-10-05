import Link from "next/link";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Compass,
  CheckCircle2,
} from "lucide-react";

import BrandMark from "@/components/BrandMark";
import {
  OFFICIAL_EMAIL,
  OFFICIAL_SOCIAL_LINKS,
} from "@/config/official-links";

const TRADITION_SEALS = [
  {
    symbol: "ॐ",
    name: "Sanatan Dharma",
    focus: "Vedas, Upanishads & Gita",
    href: "/traditions/hindu",
    color: "#D88A1C",
    bg: "rgba(216, 138, 28, 0.1)",
    border: "rgba(216, 138, 28, 0.25)",
  },
  {
    symbol: "ੴ",
    name: "Sikh Dharma",
    focus: "Gurbani, Gurpurabs & Nitnem",
    href: "/traditions/sikh",
    color: "#E67E22",
    bg: "rgba(230, 126, 34, 0.1)",
    border: "rgba(230, 126, 34, 0.25)",
  },
  {
    symbol: "卐",
    name: "Jain Dharma",
    focus: "Agamas, Tirthankaras & Ahimsa",
    href: "/traditions/jain",
    color: "#2A6B4A",
    bg: "rgba(42, 107, 74, 0.1)",
    border: "rgba(42, 107, 74, 0.25)",
  },
  {
    symbol: "☸",
    name: "Buddhist Dharma",
    focus: "Tripitaka, Mindfulness & Metta",
    href: "/traditions/buddhist",
    color: "#8B2D3E",
    bg: "rgba(139, 45, 62, 0.1)",
    border: "rgba(139, 45, 62, 0.25)",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Living Tools",
    links: [
      { href: "/panchang", label: "Local Panchang & Calendar" },
      { href: "/japa", label: "Digital Japa Mala" },
      { href: "/ai-chat", label: "Dharma Mitra AI Companion" },
      { href: "/library", label: "Pathshala & Scripture Study" },
      { href: "/kundali", label: "Kundali & Rashiphal" },
      { href: "/darshan", label: "Live Darshan Streams" },
      { href: "/kul", label: "Kul Private Family Spaces" },
      { href: "/community", label: "Mandali Community Circles" },
    ],
  },
  {
    title: "Traditions & Paths",
    links: [
      { href: "/traditions", label: "Traditions Overview" },
      { href: "/traditions/hindu", label: "Sanatan Dharma" },
      { href: "/traditions/sikh", label: "Sikh Dharma" },
      { href: "/traditions/jain", label: "Jain Dharma" },
      { href: "/traditions/buddhist", label: "Buddhist Dharma" },
      { href: "/play/gyan-chaupar", label: "Gyan Chaupar (Leela)" },
    ],
  },
  {
    title: "Ecosystem & Explore",
    links: [
      { href: "/features", label: "All Living Features & Roadmap" },
      { href: "/features/sacred-calendar", label: "Astronomical Calendar" },
      { href: "/about", label: "About Sanctuary" },
      { href: "/sources", label: "Scriptural Sources & Lineage" },
      { href: "/faq", label: "Frequently Asked Questions" },
      { href: "/contact", label: "Contact & Dialogue" },
      { href: "/early-access", label: "Request Early Access" },
    ],
  },
  {
    title: "Trust & Governance",
    links: [
      { href: "/privacy", label: "Privacy Policy (Zero Trackers)" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/guidelines", label: "Community Guidelines" },
      { href: "/sources", label: "Editorial Verification Tiers" },
      { href: "/sitemap", label: "HTML Site Map" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] overflow-hidden">
      {/* ── 1. Early Access Callout Banner ──────────────────────────────────── */}
      <div className="border-b border-[var(--card-border)]/60 bg-gradient-to-r from-[var(--surface-soft)] via-[var(--card-bg)] to-[var(--surface-soft)] px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-soft)] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-strong)] mb-3">
              <Sparkles className="size-3.5" />
              Private Testing Cohort
            </div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-3xl">
              Step into sacred time with Shoonaya.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Register your email for private early access. Our engineering team provisions applicant accounts in the background and delivers direct installation links to your inbox.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/early-access"
              className="card-lift shimmer-trigger inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 text-xs font-semibold uppercase tracking-wider text-[var(--surface-base)] shadow-sm hover:opacity-90 transition active:scale-95"
            >
              Request Early Access
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Tradition Seals Ribbon ────────────────────────────────────────── */}
      <div className="border-b border-[var(--card-border)]/60 px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)] mb-4">
            Honoring Distinct Dharmic Traditions in Authentic Context
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {TRADITION_SEALS.map((trad) => (
              <Link
                key={trad.name}
                href={trad.href}
                className="group flex items-center gap-3 rounded-2xl border p-3.5 transition-all card-lift"
                style={{
                  backgroundColor: trad.bg,
                  borderColor: trad.border,
                }}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-bold shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={{ color: trad.color, backgroundColor: "var(--card-bg)" }}
                >
                  {trad.symbol}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-cream)] truncate group-hover:text-[var(--brand-primary-strong)] transition-colors">
                    {trad.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-dim)] truncate">
                    {trad.focus}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Main Navigation Directory ─────────────────────────────────────── */}
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] lg:px-14 xl:px-20">
        {/* Brand & Philosophy Column */}
        <div className="space-y-6">
          <Link
            href="/"
            aria-label="Shoonaya home"
            className="inline-flex min-h-11 items-center gap-3 text-[var(--text-cream)] group"
          >
            <div className="transition-transform duration-300 group-hover:scale-105">
              <BrandMark size="sm" />
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--text-cream)]">
              Shoonaya
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-7 text-[var(--text-muted-warm)]">
            Find your infinite. A daily spiritual sanctuary for sacred time,
            practice, and connection. Ancient foundation, modern doorway.
          </p>

          <div className="space-y-2 border-t border-[var(--card-border)]/60 pt-4">
            <div className="flex items-center gap-2 text-xs text-[var(--brand-primary-strong)]">
              <Compass className="size-3.5" />
              <span className="font-semibold">Swiss Ephemeris & Ujjain Reference</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
              <ShieldCheck className="size-3.5" />
              <span>100% Ad-Free · Private by Design</span>
            </div>
          </div>

          {/* Social Channels */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-3">
              Official Channels
            </p>
            <div className="flex flex-wrap items-center gap-2" aria-label="Shoonaya social media">
              <a
                href={OFFICIAL_SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Shoonaya on Instagram"
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--text-muted-warm)] transition-all hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)] hover:scale-105"
              >
                <Instagram className="size-4" aria-hidden="true" />
              </a>
              <a
                href={OFFICIAL_SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Shoonaya on Facebook"
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--text-muted-warm)] transition-all hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)] hover:scale-105"
              >
                <Facebook className="size-4" aria-hidden="true" />
              </a>
              <a
                href={OFFICIAL_SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="Shoonaya on LinkedIn"
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--text-muted-warm)] transition-all hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)] hover:scale-105"
              >
                <Linkedin className="size-4" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${OFFICIAL_EMAIL}`}
                aria-label={`Email Shoonaya at ${OFFICIAL_EMAIL}`}
                className="flex size-10 items-center justify-center rounded-xl border border-[var(--card-border)] text-[var(--text-muted-warm)] transition-all hover:border-[var(--brand-primary)] hover:text-[var(--text-cream)] hover:scale-105"
              >
                <Mail className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Nav Columns */}
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-7 items-center text-xs leading-relaxed text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)] hover:translate-x-0.5 duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── 4. Bottom Sub-Footer & Integrity Strip ───────────────────────────── */}
      <div className="border-t border-[var(--card-border)] bg-[var(--surface-base)] px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 text-xs text-[var(--text-dim)] md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center md:text-left">
            <span>© {new Date().getFullYear()} Shoonaya. All rights reserved.</span>
            <span>•</span>
            <span>Ancient foundation, modern doorway.</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-3.5 py-1 text-[11px] text-[var(--text-muted-warm)]">
            <span className="size-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span>Ephemeris Engine 2026 · Operational</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-[var(--text-cream)] transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-[var(--text-cream)] transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/guidelines" className="hover:text-[var(--text-cream)] transition-colors">Guidelines</Link>
            <span>•</span>
            <Link href="/sitemap" className="hover:text-[var(--text-cream)] transition-colors">Site Map</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
