'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, ChevronRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import { getTraditionMeta } from '@/lib/tradition-config';
import type { Shloka } from '@/lib/shlokas';

interface Props {
  shloka: Shloka;               // kept in Props for page.tsx compat — not used on page
  tradition: string;
  userName: string;
  japaStreak: number;
  sessionCountToday: number;
  dailyStotramId: string;
  dailyStotramTitle: string;
  dailyStotramDeityEmoji: string;
}

// ── Tradition-aware hero text ──────────────────────────────────────────────────
const TRADITION_HERO: Record<string, { greeting: string; sub: string }> = {
  hindu:    { greeting: 'Jai Sri Ram 🙏',           sub: 'Bhakti, Kathas & Sacred Practice' },
  sikh:     { greeting: 'Waheguru Ji Ka Khalsa ☬',  sub: 'Bani, Sakhis & Naam Simran'       },
  buddhist: { greeting: 'Namo Buddhaya ☸️',          sub: 'Dhamma Stories & Sacred Chants'   },
  jain:     { greeting: 'Jai Jinendra 🤲',           sub: 'Kathas, Stotrams & Simran'        },
};

// ── Content category cards ─────────────────────────────────────────────────────
interface ContentCard {
  emoji: string;
  title: string;
  desc:  string;
  href:  string;
  // subtle tint on the card
  tint:  string;
  traditions?: string[]; // if omitted, show for all
}

const CONTENT_CARDS: ContentCard[] = [
  {
    emoji: '📖',
    title: 'Sacred Kathas',
    desc:  'Puranic stories of gods, sages & devotees',
    href:  '/bhakti/katha',
    tint:  'rgba(200,120,74,0.10)',
  },
  {
    emoji: '🎵',
    title: 'Stotrams & Hymns',
    desc:  'Sanskrit chants, chalisa, ashtakam',
    href:  '/bhakti/stotram',
    tint:  'rgba(200,146,74,0.10)',
    traditions: ['hindu', 'jain'],
  },
  {
    emoji: '☬',
    title: 'Bani & Sakhis',
    desc:  'Gurbani, sakhis and kirtan stories',
    href:  '/bhakti/katha',
    tint:  'rgba(100,160,220,0.10)',
    traditions: ['sikh'],
  },
  {
    emoji: '☸️',
    title: 'Sacred Chants',
    desc:  'Buddhist sutras, chants & mantras',
    href:  '/bhakti/stotram',
    tint:  'rgba(140,100,200,0.10)',
    traditions: ['buddhist'],
  },
  {
    emoji: '🏛️',
    title: 'Puranic Tales',
    desc:  'Ramayana, Mahabharata & the Puranas',
    href:  '/bhakti/katha',
    tint:  'rgba(200,160,60,0.10)',
    traditions: ['hindu'],
  },
  {
    emoji: '🌟',
    title: "Kids' Stories",
    desc:  'Dharmic tales for little hearts',
    href:  '/bhakti/katha',
    tint:  'rgba(80,180,160,0.10)',
  },
  {
    emoji: '🦊',
    title: 'Panchatantra',
    desc:  'Ancient wisdom fables & animal tales',
    href:  '/bhakti/katha',
    tint:  'rgba(200,120,80,0.10)',
  },
  {
    emoji: '🦁',
    title: 'Heroes of Bharat',
    desc:  'Warriors, saints & unsung legends',
    href:  '/bhakti/katha',
    tint:  'rgba(180,80,80,0.10)',
  },
  {
    emoji: '📿',
    title: 'Japa Mala',
    desc:  'Digital mala for mantra & Naam Simran',
    href:  '/bhakti/mala',
    tint:  'rgba(160,120,200,0.10)',
  },
  {
    emoji: '🕯️',
    title: 'Sattvic Mode',
    desc:  'Sacred ambience for puja & meditation',
    href:  '/bhakti/zen',
    tint:  'rgba(200,180,120,0.10)',
  },
];

export default function BhaktiClient({
  tradition,
  japaStreak,
  sessionCountToday,
  dailyStotramId,
  dailyStotramTitle,
  dailyStotramDeityEmoji,
}: Props) {
  const router        = useRouter();
  const { playHaptic } = useZenithSensory();
  const meta          = getTraditionMeta(tradition);
  const accent        = meta.accentColour ?? 'var(--brand-primary)';
  const hero          = TRADITION_HERO[tradition] ?? TRADITION_HERO.hindu;

  // Filter cards to this tradition (show universal cards + tradition-specific ones)
  const cards = CONTENT_CARDS.filter(
    c => !c.traditions || c.traditions.includes(tradition)
  );

  return (
    <div className="relative min-h-screen pb-36 theme-bg theme-ink overflow-x-hidden">

      {/* ─── Hero strip ──────────────────────────────────────────────────── */}
      <div
        className="px-4 pt-14 pb-6"
        style={{ background: `linear-gradient(160deg, ${accent}1a 0%, ${accent}08 55%, transparent 100%)` }}
      >
        {/* Back + insights row */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: accent }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Back
          </button>
          <Link
            href="/bhakti/insights"
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: `${accent}18`, color: accent }}
          >
            Insights
          </Link>
        </div>

        {/* Title */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
          {hero.sub}
        </p>
        <h1 className="text-[32px] font-bold premium-serif theme-ink leading-none mb-1">
          Bhakti
        </h1>
        <p className="text-sm theme-muted">{hero.greeting}</p>

        {/* Stat pills */}
        <div className="flex items-center gap-2 mt-4">
          {japaStreak > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: `${accent}18`, color: accent }}>
              <Flame size={12} />{japaStreak}-day streak
            </span>
          )}
          {sessionCountToday > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: `${accent}18`, color: accent }}>
              📿 {sessionCountToday} today
            </span>
          )}
        </div>
      </div>

      {/* ─── Today's Stotram ─────────────────────────────────────────────── */}
      <div className="px-4 mt-2">
        <Link href={`/bhakti/stotram/${dailyStotramId}`}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{ background: `${accent}0d`, borderColor: `${accent}28` }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${accent}22` }}
            >
              {dailyStotramDeityEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: accent }}>
                Today&apos;s Vani
              </p>
              <p className="text-[15px] font-semibold premium-serif theme-ink truncate">
                {dailyStotramTitle}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: accent }}>
              <Play size={14} fill="white" color="white" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ─── Section header ──────────────────────────────────────────────── */}
      <div className="px-4 mt-7 mb-3 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
          Explore
        </span>
      </div>

      {/* ─── Content Cards Grid ───────────────────────────────────────────── */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link key={`${card.href}-${card.title}`} href={card.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => playHaptic('light')}
              className="flex flex-col gap-3 p-4 rounded-2xl border h-full transition-all"
              style={{
                background: card.tint,
                borderColor: 'var(--card-border)',
              }}
            >
              <span className="text-[28px] leading-none">{card.emoji}</span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold premium-serif theme-ink leading-snug">
                  {card.title}
                </p>
                <p className="text-[11px] theme-muted mt-1 leading-snug">
                  {card.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: accent }}>
                Open <ChevronRight size={10} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

    </div>
  );
}
