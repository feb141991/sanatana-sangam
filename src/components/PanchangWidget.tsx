'use client';

import { useMemo } from 'react';
import { useSacredCalendar } from '@/hooks/useSacredCalendar';
import SacredIcon, { type SacredIconName } from '@/components/ui/SacredIcon';

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

  const items: Array<{ label: string; value: string; icon: SacredIconName }> = [
    { label: p.labels.dayLabel, value: p.tithi, icon: 'moon' },
    { label: 'Nakshatra', value: p.nakshatra, icon: 'star' },
    { label: 'Yoga', value: p.yoga, icon: 'activity' },
    { label: 'Vara', value: p.vara, icon: 'calendar' },
    { label: p.labels.monthLabel, value: p.masaName, icon: 'calendar' },
    { label: 'Sunrise', value: p.sunrise, icon: 'sunrise' },
    { label: 'Sunset', value: p.sunset, icon: 'sunset' },
    { label: 'Rahu Kaal', value: p.rahuKaal, icon: 'alert' },
    { label: 'Abhijit', value: p.abhijitMuhurat, icon: 'sparkles' },
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
            <div className="theme-muted text-xs mt-0.5">{p.calendarName}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,166,70,0.20)] bg-[rgba(212,166,70,0.10)] text-[rgb(212,166,70)]">
              <SacredIcon name="sun" size={17} />
            </span>
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
              <SacredIcon name={item.icon} size={11} className="text-[rgb(212,166,70)]" />
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
        <SacredIcon name="alert" size={15} className="text-[rgb(212,166,70)]" />
        <div>
          <span className="text-xs font-semibold theme-ink">Rahu Kaal: </span>
          <span className="text-xs theme-muted">{p.rahuKaal}</span>
        </div>
      </div>
    </div>
  );
}
