'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

// ── Tradition-aware labels ──────────────────────────────────────────────

function resolveJapaLabel(tradition?: string | null, override?: string): string {
  if (override) return override;
  if (tradition === 'sikh')     return 'Simran';
  if (tradition === 'buddhist') return 'Meditation';
  if (tradition === 'jain')     return 'Jap';
  return '108 Japa';
}

function resolveNityaLabel(tradition?: string | null, override?: string): string {
  if (override) return override;
  if (tradition === 'sikh')     return 'Nitnem';
  if (tradition === 'buddhist') return 'Practice';
  if (tradition === 'jain')     return 'Samayika';
  return 'Nitya Karma';
}

// ── Component ─────────────────────────────────────────────────────

interface DailySadhanaStripProps {
  japaDone:        boolean;
  nityaDone:       boolean;
  pathshalaDone:   boolean;
  /** Override japa label (defaults to tradition-aware label) */
  japaLabel?:      string;
  japaHref?:       string;
  /** Override nitya label (defaults to tradition-aware label) */
  nityaLabel?:     string;
  nityaHref?:      string;
  pathshalaLabel?: string;
  pathshalaHref?:  string;
  /** User tradition — drives contextual pill labels */
  tradition?:      string | null;
}

export default function DailySadhanaStrip({
  japaDone,
  nityaDone,
  pathshalaDone,
  japaLabel,
  japaHref = '/bhakti/mala',
  nityaLabel,
  nityaHref = '/nitya-karma',
  pathshalaLabel = 'Pathshala',
  pathshalaHref = '/pathshala',
  tradition,
}: DailySadhanaStripProps) {

  const pills = [
    {
      id: 'japa',
      label: resolveJapaLabel(tradition, japaLabel),
      done: japaDone,
      href: japaHref,
      icon: '\u{1F4FF}',
    },
    {
      id: 'nitya',
      label: resolveNityaLabel(tradition, nityaLabel),
      done: nityaDone,
      href: nityaHref,
      icon: '\u{1F305}',
    },
    {
      id: 'pathshala',
      label: pathshalaLabel,
      done: pathshalaDone,
      href: pathshalaHref,
      icon: '\u{1F4D6}',
    },
  ];

  const completedCount = pills.filter(p => p.done).length;

  return (
    <div className="px-5 relative z-20 mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-dim)' }}>
            Today&apos;s Practice
          </h3>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted-warm)' }}>
            Keep the day moving with one small step.
          </p>
        </div>
        {completedCount === 3 && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1 border"
            style={{ color: '#C5A059', borderColor: 'rgba(197, 160, 89, 0.22)', background: 'rgba(197, 160, 89, 0.08)' }}
          >
            <Sparkles size={10} /> Complete
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {pills.map((pill) => (
          <Link
            key={pill.id}
            href={pill.href}
            className={`group flex-1 min-w-[104px] flex items-center gap-2.5 px-3 py-2.5 rounded-[1rem] border transition-all duration-300 ${
              pill.done
                ? 'bg-[#C5A059]/10 border-[#C5A059]/30'
                : 'bg-[rgba(255,248,235,0.72)] border-black/5 dark:bg-[rgba(255,255,255,0.05)] dark:border-white/10'
            }`}
            style={{
              boxShadow: pill.done ? '0 6px 16px rgba(197, 160, 89, 0.10)' : '0 4px 10px rgba(10, 8, 5, 0.04)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm transition-transform duration-300 group-hover:scale-105 ${
                pill.done ? 'bg-[#C5A059] text-[#1a1610]' : 'bg-black/5 dark:bg-white/10 opacity-80'
              }`}
            >
              {pill.done ? <Check size={14} strokeWidth={3} /> : pill.icon}
            </div>
            <div className="min-w-0">
              <span
                className={`block text-[11px] font-bold tracking-wide truncate ${
                  pill.done ? 'text-[#C5A059]' : 'text-[var(--text-main)] dark:text-[var(--text-muted-warm)]'
                }`}
              >
                {pill.label}
              </span>
              <span className="block mt-0.5 text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>
                {pill.done ? 'Complete' : 'Open'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
