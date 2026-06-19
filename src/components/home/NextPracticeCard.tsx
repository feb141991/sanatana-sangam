'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { localSpiritualDate } from '@/lib/sacred-time';

/**
 * NextPracticeCard — the one stable "next step" on Home.
 *
 * Replaces the previous auto-rotating practice carousel: shows the first
 * incomplete daily practice as a single large Link, a calm completion
 * state when all five are done, and a "View all practices" expander.
 * No auto-advance, no drag, no tiny pagination targets.
 */

interface NextPracticeCardProps {
  japaDone: boolean;
  nityaDone: boolean;
  pathshalaDone: boolean;
  japaBeads?: number;
  japaRounds?: number;
  quizDone?: boolean;
  dharmVeerDone?: boolean;
  dharmVeerId?: string;
  pathshalaProgress?: number;
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

// Per-practice accent palette — carried over from the previous strip; these
// practice colours have no global tokens (same language as mood pills).
const ITEM_PALETTE: Record<string, { colour: string; bg: string }> = {
  japa:      { colour: '#F59E4A', bg: 'rgba(245,158,74,0.12)'  },
  nitya:     { colour: '#C5A059', bg: 'rgba(197,160,89,0.10)'  },
  pathshala: { colour: '#6BC47E', bg: 'rgba(107,196,126,0.12)' },
  quiz:      { colour: '#A594E0', bg: 'rgba(165,148,224,0.12)' },
  dharmveer: { colour: '#FF8A65', bg: 'rgba(255,138,101,0.12)' },
};

function formatToday() {
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  return localSpiritualDate(tz, 4);
}
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

// ── Progress ring — hollow → arc → solid filled ──────────────────────────────
function Ring({ done, progress = 0, colour }: { done: boolean; progress?: number; colour: string }) {
  const radius = 9;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.max(0, Math.min(1, progress));
  const dash   = pct * circ;

  if (done) {
    return (
      <div
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: colour, boxShadow: `0 0 8px ${colour}55` }}
      >
        <Check size={13} strokeWidth={3} style={{ color: 'var(--surface-base)' }} />
      </div>
    );
  }

  if (pct > 0) {
    return (
      <div className="relative flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-7 w-7 absolute inset-0">
          <circle cx="12" cy="12" r={radius} fill="none" stroke={`${colour}22`} strokeWidth="2" />
          <circle
            cx="12" cy="12" r={radius} fill="none"
            stroke={colour} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            transform="rotate(-90 12 12)"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ border: `1.5px solid ${colour}40` }}
    />
  );
}

export default function NextPracticeCard(props: NextPracticeCardProps) {
  const reduceMotion = useReducedMotion();
  const dharmVeerHref = props.dharmVeerId ? `/dharm-veer/${props.dharmVeerId}` : '/dharm-veer';
  const [localState, setLocalState] = useState<LocalState>(EMPTY_LOCAL_STATE);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => setLocalState(readLocalState()), []);

  // Live updates: completing a practice elsewhere (other tab, or returning
  // to this one) refreshes the card without a reload.
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

  const japaDone          = props.japaDone || localState.japaDone;
  const nityaDone         = props.nityaDone || localState.nityaDone;
  const pathshalaDone     = props.pathshalaDone || localState.pathshalaDone;
  const japaBeads         = props.japaBeads ?? localState.japaBeads;
  const japaRounds        = props.japaRounds ?? localState.japaRounds;
  const quizDone          = Boolean(props.quizDone) || localState.quizDone;
  const dharmVeerDone     = Boolean(props.dharmVeerDone) || localState.dharmVeerDone;
  const pathshalaProgress = clampPercent(props.pathshalaProgress ?? localState.pathshalaProgress);

  // Priority order: japa → nitya → pathshala → quiz → dharm veer
  const rows = useMemo(() => [
    {
      id: 'japa', icon: '📿', label: 'Japa Mala',
      actionHeadline: japaBeads > 0 ? 'Continue with Japa' : 'Begin Japa',
      actionCta: japaBeads > 0 ? 'Resume Japa' : 'Start Japa',
      context: japaBeads > 0 ? `${japaRounds} round${japaRounds !== 1 ? 's' : ''} done` : undefined,
      done: japaDone, href: '/japa',
      progress: japaDone ? 1 : Math.min(1, (japaBeads % 109) / 108),
      ...ITEM_PALETTE.japa,
    },
    {
      id: 'nitya', icon: '🌅', label: 'Nitya Seva',
      actionHeadline: 'Begin Nitya Karma',
      actionCta: 'Open Nitya Karma',
      context: undefined,
      done: nityaDone, href: '/nitya-karma', progress: 0,
      ...ITEM_PALETTE.nitya,
    },
    {
      id: 'pathshala', icon: '📖', label: 'Pathshala',
      actionHeadline: 'Study Pathshala',
      actionCta: 'Study Now',
      context: pathshalaProgress > 0 ? `Pathshala ${pathshalaProgress}%` : undefined,
      done: pathshalaDone, href: '/pathshala',
      progress: pathshalaDone ? 1 : pathshalaProgress / 100,
      ...ITEM_PALETTE.pathshala,
    },
    {
      id: 'quiz', icon: '🧠', label: 'Daily Quiz',
      actionHeadline: "Take today's quiz",
      actionCta: 'Answer Quiz',
      context: undefined,
      done: quizDone, href: '/quiz', progress: 0,
      ...ITEM_PALETTE.quiz,
    },
    {
      id: 'dharmveer', icon: '⚔️', label: 'Dharm Veer',
      actionHeadline: "Meet today's Dharm Veer",
      actionCta: 'Open Dharm Veer',
      context: undefined,
      done: dharmVeerDone, href: dharmVeerHref, progress: 0,
      ...ITEM_PALETTE.dharmveer,
    },
  ], [dharmVeerHref, dharmVeerDone, japaBeads, japaRounds, japaDone, nityaDone, pathshalaDone, pathshalaProgress, quizDone]);

  const nextPractice = rows.find((r) => !r.done) ?? null;
  const completedCount = rows.filter((r) => r.done).length;

  return (
    <section className="px-4 relative z-20 mb-2" aria-label="Daily sadhana">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-muted)' }}>
          Next Practice
        </p>
        <p className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--brand-muted)' }}>
          {completedCount} of 5 complete
        </p>
      </div>

      {/* Next practice — one stable card, or calm completion state */}
      {nextPractice ? (
        <Link
          href={nextPractice.href}
          aria-label={nextPractice.context ? `${nextPractice.actionHeadline} — ${nextPractice.context}` : nextPractice.actionHeadline}
          className="flex flex-col gap-2.5 rounded-2xl px-3.5 py-3 transition-opacity hover:bg-[var(--surface-soft)] active:opacity-80"
          style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: nextPractice.bg }}>
                <span className="text-[19px]" aria-hidden="true">{nextPractice.icon}</span>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--brand-ink)' }}>
                  {nextPractice.actionHeadline}
                </p>
                {nextPractice.context && (
                  <p className="truncate text-[12px] font-medium mt-1" style={{ color: 'var(--brand-muted)' }}>
                    {nextPractice.context}
                  </p>
                )}
              </div>
            </div>
            {/* Deprioritized progress ring */}
            {nextPractice.progress > 0 && (
              <div className="shrink-0 mt-1">
                <Ring done={false} progress={nextPractice.progress} colour={nextPractice.colour} />
              </div>
            )}
          </div>
          
          <div className="mt-1.5 flex items-center">
            <div
              className="flex items-center justify-center w-full gap-1.5 px-4 rounded-xl font-bold text-[13.5px] min-h-[40px]"
              style={{ background: 'var(--brand-primary)', color: 'white' }}
            >
              {nextPractice.actionCta}
            </div>
          </div>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-controls="next-practice-all"
          className="flex flex-col gap-2.5 rounded-2xl px-3.5 py-3 transition-opacity hover:bg-[var(--surface-soft)] active:opacity-80 w-full text-left"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: 'var(--brand-primary-soft)' }}>
              <Check size={18} strokeWidth={3} aria-hidden="true" style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--brand-ink)' }}>
                Daily practice complete
              </p>
              <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--brand-muted)' }}>
                A full day of sadhana. Rest well 🙏
              </p>
            </div>
          </div>
          <div className="mt-1.5 flex items-center">
            <div
              className="flex items-center justify-center w-full gap-1.5 px-4 rounded-xl font-bold text-[13.5px] min-h-[40px]"
              style={{ background: 'var(--brand-primary)', color: 'white' }}
            >
              View all practices
            </div>
          </div>
        </button>
      )}

      {/* Expander — real button, visible affordance */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="next-practice-all"
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 min-h-[44px] text-[13px] font-medium transition-colors hover:bg-[var(--surface-soft)]"
        style={{ color: 'var(--brand-muted)', border: '1px solid var(--card-border-soft)' }}
      >
        {expanded ? 'Hide practices' : 'View all practices'}
        <ChevronDown
          size={15}
          aria-hidden="true"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: reduceMotion ? 'none' : 'transform 200ms ease' }}
        />
      </button>

      {/* All five practices — each row is a real Link */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="next-practice-all"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <ul className="space-y-1.5 pt-2">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 min-h-[44px] transition-colors hover:bg-[var(--surface-soft)]"
                    style={{ border: '1px solid var(--card-border-soft)', background: 'var(--card-bg)' }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-[18px] shrink-0" aria-hidden="true">{row.icon}</span>
                      <span className="text-[13px] font-medium truncate" style={{ color: 'var(--brand-ink)' }}>
                        {row.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-medium" style={{ color: row.done ? row.colour : 'var(--brand-muted)' }}>
                        {row.done ? 'Done' : row.progress > 0 ? `${Math.round(row.progress * 100)}%` : 'Start'}
                      </span>
                      <Ring done={row.done} progress={row.progress} colour={row.colour} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
