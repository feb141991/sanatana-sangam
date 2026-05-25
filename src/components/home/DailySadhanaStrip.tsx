'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

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
  japaDone: false,
  japaBeads: 0,
  japaRounds: 0,
  nityaDone: false,
  quizDone: false,
  dharmVeerDone: false,
  pathshalaDone: false,
  pathshalaProgress: 0,
};

function formatToday() {
  return new Date().toISOString().split('T')[0];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function derivePathshalaProgress(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0;
  if (Array.isArray(raw)) {
    return raw.reduce((max, item) => Math.max(max, derivePathshalaProgress(item)), 0);
  }
  const record = raw as Record<string, unknown>;
  const numericKeys = ['progress', 'percentage', 'percent', 'completion', 'completionRate'];
  let max = 0;
  for (const key of numericKeys) {
    const value = record[key];
    if (typeof value === 'number') max = Math.max(max, clampPercent(value <= 1 ? value * 100 : value));
  }
  for (const value of Object.values(record)) {
    max = Math.max(max, derivePathshalaProgress(value));
  }
  return max;
}

function readLocalState(): LocalState {
  if (typeof window === 'undefined') return EMPTY_LOCAL_STATE;
  try {
    const todayStr = formatToday();
    const next = { ...EMPTY_LOCAL_STATE };

    const japaRaw = localStorage.getItem('shoonaya-japa-session-today');
    if (japaRaw) {
      const parsed = JSON.parse(japaRaw) as { beads?: number; rounds?: number; date?: string };
      if (parsed.date === todayStr) {
        next.japaBeads = parsed.beads ?? 0;
        next.japaRounds = parsed.rounds ?? 0;
        next.japaDone = (parsed.rounds ?? 0) >= 1;
      }
    }

    next.nityaDone = localStorage.getItem(`shoonaya-nitya-done-${todayStr}`) === 'true';

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('shoonaya-quiz-daily-answered-') && key.endsWith(todayStr)) {
        const value = localStorage.getItem(key);
        if (value === 'true' || value === '0' || value === '1' || value === '2' || value === '3') {
          next.quizDone = true;
          break;
        }
      }
    }

    next.dharmVeerDone = localStorage.getItem(`shoonaya-dharmveer-done-${todayStr}`) === 'true';

    const pathshalaRaw = localStorage.getItem('shoonaya-pathshala-progress');
    if (pathshalaRaw) {
      next.pathshalaProgress = derivePathshalaProgress(JSON.parse(pathshalaRaw));
    }

    next.pathshalaDone = localStorage.getItem(`shoonaya-pathshala-done-${todayStr}`) === 'true';

    return next;
  } catch {
    return EMPTY_LOCAL_STATE;
  }
}

function StatusDot({ done, accentColor }: { done: boolean; accentColor: string }) {
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300"
      style={{
        background: done ? `${accentColor}22` : 'transparent',
        border: `1.5px solid ${done ? accentColor + '88' : 'rgba(197,160,89,0.40)'}`,
      }}
    >
      {done && <Check size={11} strokeWidth={2.8} style={{ color: accentColor }} />}
    </div>
  );
}

function JapaArc({ beads, done, accentColor }: { beads: number; done: boolean; accentColor: string }) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(108, beads % 109 || (done ? 108 : 0)));
  const dash = (progress / 108) * circumference;
  return (
    <div className="relative flex items-center justify-center h-7 w-7">
      <svg viewBox="0 0 32 32" className="h-7 w-7 absolute inset-0" aria-hidden="true">
        <circle cx="16" cy="16" r={radius} fill="none" stroke="rgba(197,160,89,0.14)" strokeWidth="2.5" />
        <circle
          cx="16" cy="16" r={radius} fill="none"
          stroke={accentColor} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 16 16)"
          style={{ opacity: done ? 1 : 0.85, transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      {done && (
        <Check
          size={11}
          strokeWidth={2.8}
          style={{ color: accentColor }}
          className="relative z-10"
        />
      )}
    </div>
  );
}

export default function DailySadhanaStrip(props: DailySadhanaStripProps) {
  const dharmVeerHref = props.dharmVeerId ? `/dharm-veer/${props.dharmVeerId}` : '/dharm-veer';
  const [localState, setLocalState] = useState<LocalState>(EMPTY_LOCAL_STATE);
  const [activeIdx, setActiveIdx] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragX = useMotionValue(0);

  const refresh = useCallback(() => setLocalState(readLocalState()), []);

  // Read on mount + re-read on storage changes + on tab focus
  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.startsWith('shoonaya-japa') ||
        e.key.startsWith('shoonaya-quiz') ||
        e.key.startsWith('shoonaya-dharmveer') ||
        e.key.startsWith('shoonaya-pathshala')
      ) refresh();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const tradition = props.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const accentColor = `var(--relic-accent, ${meta.accentColour})`;

  // Server props win for japa/nitya/pathshala (DB-authoritative),
  // but if localStorage says done (just completed this session), honour that too.
  const japaDone   = props.japaDone || localState.japaDone;
  const nityaDone  = props.nityaDone || localState.nityaDone;
  const pathshalaDone = props.pathshalaDone || localState.pathshalaDone;
  const japaBeads  = props.japaBeads ?? localState.japaBeads;
  const japaRounds = props.japaRounds ?? localState.japaRounds;
  const quizDone   = Boolean(props.quizDone) || localState.quizDone;
  const dharmVeerDone = Boolean(props.dharmVeerDone) || localState.dharmVeerDone;
  const pathshalaProgress = clampPercent(props.pathshalaProgress ?? localState.pathshalaProgress);

  const rows = useMemo(() => [
    {
      id: 'japa',
      icon: '📿',
      label: 'Japa Mala',
      sublabel: japaBeads > 0 ? `${japaRounds} round${japaRounds !== 1 ? 's' : ''} · ${japaBeads} beads` : 'Recite the divine name',
      done: japaDone,
      href: '/bhakti/mala',
      right: <JapaArc beads={japaBeads} done={japaDone} accentColor={accentColor} />,
    },
    {
      id: 'nitya',
      icon: '🌅',
      label: 'Nitya Seva',
      sublabel: nityaDone ? 'Morning routine done' : 'Morning practice',
      done: nityaDone,
      href: '/nitya-karma',
      right: <StatusDot done={nityaDone} accentColor={accentColor} />,
    },
    {
      id: 'pathshala',
      icon: '📖',
      label: 'Pathshala',
      sublabel: pathshalaProgress > 0 ? `${pathshalaProgress}% read today` : 'Study scripture',
      done: pathshalaDone,
      href: '/pathshala',
      right: pathshalaDone
        ? <StatusDot done={true} accentColor={accentColor} />
        : (
            <div className="w-[52px]">
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(197,160,89,0.14)' }}>
                <div className="h-[3px] rounded-full transition-all duration-500"
                  style={{ width: `${pathshalaProgress}%`, background: accentColor }} />
              </div>
            </div>
          ),
    },
    {
      id: 'quiz',
      icon: '🧠',
      label: 'Daily Quiz',
      sublabel: quizDone ? 'All answered today' : 'Test your knowledge',
      done: quizDone,
      href: '/quiz',
      right: <StatusDot done={quizDone} accentColor={accentColor} />,
    },
    {
      id: 'dharmveer',
      icon: '⚔️',
      label: 'Dharm Veer',
      sublabel: dharmVeerDone ? 'Challenge complete' : "Today's challenge",
      done: dharmVeerDone,
      href: dharmVeerHref,
      right: <StatusDot done={dharmVeerDone} accentColor={accentColor} />,
    },
  ], [accentColor, dharmVeerHref, dharmVeerDone, japaBeads, japaRounds, japaDone, nityaDone, pathshalaDone, pathshalaProgress, quizDone]);

  const completedCount = rows.filter((r) => r.done).length;

  // ── Auto-advance carousel every 3s, pause on interaction ─────────────────
  const resetTimer = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % rows.length);
    }, 3000);
  }, [rows.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [resetTimer]);

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    resetTimer();
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -30) goTo((activeIdx + 1) % rows.length);
    else if (info.offset.x > 30) goTo((activeIdx - 1 + rows.length) % rows.length);
    dragX.set(0);
  };

  const activeRow = rows[activeIdx];

  return (
    <div className="px-5 relative z-20 mb-5" aria-label={`${completedCount} of 5 sadhanas complete today`}>

      {/* ── Slim pagination lines ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-3">
        {rows.map((row, i) => (
          <button
            key={row.id}
            type="button"
            aria-label={`Go to ${row.label}`}
            onClick={() => goTo(i)}
            className="flex-1 h-[3px] rounded-full overflow-hidden focus:outline-none"
            style={{ background: 'rgba(197,160,89,0.13)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: row.done ? accentColor : i === activeIdx ? `${accentColor}55` : 'transparent' }}
              initial={{ width: '0%' }}
              animate={{ width: row.done ? '100%' : i === activeIdx ? '100%' : '0%' }}
              transition={{ duration: 0.55, delay: row.done ? i * 0.07 : 0, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
        ))}
        <span className="shrink-0 text-[10px] font-bold tabular-nums ml-1" style={{ color: accentColor, opacity: 0.72 }}>
          {completedCount}/5
        </span>
      </div>

      {/* ── Single carousel card ──────────────────────────────────────────────── */}
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
          >
            <Link
              href={activeRow.href}
              className="flex h-[52px] items-center justify-between transition-opacity active:opacity-70"
              draggable={false}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-[20px] shrink-0">{activeRow.icon}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
                    {activeRow.label}
                    {activeRow.done && (
                      <span className="ml-1.5 text-[10px] font-bold" style={{ color: accentColor, opacity: 0.8 }}>✓</span>
                    )}
                  </div>
                  <div className="truncate text-[11px] leading-tight mt-[1px]" style={{ color: 'var(--brand-muted)' }}>
                    {activeRow.sublabel}
                  </div>
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2 shrink-0">
                {activeRow.right}
                <ChevronRight size={14} style={{ color: 'rgba(197,160,89,0.4)' }} />
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
