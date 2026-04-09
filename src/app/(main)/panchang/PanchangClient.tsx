'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { calculatePanchang } from '@/lib/panchang';
import type { PanchangData } from '@/lib/panchang';

interface Props {
  lat:       number;
  lon:       number;
  city:      string;
  tradition?: string;
}

// ─── Tradition calendar metadata ──────────────────────────────────────────────
const TRADITION_CALENDAR: Record<string, { badge: string; note: string; colour: string }> = {
  hindu:    { badge: '🕉️ Vedic',        note: 'Vikram Samvat calendar',           colour: 'var(--brand-primary-strong)' },
  sikh:     { badge: '☬ Nanakshahi',    note: 'Nanakshahi Sikh calendar month',   colour: 'var(--brand-primary)' },
  buddhist: { badge: '☸️ Buddhist',      note: 'Buddhist lunar calendar',          colour: 'var(--brand-secondary)' },
  jain:     { badge: '🤲 Jain',          note: 'Jain Vira Samvat calendar',        colour: 'var(--brand-earth)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ─── Panchang detail row ──────────────────────────────────────────────────────
function Row({ emoji, label, value, highlight = false }: {
  emoji: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${highlight ? '' : 'bg-white border border-gray-100'}`}
      style={highlight ? { background: 'var(--brand-primary-soft)', border: '1px solid rgba(200, 127, 146, 0.2)' } : undefined}
    >
      <span className="text-xl w-7 text-center flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className={`font-semibold text-sm mt-0.5 ${highlight ? '' : 'text-gray-800'}`} style={highlight ? { color: 'var(--brand-primary-strong)' } : undefined}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PanchangClient({ lat, lon, city, tradition = 'hindu' }: Props) {
  const calMeta = TRADITION_CALENDAR[tradition] ?? TRADITION_CALENDAR.hindu;
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(today);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Calculate panchang for selected date
  const p: PanchangData = useMemo(
    () => calculatePanchang(selected, lat, lon),
    [selected, lat, lon]
  );

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isToday = isSameDay(selected, today);
  const dateLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  async function share() {
    const text = `🪔 Panchang — ${dateLabel}\n\n` +
      `📅 Tithi: ${p.tithi} (${p.paksha} Paksha)\n` +
      `⭐ Nakshatra: ${p.nakshatra}\n` +
      `🕉️ Yoga: ${p.yoga}\n` +
      `📆 Vara: ${p.vara}\n` +
      `🌅 Sunrise: ${p.sunrise}  🌆 Sunset: ${p.sunset}\n` +
      `⚠️ Rahu Kaal: ${p.rahuKaal}\n` +
      `✨ Abhijit Muhurat: ${p.abhijitMuhurat}\n\n` +
      `— Sanatana Sangam`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Panchang', text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    alert('Panchang copied to clipboard!');
  }

  return (
    <div className="flex flex-col gap-0 fade-in pb-2">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        <Link href="/home"
          className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center transition"
          style={{ borderColor: 'rgba(200, 127, 146, 0.16)' }}>
          <ArrowLeft size={15} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-gray-900 text-xl leading-tight">Panchang</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: calMeta.colour }}>
              {calMeta.badge}
            </span>
          </div>
          {city && <p className="text-xs text-gray-400 mt-0.5">📍 {city}</p>}
        </div>
        <button onClick={share}
          className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center transition"
          style={{ borderColor: 'rgba(200, 127, 146, 0.16)' }}>
          <Share2 size={15} className="text-gray-500" />
        </button>
      </div>

      {/* ── Calendar ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3" style={{ border: '1px solid rgba(200, 127, 146, 0.16)' }}>
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-sm">{MONTHS[viewMonth]} {viewYear}</p>
            <p className="text-[10px] text-gray-400">
              {tradition === 'hindu' ? `${p.masaName} Masa` : calMeta.note}
            </p>
          </div>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 p-2 gap-1">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;
            const isSelected = isSameDay(date, selected);
            const isCurrentDay = isSameDay(date, today);
            // Get tithi for this date
            const dayP = calculatePanchang(date, lat, lon);
            const tithiShort = dayP.tithiIndex;
            return (
              <button key={date.toISOString()} onClick={() => setSelected(date)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                  isSelected
                    ? 'text-white'
                    : isCurrentDay
                    ? 'border text-gray-700'
                    : 'text-gray-700'
                }`}
                style={
                  isSelected
                    ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }
                    : isCurrentDay
                      ? { borderColor: 'rgba(200, 127, 146, 0.4)', color: 'var(--brand-primary-strong)', background: 'var(--brand-primary-soft)' }
                      : undefined
                }>
                <span className="text-xs font-semibold leading-none">{date.getDate()}</span>
                <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  {tithiShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected date label ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />
        <p className="text-xs font-semibold text-gray-600">{isToday ? 'Today — ' : ''}{dateLabel}</p>
      </div>

      {/* ── Panchang details ────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* Paksha + Masa banner */}
        <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          <span className="text-xl">🪔</span>
          <div>
            <p className="text-white font-semibold text-sm">
              {p.paksha} Paksha · {p.masaName} Masa
            </p>
            <p className="text-white/60 text-[10px]">{p.vara} · Hindu Panchanga</p>
          </div>
        </div>

        {/* Core panchang items */}
        <div className="grid grid-cols-2 gap-2">
          <Row emoji="📅" label="Tithi"     value={p.tithi} />
          <Row emoji="⭐" label="Nakshatra" value={p.nakshatra} />
          <Row emoji="🕉️" label="Yoga"      value={p.yoga} />
          <Row emoji="📆" label="Vara"      value={p.vara} />
        </div>

        {/* Timings */}
        <div className="grid grid-cols-2 gap-2">
          <Row emoji="🌅" label="Sunrise" value={p.sunrise} />
          <Row emoji="🌆" label="Sunset"  value={p.sunset} />
        </div>

        {/* Rahu Kaal & Abhijit — highlighted */}
        <Row emoji="⚠️" label="Rahu Kaal (avoid auspicious work)" value={p.rahuKaal} highlight />
        <Row emoji="✨" label="Abhijit Muhurat (most auspicious)" value={p.abhijitMuhurat} />

        {/* Quick tip */}
        <div className="rounded-xl px-4 py-3" style={{ background: 'var(--brand-accent-soft)', border: '1px solid rgba(200, 127, 146, 0.14)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
            <span className="font-semibold">Today&apos;s guidance:</span>{' '}
            {p.paksha === 'Shukla'
              ? 'Shukla Paksha is auspicious for new beginnings, prayers, and satsang.'
              : 'Krishna Paksha is ideal for introspection, fasting, and ancestral prayers (Pitru Tarpan).'}
          </p>
        </div>
      </div>
    </div>
  );
}
