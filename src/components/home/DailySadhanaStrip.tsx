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

function formatDateLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTraditionSymbol(tradition?: string) {
  if (tradition === 'sikh') return 'ੴ';
  if (tradition === 'buddhist') return '☸';
  if (tradition === 'jain') return '☮';
  return 'ॐ';
}

function getStatusCircle(done: boolean, accentColor: string) {
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full border"
      style={{
        borderColor: done ? `${accentColor}66` : 'var(--card-border)',
        background: done ? `${accentColor}22` : 'transparent',
        color: done ? accentColor : 'var(--brand-muted)',
      }}
    >
      {done ? <Check size={14} strokeWidth={2.6} /> : <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--card-border)' }} />}
    </div>
  );
}

function Petal({
  index,
  filled,
  accentColor,
}: {
  index: number;
  filled: boolean;
  accentColor: string;
}) {
  const angle = index * 72;
  const path = 'M 60 18 Q 82 42 60 72 Q 38 42 60 18 Z';
  return (
    <path
      d={path}
      transform={`rotate(${angle} 60 60)`}
      fill={filled ? accentColor : 'transparent'}
      fillOpacity={filled ? 0.85 : 0}
      stroke={filled ? accentColor : 'var(--card-border)'}
      strokeOpacity={filled ? 0.85 : 0.5}
      strokeWidth={1.5}
      filter={filled ? 'url(#mandala-glow)' : undefined}
      style={{ transition: 'fill-opacity 0.6s ease, stroke-opacity 0.6s ease' }}
    />
  );
}

function MandalaProgress({
  completedCount,
  accentColor,
  tradition,
}: {
  completedCount: number;
  accentColor: string;
  tradition?: string;
}) {
  const symbol = getTraditionSymbol(tradition);
  return (
    <svg viewBox="0 0 120 120" className="h-[120px] w-[120px]" aria-hidden="true">
      <defs>
        <filter id="mandala-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={accentColor} floodOpacity="0.28" />
        </filter>
      </defs>
      {Array.from({ length: 5 }, (_, index) => (
        <Petal key={index} index={index} filled={index < completedCount} accentColor={accentColor} />
      ))}
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fontSize="14"
        fill={accentColor}
        fontFamily="var(--font-devanagari), var(--font-serif), system-ui"
      >
        {symbol}
      </text>
    </svg>
  );
}

function HavanFire({
  completedCount,
}: {
  completedCount: number;
}) {
  const flameHeight = [0, 30, 50, 70, 78, 86][completedCount] ?? 86;
  const showInner = completedCount >= 4;
  const showOuterGlow = completedCount >= 5;
  const baseY = 94;
  const topY = baseY - flameHeight;
  const flamePath = `M 48 ${baseY} C 28 ${baseY - 10}, 26 ${topY + 20}, 46 ${topY} C 44 ${topY + 18}, 70 ${topY + 24}, 64 ${baseY} Z`;
  const innerPath = `M 50 ${baseY} C 40 ${baseY - 10}, 40 ${topY + 30}, 50 ${topY + 14} C 54 ${topY + 26}, 64 ${topY + 30}, 58 ${baseY} Z`;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 96 120" className="h-[110px] w-[92px]" aria-hidden="true">
        <defs>
          <linearGradient id="havan-flame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
        </defs>
        {completedCount === 0 ? (
          <circle cx="48" cy="92" r="6" fill="#FF6B00" opacity="0.82" />
        ) : (
          <>
            <path
              d={flamePath}
              fill="url(#havan-flame)"
              style={{
                transformOrigin: '48px 94px',
                animation: 'flicker 1.8s ease-in-out infinite',
                filter: showOuterGlow ? 'drop-shadow(0 0 8px #FFB80066)' : undefined,
              }}
            />
            {showInner && (
              <path
                d={innerPath}
                fill="#FFD975"
                opacity="0.82"
                style={{ transformOrigin: '48px 94px', animation: 'flicker 1.55s ease-in-out infinite' }}
              />
            )}
          </>
        )}
      </svg>
      <span className="text-[11px]" style={{ color: 'var(--brand-muted)' }}>
        {completedCount}/5
      </span>
    </div>
  );
}

function JapaProgressArc({
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
  const ticks = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <circle cx="16" cy="16" r={radius} fill="none" stroke="var(--card-border)" strokeWidth="2.5" />
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
      {ticks.map((tick) => {
        const angle = tick * Math.PI * 2 - Math.PI / 2;
        const x1 = 16 + Math.cos(angle) * 12;
        const y1 = 16 + Math.sin(angle) * 12;
        const x2 = 16 + Math.cos(angle) * 14;
        const y2 = 16 + Math.sin(angle) * 14;
        return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeOpacity="0.45" strokeWidth="1.2" />;
      })}
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
  const dateLabel = formatDateLabel();

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
      sublabel: `${japaBeads} beads · ${japaRounds} rounds today`,
      done: props.japaDone,
      href: '/bhakti/mala',
      right: <JapaProgressArc beads={japaBeads} done={props.japaDone} accentColor={accentColor} />,
    },
    {
      id: 'nitya',
      icon: '🌅',
      label: 'Nitya Seva',
      sublabel: props.nityaDone ? 'Morning routine done' : 'Morning practice',
      done: props.nityaDone,
      href: '/nitya-karma',
      right: getStatusCircle(props.nityaDone, accentColor),
    },
    {
      id: 'pathshala',
      icon: '📖',
      label: 'Pathshala',
      sublabel: pathshalaProgress > 0 ? `${pathshalaProgress}% read` : 'Study scripture',
      done: props.pathshalaDone,
      href: '/pathshala',
      right: (
        <div className="w-[60px]">
          <div className="h-1 rounded-full" style={{ background: 'var(--card-border)' }}>
            <div
              className="h-1 rounded-full"
              style={{ width: `${pathshalaProgress}%`, background: accentColor, transition: 'width 0.4s ease' }}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'quiz',
      icon: '🧠',
      label: 'Quiz',
      sublabel: quizDone ? 'All answered' : 'Test your knowledge',
      done: quizDone,
      href: '/quiz',
      right: getStatusCircle(quizDone, accentColor),
    },
    {
      id: 'dharmveer',
      icon: '⚔️',
      label: 'Dharm Veer',
      sublabel: dharmVeerDone ? 'Challenge complete' : "Today's challenge",
      done: dharmVeerDone,
      href: '/discover',
      right: getStatusCircle(dharmVeerDone, accentColor),
    },
  ], [accentColor, dharmVeerDone, japaBeads, japaRounds, pathshalaProgress, props.japaDone, props.nityaDone, props.pathshalaDone, quizDone]);

  const completedCount = rows.filter((row) => row.done).length;
  const allDone = completedCount === 5;
  const shouldCollapse = allDone && !isExpanded;

  return (
    <div className="px-5 relative z-20 mb-6">
      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.92) skewX(3deg); }
        }
      `}</style>

      <div
        className="mx-auto max-w-lg overflow-hidden rounded-[1.5rem] border"
        style={{
          background: 'var(--card-bg)',
          borderColor: allDone && !isExpanded ? '#D4AF3744' : 'var(--card-border)',
          color: 'var(--brand-ink)',
          boxShadow: '0 8px 24px rgba(10,8,5,0.06)',
        }}
      >
        <div
          className="flex h-9 items-center justify-between px-4 text-[11px]"
          style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--brand-muted)' }}
        >
          <div className="flex items-center gap-2">
            {props.tithi ? (
              <>
                <span style={{ color: accentColor }}>{getTraditionSymbol(tradition)}</span>
                <span>{props.tithi}</span>
              </>
            ) : (
              <span>{dateLabel}</span>
            )}
          </div>
          <span>{dateLabel}</span>
        </div>

        <div className="flex h-[140px] items-center px-4 py-3">
          <div className="flex w-[60%] items-center justify-center">
            <MandalaProgress completedCount={completedCount} accentColor={accentColor} tradition={tradition} />
          </div>
          <div className="flex w-[40%] items-center justify-center">
            <HavanFire completedCount={completedCount} />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {shouldCollapse ? (
            <motion.button
              key="collapsed"
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex h-11 w-full items-center justify-between px-4 text-left"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 44, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7">
                  <MandalaProgress completedCount={5} accentColor={accentColor} tradition={tradition} />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>Sadhana Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="text-sm font-semibold" style={{ color: accentColor }}>5/5</span>
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {rows.map((row, index) => (
                <Link
                  key={row.id}
                  href={row.href}
                  className="flex h-[52px] items-center justify-between px-4"
                  style={{ borderTop: index === 0 ? '1px solid var(--card-border)' : '1px solid var(--card-border)' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center text-[20px]">{row.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--brand-ink)' }}>{row.label}</div>
                      <div className="truncate text-[11px]" style={{ color: 'var(--brand-muted)' }}>{row.sublabel}</div>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">{row.right}</div>
                </Link>
              ))}
              {allDone && (
                <motion.button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="flex h-11 w-full items-center justify-center border-t text-[12px] font-semibold"
                  style={{ borderColor: 'var(--card-border)', color: accentColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Collapse complete state
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
