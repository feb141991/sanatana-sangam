'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Play, Flame, BarChart2, ChevronRight, Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { Shloka } from '@/lib/shlokas';

interface Props {
  shloka: Shloka;
  tradition: string;
  userName: string;
  japaStreak: number;
  sessionCountToday: number;
  dailyStotramId: string;
  dailyStotramTitle: string;
  dailyStotramDeityEmoji: string;
}

// ── Tradition-aware hero copy ─────────────────────────────────────────────────
const TRADITION_HERO: Record<string, { greeting: string; sub: string }> = {
  hindu:    { greeting: 'Jai Sri Ram 🙏', sub: 'Your Bhakti sanctuary' },
  sikh:     { greeting: 'Waheguru Ji Ka Khalsa ☬', sub: 'Naam Simran, Seva, Kirtan' },
  buddhist: { greeting: 'Namo Buddhaya ☸️', sub: 'The path of compassion' },
  jain:     { greeting: 'Jai Jinendra 🤲', sub: 'Ahimsa · Satya · Aparigraha' },
};

// ── Quick-action tiles ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Japa Mala',   emoji: '📿', href: '/bhakti/mala',    desc: 'Mantra japa' },
  { label: 'Hymns',       emoji: '🎵', href: '/bhakti/stotram', desc: 'Sacred chants' },
  { label: 'Kathas',      emoji: '📖', href: '/bhakti/katha',   desc: 'Divine stories' },
  { label: 'Sattvic',     emoji: '🕯️', href: '/bhakti/zen',     desc: 'Sacred ambience' },
];

export default function BhaktiClient({
  shloka,
  tradition,
  userName,
  japaStreak,
  sessionCountToday,
  dailyStotramId,
  dailyStotramTitle,
  dailyStotramDeityEmoji,
}: Props) {
  const router = useRouter();
  const { playHaptic } = useZenithSensory();
  const meta   = getTraditionMeta(tradition);
  const accent = meta.accentColour ?? 'var(--brand-primary)';
  const hero   = TRADITION_HERO[tradition] ?? TRADITION_HERO.hindu;

  return (
    <div className="relative min-h-screen pb-40 theme-bg theme-ink overflow-x-hidden">

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative px-4 pt-14 pb-8 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${accent}22 0%, ${accent}08 60%, transparent 100%)`,
        }}
      >
        {/* Subtle glow orb */}
        <div
          className="absolute top-0 right-0 w-56 h-56 rounded-full blur-[90px] pointer-events-none opacity-30"
          style={{ background: accent }}
        />

        {/* Back + Insights row */}
        <div className="relative flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: accent }}
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          <Link href="/bhakti/insights">
            <motion.div
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${accent}18`, color: accent }}
            >
              <BarChart2 size={13} />
              Insights
            </motion.div>
          </Link>
        </div>

        {/* Title */}
        <div className="relative space-y-1">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent }}>
            {hero.sub}
          </p>
          <h1 className="text-4xl font-bold premium-serif theme-ink leading-tight">
            Bhakti
          </h1>
          <p className="text-sm theme-muted mt-1">{hero.greeting}</p>
        </div>

        {/* Streak + sessions stats */}
        <div className="relative flex items-center gap-3 mt-5">
          {japaStreak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${accent}18`, color: accent }}
            >
              <Flame size={13} />
              {japaStreak}-day streak
            </div>
          )}
          {sessionCountToday > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: `${accent}18`, color: accent }}
            >
              📿 {sessionCountToday} today
            </div>
          )}
        </div>
      </section>

      {/* ─── Quick Actions ─────────────────────────────────────────────────── */}
      <section className="px-4 mt-6">
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}>
              <motion.div
                whileTap={{ scale: 0.93 }}
                onClick={() => playHaptic('light')}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 px-1 border transition-all"
                style={{
                  background: `${accent}0a`,
                  borderColor: `${accent}20`,
                }}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-[10px] font-semibold theme-ink text-center leading-tight">
                  {a.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Today's Stotram ───────────────────────────────────────────────── */}
      <section className="px-4 mt-6">
        <SectionHeader label="Today's Vani" accent={accent} />
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="mt-3 flex items-center gap-4 p-4 rounded-2xl border"
            style={{
              background: `${accent}0e`,
              borderColor: `${accent}25`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
              style={{ background: `${accent}20` }}
            >
              {dailyStotramDeityEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
                Daily Stotram
              </p>
              <p className="text-base font-semibold premium-serif theme-ink truncate">
                {dailyStotramTitle}
              </p>
              <p className="text-xs theme-muted mt-0.5">Tap to chant with guidance</p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: accent }}
            >
              <Play size={16} fill="white" color="white" />
            </div>
          </motion.div>
        </Link>
      </section>

      {/* ─── Practice Paths ─────────────────────────────────────────────────── */}
      <section className="px-4 mt-8">
        <SectionHeader label="Bhakti Paths" accent={accent} href="/bhakti/stotram" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            {
              title: 'Sacred Hymns',
              desc: 'Sanskrit stotrams, chalisa, ashtakam',
              emoji: '🎶',
              href: '/bhakti/stotram',
            },
            {
              title: 'Puranic Kathas',
              desc: 'Stories of the divine across traditions',
              emoji: '📖',
              href: '/bhakti/katha',
            },
            {
              title: 'Japa Sadhana',
              desc: 'Digital mala for mantra repetition',
              emoji: '📿',
              href: '/bhakti/mala',
            },
            {
              title: 'Sattvic Mode',
              desc: 'Ambient sound for puja & meditation',
              emoji: '🕯️',
              href: '/bhakti/zen',
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.96 }}
                className="h-full flex flex-col gap-3 p-4 rounded-2xl border transition-all"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-semibold premium-serif theme-ink leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] theme-muted mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mt-auto"
                  style={{ color: accent }}
                >
                  Explore <ChevronRight size={10} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Aaj ka Shloka ─────────────────────────────────────────────────── */}
      <section className="px-4 mt-8">
        <SectionHeader label="Aaj ka Shloka" accent={accent} />
        <div
          className="mt-3 rounded-2xl p-5 border"
          style={{ background: `${accent}0a`, borderColor: `${accent}20` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-10 rounded-full" style={{ background: accent }} />
            <p className="text-lg premium-serif theme-ink leading-snug italic">
              &ldquo;{shloka.sanskrit}&rdquo;
            </p>
          </div>
          {shloka.meaning && (
            <p className="text-xs theme-muted leading-relaxed pl-3">
              {shloka.meaning}
            </p>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-widest mt-3 pl-3" style={{ color: accent }}>
            — {shloka.source}
          </p>
        </div>
      </section>

      {/* ─── Browse All Stotrams ────────────────────────────────────────────── */}
      <section className="px-4 mt-6 mb-4">
        <Link href="/bhakti/stotram">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}18` }}
              >
                <Volume2 size={16} style={{ color: accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold theme-ink">Browse All Stotrams</p>
                <p className="text-[11px] theme-muted">Chalisa, ashtakam, namavali & more</p>
              </div>
            </div>
            <ChevronRight size={16} className="theme-muted" />
          </motion.div>
        </Link>

        <Link href="/bhakti/katha" className="mt-3 block">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}18` }}
              >
                <span style={{ color: accent }}><BookOpen size={16} /></span>
              </div>
              <div>
                <p className="text-sm font-semibold theme-ink">Sacred Kathas</p>
                <p className="text-[11px] theme-muted">Puranic tales across all traditions</p>
              </div>
            </div>
            <ChevronRight size={16} className="theme-muted" />
          </motion.div>
        </Link>
      </section>
    </div>
  );
}

// ── Reusable section header ───────────────────────────────────────────────────
function SectionHeader({
  label,
  accent,
  href,
}: {
  label: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {label}
        </span>
      </div>
      {href && (
        <span className="text-[11px] font-semibold theme-muted flex items-center gap-0.5">
          See all <ChevronRight size={11} />
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── BookOpen inline SVG (not in lucide bundle used here) ─────────────────────
function BookOpen({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
