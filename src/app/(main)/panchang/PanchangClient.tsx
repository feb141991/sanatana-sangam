'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { calculatePanchang, PANCHANG_TRUST_META } from '@/lib/panchang';
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

const SKY_THEMES = {
  dawn: {
    shell: 'linear-gradient(180deg, rgba(255, 246, 239, 0.98) 0%, rgba(255, 234, 229, 0.94) 42%, rgba(245, 220, 226, 0.92) 100%)',
    glow: 'radial-gradient(circle at top, rgba(255, 214, 167, 0.55), transparent 55%)',
    orb: 'rgba(255, 198, 126, 0.9)',
    label: 'Dawn sky',
  },
  day: {
    shell: 'linear-gradient(180deg, rgba(250, 244, 239, 0.98) 0%, rgba(241, 232, 239, 0.95) 48%, rgba(231, 213, 224, 0.92) 100%)',
    glow: 'radial-gradient(circle at top, rgba(255, 231, 176, 0.45), transparent 52%)',
    orb: 'rgba(255, 221, 137, 0.88)',
    label: 'Day sky',
  },
  dusk: {
    shell: 'linear-gradient(180deg, rgba(245, 232, 233, 0.98) 0%, rgba(233, 206, 221, 0.95) 45%, rgba(206, 171, 198, 0.94) 100%)',
    glow: 'radial-gradient(circle at top, rgba(255, 185, 145, 0.46), transparent 55%)',
    orb: 'rgba(255, 170, 129, 0.82)',
    label: 'Dusk sky',
  },
  night: {
    shell: 'linear-gradient(180deg, rgba(38, 32, 58, 0.98) 0%, rgba(58, 42, 77, 0.96) 42%, rgba(103, 74, 104, 0.94) 100%)',
    glow: 'radial-gradient(circle at top, rgba(162, 145, 214, 0.34), transparent 58%)',
    orb: 'rgba(238, 228, 255, 0.78)',
    label: 'Night sky',
  },
} as const;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function getSkyTheme(hour: number) {
  if (hour >= 5 && hour < 8) return SKY_THEMES.dawn;
  if (hour >= 8 && hour < 17) return SKY_THEMES.day;
  if (hour >= 17 && hour < 20) return SKY_THEMES.dusk;
  return SKY_THEMES.night;
}

function triggerPanchangHaptic(pattern: number | number[]) {
  if (typeof window === 'undefined') return;
  window.navigator.vibrate?.(pattern);
}

function parseClockToMinutes(value: string): number | null {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + minute;
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
    triggerPanchangHaptic(12);
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    triggerPanchangHaptic(12);
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const isToday = isSameDay(selected, today);
  const dateLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const skyTheme = getSkyTheme(isToday ? new Date().getHours() : 7);
  const sunriseMinutes = parseClockToMinutes(p.sunrise);
  const sunsetMinutes = parseClockToMinutes(p.sunset);
  const selectedClockMinutes = isToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : sunriseMinutes !== null && sunsetMinutes !== null
      ? Math.round((sunriseMinutes + sunsetMinutes) / 2)
      : null;
  const daylightProgress = sunriseMinutes !== null && sunsetMinutes !== null && selectedClockMinutes !== null
    ? Math.max(0, Math.min(1, (selectedClockMinutes - sunriseMinutes) / Math.max(1, sunsetMinutes - sunriseMinutes)))
    : 0.5;
  const sacredWindowLabel = isToday
    ? selectedClockMinutes !== null && sunriseMinutes !== null && sunsetMinutes !== null
      ? selectedClockMinutes < sunriseMinutes
        ? 'The day has not opened yet. Keep the morning quiet until sunrise.'
        : selectedClockMinutes > sunsetMinutes
          ? 'The visible day has closed. This is a good hour for recollection and gratitude.'
          : selectedClockMinutes < sunriseMinutes + 120
            ? 'You are in the fresh morning window, ideal for sankalpa, recitation, and starting with clarity.'
            : selectedClockMinutes > sunsetMinutes - 120
              ? 'Dusk is near. This is a gentle window for prayer, remembrance, and closing the day well.'
              : 'The day is in motion. Use the sacred-time ribbon below to stay aware of auspicious and avoidable windows.'
      : 'Use the sacred-time ribbon below to orient your day.'
    : 'This is a calm planning view for a different day, so you can prepare ahead.';

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
    triggerPanchangHaptic([12, 30, 12]);
    alert('Panchang copied to clipboard!');
  }

  function goToToday() {
    triggerPanchangHaptic(18);
    setSelected(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  return (
    <div className="flex flex-col gap-0 fade-in pb-2">

      <div
        className="relative overflow-hidden rounded-[2rem] p-4 sm:p-5 mb-3 border"
        style={{ background: skyTheme.shell, borderColor: 'rgba(223, 156, 171, 0.24)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: skyTheme.glow }} />
        <div
          className="absolute top-4 right-6 w-16 h-16 rounded-full blur-md opacity-80"
          style={{ background: skyTheme.orb }}
        />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-gray-500">Sacred Time</p>
          <h1 className="font-display font-bold text-gray-900 text-xl mt-1">Panchang for the day</h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            A calmer view of the day’s rhythm: sunrise, sacred windows, and the lunar markers that shape your practice.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/75 text-gray-700 border border-white/80">
              {skyTheme.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/75 text-gray-700 border border-white/80">
              {city || 'Location-aware'}
            </span>
            {!isToday && (
              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-700 border border-white/80 transition hover:bg-white"
              >
                Return to today
              </button>
            )}
          </div>
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/55 px-3 py-3 backdrop-blur-[2px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-500">Day arc</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{p.sunrise} to {p.sunset}</p>
              </div>
              <p className="text-[11px] text-gray-500 max-w-[10rem] text-right leading-relaxed">{sacredWindowLabel}</p>
            </div>
            <div className="mt-3">
              <div className="relative h-2 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.round(daylightProgress * 100)}%`,
                    background: 'linear-gradient(90deg, rgba(255, 190, 132, 0.95), rgba(223, 156, 171, 0.95))',
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>Sunrise</span>
                <span>{isToday ? 'Current day flow' : 'Planned day flow'}</span>
                <span>Sunset</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <button key={date.toISOString()} onClick={() => { triggerPanchangHaptic(10); setSelected(date); }}
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

      <div className="rounded-2xl border p-3 mb-3" style={{ background: 'rgba(255,255,255,0.82)', borderColor: 'rgba(223, 156, 171, 0.18)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-2">Sacred time ribbon</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Sunrise', value: p.sunrise, emoji: '🌅' },
            { label: 'Sunset', value: p.sunset, emoji: '🌇' },
            { label: 'Rahu Kaal', value: p.rahuKaal, emoji: '⚠️' },
            { label: 'Abhijit', value: p.abhijitMuhurat, emoji: '✨' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl px-3 py-2 bg-white/80 border border-white/80">
              <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400 font-semibold">{item.emoji} {item.label}</p>
              <p className="text-sm font-semibold mt-1" style={{ color: 'var(--brand-primary-strong)' }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-gray-400">Today&apos;s posture</p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--brand-primary-strong)' }}>
            {sacredWindowLabel}
          </p>
        </div>
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

        <div className="rounded-xl px-4 py-3 border border-[rgba(223,156,171,0.18)] bg-white/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{PANCHANG_TRUST_META.methodLabel}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-primary-strong)' }}>{PANCHANG_TRUST_META.precisionLabel}</p>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">{PANCHANG_TRUST_META.guidanceNote}</p>
        </div>
      </div>
    </div>
  );
}
