'use client';

import { useMemo } from 'react';
import { useSacredCalendar } from '@/hooks/useSacredCalendar';

interface Props {
  lat?: number;
  lon?: number;
  tradition?: string;
}

export default function PanchangWidget({ lat = 51.5074, lon = -0.1278, tradition = 'hindu' }: Props) {
  const p = useSacredCalendar(new Date(), lat, lon, tradition);
  const mood = {
    shell: 'linear-gradient(180deg, rgba(51, 51, 48, 0.985) 0%, rgba(43, 43, 40, 0.97) 56%, rgba(34, 34, 31, 0.98) 100%)',
    glow: 'radial-gradient(circle at top, rgba(212, 166, 70, 0.12), transparent 58%)',
    orb: 'rgba(212, 166, 70, 0.18)',
    label: 'Today',
  };

  const items = [
    { label: 'Tithi',     value: p.tithi,            emoji: '🌙' },
    { label: 'Nakshatra', value: p.nakshatra,         emoji: '⭐' },
    { label: 'Yoga',      value: p.yoga,              emoji: '🧘' },
    { label: 'Vara',      value: p.vara,              emoji: '📅' },
    { label: 'Masa',      value: p.masaName,          emoji: '🗓️' },
    { label: 'Sunrise',   value: p.sunrise,           emoji: '🌅' },
    { label: 'Sunset',    value: p.sunset,            emoji: '🌇' },
    { label: 'Rahu Kaal', value: p.rahuKaal,          emoji: '⚠️' },
    { label: 'Abhijit',   value: p.abhijitMuhurat,    emoji: '✨' },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[1.6rem] shadow-card decorative-orbit"
      style={{ background: mood.shell, border: '1px solid rgba(212, 166, 70, 0.16)' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: mood.glow }} />
      <div
        className="absolute top-4 right-5 h-12 w-12 rounded-full blur-md opacity-80"
        style={{ background: mood.orb }}
      />
      {/* Header */}
      <div className="relative px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold theme-dim">Sacred time</div>
            <div className="font-display font-semibold text-base theme-ink mt-1">आज का पंचांग</div>
            <div className="theme-muted text-xs mt-0.5">Today&apos;s Panchang</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl">🪔</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold theme-dim" style={{ borderColor: 'rgba(212, 166, 70, 0.16)', background: 'rgba(40, 40, 37, 0.88)' }}>
              {mood.label}
            </span>
          </div>
        </div>
        <div className="theme-muted text-xs mt-3">{p.date}</div>
      </div>

      {/* Grid */}
      <div className="relative grid grid-cols-3 divide-x divide-y backdrop-blur-[2px]" style={{ background: 'var(--card-bg)', borderTop: '1px solid rgba(212, 166, 70, 0.08)', borderColor: 'rgba(212, 166, 70, 0.08)' }}>
        {items.map((item) => (
          <div key={item.label} className="px-3 py-2.5" style={{ borderColor: 'rgba(200, 127, 146, 0.08)' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs">{item.emoji}</span>
              <span className="text-[10px] theme-dim uppercase tracking-wide font-medium">
                {item.label}
              </span>
            </div>
            <div className="text-xs font-semibold theme-ink leading-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Rahu Kaal warning */}
      <div className="relative px-4 py-2.5 border-t flex items-center gap-2" style={{ background: 'rgba(34, 34, 31, 0.94)', borderColor: 'rgba(212, 166, 70, 0.18)' }}>
        <span className="text-sm">⚠️</span>
        <div>
          <span className="text-xs font-semibold theme-ink">Rahu Kaal: </span>
          <span className="text-xs theme-muted">{p.rahuKaal}</span>
        </div>
      </div>
    </div>
  );
}
