'use client';

import { useMemo } from 'react';
import { calculatePanchang } from '@/lib/panchang';

interface Props {
  lat?: number;
  lon?: number;
}

export default function PanchangWidget({ lat = 51.5074, lon = -0.1278 }: Props) {
  const p = useMemo(() => calculatePanchang(new Date(), lat, lon), [lat, lon]);

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
    <div className="bg-white rounded-2xl border border-orange-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-sacred px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-display font-semibold text-sm">आज का पंचांग</div>
            <div className="text-white/80 text-xs mt-0.5">Today's Panchang</div>
          </div>
          <span className="text-2xl">🪔</span>
        </div>
        <div className="text-white/90 text-xs mt-2">{p.date}</div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 divide-x divide-y divide-orange-50">
        {items.map((item) => (
          <div key={item.label} className="px-3 py-2.5">
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
      <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
        <span className="text-sm">⚠️</span>
        <div>
          <span className="text-xs font-semibold text-red-700">Rahu Kaal — avoid auspicious work: </span>
          <span className="text-xs text-red-600">{p.rahuKaal}</span>
        </div>
      </div>
    </div>
  );
}
