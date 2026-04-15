'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { calculatePanchang } from '@/lib/panchang';
import type { PanchangData } from '@/lib/panchang';

interface Props {
  lat:       number;
  lon:       number;
  city:      string;
  tradition?: string;
}

// ─── Tradition metadata ───────────────────────────────────────────────────────
const TRADITION_META: Record<string, { badge: string; note: string; accent: string; accentLight: string }> = {
  hindu:    { badge: '🕉️ Vedic',     note: 'Vikram Samvat',         accent: '#B8541B', accentLight: 'rgba(184,84,27,0.15)' },
  sikh:     { badge: '☬ Nanakshahi', note: 'Nanakshahi Calendar',   accent: '#1a4d7b', accentLight: 'rgba(26,77,123,0.15)' },
  buddhist: { badge: '☸️ Buddhist',   note: 'Buddhist Lunar',        accent: '#5c6b1a', accentLight: 'rgba(92,107,26,0.15)' },
  jain:     { badge: '🤲 Jain',       note: 'Vira Samvat',           accent: '#7b5a1a', accentLight: 'rgba(123,90,26,0.15)' },
};

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Time-of-day phase from sunrise/sunset strings ────────────────────────────
type SkyPhase = 'night' | 'predawn' | 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'evening';

function parseSunTime(timeStr: string): number {
  // "6:12 AM" → minutes since midnight
  const [time, period] = timeStr.split(' ');
  const [h, m]         = time.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;
  return hours * 60 + m;
}

function getSkyPhase(nowMin: number, sunriseMin: number, sunsetMin: number): SkyPhase {
  if (nowMin < sunriseMin - 60)          return 'night';
  if (nowMin < sunriseMin - 15)          return 'predawn';
  if (nowMin < sunriseMin + 45)          return 'dawn';
  if (nowMin < (sunriseMin + sunsetMin) / 2) return 'morning';
  if (nowMin < sunsetMin - 45)           return 'afternoon';
  if (nowMin < sunsetMin + 45)           return 'dusk';
  if (nowMin < sunsetMin + 120)          return 'evening';
  return 'night';
}

const SKY_GRADIENTS: Record<SkyPhase, string> = {
  night:     'linear-gradient(180deg, #0a0a1a 0%, #0f0f2e 40%, #1a0f2e 100%)',
  predawn:   'linear-gradient(180deg, #0d0d28 0%, #1a0f35 50%, #2d1045 100%)',
  dawn:      'linear-gradient(180deg, #1a0a28 0%, #5c1f3a 35%, #c45c2a 70%, #e8a060 100%)',
  morning:   'linear-gradient(180deg, #1e4a8a 0%, #3a7ab8 35%, #d4885a 70%, #f0b870 100%)',
  afternoon: 'linear-gradient(180deg, #1a3a6e 0%, #2d5a9e 40%, #4a7ac0 100%)',
  dusk:      'linear-gradient(180deg, #1a1030 0%, #5c1a1a 30%, #c44820 60%, #e87040 100%)',
  evening:   'linear-gradient(180deg, #0f0820 0%, #2a1040 40%, #4a1a30 100%)',
};

const SKY_ORB: Record<SkyPhase, { color: string; size: string; opacity: number }> = {
  night:     { color: 'rgba(200,220,255,0.35)', size: '5rem',  opacity: 0.9 },
  predawn:   { color: 'rgba(180,160,220,0.25)', size: '4rem',  opacity: 0.6 },
  dawn:      { color: 'rgba(255,180,80,0.45)',  size: '6rem',  opacity: 0.8 },
  morning:   { color: 'rgba(255,220,100,0.5)',  size: '8rem',  opacity: 0.9 },
  afternoon: { color: 'rgba(255,240,150,0.4)',  size: '10rem', opacity: 0.7 },
  dusk:      { color: 'rgba(255,120,50,0.5)',   size: '9rem',  opacity: 0.85 },
  evening:   { color: 'rgba(220,100,60,0.3)',   size: '6rem',  opacity: 0.5 },
};

const PHASE_LABELS: Record<SkyPhase, string> = {
  night: 'Night', predawn: 'Pre-dawn', dawn: 'Dawn',
  morning: 'Morning', afternoon: 'Afternoon', dusk: 'Dusk', evening: 'Evening',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border backdrop-blur-md ${className}`}
      style={{ background: 'rgba(10,8,25,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}>
      {children}
    </div>
  );
}

// ─── Panchang row ─────────────────────────────────────────────────────────────
function Row({ emoji, label, value, accent, warn = false }: {
  emoji: string; label: string; value: string; accent: string; warn?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: warn ? 'rgba(200,80,20,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${warn ? 'rgba(200,80,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <span className="text-xl w-7 text-center flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{label}</p>
        <p className={`font-semibold text-sm mt-0.5 ${warn ? 'text-orange-300' : 'text-white/90'}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Stars background ─────────────────────────────────────────────────────────
function Stars({ count = 28 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width:  `${1 + (i % 3) * 0.5}px`,
            height: `${1 + (i % 3) * 0.5}px`,
            left:   `${(i * 37 + 7) % 97}%`,
            top:    `${(i * 23 + 5) % 55}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PanchangClient({ lat, lon, city, tradition = 'hindu' }: Props) {
  const tradMeta = TRADITION_META[tradition] ?? TRADITION_META.hindu;
  const today    = useMemo(() => new Date(), []);
  const [selected,   setSelected]  = useState<Date>(today);
  const [viewYear,   setViewYear]  = useState(today.getFullYear());
  const [viewMonth,  setViewMonth] = useState(today.getMonth());

  const p: PanchangData = useMemo(
    () => calculatePanchang(selected, lat, lon),
    [selected, lat, lon]
  );

  // ── Compute sky phase ────────────────────────────────────────────────────────
  const skyPhase = useMemo(() => {
    const nowMin      = today.getHours() * 60 + today.getMinutes();
    const sunriseMin  = parseSunTime(p.sunrise);
    const sunsetMin   = parseSunTime(p.sunset);
    return getSkyPhase(nowMin, sunriseMin, sunsetMin);
  }, [today, p.sunrise, p.sunset]);

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
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

  const isToday   = isSameDay(selected, today);
  const dateLabel = selected.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const isNight  = skyPhase === 'night' || skyPhase === 'predawn' || skyPhase === 'evening';
  const orb      = SKY_ORB[skyPhase];

  async function share() {
    const text = `🪔 Panchang — ${dateLabel}\n\n` +
      `📅 Tithi: ${p.tithi} (${p.paksha} Paksha)\n` +
      `⭐ Nakshatra: ${p.nakshatra}\n🕉️ Yoga: ${p.yoga}\n📆 Vara: ${p.vara}\n` +
      `🌅 Sunrise: ${p.sunrise}  🌆 Sunset: ${p.sunset}\n` +
      `⚠️ Rahu Kaal: ${p.rahuKaal}\n✨ Abhijit Muhurat: ${p.abhijitMuhurat}\n\n— Sanatana Sangam`;
    if (navigator.share) { try { await navigator.share({ title: 'Panchang', text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
  }

  return (
    // Full-bleed atmospheric wrapper — extends behind safe areas
    <div className="relative -mx-4 -mt-4 pb-28 min-h-screen" style={{ background: SKY_GRADIENTS[skyPhase] }}>

      {/* ── Stars (night phases) ──────────────────────────────────────── */}
      {isNight && <Stars />}

      {/* ── Animated sky orb (sun / moon) ────────────────────────────── */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: orb.size, height: orb.size,
          background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
          top: '4%', left: '50%', translateX: '-50%',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [orb.opacity * 0.8, orb.opacity, orb.opacity * 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Horizon glow ─────────────────────────────────────────────── */}
      {(skyPhase === 'dawn' || skyPhase === 'dusk') && (
        <motion.div
          className="absolute inset-x-0 pointer-events-none"
          style={{
            top: '10%', height: '30%',
            background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${
              skyPhase === 'dawn' ? 'rgba(255,140,50,0.35)' : 'rgba(200,60,20,0.35)'
            }, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-4 space-y-3">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/home"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={16} className="text-white/80" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-xl leading-tight tracking-tight">Panchang</h1>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90"
                style={{ background: tradMeta.accent }}>
                {tradMeta.badge}
              </span>
            </div>
            <p className="text-white/50 text-xs mt-0.5">
              {PHASE_LABELS[skyPhase]}{city ? ` · 📍 ${city}` : ''}
            </p>
          </div>
          <button onClick={share}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Share2 size={15} className="text-white/80" />
          </button>
        </div>

        {/* Paksha banner — floats over sky */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${tradMeta.accent}dd, ${tradMeta.accent}99)`, border: `1px solid rgba(255,255,255,0.12)` }}>
          <span className="text-2xl">🪔</span>
          <div>
            <p className="text-white font-bold text-sm">{p.paksha} Paksha · {p.masaName} Masa</p>
            <p className="text-white/60 text-[11px] mt-0.5">{p.vara} · {tradMeta.note}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/80 text-xs font-semibold">{p.sunrise}</p>
            <p className="text-white/40 text-[10px]">sunrise</p>
          </div>
        </motion.div>

        {/* Calendar */}
        <GlassCard className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ChevronLeft size={15} className="text-white/70" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-white text-sm">{MONTHS[viewMonth]} {viewYear}</p>
              <p className="text-white/40 text-[10px] mt-0.5">
                {tradition === 'hindu' ? `${p.masaName} Masa` : tradMeta.note}
              </p>
            </div>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ChevronRight size={15} className="text-white/70" />
            </button>
          </div>

          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {DAY_LABELS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-medium text-white/35">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 p-2 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const isSelected    = isSameDay(date, selected);
              const isCurrentDay  = isSameDay(date, today);
              const dayP          = calculatePanchang(date, lat, lon);
              return (
                <motion.button
                  key={date.toISOString()}
                  onClick={() => setSelected(date)}
                  whileTap={{ scale: 0.88 }}
                  className="relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all"
                  style={
                    isSelected    ? { background: tradMeta.accent, border: 'none' }
                    : isCurrentDay ? { border: `1px solid ${tradMeta.accent}`, background: `${tradMeta.accent}20` }
                    : { background: 'transparent' }
                  }>
                  <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-white' : isCurrentDay ? 'text-white' : 'text-white/70'}`}>
                    {date.getDate()}
                  </span>
                  <span className={`text-[8px] leading-none mt-0.5 ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                    {dayP.tithiIndex}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>

        {/* Date label */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tradMeta.accent }} />
          <p className="text-xs font-semibold text-white/70">{isToday ? 'Today — ' : ''}{dateLabel}</p>
        </div>

        {/* Panchang details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="space-y-2">

          <div className="grid grid-cols-2 gap-2">
            <Row emoji="📅" label="Tithi"     value={p.tithi}     accent={tradMeta.accent} />
            <Row emoji="⭐" label="Nakshatra" value={p.nakshatra} accent={tradMeta.accent} />
            <Row emoji="🕉️" label="Yoga"      value={p.yoga}      accent={tradMeta.accent} />
            <Row emoji="📆" label="Vara"      value={p.vara}      accent={tradMeta.accent} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Row emoji="🌅" label="Sunrise" value={p.sunrise} accent={tradMeta.accent} />
            <Row emoji="🌆" label="Sunset"  value={p.sunset}  accent={tradMeta.accent} />
          </div>

          <Row emoji="⚠️" label="Rahu Kaal — avoid auspicious starts" value={p.rahuKaal}         accent={tradMeta.accent} warn />
          <Row emoji="✨" label="Abhijit Muhurat — most auspicious"    value={p.abhijitMuhurat}   accent={tradMeta.accent} />

          {/* Guidance */}
          <div className="rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid rgba(255,200,100,0.15)' }}>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              <span className="font-semibold text-amber-200">Today&apos;s guidance:</span>{' '}
              {p.paksha === 'Shukla'
                ? 'Shukla Paksha — auspicious for new beginnings, prayers, and satsang. Chant, give, begin.'
                : 'Krishna Paksha — turn inward. Fast, introspect, offer ancestral prayers (Pitru Tarpan).'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
