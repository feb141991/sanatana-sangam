'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Share2 } from 'lucide-react';
import { calculatePanchang } from '@/lib/panchang';
import type { PanchangData } from '@/lib/panchang';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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

// ─── One-liner info for each panchang element ─────────────────────────────────
const INFO_TEXT: Record<string, string> = {
  Tithi:             'Lunar day (1–30). Each tithi has a presiding deity and governs which activities are auspicious.',
  Nakshatra:         "Moon's mansion in 1 of 27 star-clusters. Your moon nakshatra shapes emotion, instinct, and timing.",
  Yoga:              'Sun + Moon combined longitude across 27 yogas. Indicates the overall quality and nature of the day.',
  Karana:            'Half of a tithi — the moon moves 6° per karana. There are 11 karanas, 7 movable and 4 fixed. Governs the finer timing within each tithi for rituals and acts.',
  Vara:              'Vedic day of the week. Each day has a ruling planet and presiding deity who blesses related acts.',
  Sunrise:           'Calculated for your location. Brahma Muhurta starts 96 minutes before sunrise — the ideal waking time.',
  Sunset:            'Sandhya kaal — ideal for evening prayers, japa, and quiet reflection as day meets night.',
  'Brahma Muhurta':  'The sacred pre-dawn window — 96 to 48 minutes before sunrise. The mind is clearest, subtle energies are elevated, and the shastras call this the best time for meditation, japa, and pranayama.',
  'Rahu Kaal':       'A 90-min daily window ruled by Rahu (shadow planet). Avoid starting new ventures or auspicious acts.',
  'Abhijit Muhurat': 'The most auspicious ~48-min window around solar noon. Ideal for important new beginnings.',
};

// ─── Inline tooltip ────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition hover:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.55)',
        }}
        aria-label="More info"
      >
        i
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-7 right-0 z-50 w-56 rounded-xl px-3 py-2.5 text-left"
            style={{
              background: 'rgba(8,6,22,0.97)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-[11px] leading-relaxed text-white/75">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panchang row ─────────────────────────────────────────────────────────────
function Row({ emoji, label, value, upto, accent, warn = false, infoKey }: {
  emoji: string; label: string; value: string; upto?: string; accent: string; warn?: boolean; infoKey?: string;
}) {
  const infoText = infoKey ? INFO_TEXT[infoKey] : undefined;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: warn ? 'rgba(200,80,20,0.18)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${warn ? 'rgba(200,80,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <span className="text-lg w-6 text-center flex-shrink-0 leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`font-semibold text-sm mt-0.5 ${warn ? 'text-orange-300' : 'text-white/90'}`}>{value}</p>
          {upto && (
            <p className="text-[10px] text-white/40 mt-0.5">upto {upto}</p>
          )}
        </div>
      </div>
      {infoText && (
        <div className="relative flex-shrink-0">
          <InfoTooltip text={infoText} />
        </div>
      )}
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
  const { t } = useLanguage();
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
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-cream)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Panchang</h1>
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

          {/* Main Panchang elements — single column so long values fit */}
          <div className="space-y-2">
            <Row emoji="📅" label={t('tithi')}
              value={`${p.tithi} · ${p.paksha} Paksha`}
              upto={p.tithiUpto}
              accent={tradMeta.accent} infoKey="Tithi" />
            <Row emoji="⭐" label={t('nakshatra')}
              value={p.nakshatra}
              upto={p.nakshatraUpto}
              accent={tradMeta.accent} infoKey="Nakshatra" />
            <Row emoji="🕉️" label={t('yoga')}
              value={p.yoga}
              upto={p.yogaUpto}
              accent={tradMeta.accent} infoKey="Yoga" />
            <Row emoji="🃏" label="Karana"
              value={p.karana}
              upto={p.karanaUpto}
              accent={tradMeta.accent} infoKey="Karana" />
            <Row emoji="📆" label={t('vara')}      value={p.vara}      accent={tradMeta.accent} infoKey="Vara" />
          </div>

          {/* Sun times — 2-col fine since values are short */}
          <div className="grid grid-cols-2 gap-2">
            <Row emoji="🌅" label={t('sunrise')} value={p.sunrise} accent={tradMeta.accent} infoKey="Sunrise" />
            <Row emoji="🌆" label={t('sunset')}  value={p.sunset}  accent={tradMeta.accent} infoKey="Sunset" />
          </div>
          {/* Brahma Muhurta */}
          {'brahmaMuhurta' in p && (
            <Row emoji="🌙" label="Brahma Muhurta" value={(p as any).brahmaMuhurta} accent={tradMeta.accent} infoKey="Brahma Muhurta" />
          )}

          <Row emoji="⚠️" label={t('rahuKaal')}        value={p.rahuKaal}       accent={tradMeta.accent} warn infoKey="Rahu Kaal" />
          <Row emoji="✨" label={t('abhijitMuhurat')} value={p.abhijitMuhurat} accent={tradMeta.accent} infoKey="Abhijit Muhurat" />

          {/* Samvat */}
          {'samvatYear' in p && (
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Vikram Samvat</span>
              <span className="text-white/80 text-sm font-semibold ml-auto">
                {(p as any).samvatYear} {(p as any).samvatName}
              </span>
            </div>
          )}

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
