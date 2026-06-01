'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface Shield {
  threshold: number;
  name: string;
  emoji: string;
  description: string;
  next: string | null;
}

const STREAK_SHIELDS: readonly Shield[] = [
  {
    threshold: 7,
    name: 'Saptāha',
    emoji: '🔥',
    description: '7-day sadhana streak. A solid week of unbroken dedication.',
    next: 'Niyama at 21 days',
  },
  {
    threshold: 21,
    name: 'Niyama',
    emoji: '🕯️',
    description: '21-day sadhana streak. Your practice has formed a steady habit.',
    next: 'Chālisā at 40 days',
  },
  {
    threshold: 40,
    name: 'Chālisā',
    emoji: '🌟',
    description: '40-day sadhana streak. A complete cycle of deep transformation.',
    next: 'Ardha Mālā at 54 days',
  },
  {
    threshold: 54,
    name: 'Ardha Mālā',
    emoji: '📿',
    description: '54-day sadhana streak. Halfway to the full sacred mala circle.',
    next: 'Pūrṇa Mālā at 108 days',
  },
  {
    threshold: 108,
    name: 'Pūrṇa Mālā',
    emoji: '🙏',
    description: '108-day sadhana streak. You have completed the full sacred mala circle.',
    next: 'Varsha at 365 days',
  },
  {
    threshold: 365,
    name: 'Varsha',
    emoji: '☀️',
    description: '365-day sadhana streak. A full solar circle of daily devotion.',
    next: null,
  },
];

const SESSION_SHIELDS: readonly Shield[] = [
  {
    threshold: 7,
    name: 'Prārambha',
    emoji: '🌱',
    description: '7 japa sessions completed. The seed of practice has sprouted.',
    next: 'Abhyāsa at 21 sessions',
  },
  {
    threshold: 21,
    name: 'Abhyāsa',
    emoji: '⚡',
    description: '21 japa sessions completed. Steady momentum builds.',
    next: 'Tapas at 40 sessions',
  },
  {
    threshold: 40,
    name: 'Tapas',
    emoji: '🔆',
    description: '40 japa sessions completed. Your practice has become heat — a burning commitment.',
    next: 'Mālā at 108 sessions',
  },
  {
    threshold: 108,
    name: 'Mālā',
    emoji: '📿',
    description: 'One full mala of sessions — 108 completions. You have circled the sacred number.',
    next: 'Varshika at 365 sessions',
  },
  {
    threshold: 365,
    name: 'Varshika',
    emoji: '🌕',
    description: '365 japa sessions completed. A full year of sacred rounds.',
    next: 'Sahasra at 1000 sessions',
  },
  {
    threshold: 1000,
    name: 'Sahasra',
    emoji: '💎',
    description: '1000 japa sessions completed. A diamond-clarity summit of practice.',
    next: null,
  },
];

const ROUTE_MAP: Record<string, string> = {
  'Beads': '/bhakti/mala',
  'Day Streak 🔥': '/my-progress',
  'Rounds': '/bhakti/mala',
  'In Practice': '/my-progress',
  'Nitya Days': '/nitya-karma',
  'Saved Verses': '/pathshala',
};

interface Props {
  tradition: string;
  totalBeads: number;
  totalRounds: number;
  totalMinutes: number;
  totalSessions: number;
  streak: number;
  topMantra: string | null;
  nityaDays: number;
  pathshalaEntries: number;
  bookmarkedVerses: number;
  showHighlights: boolean;
  onToggleHighlights: () => void;
  isOwnProfile: boolean;
}

function getHighestEarnedShield<T extends { threshold: number }>(shields: readonly T[], value: number): T | null {
  let earned: T | null = null;
  for (const shield of shields) {
    if (value >= shield.threshold) earned = shield;
  }
  return earned;
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes > 60) return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  return `${totalMinutes}m`;
}

export default function SadhanaHighlightsCard({
  tradition,
  totalBeads,
  totalRounds,
  totalMinutes,
  totalSessions,
  streak,
  topMantra,
  nityaDays,
  pathshalaEntries,
  bookmarkedVerses,
  showHighlights,
  onToggleHighlights,
  isOwnProfile,
}: Props) {
  const [expandedShield, setExpandedShield] = useState<string | null>(null);

  if (!isOwnProfile && !showHighlights) return null;

  const accentColor = getTraditionMeta(tradition).accentColour;
  const muted = 'var(--brand-muted)';
  const inkColor = 'var(--brand-ink)';
  const borderColor = 'var(--card-border)';

  const streakShield = getHighestEarnedShield(STREAK_SHIELDS, streak);
  const sessionShield = getHighestEarnedShield(SESSION_SHIELDS, totalSessions);

  return (
    <div
      className="clay-card rounded-[2rem] p-5"
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: accentColor }}>
          Sadhana Highlights
        </p>
        <p className="mt-1 text-xs" style={{ color: muted }}>
          Lifelong practice at a glance
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        {[
          { value: totalBeads.toLocaleString('en-IN'), label: 'Beads' },
          { value: streak, label: 'Day Streak 🔥' },
          { value: totalRounds.toLocaleString('en-IN'), label: 'Rounds' },
          { value: formatMinutes(totalMinutes), label: 'In Practice' },
          { value: `${nityaDays}/30`, label: 'Nitya Days' },
          { value: bookmarkedVerses, label: 'Saved Verses' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={ROUTE_MAP[stat.label] ?? '#'}
            className="relative block active:scale-95 transition-transform text-left"
            style={{
              padding: '12px 8px',
              borderRadius: 18,
              background: 'color-mix(in srgb, var(--card-bg) 72%, transparent)',
              border: `1px solid ${borderColor}`,
              position: 'relative',
              display: 'block',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: accentColor, textAlign: 'center' }}>{stat.value}</div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: muted,
                marginTop: 3,
                textAlign: 'center',
              }}
            >
              {stat.label}
            </div>
            <ChevronRight
              size={10}
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                opacity: 0.3,
                color: inkColor,
              }}
            />
          </Link>
        ))}
      </div>

      {(streakShield || sessionShield) && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {streakShield && (
              <button
                type="button"
                onClick={() => setExpandedShield(expandedShield === streakShield.name ? null : streakShield.name)}
                className="flex items-center gap-1.5 transition-all active:scale-95 text-left"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${expandedShield === streakShield.name ? accentColor : borderColor}`,
                  background: 'var(--card-bg)',
                  color: inkColor,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span>{streakShield.emoji}</span>
                <span>{streakShield.name}</span>
                <Info size={11} className="opacity-50" />
              </button>
            )}
            {sessionShield && (
              <button
                type="button"
                onClick={() => setExpandedShield(expandedShield === sessionShield.name ? null : sessionShield.name)}
                className="flex items-center gap-1.5 transition-all active:scale-95 text-left"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: `1px solid ${expandedShield === sessionShield.name ? accentColor : borderColor}`,
                  background: 'var(--card-bg)',
                  color: inkColor,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span>{sessionShield.emoji}</span>
                <span>{sessionShield.name}</span>
                <Info size={11} className="opacity-50" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {expandedShield && (
              (() => {
                const shield = (streakShield?.name === expandedShield ? streakShield : null) || (sessionShield?.name === expandedShield ? sessionShield : null);
                if (!shield) return null;
                return (
                  <motion.div
                    key={shield.name}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden rounded-2xl p-3.5 bg-white/[0.02] border border-white/5 space-y-1.5"
                  >
                    <p className="text-xs leading-relaxed" style={{ color: muted }}>
                      {shield.description}
                    </p>
                    {shield.next && (
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                        Next: {shield.next}
                      </p>
                    )}
                  </motion.div>
                );
              })()
            )}
          </AnimatePresence>
        </div>
      )}

      {topMantra && (
        <p className="mt-4" style={{ fontSize: 12, color: muted }}>
          Favourite mantra:{' '}
          <strong style={{ color: inkColor }}>{topMantra}</strong>
        </p>
      )}

      <div className="mt-3" style={{ fontSize: 12, color: muted }}>
        Pathshala entries opened: <strong style={{ color: inkColor }}>{pathshalaEntries}</strong>
      </div>

      {isOwnProfile && (
        <div
          className="mt-4 flex items-center justify-between"
          style={{
            paddingTop: 12,
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          <span style={{ fontSize: 11, color: muted }}>Show on public profile</span>
          <button
            type="button"
            onClick={onToggleHighlights}
            role="switch"
            aria-checked={showHighlights}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: showHighlights ? accentColor : '#ccc',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: showHighlights ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
