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

function SuggestedChips({
  tradition,
  nextObservance,
}: {
  tradition: string | null;
  nextObservance?: { name: string; emoji: string; daysAway: number; slug: string; routeKind: string } | null;
}) {
  const dynamicChips = [];
  if (nextObservance && nextObservance.daysAway <= 3) {
    if (nextObservance.daysAway === 0) {
      dynamicChips.push({
        label: `${nextObservance.emoji} It's ${nextObservance.name} today`,
        href: `/${nextObservance.routeKind}/${nextObservance.slug}`,
      });
    } else {
      dynamicChips.push({
        label: `${nextObservance.emoji} Prepare for ${nextObservance.name}`,
        href: `/${nextObservance.routeKind}/${nextObservance.slug}`,
      });
    }
  }

  const chips = [
    ...dynamicChips,
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
              background:  'var(--brand-primary-soft)',
              borderColor: 'var(--card-border)',
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

function FeaturedGrid({ tradition }: { tradition: string | null }) {
  const items = tradition && TRADITION_FEATURED[tradition]
    ? TRADITION_FEATURED[tradition]
    : BASE_FEATURED;

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
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', textDecoration: 'none' }}
          >
            {/* Ambient glow */}
            <span
              className="pointer-events-none absolute top-0 right-0 w-12 h-12 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, var(--brand-primary), transparent 70%)', transform: 'translate(30%,-30%)' }}
              aria-hidden="true"
            />
            <span
              className="drop-shadow-sm select-none mb-2"
              style={{ fontSize: '2rem', lineHeight: 1, display: 'block' }}
              aria-hidden="true"
            >
              {item.emoji}
            </span>
            <span className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text-cream)' }}>
              {item.title}
            </span>
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
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
  activeSankalpa?: { name: string; streakDays: number; targetDays: number } | null;
  nextObservance?: { name: string; emoji: string; daysAway: number; slug: string; routeKind: string } | null;
}

import { MOODS_CONFIG } from '@/lib/mood/registry';

// ── Recommendation Card Component ───────────────────────────────────────────────

function RecommendationCard({
  rec,
  accentColour,
  onClickAction,
}: {
  rec: MoodRecommendation;
  accentColour: string;
  onClickAction: () => void;
}) {
  let badgeLabel = 'Explore';
  if (rec.href.includes('/pathshala?tradition=sikh')) badgeLabel = 'Sikh';
  else if (rec.href.includes('/bhakti/mala')) badgeLabel = 'Practice';
  else if (rec.type === 'katha') badgeLabel = 'Story';

  const TIME_ESTIMATE: Record<MoodRecommendation['type'], string> = {
    stotram: '3 min', katha: '5 min', dhyana: '10 min',
    discover: '5 min', japa: '8 min', pathshala: '5 min',
  };
  const timeEst = TIME_ESTIMATE[rec.type] ?? '5 min';

  return (
    <div
      className="w-full rounded-[1.6rem] p-4 flex flex-col overflow-hidden relative"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-20 pointer-events-none rounded-full"
        style={{ background: accentColour, transform: 'translate(30%, -30%)' }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: `${accentColour}15`, color: accentColour }}>
            {badgeLabel}
          </span>
        </div>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-dim)' }}>
          {timeEst}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${accentColour}15` }}>
          <SacredIcon name={rec.icon} size={26} strokeWidth={1.6} style={{ color: accentColour }} />
        </div>

        <h3 className="text-xl font-bold mb-2 leading-tight premium-serif" style={{ color: 'var(--text-cream)' }}>
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

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={rec.href}
          onClick={onClickAction}
          className="flex-1 py-2.5 rounded-[1.2rem] text-center text-[13px] font-bold transition-transform active:scale-95"
          style={{ background: accentColour, color: 'var(--surface-base)' }}
        >
          {rec.actionLabel}
        </Link>
      </div>
    </div>
  );
}

// ── Daily Dharm Veer Banner ────────────────────────────────────────────────────
function DailyVeerBanner({ veer }: { veer: TodayVeer }) {
  const TRADITION_ACCENT: Record<string, string> = {
    hindu:    'var(--glow-hindu)',
    sikh:     'var(--glow-sikh)',
    buddhist: 'var(--glow-buddhist)',
    jain:     'var(--glow-jain)',
  };
  const bg = TRADITION_ACCENT[veer.tradition] ?? 'var(--brand-primary-soft)';

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

// ── Today's Context Banner ───────────────────────────────────────────────────
function TodayContextBanner({ activeSankalpa, nextObservance }: {
  activeSankalpa?: Props['activeSankalpa'];
  nextObservance?: Props['nextObservance'];
}) {
  if (!activeSankalpa && !nextObservance) return null;

  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const day = now.getDate();
  const month = now.toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="clay-card rounded-2xl p-4 mb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'var(--text-dim)' }}>
        Today · {weekday} {day} {month}
      </p>
      <div className="flex flex-wrap gap-2">
        {activeSankalpa && (
          <Link
            href="/my-progress"
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform active:scale-[0.98]"
            style={{
              background: 'rgba(197,160,89,0.12)',
              border: '1px solid rgba(197,160,89,0.3)',
              color: 'var(--brand-primary)',
            }}
          >
            🔥 Day {activeSankalpa.streakDays} of {activeSankalpa.targetDays} · {activeSankalpa.name}
          </Link>
        )}
        {nextObservance && (
          <Link
            href={`/${nextObservance.routeKind}/${nextObservance.slug}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform active:scale-[0.98]"
            style={{
              background: nextObservance.daysAway === 0 ? 'rgba(197,160,89,0.12)' : 'var(--surface-soft)',
              border: '1px solid ' + (nextObservance.daysAway === 0 ? 'rgba(197,160,89,0.3)' : 'var(--card-border)'),
              color: nextObservance.daysAway === 0 ? 'var(--brand-primary)' : 'var(--text-muted-warm)',
            }}
          >
            {nextObservance.emoji} {nextObservance.name} · {nextObservance.daysAway === 0 ? 'Today' : nextObservance.daysAway === 1 ? 'Tomorrow' : `In ${nextObservance.daysAway} days`}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function DiscoverClient({ tradition, transliterationLanguage, todayVeer, activeSankalpa, nextObservance }: Props) {
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
    setContext({ need: null, time: null, type: null });
  }

  function reset() {
    setSelectedMood(null);
    setStack([]);
    setActiveIndex(0);
  }

  function trackInteraction(action: 'skip' | 'click', itemType: string) {
    if (!activeCheckinId) return;

    fetch('/api/mood/discover-track', {
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
        <div className="px-4 pt-4 h-full overflow-y-auto pb-32">
          {/* ── Today's Context ── */}
          {(!selectedMood) && <TodayContextBanner activeSankalpa={activeSankalpa} nextObservance={nextObservance} />}

          {/* ── Today's Dharm Veer ── */}
          {todayVeer && !selectedMood && <DailyVeerBanner veer={todayVeer} />}

          {/* ── Suggested chips ── */}
          {!selectedMood && <SuggestedChips tradition={tradition} nextObservance={nextObservance} />}

          {/* ── Featured grid ── */}
          {!selectedMood && (
            <FeaturedGrid tradition={tradition} />
          )}

          {/* ── Mood selection section ── */}
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-3 mt-2" style={{ color: 'var(--text-dim)' }}>
            How are you feeling?
          </p>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {MOODS.map(mood => (
              <button
                key={mood.key}
                onClick={() => handleSelectMood(mood.key)}
                className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-full border transition-all active:scale-95"
                style={{
                  background: selectedMood === mood.key ? `${mood.colour}18` : 'rgba(128,128,128,0.06)',
                  borderColor: selectedMood === mood.key ? `${mood.colour}50` : 'rgba(128,128,128,0.12)',
                  color: selectedMood === mood.key ? mood.colour : 'var(--text-muted-warm)',
                }}>
                <MoodGlyph mood={mood.key} color={mood.colour} size={16} />
                <span className="text-[12px] font-semibold whitespace-nowrap">{mood.label}</span>
              </button>
            ))}
          </div>

          {/* ── Inline Recommendations ── */}
          <AnimatePresence>
            {selectedMood && stack.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {stack.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    accentColour={accent}
                    onClickAction={() => trackInteraction('click', rec.type)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
