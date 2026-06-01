'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import MoodGlyph from '@/components/ui/MoodGlyph';
import SacredIcon from '@/components/ui/SacredIcon';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { getFullRecommendationsForMood, MoodRecommendation, MoodContext } from '@/lib/mood/engine';
import { MOODS_CONFIG } from '@/lib/mood/registry';

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
    { label: 'Nitnem Bani',     href: '/bhakti/stotram?tradition=sikh' },
    { label: 'Ardas meaning',   href: '/pathshala?tradition=sikh' },
    { label: 'Gurdwara nearby', href: '/tirtha-map' },
  ],
  buddhist: [
    { label: 'Dhammapada verse', href: '/pathshala?tradition=buddhist' },
    { label: 'Meditation timer', href: '/bhakti/mala' },
    { label: 'Uposatha today?',  href: '/panchang' },
  ],
  jain: [
    { label: 'Navkar Mantra',    href: '/bhakti/mala' },
    { label: 'Paryushana info',  href: '/vrat/paryushana' },
    { label: 'Jain calendar',    href: '/panchang' },
  ],
};

const BASE_FEATURED: Array<{ emoji: string; title: string; desc: string; href: string }> = [
  { emoji: '📿', title: 'Daily Japa',  desc: 'Mala practice',     href: '/bhakti/mala' },
  { emoji: '📚', title: 'Pathshala',   desc: 'Sacred study',      href: '/pathshala' },
  { emoji: '📅', title: 'Panchang',    desc: 'Tithi & Nakshatra', href: '/panchang' },
  { emoji: '🏆', title: 'Leaderboard', desc: 'Sadhana ranks',     href: '/scoreboard' },
];

const TRADITION_FEATURED: Record<string, Array<{ emoji: string; title: string; desc: string; href: string }>> = {
  sikh:     [
    { emoji: '☬',  title: 'Gurbani',    desc: 'Daily scripture', href: '/pathshala?tradition=sikh' },
    { emoji: '🙏', title: 'Ardas',      desc: 'Daily prayer',    href: '/bhakti' },
    { emoji: '📿', title: 'Simran',     desc: 'Naam Japna',      href: '/bhakti/mala' },
    { emoji: '👥', title: 'Sangat',     desc: 'Community',       href: '/mandali' },
  ],
  buddhist: [
    { emoji: '☸️', title: 'Dhammapada', desc: 'Path of wisdom',  href: '/pathshala?tradition=buddhist' },
    { emoji: '🧘', title: 'Meditation', desc: 'Mindful practice', href: '/bhakti/mala' },
    { emoji: '📅', title: 'Uposatha',   desc: 'Lunar calendar',   href: '/panchang' },
    { emoji: '👥', title: 'Sangha',     desc: 'Community',        href: '/mandali' },
  ],
  jain: [
    { emoji: '🤲', title: 'Navkar',     desc: 'Supreme mantra',  href: '/bhakti/mala' },
    { emoji: '📚', title: 'Agama',      desc: 'Jain scriptures', href: '/pathshala?tradition=jain' },
    { emoji: '📅', title: 'Calendar',   desc: 'Jain observances',href: '/panchang' },
    { emoji: '👥', title: 'Sangha',     desc: 'Community',       href: '/mandali' },
  ],
};

const TIME_OPTIONS = [
  { key: 'short',  label: 'Just 5 minutes',       desc: 'A quick, focused practice',     emoji: '⚡' },
  { key: 'medium', label: 'About 15 minutes',      desc: 'A meaningful session',           emoji: '🕐' },
  { key: 'open',   label: 'I have all the time',   desc: 'Deep immersion today',           emoji: '∞' },
] as const;

interface Props {
  tradition: string | null;
  spiritualLevel: string | null;
  transliterationLanguage?: string;
  activeSankalpa?: { name: string; streakDays: number; targetDays: number } | null;
  nextObservance?: { name: string; emoji: string; daysAway: number; slug: string; routeKind: string } | null;
}

// ── Recommendation Card ───────────────────────────────────────────────────────
function RecommendationCard({
  rec,
  accentColour,
  onClickAction,
}: {
  rec: MoodRecommendation;
  accentColour: string;
  onClickAction: () => void;
}) {
  const TIME_ESTIMATE: Record<MoodRecommendation['type'], string> = {
    stotram: '3 min', katha: '5 min', dhyana: '10 min',
    discover: '5 min', japa: '8 min', pathshala: '5 min',
  };

  return (
    <div
      className="w-full rounded-[1.6rem] p-4 flex flex-col overflow-hidden relative"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-15 pointer-events-none rounded-full"
        style={{ background: accentColour, transform: 'translate(30%,-30%)' }} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: `${accentColour}15`, color: accentColour }}>
          {rec.type}
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-dim)' }}>
          {TIME_ESTIMATE[rec.type] ?? '5 min'}
        </span>
      </div>

      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
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
        <div className="rounded-2xl p-3 mb-3" style={{ background: 'var(--card-bg-soft)', border: '1px solid var(--card-border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColour }}>Why this fits</p>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{rec.explanation}</p>
        </div>
      )}

      <Link
        href={rec.href}
        onClick={onClickAction}
        className="w-full py-3 rounded-[1.2rem] text-center text-[13px] font-bold transition-transform active:scale-95 block"
        style={{ background: accentColour, color: 'var(--surface-base)' }}
      >
        {rec.actionLabel}
      </Link>
    </div>
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
          <Link href="/my-progress"
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform active:scale-[0.98]"
            style={{ background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.3)', color: 'var(--brand-primary)' }}>
            🔥 Day {activeSankalpa.streakDays} of {activeSankalpa.targetDays} · {activeSankalpa.name}
          </Link>
        )}
        {nextObservance && (
          <Link href={`/${nextObservance.routeKind}/${nextObservance.slug}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform active:scale-[0.98]"
            style={{
              background: nextObservance.daysAway === 0 ? 'rgba(197,160,89,0.12)' : 'var(--surface-soft)',
              border: '1px solid ' + (nextObservance.daysAway === 0 ? 'rgba(197,160,89,0.3)' : 'var(--card-border)'),
              color: nextObservance.daysAway === 0 ? 'var(--brand-primary)' : 'var(--text-muted-warm)',
            }}>
            {nextObservance.emoji} {nextObservance.name} · {nextObservance.daysAway === 0 ? 'Today' : nextObservance.daysAway === 1 ? 'Tomorrow' : `In ${nextObservance.daysAway} days`}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function DiscoverClient({ tradition, activeSankalpa, nextObservance }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useThemePreference();

  const MOODS = MOODS_CONFIG[resolvedTheme] || MOODS_CONFIG.dark;

  const initialMood = searchParams.get('mood');
  const initialCheckinId = searchParams.get('checkin_id');
  const initialTime = searchParams.get('time');

  // flow: 'mood' → 'time' → 'recs'
  type FlowStep = 'mood' | 'time' | 'recs';
  const [step, setStep] = useState<FlowStep>(() => {
    if (initialMood && initialTime) return 'recs';
    if (initialMood) return 'time';
    return 'mood';
  });

  const [selectedMood, setSelectedMood] = useState<string | null>(initialMood);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime);
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(initialCheckinId);
  const [context, setContext] = useState<MoodContext>({
    need: searchParams.get('need'),
    time: initialTime,
    type: searchParams.get('type'),
  });

  const [stack, setStack] = useState<MoodRecommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const activeMood = MOODS.find(m => m.key === selectedMood);
  const accent = activeMood?.colour ?? 'var(--brand-primary)';

  // Resume an open session on first load
  useEffect(() => {
    if (!initialMood && !initialCheckinId) {
      let cancelled = false;
      fetch('/api/mood/checkin')
        .then(r => r.json())
        .then(data => {
          if (!cancelled && data?.openSession) {
            setActiveCheckinId(data.openSession.id);
            setSelectedMood(data.openSession.before_mood);
            setStep('time');
          }
        })
        .catch(console.warn);
      return () => { cancelled = true; };
    }
  }, [initialMood, initialCheckinId]);

  // Fetch recommendations when step reaches 'recs'
  useEffect(() => {
    if (step !== 'recs' || !selectedMood) return;

    setRecsLoading(true);
    const qs = new URLSearchParams();
    qs.set('mood', selectedMood);
    qs.set('full', 'true');
    if (context.time) qs.set('time', context.time);
    if (context.need) qs.set('need', context.need);
    if (context.type) qs.set('type', context.type);
    if (activeCheckinId) qs.set('checkin_id', activeCheckinId);

    fetch(`/api/mood/recommendations?${qs.toString()}`)
      .then(r => r.json())
      .then(data => {
        setStack(data.recommendations ?? []);
      })
      .catch(console.error)
      .finally(() => setRecsLoading(false));
  }, [step, selectedMood, context, activeCheckinId]);

  async function handleSelectMood(moodKey: string) {
    if (!activeCheckinId) {
      try {
        const res = await fetch('/api/mood/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ before_mood: moodKey, source_surface: 'discover_page' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.checkin_id) setActiveCheckinId(data.checkin_id);
        }
      } catch (e) {
        console.warn('Failed to start checkin session', e);
      }
    }
    setSelectedMood(moodKey);
    setContext({ need: null, time: null, type: null });
    setSelectedTime(null);
    setStack([]);
    setStep('time');
  }

  function handleSelectTime(timeKey: string) {
    setSelectedTime(timeKey);
    setContext(prev => ({ ...prev, time: timeKey }));
    setStep('recs');
  }

  function resetToMood() {
    setStep('mood');
    setSelectedMood(null);
    setSelectedTime(null);
    setStack([]);
    setContext({ need: null, time: null, type: null });
  }

  function resetToTime() {
    setStep('time');
    setSelectedTime(null);
    setStack([]);
    setContext(prev => ({ ...prev, time: null }));
  }

  function trackInteraction(action: 'skip' | 'click', itemType: string) {
    if (!activeCheckinId) return;
    fetch('/api/mood/discover-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkinId: activeCheckinId, action, itemType }),
    }).catch(console.error);
  }

  const chips = [
    ...(nextObservance && nextObservance.daysAway <= 3 ? [{
      label: nextObservance.daysAway === 0
        ? `${nextObservance.emoji} It's ${nextObservance.name} today`
        : `${nextObservance.emoji} Prepare for ${nextObservance.name}`,
      href: `/${nextObservance.routeKind}/${nextObservance.slug}`,
    }] : []),
    ...(tradition && TRADITION_CHIPS[tradition] ? TRADITION_CHIPS[tradition] : []),
    ...BASE_CHIPS,
  ].slice(0, 7);

  const featuredItems = tradition && TRADITION_FEATURED[tradition]
    ? TRADITION_FEATURED[tradition]
    : BASE_FEATURED;

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: 'var(--divine-bg)' }}>

      {/* ── Fixed Header ── */}
      <div className="relative flex items-center justify-between px-4 pt-safe pt-4 pb-3 shrink-0 z-10"
        style={{ borderBottom: step !== 'mood' ? '1px solid var(--card-border)' : 'none' }}>

        <button
          onClick={() => step === 'mood' ? router.back() : resetToMood()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'var(--brand-primary-soft)', border: '1px solid var(--card-border)' }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--brand-primary)' }} />
        </button>

        <div className="flex-1 text-center px-3">
          {step === 'mood' && (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-cream)' }}>
              Discover
            </p>
          )}
          {step === 'time' && activeMood && (
            <div className="flex items-center justify-center gap-2">
              <MoodGlyph mood={activeMood.key} color={activeMood.colour} size={14} />
              <span className="text-sm font-semibold" style={{ color: activeMood.colour }}>{activeMood.label}</span>
            </div>
          )}
          {step === 'recs' && activeMood && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: `${activeMood.colour}18`, border: `1px solid ${activeMood.colour}35` }}>
                <MoodGlyph mood={activeMood.key} color={activeMood.colour} size={12} />
                <span className="text-[11px] font-semibold" style={{ color: activeMood.colour }}>{activeMood.label}</span>
              </div>
              {selectedTime && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted-warm)' }}>
                  {TIME_OPTIONS.find(t => t.key === selectedTime)?.emoji} {TIME_OPTIONS.find(t => t.key === selectedTime)?.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* X button — always exits the flow entirely */}
        {step !== 'mood' && (
          <button
            onClick={resetToMood}
            aria-label="Exit mood flow"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <X size={16} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        )}
        {step === 'mood' && <div className="w-9" />}
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pb-28">

          {/* ═══════════════════════════════════════════════════════════
              STEP: MOOD SELECTION
          ═══════════════════════════════════════════════════════════ */}
          {step === 'mood' && (
            <>
              {/* Prominent heading */}
              <div className="pt-5 pb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--text-dim)' }}>
                  Mood-based guidance
                </p>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-cream)', lineHeight: 1.2 }}>
                  How are you feeling?
                </h1>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-dim)' }}>
                  Pick what&apos;s closest to your state right now
                </p>
              </div>

              {/* 3-column mood grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-8">
                {MOODS.map(mood => (
                  <motion.button
                    key={mood.key}
                    onClick={() => handleSelectMood(mood.key)}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                    className="flex flex-col items-center gap-2 rounded-[1.2rem] px-2 py-4 border transition-colors"
                    style={{
                      background: mood.bg,
                      borderColor: `${mood.colour}30`,
                    }}
                  >
                    <MoodGlyph mood={mood.key} color={mood.colour} size={28} />
                    <span className="text-[12px] font-semibold text-center leading-tight" style={{ color: mood.colour }}>
                      {mood.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Below-fold content */}
              <TodayContextBanner activeSankalpa={activeSankalpa} nextObservance={nextObservance} />

              <div className="mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2.5" style={{ color: 'var(--text-dim)' }}>
                  Quick explore
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {chips.map(chip => (
                    <Link key={chip.label} href={chip.href}
                      className="shrink-0 px-3.5 py-2 rounded-full text-[11px] font-semibold border transition-all active:scale-95"
                      style={{ background: 'var(--brand-primary-soft)', borderColor: 'var(--card-border)', color: 'var(--brand-primary)', whiteSpace: 'nowrap' }}>
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-2.5" style={{ color: 'var(--text-dim)' }}>
                  Featured
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {featuredItems.map(item => (
                    <Link key={item.title} href={item.href}
                      className="flex flex-col rounded-[1.3rem] p-3.5 border relative overflow-hidden transition-transform active:scale-[0.97]"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', textDecoration: 'none' }}>
                      <span className="pointer-events-none absolute top-0 right-0 w-12 h-12 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, var(--brand-primary), transparent 70%)', transform: 'translate(30%,-30%)' }} />
                      <span className="drop-shadow-sm select-none mb-2" style={{ fontSize: '2rem', lineHeight: 1, display: 'block' }}>
                        {item.emoji}
                      </span>
                      <span className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text-cream)' }}>{item.title}</span>
                      <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP: TIME SELECTION
          ═══════════════════════════════════════════════════════════ */}
          {step === 'time' && activeMood && (
            <AnimatePresence mode="wait">
              <motion.div
                key="time-step"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Mood confirmation */}
                <div className="pt-6 pb-5 text-center">
                  <div className="w-16 h-16 rounded-[1.4rem] flex items-center justify-center mx-auto mb-4"
                    style={{ background: `${activeMood.colour}18`, border: `1px solid ${activeMood.colour}35` }}>
                    <MoodGlyph mood={activeMood.key} color={activeMood.colour} size={36} />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>You&apos;re feeling</p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: activeMood.colour }}>
                    {activeMood.label}
                  </p>
                </div>

                <div className="pt-2 pb-4 text-center">
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
                    How much time do you have?
                  </h2>
                  <p className="mt-1 text-[13px]" style={{ color: 'var(--text-dim)' }}>
                    We&apos;ll tailor the practice to fit your day
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  {TIME_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.key}
                      onClick={() => handleSelectTime(opt.key)}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                      className="w-full flex items-center gap-4 rounded-[1.4rem] px-5 py-4 border text-left transition-colors active:scale-[0.97]"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                    >
                      <span style={{ fontSize: '1.8rem', lineHeight: 1, minWidth: 36, textAlign: 'center' }}>
                        {opt.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px]" style={{ color: 'var(--text-cream)' }}>{opt.label}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{opt.desc}</p>
                      </div>
                      <ChevronLeft size={16} style={{ color: 'var(--text-dim)', transform: 'rotate(180deg)', flexShrink: 0 }} />
                    </motion.button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <Link
                    href="/"
                    className="w-full py-3 rounded-[1.2rem] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 no-underline"
                    style={{ background: 'var(--brand-primary-soft)', border: '1px solid rgba(197,160,89,0.3)', color: 'var(--brand-primary)' }}
                  >
                    ✓ Just set my mood — go home
                  </Link>
                  <button
                    onClick={resetToMood}
                    className="w-full py-3 rounded-[1.2rem] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-dim)' }}
                  >
                    <RotateCcw size={13} />
                    Change mood
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP: RECOMMENDATIONS
          ═══════════════════════════════════════════════════════════ */}
          {step === 'recs' && (
            <AnimatePresence mode="wait">
              <motion.div
                key="recs-step"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="pt-4 pb-5">
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-cream)' }}>
                    {activeMood ? `For when you feel ${activeMood.label.toLowerCase()}` : 'Your practice for now'}
                  </h2>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--text-dim)' }}>
                    Practices chosen for your state and available time
                  </p>
                </div>

                {recsLoading && (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-full h-44 rounded-[1.6rem] animate-pulse"
                        style={{ background: 'var(--card-bg)' }} />
                    ))}
                  </div>
                )}

                {!recsLoading && stack.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {stack.map(rec => (
                      <RecommendationCard
                        key={rec.id}
                        rec={rec}
                        accentColour={accent}
                        onClickAction={() => trackInteraction('click', rec.type)}
                      />
                    ))}
                  </div>
                )}

                {!recsLoading && stack.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[15px]" style={{ color: 'var(--text-dim)' }}>No recommendations found.</p>
                  </div>
                )}

                <div className="flex flex-col gap-2 mt-6">
                  <Link
                    href="/"
                    className="w-full py-3 rounded-[1.2rem] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 no-underline"
                    style={{ background: 'var(--brand-primary-soft)', border: '1px solid rgba(197,160,89,0.3)', color: 'var(--brand-primary)' }}
                  >
                    ✓ Done — go home
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={resetToTime}
                      className="flex-1 py-3 rounded-[1.2rem] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted-warm)' }}
                    >
                      <RotateCcw size={13} />
                      Change time
                    </button>
                    <button
                      onClick={resetToMood}
                      className="flex-1 py-3 rounded-[1.2rem] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted-warm)' }}
                    >
                      <X size={13} />
                      Change mood
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  );
}
