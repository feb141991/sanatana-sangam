'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import { useRouter } from 'next/navigation';

interface DailySadhanaStripProps {
  japaDone: boolean;
  nityaDone: boolean;
  pathshalaDone: boolean;
  japaBeads?: number;
  japaRounds?: number;
  quizDone?: boolean;
  dharmVeerDone?: boolean;
  dharmVeerId?: string;
  pathshalaProgress?: number;
  tithi?: string;
  tradition?: string;
  isDark?: boolean;
}

type LocalState = {
  japaDone: boolean;
  japaBeads: number;
  japaRounds: number;
  nityaDone: boolean;
  quizDone: boolean;
  dharmVeerDone: boolean;
  pathshalaDone: boolean;
  pathshalaProgress: number;
};

const EMPTY_LOCAL_STATE: LocalState = {
  japaDone: false, japaBeads: 0, japaRounds: 0,
  nityaDone: false, quizDone: false, dharmVeerDone: false,
  pathshalaDone: false, pathshalaProgress: 0,
};

// Per-sadhana colour palette — same language as mood pills
const ITEM_PALETTE: Record<string, { colour: string; bg: string }> = {
  japa:      { colour: '#F59E4A', bg: 'rgba(245,158,74,0.12)'  },
  nitya:     { colour: '#C5A059', bg: 'rgba(197,160,89,0.10)'  },
  pathshala: { colour: '#6BC47E', bg: 'rgba(107,196,126,0.12)' },
  quiz:      { colour: '#A594E0', bg: 'rgba(165,148,224,0.12)' },
  dharmveer: { colour: '#FF8A65', bg: 'rgba(255,138,101,0.12)' },
};

function formatToday() { return new Date().toISOString().split('T')[0]; }
function clampPercent(v: number) { return Math.max(0, Math.min(100, Math.round(v))); }

function derivePathshalaProgress(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0;
  if (Array.isArray(raw)) return raw.reduce((m, i) => Math.max(m, derivePathshalaProgress(i)), 0);
  const rec = raw as Record<string, unknown>;
  let max = 0;
  for (const k of ['progress', 'percentage', 'percent', 'completion', 'completionRate']) {
    const v = rec[k];
    if (typeof v === 'number') max = Math.max(max, clampPercent(v <= 1 ? v * 100 : v));
  }
  for (const v of Object.values(rec)) max = Math.max(max, derivePathshalaProgress(v));
  return max;
}

function readLocalState(): LocalState {
  if (typeof window === 'undefined') return EMPTY_LOCAL_STATE;
  try {
    const today = formatToday();
    const next = { ...EMPTY_LOCAL_STATE };
    const japaRaw = localStorage.getItem('shoonaya-japa-session-today');
    if (japaRaw) {
      const p = JSON.parse(japaRaw) as { beads?: number; rounds?: number; date?: string };
      if (p.date === today) { next.japaBeads = p.beads ?? 0; next.japaRounds = p.rounds ?? 0; next.japaDone = (p.rounds ?? 0) >= 1; }
    }
    next.nityaDone = localStorage.getItem(`shoonaya-nitya-done-${today}`) === 'true';
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('shoonaya-quiz-daily-answered-') && key.endsWith(today)) {
        const val = localStorage.getItem(key);
        if (val === 'true' || val === '0' || val === '1' || val === '2' || val === '3') { next.quizDone = true; break; }
      }
    }
    next.dharmVeerDone = localStorage.getItem(`shoonaya-dharmveer-done-${today}`) === 'true';
    const pr = localStorage.getItem('shoonaya-pathshala-progress');
    if (pr) next.pathshalaProgress = derivePathshalaProgress(JSON.parse(pr));
    next.pathshalaDone = localStorage.getItem(`shoonaya-pathshala-done-${today}`) === 'true';
    return next;
  } catch { return EMPTY_LOCAL_STATE; }
}

// ── Unified ring — hollow → arc → solid filled ───────────────────────────────
function Ring({ done, progress = 0, colour }: { done: boolean; progress?: number; colour: string }) {
  const radius = 9;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.max(0, Math.min(1, progress));
  const dash   = pct * circ;

  if (done) {
    return (
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300"
        style={{ background: colour, boxShadow: `0 0 8px ${colour}55` }}
      >
        <Check size={13} strokeWidth={3} style={{ color: '#0e0d09' }} />
      </div>
    );
  }

  if (pct > 0) {
    return (
      <div className="relative flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7 absolute inset-0" aria-hidden="true">
          <circle cx="12" cy="12" r={radius} fill="none" stroke={`${colour}22`} strokeWidth="2" />
          <circle
            cx="12" cy="12" r={radius} fill="none"
            stroke={colour} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            transform="rotate(-90 12 12)"
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ border: `1.5px solid ${colour}40` }}
    />
  );
}

export default function DailySadhanaStrip(props: DailySadhanaStripProps) {
  const router = useRouter();
  const dharmVeerHref = props.dharmVeerId ? `/dharm-veer/${props.dharmVeerId}` : '/dharm-veer';
  const [localState, setLocalState] = useState<LocalState>(EMPTY_LOCAL_STATE);
  const [activeIdx, setActiveIdx] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragX = useMotionValue(0);

  const refresh = useCallback(() => setLocalState(readLocalState()), []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('shoonaya-japa') || e.key.startsWith('shoonaya-quiz') || e.key.startsWith('shoonaya-dharmveer') || e.key.startsWith('shoonaya-pathshala')) refresh();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.removeEventListener('storage', onStorage); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  const tradition = props.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const goldAccent = `var(--relic-accent, ${meta.accentColour})`;

  const japaDone          = props.japaDone || localState.japaDone;
  const nityaDone         = props.nityaDone || localState.nityaDone;
  const pathshalaDone     = props.pathshalaDone || localState.pathshalaDone;
  const japaBeads         = props.japaBeads ?? localState.japaBeads;
  const japaRounds        = props.japaRounds ?? localState.japaRounds;
  const quizDone          = Boolean(props.quizDone) || localState.quizDone;
  const dharmVeerDone     = Boolean(props.dharmVeerDone) || localState.dharmVeerDone;
  const pathshalaProgress = clampPercent(props.pathshalaProgress ?? localState.pathshalaProgress);

  const rows = useMemo(() => [
    {
      id: 'japa', icon: '📿', label: 'Japa Mala',
      sublabel: japaBeads > 0 ? `${japaRounds} round${japaRounds !== 1 ? 's' : ''} · ${japaBeads} beads` : 'Recite the divine name',
      done: japaDone, href: '/bhakti/mala',
      progress: japaDone ? 1 : Math.min(1, (japaBeads % 109) / 108),
      ...ITEM_PALETTE.japa,
    },
    {
      id: 'nitya', icon: '🌅', label: 'Nitya Seva',
      sublabel: nityaDone ? 'Morning routine done' : 'Morning practice',
      done: nityaDone, href: '/nitya-karma', progress: 0,
      ...ITEM_PALETTE.nitya,
    },
    {
      id: 'pathshala', icon: '📖', label: 'Pathshala',
      sublabel: pathshalaProgress > 0 ? `${pathshalaProgress}% read today` : 'Study scripture',
      done: pathshalaDone, href: '/pathshala',
      progress: pathshalaDone ? 1 : pathshalaProgress / 100,
      ...ITEM_PALETTE.pathshala,
    },
    {
      id: 'quiz', icon: '🧠', label: 'Daily Quiz',
      sublabel: quizDone ? 'All answered today' : 'Test your knowledge',
      done: quizDone, href: '/quiz', progress: 0,
      ...ITEM_PALETTE.quiz,
    },
    {
      id: 'dharmveer', icon: '⚔️', label: 'Dharm Veer',
      sublabel: dharmVeerDone ? 'Challenge complete' : "Today's challenge",
      done: dharmVeerDone, href: dharmVeerHref, progress: 0,
      ...ITEM_PALETTE.dharmveer,
    },
  ], [dharmVeerHref, dharmVeerDone, japaBeads, japaRounds, japaDone, nityaDone, pathshalaDone, pathshalaProgress, quizDone]);

  const completedCount = rows.filter(r => r.done).length;

  const resetTimer = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => setActiveIdx(i => (i + 1) % rows.length), 3000);
  }, [rows.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [resetTimer]);

  const goTo = (idx: number) => { setActiveIdx(idx); resetTimer(); };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -30) goTo((activeIdx + 1) % rows.length);
    else if (info.offset.x > 30) goTo((activeIdx - 1 + rows.length) % rows.length);
    dragX.set(0);
  };

  const activeRow = rows[activeIdx];

  return (
    <div className="px-4 relative z-20 mb-5" aria-label={`${completedCount} of 5 sadhanas complete today`}>
      {/* ── Slim pagination lines ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-2">
        {rows.map((row, i) => (
          <button
            key={row.id} type="button" aria-label={`Go to ${row.label}`}
            onClick={() => {
              if (i === activeIdx) router.push(row.href);
              else goTo(i);
            }}
            className="flex-1 h-[3px] rounded-full overflow-hidden focus:outline-none"
            style={{ background: 'rgba(197,160,89,0.13)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: row.done ? goldAccent : i === activeIdx ? `${goldAccent}55` : 'transparent' }}
              initial={{ width: '0%' }}
              animate={{ width: row.done ? '100%' : i === activeIdx ? '100%' : '0%' }}
              transition={{ duration: 0.55, delay: row.done ? i * 0.07 : 0, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
        ))}
        <span className="shrink-0 text-[10px] font-bold tabular-nums ml-1" style={{ color: goldAccent, opacity: 0.72 }}>
          {completedCount}/5
        </span>
      </div>

      {/* ── Carousel pill card ────────────────────────────────────────────── */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeRow.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
            onTap={() => router.push(activeRow.href)}
            className="cursor-pointer"
          >
            {/* Coloured pill — same borderless bg style as mood buttons */}
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3 transition-opacity active:opacity-70"
              style={{ background: activeRow.bg }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-[20px] shrink-0">{activeRow.icon}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
                    {activeRow.label}
                    {activeRow.done && (
                      <span className="ml-1.5 text-[10px] font-bold" style={{ color: activeRow.colour, opacity: 0.9 }}>✓</span>
                    )}
                  </div>
                  <div className="truncate text-[11px] leading-tight mt-[1px]" style={{ color: 'var(--brand-muted)' }}>
                    {activeRow.sublabel}
                  </div>
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2 shrink-0">
                <Ring done={activeRow.done} progress={activeRow.progress} colour={activeRow.colour} />
                <ChevronRight size={14} style={{ color: `${activeRow.colour}55` }} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
