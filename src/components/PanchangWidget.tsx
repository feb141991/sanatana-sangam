'use client';

import { useMemo } from 'react';
import { calculatePanchang } from '@/lib/panchang';

interface Props {
  lat?: number;
  lon?: number;
}

export default function PanchangWidget({ lat = 51.5074, lon = -0.1278 }: Props) {
  const p = useMemo(() => calculatePanchang(new Date(), lat, lon), [lat, lon]);
  const hour = new Date().getHours();
  const mood =
    hour >= 5 && hour < 8
      ? {
          shell: 'linear-gradient(180deg, rgba(255, 246, 239, 0.98) 0%, rgba(255, 234, 229, 0.96) 54%, rgba(245, 220, 226, 0.95) 100%)',
          glow: 'radial-gradient(circle at top, rgba(255, 214, 167, 0.45), transparent 55%)',
          orb: 'rgba(255, 198, 126, 0.82)',
          label: 'Dawn',
        }
      : hour >= 8 && hour < 17
        ? {
            shell: 'linear-gradient(180deg, rgba(250, 244, 239, 0.98) 0%, rgba(241, 232, 239, 0.95) 54%, rgba(231, 213, 224, 0.94) 100%)',
            glow: 'radial-gradient(circle at top, rgba(255, 231, 176, 0.4), transparent 54%)',
            orb: 'rgba(255, 221, 137, 0.8)',
            label: 'Day',
          }
        : hour >= 17 && hour < 20
          ? {
              shell: 'linear-gradient(180deg, rgba(245, 232, 233, 0.98) 0%, rgba(233, 206, 221, 0.96) 50%, rgba(206, 171, 198, 0.95) 100%)',
              glow: 'radial-gradient(circle at top, rgba(255, 185, 145, 0.4), transparent 56%)',
              orb: 'rgba(255, 170, 129, 0.76)',
              label: 'Dusk',
            }
          : {
              shell: 'linear-gradient(180deg, rgba(54, 42, 62, 0.98) 0%, rgba(79, 57, 88, 0.96) 56%, rgba(116, 81, 112, 0.94) 100%)',
              glow: 'radial-gradient(circle at top, rgba(219, 207, 255, 0.18), transparent 58%)',
              orb: 'rgba(243, 237, 255, 0.66)',
              label: 'Night',
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
      className="relative overflow-hidden rounded-[1.6rem] shadow-card"
      style={{ background: mood.shell, border: '1px solid rgba(200, 127, 146, 0.16)' }}
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
            <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500">Sacred Time</div>
            <div className="font-display font-semibold text-base text-gray-900 mt-1">आज का पंचांग</div>
            <div className="text-gray-600 text-xs mt-0.5">Today&apos;s Panchang</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl">🪔</span>
            <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {mood.label}
            </span>
          </div>
        </div>
        <div className="text-gray-600 text-xs mt-3">{p.date}</div>
      </div>

      {/* Grid */}
      <div className="relative grid grid-cols-3 divide-x divide-y bg-white/82 backdrop-blur-[2px]" style={{ borderTop: '1px solid rgba(200, 127, 146, 0.08)', borderColor: 'rgba(200, 127, 146, 0.08)' }}>
        {items.map((item) => (
          <div key={item.label} className="px-3 py-2.5" style={{ borderColor: 'rgba(200, 127, 146, 0.08)' }}>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs">{item.emoji}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                {item.label}
              </span>
            </div>
            <div className="text-xs font-semibold text-gray-800 leading-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Rahu Kaal warning */}
      <div className="relative px-4 py-2.5 border-t flex items-center gap-2 bg-white/82" style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }}>
        <span className="text-sm">⚠️</span>
        <div>
          <span className="text-xs font-semibold" style={{ color: 'var(--brand-primary-strong)' }}>Rahu Kaal — avoid auspicious work: </span>
          <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>{p.rahuKaal}</span>
        </div>
      </div>
    </div>
  );
}
