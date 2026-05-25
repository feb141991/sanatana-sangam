'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface DailySadhanaStripProps {
  japaDone: boolean;
  nityaDone: boolean;
  pathshalaDone: boolean;
  japaBeads?: number;
  japaRounds?: number;
  quizDone?: boolean;
  dharmVeerDone?: boolean;
  pathshalaProgress?: number;
  tithi?: string;
  tradition?: string;
}

type LocalState = {
  japaBeads: number;
  japaRounds: number;
  quizDone: boolean;
  dharmVeerDone: boolean;
  pathshalaProgress: number;
};

const EMPTY_LOCAL_STATE: LocalState = {
  japaBeads: 0,
  japaRounds: 0,
  quizDone: false,
  dharmVeerDone: false,
  pathshalaProgress: 0,
};

function formatToday() {
  return new Date().toISOString().split('T')[0];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function StatusDot({ done, accentColor }: { done: boolean; accentColor: string }) {
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300"
      style={{
        background: done ? `${accentColor}22` : 'transparent',
        border: `1.5px solid ${done ? accentColor + '88' : 'rgba(197,160,89,0.22)'}`,
      }}
    >
      {done && <Check size={11} strokeWidth={2.8} style={{ color: accentColor }} />}
    </div>
  );
}

function JapaArc({
  beads,
  done,
  accentColor,
}: {
  beads: number;
  done: boolean;
  accentColor: string;
}) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(108, beads));
  const dash = (progress / 108) * circumference;

  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
      <circle cx="16" cy="16" r={radius} fill="none" stroke="rgba(197,160,89,0.14)" strokeWidth="2.5" />
      <circle
        cx="16"
        cy="16"
        r={radius}
        fill="none"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 16 16)"
        style={{ opacity: done ? 1 : 0.85, transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  );
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
    const nextState = { ...EMPTY_LOCAL_STATE };

    const japaRaw = localStorage.getItem('shoonaya-japa-session-today');
    if (japaRaw) {
      const parsed = JSON.parse(japaRaw) as { beads?: number; rounds?: number; date?: string };
      if (parsed.date === todayStr) {
        nextState.japaBeads = parsed.beads ?? 0;
        nextState.japaRounds = parsed.rounds ?? 0;
      }
    }

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('shoonaya-quiz-daily-answered-') && key.endsWith(todayStr)) {
        const value = localStorage.getItem(key);
        if (value === 'true' || value === '0' || value === '1' || value === '2' || value === '3') {
          nextState.quizDone = true;
          break;
        }
      }
    }

    nextState.dharmVeerDone = localStorage.getItem(`shoonaya-dharmveer-done-${todayStr}`) === 'true';

    const pathshalaRaw = localStorage.getItem('shoonaya-pathshala-progress');
    if (pathshalaRaw) {
      nextState.pathshalaProgress = derivePathshalaProgress(JSON.parse(pathshalaRaw));
    }

    return nextState;
  } catch {
    return EMPTY_LOCAL_STATE;
  }
}

export default function DailySadhanaStrip(props: DailySadhanaStripProps) {
  const [localState, setLocalState] = useState<LocalState>(EMPTY_LOCAL_STATE);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setLocalState(readLocalState());
  }, []);

  const tradition = props.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const accentColor = meta.accentColour;

  const japaBeads = props.japaBeads ?? localState.japaBeads;
  const japaRounds = props.japaRounds ?? localState.japaRounds;
  const quizDone = props.quizDone ?? localState.quizDone;
  const dharmVeerDone = props.dharmVeerDone ?? localState.dharmVeerDone;
  const pathshalaProgress = clampPercent(props.pathshalaProgress ?? localState.pathshalaProgress);

  const rows = useMemo(() => [
    {
      id: 'japa',
      icon: '📿',
      label: 'Japa Mala',
      sublabel: japaBeads > 0 ? `${japaBeads} beads · ${japaRounds} rounds` : 'Recite the divine name',
      done: props.japaDone,
      href: '/bhakti/mala',
      right: <JapaArc beads={japaBeads} done={props.japaDone} accentColor={accentColor} />,
    },
    {
      id: 'nitya',
      icon: '🌅',
      label: 'Nitya Seva',
      sublabel: props.nityaDone ? 'Morning routine done' : 'Morning practice',
      done: props.nityaDone,
      href: '/nitya-karma',
      right: <StatusDot done={props.nityaDone} accentColor={accentColor} />,
    },
    {
      id: 'pathshala',
      icon: '📖',
      label: 'Pathshala',
      sublabel: pathshalaProgress > 0 ? `${pathshalaProgress}% read today` : 'Study scripture',
      done: props.pathshalaDone,
      href: '/pathshala',
      right: (
        <div className="w-[52px]">
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(197,160,89,0.14)' }}>
            <div
              className="h-[3px] rounded-full transition-all duration-500"
              style={{ width: `${pathshalaProgress}%`, background: accentColor }}
            />
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
      href: '/discover',
      right: <StatusDot done={dharmVeerDone} accentColor={accentColor} />,
    },
  ], [accentColor, dharmVeerDone, japaBeads, japaRounds, pathshalaProgress, props.japaDone, props.nityaDone, props.pathshalaDone, quizDone]);

  const completedCount = rows.filter((row) => row.done).length;
  const allDone = completedCount === 5;

  return (
    <div className="px-5 relative z-20 mb-5">

      {/* ── Slim pagination progress lines ──────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 mb-3"
        aria-label={`${completedCount} of 5 sadhanas complete today`}
      >
        {rows.map((row, i) => (
          <div
            key={row.id}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(197,160,89,0.13)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: row.done ? accentColor : 'transparent' }}
              initial={{ width: '0%' }}
              animate={{ width: row.done ? '100%' : '0%' }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        ))}
        <span
          className="shrink-0 text-[10px] font-bold tabular-nums ml-1"
          style={{ color: accentColor, opacity: 0.72 }}
        >
          {completedCount}/5
        </span>
      </div>

      {/* ── Activity rows — borderless, merged with page ─────────────────────── */}
      <AnimatePresence initial={false}>
        {(!allDone || isExpanded) ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {rows.map((row, index) => (
              <Link
                key={row.id}
                href={row.href}
                className="flex h-[46px] items-center justify-between transition-opacity active:opacity-70"
                style={{
                  borderTop: index > 0 ? '1px solid rgba(197,160,89,0.07)' : 'none',
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-[17px] shrink-0">{row.icon}</span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-semibold leading-tight"
                      style={{ color: 'var(--brand-ink)' }}
                    >
                      {row.label}
                    </div>
                    <div
                      className="truncate text-[11px] leading-tight mt-[1px]"
                      style={{ color: 'var(--brand-muted)' }}
                    >
                      {row.sublabel}
                    </div>
                  </div>
                </div>
                <div className="ml-3 shrink-0">{row.right}</div>
              </Link>
            ))}

            {allDone && (
              <motion.button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="flex h-9 w-full items-center justify-center mt-2 text-[11px] font-semibold rounded-2xl"
                style={{ color: accentColor, background: `${accentColor}0e` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                Collapse ↑
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex h-10 w-full items-center justify-center text-[12px] font-semibold rounded-2xl"
            style={{ color: accentColor, background: `${accentColor}0e` }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            🔥 Sadhana complete — tap to expand
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
