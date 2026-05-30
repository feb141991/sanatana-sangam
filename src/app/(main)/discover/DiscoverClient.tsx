'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, RotateCcw, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredIcon from '@/components/ui/SacredIcon';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getFullRecommendationsForMood, MoodRecommendation, MoodContext } from '@/lib/mood/engine';

// ── Suggested Chips ───────────────────────────────────────────────────────────
const BASE_CHIPS = [
  { label: "What is today's tithi?",  href: '/panchang' },
  { label: 'Gayatri Mantra meaning',  href: '/bhakti/stotram' },
  { label: 'Ekadashi rules',          href: '/vrat/ekadashi' },
  { label: 'Temples near me',         href: '/tirtha-map' },
  { label: 'Start a Sankalpa',        href: '/my-progress' },
  { label: 'Daily quiz',              href: '/quiz' },
];

const TRADITION_CHIPS: Record<string, Array<{label: string; href: string}>> = {
  sikh:     [
    { label: 'Nitnem Bani',    href: '/bhakti/stotram?tradition=sikh' },
    { label: 'Ardas meaning',  href: '/pathshala?tradition=sikh' },
    { label: 'Gurdwara nearby',href: '/tirtha-map' },
  ],
  buddhist: [
    { label: 'Dhammapada verse',  href: '/pathshala?tradition=buddhist' },
    { label: 'Meditation timer',  href: '/bhakti/mala' },
    { label: 'Uposatha today?',   href: '/panchang' },
  ],
  jain: [
    { label: 'Navkar Mantra',     href: '/bhakti/mala' },
    { label: 'Paryushana info',   href: '/vrat/paryushana' },
    { label: 'Jain calendar',     href: '/panchang' },
  ],
};

function SuggestedChips({ tradition }: { tradition: string | null }) {
  const chips = [
    ...(tradition && TRADITION_CHIPS[tradition] ? TRADITION_CHIPS[tradition] : []),
    ...BASE_CHIPS,
  ].slice(0, 7);

  return (
    <div className="mb-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2.5" style={{ color: 'var(--text-dim)' }}>
        Quick explore
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {chips.map(chip => (
          <Link
            key={chip.label}
            href={chip.href}
            className="shrink-0 px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
            style={{
              background:  'rgba(197,160,89,0.08)',
              borderColor: 'rgba(197,160,89,0.20)',
              color:       'var(--brand-primary)',
              whiteSpace:  'nowrap',
            }}
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Featured Grid ─────────────────────────────────────────────────────────────
const BASE_FEATURED: Array<{ emoji: string; title: string; desc: string; href: string }> = [
  { emoji: '📿', title: 'Daily Japa',      desc: 'Mala practice',          href: '/bhakti/mala' },
  { emoji: '📚', title: 'Pathshala',        desc: 'Sacred study',           href: '/pathshala' },
  { emoji: '📅', title: 'Panchang',         desc: 'Tithi & Nakshatra',      href: '/panchang' },
  { emoji: '🏆', title: 'Leaderboard',      desc: 'Sadhana ranks',          href: '/scoreboard' },
];

const TRADITION_FEATURED: Record<string, Array<{ emoji: string; title: string; desc: string; href: string }>> = {
  sikh:     [
    { emoji: '☬',  title: 'Gurbani',    desc: 'Daily scripture',  href: '/pathshala?tradition=sikh' },
    { emoji: '🙏', title: 'Ardas',      desc: 'Daily prayer',     href: '/bhakti' },
    { emoji: '📿', title: 'Simran',     desc: 'Naam Japna',       href: '/bhakti/mala' },
    { emoji: '👥', title: 'Sangat',     desc: 'Community',        href: '/mandali' },
  ],
  buddhist: [
    { emoji: '☸️', title: 'Dhammapada', desc: 'Path of wisdom',   href: '/pathshala?tradition=buddhist' },
    { emoji: '🧘', title: 'Meditation', desc: 'Mindful practice',  href: '/bhakti/mala' },
    { emoji: '📅', title: 'Uposatha',   desc: 'Lunar calendar',    href: '/panchang' },
    { emoji: '👥', title: 'Sangha',     desc: 'Community',         href: '/mandali' },
  ],
  jain: [
    { emoji: '🤲', title: 'Navkar',     desc: 'Supreme mantra',   href: '/bhakti/mala' },
    { emoji: '📚', title: 'Agama',      desc: 'Jain scriptures',  href: '/pathshala?tradition=jain' },
    { emoji: '📅', title: 'Calendar',   desc: 'Jain observances', href: '/panchang' },
    { emoji: '👥', title: 'Sangha',     desc: 'Community',        href: '/mandali' },
  ],
};

function FeaturedGrid({
  tradition,
  isDark,
}: { tradition: string | null; isDark: boolean }) {
  const items = tradition && TRADITION_FEATURED[tradition]
    ? TRADITION_FEATURED[tradition]
    : BASE_FEATURED;

  const cardBg     = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,253,246,0.92)';
  const cardBorder = isDark ? 'rgba(197,160,89,0.12)' : 'rgba(197,160,89,0.18)';
  const titleColor = isDark ? '#F0EDE6' : '#1A100A';
  const descColor  = isDark ? 'rgba(240,237,230,0.45)' : 'rgba(60,40,15,0.50)';

  return (
    <div className="mb-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2.5" style={{ color: 'var(--text-dim)' }}>
        Featured
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col rounded-[1.3rem] p-3.5 border relative overflow-hidden transition-transform active:scale-[0.97]"
            style={{ background: cardBg, borderColor: cardBorder, textDecoration: 'none' }}
          >
            {/* Ambient glow */}
            <span
              className="pointer-events-none absolute top-0 right-0 w-12 h-12 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.5), transparent 70%)', transform: 'translate(30%,-30%)' }}
              aria-hidden="true"
            />
            <span
              className="drop-shadow-sm select-none mb-2"
              style={{ fontSize: '2rem', lineHeight: 1, display: 'block' }}
              aria-hidden="true"
            >
              {item.emoji}
            </span>
            <span className="text-[13px] font-bold leading-tight" style={{ color: titleColor }}>
              {item.title}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: descColor }}>
              {item.desc}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface TodayVeer {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  tradition: string;
}

interface Props {
  tradition: string | null;
  spiritualLevel: string | null;
  transliterationLanguage?: string;
  todayVeer?: TodayVeer | null;
}

import { MOODS_CONFIG } from '@/lib/mood/registry';

// ── Stack Card Component ──────────────────────────────────────────────────────

function StackCard({
  rec,
  index,
  total,
  accentColour,
  onNext, onPrev,
  onClose,
  onClickAction,
  isActive
}: {
  rec: MoodRecommendation;
  index: number;
  total: number;
  accentColour: string;
  onNext: () => void;
  onPrev?: () => void;
  onClose: () => void;
  onClickAction: () => void;
  isActive: boolean;
}) {
  return (
    <motion.div
      className="absolute left-1/2 w-full max-w-sm rounded-[1.6rem] p-4 flex flex-col overflow-hidden"
      style={{
        height: 420,
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: isActive ? '0 12px 40px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.1)',
        zIndex: total - index,
      }}
      initial={{ scale: 0.9, x: '-50%', y: 40, opacity: 0 }}
      animate={{
        scale: isActive ? 1 : Math.max(0.9, 1 - index * 0.05),
        x: '-50%',
        y: isActive ? 0 : index * 14,
        opacity: 1 - index * 0.2,
      }}
      exit={{ scale: 1.05, x: '-50%', y: -40, opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-20 pointer-events-none rounded-full"
        style={{ background: accentColour, transform: 'translate(30%, -30%)' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: `${accentColour}15`, color: accentColour }}>
            {rec.type}
          </span>
        </div>
        {isActive && (
          <button onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center transition hover:bg-white/5">
            <X size={16} style={{ color: 'var(--text-dim)' }} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${accentColour}15` }}>
          <SacredIcon name={rec.icon} size={26} strokeWidth={1.6} style={{ color: accentColour }} />
        </div>

        <h3 className="text-xl font-bold mb-2 leading-tight" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-cream)' }}>
          {rec.title}
        </h3>

        <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--text-muted-warm)' }}>
          {rec.description}
        </p>

        {rec.explanation && (
          <div className="rounded-2xl p-3 mt-1" style={{ background: 'var(--card-bg-soft)', border: '1px solid var(--card-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accentColour }}>Why this fits</p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              {rec.explanation}
            </p>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-4 flex items-center gap-2">
          {onPrev && (
            <button
              onClick={onPrev}
              className="w-11 h-11 rounded-[1rem] flex items-center justify-center transition-transform active:scale-95"
              style={{ border: '1px solid var(--card-border)' }}
              aria-label="Previous recommendation"
            >
              <ChevronLeft size={16} style={{ color: 'var(--text-dim)' }} />
            </button>
          )}
          <Link
            href={rec.href}
            onClick={onClickAction}
            className="flex-1 py-2.5 rounded-[1.2rem] text-center text-[13px] font-bold transition-transform active:scale-95"
            style={{ background: accentColour, color: 'var(--surface-base)' }}
          >
            {rec.actionLabel}
          </Link>
          <button
            onClick={onNext}
            className="w-11 h-11 rounded-[1rem] flex items-center justify-center transition-transform active:scale-95"
            style={{ border: '1px solid var(--card-border)' }}
            aria-label="Next recommendation"
          >
            <ArrowRight size={18} style={{ color: 'var(--text-dim)' }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Daily Dharm Veer Banner ────────────────────────────────────────────────────
function DailyVeerBanner({ veer }: { veer: TodayVeer }) {
  const TRADITION_ACCENT: Record<string, string> = {
    hindu:    'rgba(255,120,0,0.12)',
    sikh:     'rgba(0,100,255,0.12)',
    buddhist: 'rgba(255,200,0,0.12)',
    jain:     'rgba(0,200,50,0.12)',
    sufi:     'rgba(140,90,220,0.12)',
    tribal:   'rgba(60,160,90,0.12)',
  };
  const bg = TRADITION_ACCENT[veer.tradition] ?? 'rgba(197,160,89,0.10)';

  return (
    <Link
      href={`/dharm-veer/${veer.id}`}
      className="flex items-center gap-3 rounded-2xl p-3.5 mb-5 border transition-transform active:scale-[0.98] relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(197,160,89,0.09), rgba(197,160,89,0.03))', borderColor: 'rgba(197,160,89,0.22)', textDecoration: 'none' }}
    >
      <div
        className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[32px] opacity-30"
        style={{ background: '#C5A059' }}
        aria-hidden="true"
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: bg, border: '1px solid rgba(197,160,89,0.25)' }}
      >
        {veer.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: 'rgba(197,160,89,0.55)' }}>
          Today&apos;s Dharm Veer
        </p>
        <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--text-cream)' }}>
          {veer.name}
        </p>
        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-dim)' }}>
          {veer.tagline}
        </p>
      </div>
      <ArrowRight size={14} style={{ color: 'rgba(197,160,89,0.6)', flexShrink: 0 }} />
    </Link>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function DiscoverClient({ tradition, transliterationLanguage, todayVeer }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();

  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  // Initialize from URL params if available
  const initialMood = searchParams.get('mood');
  const initialCheckinId = searchParams.get('checkin_id');

  const [selectedMood, setSelectedMood] = useState<string | null>(initialMood);
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(initialCheckinId);

  const [context, setContext] = useState<MoodContext>({
    need: searchParams.get('need'),
    time: searchParams.get('time'),
    type: searchParams.get('type')
  });

  // Resume an open session if we arrived without URL params
  useEffect(() => {
    if (!initialMood && !initialCheckinId) {
      let cancelled = false;
      fetch('/api/mood/checkin')
        .then(r => r.json())
        .then(data => {
          if (!cancelled && data?.openSession) {
            setActiveCheckinId(data.openSession.id);
            setSelectedMood(data.openSession.before_mood);
          }
        })
        .catch(console.warn);
      return () => { cancelled = true; };
    }
  }, [initialMood, initialCheckinId]);

  const [stack, setStack] = useState<MoodRecommendation[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeMood = MOODS.find(m => m.key === selectedMood);

  useEffect(() => {
    if (selectedMood) {
      const qs = new URLSearchParams();
      qs.set('mood', selectedMood);
      qs.set('full', 'true');
      if (context.need) qs.set('need', context.need);
      if (context.time) qs.set('time', context.time);
      if (context.type) qs.set('type', context.type);
      if (activeCheckinId) qs.set('checkin_id', activeCheckinId);

      fetch(`/api/mood/recommendations?${qs.toString()}`)
        .then(r => r.json())
        .then(data => {
          setStack(data.recommendations || []);
          setActiveIndex(0);
        })
        .catch(console.error);
    }
  }, [selectedMood, context, activeCheckinId]);

  async function handleSelectMood(moodKey: string) {
    // If organic selection, start a backend session first
    if (!activeCheckinId) {
      try {
        const res = await fetch('/api/mood/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            before_mood: moodKey,
            source_surface: 'discover_page'
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.checkin_id) {
            setActiveCheckinId(data.checkin_id);
          }
        }
      } catch (e) {
        console.warn('Failed to start organic checkin session', e);
      }
    }

    setSelectedMood(moodKey);
    setContext({});
  }

  function reset() {
    setSelectedMood(null);
    setStack([]);
    setActiveIndex(0);
  }

  function trackInteraction(action: 'skip' | 'click', itemType: string) {
    if (!activeCheckinId) return;

    fetch('/api/mood/dis' + 'cover-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkinId: activeCheckinId, action, itemType })
    }).catch(console.error);
  }

  const accent = activeMood?.colour ?? 'var(--brand-primary)';

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden fade-in">
      {/* ── Header ── */}
      <div className="relative flex items-center px-4 pt-safe pt-4 pb-2 z-10">
        <button
          onClick={() => selectedMood ? reset() : router.back()}
          aria-label="Go back"
          className="absolute left-4 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'var(--brand-primary-soft)', border: '1px solid var(--card-border)' }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--brand-primary)' }} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>
            Mood-Based Discovery
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-cream)', lineHeight: 1.2 }}>
            {selectedMood && activeMood ? `For when you feel ${activeMood.label}` : 'How are you feeling?'}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!selectedMood ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-4 h-full overflow-y-auto pb-32"
            >
              {/* ── Suggested chips ── */}
              <SuggestedChips tradition={tradition} />

              {/* ── Today's Dharm Veer ── */}
              {todayVeer && <DailyVeerBanner veer={todayVeer} />}

              {/* ── Featured grid ── */}
              <FeaturedGrid
                tradition={tradition}
                isDark={resolvedTheme === 'dark'}
              />

              {/* ── Mood grid section ── */}
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--text-dim)' }}>
                By mood
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {MOODS.map(mood => (
                  <motion.button
                    key={mood.key}
                    onClick={() => handleSelectMood(mood.key)}
                    className="flex flex-col items-center gap-2 rounded-[1.4rem] px-3 py-5 text-center transition-all motion-press"
                    style={{
                      background: `linear-gradient(145deg, ${mood.colour}12, var(--card-bg-soft))`,
                      border: `1px solid var(--card-border)`,
                      boxShadow: 'var(--shadow-soft)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                      <MoodGlyph mood={mood.key} color={mood.colour} size={28} />
                    </span>
                    <span
                      className="text-[13px] font-semibold leading-tight mt-1"
                      style={{ color: 'var(--text-cream)' }}
                    >
                      {mood.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stack"
              className="absolute w-full h-full flex flex-col px-5 pb-8 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Stack Progress */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {stack.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === activeIndex ? 16 : 4,
                      background: i === activeIndex ? accent : 'var(--card-border)',
                    }}
                  />
                ))}
              </div>

              {/* Cards Container */}
              <div className="relative flex-1 flex items-center justify-center">
                <AnimatePresence>
                  {stack.slice(activeIndex, activeIndex + 3).map((rec, renderIndex) => {
                    const actualIndex = activeIndex + renderIndex;
                    return (
                      <StackCard
                        key={`${rec.id}-${actualIndex}`}
                        rec={rec}
                        index={renderIndex}
                        total={stack.length}
                        accentColour={accent}
                        isActive={renderIndex === 0}
                        onNext={() => {
                          trackInteraction('skip', rec.type);
                          if (activeIndex < stack.length - 1) {
                            setActiveIndex(prev => prev + 1);
                          } else {
                            reset();
                          }
                        }}
                        onPrev={activeIndex > 0 ? () => setActiveIndex(prev => Math.max(0, prev - 1)) : undefined}
                        onClickAction={() => {
                          trackInteraction('click', rec.type);
                        }}
                        onClose={reset}
                      />
                    );
                  })}
                </AnimatePresence>

                {/* End of stack state */}
                {activeIndex >= stack.length && (
                  <motion.div
                    className="absolute left-1/2 w-full max-w-sm rounded-[2rem] p-6 flex flex-col items-center justify-center text-center"
                    style={{ height: 420, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                    initial={{ opacity: 0, x: '-50%' }} animate={{ opacity: 1, x: '-50%' }}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--brand-primary-soft)' }}>
                      <RotateCcw size={24} style={{ color: 'var(--brand-primary)' }} />
                    </div>
                    <p className="text-[15px] font-bold mb-2" style={{ color: 'var(--text-cream)' }}>You&apos;ve seen everything</p>
                    <p className="text-[13px] mb-6" style={{ color: 'var(--text-dim)' }}>Would you like to explore another state?</p>
                    <button
                      onClick={reset}
                      className="px-6 py-3 rounded-full text-[13px] font-bold"
                      style={{ background: 'var(--card-border)', color: 'var(--text-cream)' }}
                    >
                      Return to Moods
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
