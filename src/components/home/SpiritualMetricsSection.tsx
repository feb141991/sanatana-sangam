'use client';

import { useEffect, useState, useMemo } from 'react';
import RadialRing from '@/components/ui/RadialRing';
import { useVocabulary } from '@/hooks/useVocabulary';

// ── Ring definitions ───────────────────────────────────────────────────────────
// Each ring maps to a feature page and carries its own accent pair for the
// gradient arc (accent → accentEnd).  All other styling uses CSS tokens.
const RINGS = [
  {
    id:        'japa',
    labelKey:  'japa',
    href:      '/japa',
    accent:    '#C8924A',
    accentEnd: '#E8A860',
    scoreKey:  'presence' as const,
  },
  {
    id:        'svadhyaya',
    labelKey:  'svadhyaya',
    href:      '/pathshala',
    accent:    '#6aafcc',
    accentEnd: '#88ccee',
    scoreKey:  'clarity' as const,
  },
  {
    id:        'sadhana',
    labelKey:  'sadhana',
    href:      '/nitya-karma',
    accent:    '#b06adc',
    accentEnd: '#cc88ee',
    scoreKey:  'balance' as const,
  },
  {
    id:        'nitya',
    labelKey:  'nitya',
    href:      '/nitya-karma',
    accent:    '#e09050',
    accentEnd: '#f0b070',
    scoreKey:  'grounding' as const,
  },
  {
    id:        'viveka',
    labelKey:  'viveka',
    href:      '/discover',
    accent:    '#7ab85a',
    accentEnd: '#9ad878',
    scoreKey:  'renewal' as const,
  },
] as const;

// ── Main Section ──────────────────────────────────────────────────────────────
interface SpiritualMetricsSectionProps {
  japaStreak:           number;
  shlokaStreak:         number;
  japaAlreadyDoneToday: boolean;
  readToday:            boolean;
  tradition?:           string | null;
}

export default function SpiritualMetricsSection({
  japaStreak,
  shlokaStreak,
  japaAlreadyDoneToday,
  readToday,
  tradition = 'hindu',
}: SpiritualMetricsSectionProps) {
  const { term } = useVocabulary(tradition ?? 'hindu');
  // ── Theme detection ────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.dataset.theme !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const containerBg = isDark
    ? 'linear-gradient(150deg, rgba(30,24,16,0.98), rgba(22,18,12,0.96))'
    : 'rgba(255, 253, 248, 0.90)';

  const containerShadow = isDark
    ? '0 12px 32px rgba(0,0,0,0.24)'
    : '0 8px 24px rgba(49,35,20,0.07), inset 0 1px 0 rgba(255,255,255,0.85)';

  // ── Score computation ──────────────────────────────────────────────────────
  const scores = useMemo(() => {
    // Presence: japa streak — 21 days = full
    const presence  = Math.min(100, Math.round((japaStreak   / 21) * 100));
    // Clarity: scripture streak — 30 days = full
    const clarity   = Math.min(100, Math.round((shlokaStreak / 30) * 100));
    // Balance: weighted average
    const balance   = Math.round(presence * 0.55 + clarity * 0.45);
    // Grounding: today's completion + streak momentum
    const groundingToday = (japaAlreadyDoneToday ? 50 : 0) + (readToday ? 50 : 0);
    const grounding = Math.round(groundingToday * 0.7 + Math.min(100, (japaStreak / 14) * 100) * 0.3);
    // Renewal: elevated on 7+ consecutive days
    const renewal   = Math.min(100, japaStreak >= 7 ? 70 + (japaStreak - 7) * 2 : japaStreak * 9);

    return { presence, clarity, balance, grounding, renewal } as const;
  }, [japaStreak, shlokaStreak, japaAlreadyDoneToday, readToday]);

  return (
    <div
      className="rounded-[1.7rem] px-4 py-4 relative overflow-hidden"
      style={{
        background:  containerBg,
        border:      '1px solid rgba(200,146,74,0.14)',
        boxShadow:   containerShadow,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, var(--ring-glow), transparent 70%)' }}
      />

      {/* Section label */}
      <p
        className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3"
        style={{ color: 'var(--brand-muted)' }}
      >
        {term('sadhana')} Vitals
      </p>

      {/* Rings row — each is a tappable link */}
      <div className="flex gap-2 justify-between overflow-x-auto pb-1 no-scrollbar">
        {RINGS.map(ring => (
          <RadialRing
            key={ring.id}
            pct={scores[ring.scoreKey]}
            accent={ring.accent}
            accentEnd={ring.accentEnd}
            gradientId={`sm-${ring.id}`}
            size={72}
            strokeWidth={6.5}
            showPct
            caption={term(ring.labelKey)}
            href={ring.href}
          />
        ))}
      </div>
    </div>
  );
}
