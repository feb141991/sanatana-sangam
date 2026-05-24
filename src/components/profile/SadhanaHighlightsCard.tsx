'use client';

import { getTraditionMeta } from '@/lib/tradition-config';

const STREAK_SHIELDS = [
  { threshold: 7, name: 'Saptāha', emoji: '🔥' },
  { threshold: 21, name: 'Niyama', emoji: '🕯️' },
  { threshold: 40, name: 'Chālisā', emoji: '🌟' },
  { threshold: 54, name: 'Ardha Mālā', emoji: '📿' },
  { threshold: 108, name: 'Pūrṇa Mālā', emoji: '🙏' },
  { threshold: 365, name: 'Varsha', emoji: '☀️' },
] as const;

const SESSION_SHIELDS = [
  { threshold: 7, name: 'Prārambha', emoji: '🌱' },
  { threshold: 21, name: 'Abhyāsa', emoji: '⚡' },
  { threshold: 40, name: 'Tapas', emoji: '🔆' },
  { threshold: 108, name: 'Mālā', emoji: '📿' },
  { threshold: 365, name: 'Varshika', emoji: '🌕' },
  { threshold: 1000, name: 'Sahasra', emoji: '💎' },
] as const;

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
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              padding: '12px 8px',
              borderRadius: 18,
              background: 'color-mix(in srgb, var(--card-bg) 72%, transparent)',
              border: `1px solid ${borderColor}`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: accentColor }}>{stat.value}</div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: muted,
                marginTop: 3,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {(streakShield || sessionShield) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {streakShield && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background: 'var(--card-bg)',
                color: inkColor,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>{streakShield.emoji}</span>
              <span>{streakShield.name}</span>
            </div>
          )}
          {sessionShield && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background: 'var(--card-bg)',
                color: inkColor,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span>{sessionShield.emoji}</span>
              <span>{sessionShield.name}</span>
            </div>
          )}
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
